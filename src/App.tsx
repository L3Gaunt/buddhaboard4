import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { TicketQueue } from "./views/TicketsView/TicketQueue";
import { TicketDetail } from "./views/TicketsView/TicketDetail";
import { AgentsView } from "./views/AgentsView";
import { ChatView } from "./views/ChatView";
import { LoginView } from "./views/LoginView";
import { UserTicketView } from "./views/UserTicketView";
import { TicketLookupView } from "./views/TicketLookupView";
import { KnowledgeBaseView } from "./views/KnowledgeBaseView";
import { FeedbackView } from "./views/FeedbackView";
import { supabase } from './lib/supabase';
import { ReassignTicketModal } from "@/components/modals/ReassignTicketModal";
import { Toaster } from 'sonner';
import {
  type Ticket,
  type Customer,
  type ViewType,
  type Agent,
  Views,
  TicketStatus,
  TicketPriority,
  AgentStatus,
  createAgentId,
  createCustomerId,
  createTicketId,
  createMessageId,
} from '@/types';
import type { Database } from './types/supabase';

// Import Supabase services
import { getCurrentUser, getAgentProfile, updateAgentStatus, signOut } from '@/lib/auth';
import { getTickets, getTicketById } from '@/lib/tickets';
import { getAllAgents } from '@/lib/agents';

export default function App() {
  // Check if we're on a public route
  const isSubmitTicketPage = window.location.pathname === '/submit-ticket';
  const isTicketLookupPage = window.location.pathname.startsWith('/ticket/');
  const isInternalTicketPage = window.location.pathname.startsWith('/tickets/');
  const isAgentsPage = window.location.pathname === '/agents';
  const isChatPage = window.location.pathname === '/chat';
  const isKnowledgeBasePage = window.location.pathname === '/knowledge-base';
  const isFeedbackPage = window.location.pathname === '/feedback';
  
  // If it's a public route, render the appropriate view without authentication
  if (isSubmitTicketPage) {
    return <UserTicketView />;
  }
  
  if (isTicketLookupPage) {
    return <TicketLookupView />;
  }

  const [currentView, setCurrentView] = useState<ViewType>(
    isAgentsPage ? Views.AGENTS :
    isChatPage ? Views.CHAT :
    isKnowledgeBasePage ? Views.KNOWLEDGE_BASE :
    isFeedbackPage ? Views.FEEDBACK :
    Views.TICKETS
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [response, setResponse] = useState("");
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>(TicketStatus.OPEN);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    // Clear active ticket when switching views
    setActiveTicket(null);
    
    let newPath = '/tickets'; // default path
    
    switch (view) {
      case Views.AGENTS:
        newPath = '/agents';
        break;
      case Views.KNOWLEDGE_BASE:
        newPath = '/knowledge-base';
        break;
      case Views.CHAT:
        newPath = '/chat';
        break;
      case Views.FEEDBACK:
        newPath = '/feedback';
        break;
    }
    
    window.history.pushState({}, '', newPath);
  };

  async function loadInitialData() {
    try {
      // Get current user and their agent profile
      const user = await getCurrentUser();
      console.log('Current user:', user);
      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      let agentProfile = null;
      // Load all agents only if we're an agent
      try {
        agentProfile = await getAgentProfile(user.id);
        console.log('Agent profile:', agentProfile);
        
        if (agentProfile) {
          // Load all agents since we're an agent
          const allAgents = await getAllAgents();
          setAgents(allAgents);
          
          const metadata = agentProfile.metadata as { 
            department?: string; 
            skills?: string[]; 
            languages?: string[]; 
          } | null;

          setCurrentAgent({
            id: createAgentId(agentProfile.id),
            name: agentProfile.name,
            role: agentProfile.role,
            status: agentProfile.status,
            avatar: agentProfile.avatar || agentProfile.name.substring(0, 2).toUpperCase(),
            email: agentProfile.email,
            metadata: metadata || undefined
          });

          // Set availability based on agent profile status
          setIsAvailable(agentProfile.status === AgentStatus.ONLINE);
        }
      } catch (error) {
        console.log('Not an agent profile, continuing as customer');
        // Reset agent-specific state when error occurs
        setCurrentAgent(null);
        setAgents([]);
      }

      // Load tickets based on user role
      let ticketData;
      if (agentProfile) {
        // If user is an agent, load all tickets
        ticketData = await getTickets();
      } else {
        // If user is a customer, use the edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer_ticket`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              action: 'list_tickets',
              user_id: user.id
            })
          }
        );
        const { data, error } = await response.json();
        if (error) throw new Error(error);
        ticketData = data.map((ticket: Database['public']['Tables']['tickets']['Row']) => ({
          ...ticket,
          createdAt: new Date(ticket.created_at),
          lastUpdated: new Date(ticket.last_updated),
          id: createTicketId(ticket.number),
          customer_id: createCustomerId(ticket.customer_id),
          assignedTo: ticket.assigned_to ? createAgentId(ticket.assigned_to) : undefined,
          conversation: (ticket.conversation || []).map((msg) => {
            const message = msg as {
              id: string;
              isFromCustomer: boolean;
              message: string;
              timestamp: string;
              attachments?: Array<{
                url: string;
                name: string;
                type: string;
                size: number;
              }>;
              metadata?: Record<string, unknown>;
            };
            return {
              ...message,
              id: createMessageId(message.id),
              timestamp: new Date(message.timestamp)
            };
          })
        }));
      }
      
      console.log('Ticket data:', ticketData);
      setTickets(ticketData);

      // Load customer data if there's an active ticket
      if (activeTicket) {
        const { data: customerData } = await supabase
          .from('users')
          .select('*')
          .eq('id', activeTicket.customer_id)
          .single();

        if (customerData) {
          setCustomer({
            id: createCustomerId(customerData.id),
            email: customerData.email,
            name: customerData.name,
            createdAt: new Date(customerData.created_at),
            avatar: customerData.avatar || undefined,
            phone: customerData.phone || undefined,
            company: customerData.company || undefined,
            metadata: typeof customerData.metadata === 'object' && customerData.metadata ? {
              ...Object.fromEntries(
                Object.entries(customerData.metadata).map(([key, value]) => [key, value])
              )
            } : undefined
          });
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (isInternalTicketPage) {
        const ticketNumber = parseInt(path.split('/tickets/')[1], 10);
        if (!isNaN(ticketNumber)) {
          getTicketById(ticketNumber)
            .then(ticket => {
              setActiveTicket(ticket);
              setCurrentView(Views.TICKETS);
            })
            .catch(error => console.error('Error loading ticket:', error));
        }
      } else if (path === '/tickets') {
        setActiveTicket(null);
        setCurrentView(Views.TICKETS);
      } else if (path === '/agents') {
        setCurrentView(Views.AGENTS);
      } else if (path === '/chat') {
        setCurrentView(Views.CHAT);
      } else if (path === '/knowledge-base') {
        setCurrentView(Views.KNOWLEDGE_BASE);
      } else if (path === '/feedback') {
        setCurrentView(Views.FEEDBACK);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isInternalTicketPage]);

  // Load current agent and their tickets
  useEffect(() => {
    async function loadTicketFromUrl() {
      if (isInternalTicketPage && isAuthenticated) {
        const ticketNumber = parseInt(window.location.pathname.split('/tickets/')[1], 10);
        if (!isNaN(ticketNumber)) {
          try {
            const ticket = await getTicketById(ticketNumber);
            setActiveTicket(ticket);
            setCurrentView(Views.TICKETS);
          } catch (error) {
            console.error('Error loading ticket:', error);
          }
        }
      }
    }

    loadInitialData();
    loadTicketFromUrl();
  }, [activeTicket?.customer_id, isAuthenticated]);

  // Update agent status
  useEffect(() => {
    if (currentAgent) {
      updateAgentStatus(currentAgent.id, isAvailable ? AgentStatus.ONLINE : AgentStatus.AWAY)
        .catch(console.error);
    }
  }, [isAvailable, currentAgent]);

  // Add handleLogout function
  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setCurrentAgent(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <ReassignTicketModal
        showReassignModal={showReassignModal}
        setShowReassignModal={setShowReassignModal}
        currentAgent={currentAgent}
        agents={agents}
        ticketNumber={activeTicket?.number || 0}
        onTicketReassigned={(ticketNumber, newAgentId) => {
          // Update the active ticket
          if (activeTicket) {
            setActiveTicket({
              ...activeTicket,
              assignedTo: createAgentId(newAgentId)
            });
          }
          
          // Update the ticket in the tickets array
          setTickets(tickets.map(ticket => 
            ticket.number === ticketNumber 
              ? { ...ticket, assignedTo: createAgentId(newAgentId) }
              : ticket
          ));
        }}
      />
      <Layout
        currentView={currentView}
        setCurrentView={handleViewChange}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={handleLogout}
        isAvailable={isAvailable}
        setIsAvailable={setIsAvailable}
        currentAgent={currentAgent}
      >
        {currentView === Views.TICKETS && (
          <div className="flex flex-1 overflow-hidden">
            {!activeTicket ? (
              <div className="w-full overflow-auto">
                <TicketQueue 
                  tickets={tickets} 
                  setActiveTicket={setActiveTicket} 
                  isCustomerView={!currentAgent}
                  currentAgent={currentAgent}
                />
              </div>
            ) : customer && (
              <div className="w-full overflow-auto">
                <TicketDetail
                  ticket={activeTicket}
                  setActiveTicket={setActiveTicket}
                  ticketPriority={ticketPriority}
                  setTicketPriority={setTicketPriority}
                  ticketStatus={ticketStatus}
                  setTicketStatus={setTicketStatus}
                  setShowReassignModal={setShowReassignModal}
                  response={response}
                  setResponse={setResponse}
                  customer={customer}
                  customerTickets={tickets.filter(t => t.customer_id === activeTicket.customer_id)}
                  isCustomerView={!currentAgent}
                />
              </div>
            )}
          </div>
        )}
        {currentView === Views.AGENTS && (
          <AgentsView 
            agents={agents}
            currentAgent={currentAgent}
            onAgentUpdated={() => {
              // Reload the agent list
              loadInitialData();
            }} 
          />
        )}
        {currentView === Views.CHAT && <ChatView />}
        {currentView === Views.KNOWLEDGE_BASE && <KnowledgeBaseView />}
        {currentView === Views.FEEDBACK && !currentAgent?.role && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-red-600">You don't have permission to view this page.</div>
          </div>
        )}
        {currentView === Views.FEEDBACK && currentAgent?.role && (
          <FeedbackView 
            currentAgent={currentAgent} 
            setActiveTicket={(ticket) => {
              if (ticket) {
                setActiveTicket(ticket);
                setCurrentView(Views.TICKETS);
              }
            }} 
          />
        )}
      </Layout>
    </>
  );
}
