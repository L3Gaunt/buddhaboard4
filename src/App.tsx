import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { TicketQueue } from "./views/TicketsView/TicketQueue";
import { TicketDetail } from "./views/TicketsView/TicketDetail";
import { DashboardView } from "./views/DashboardView";
import { AgentsView } from "./views/AgentsView";
import { ChatView } from "./views/ChatView";
import { LoginView } from "./views/LoginView";
import { UserTicketView } from "./views/UserTicketView";
import { TicketLookupView } from "./views/TicketLookupView";
import { KnowledgeBaseView } from "./views/KnowledgeBaseView";
import { supabase } from './lib/supabase';
import { AgentSettingsModal } from "@/components/modals/AgentSettingsModal";
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
} from '@/types';

// Import Supabase services
import { getCurrentUser, getAgentProfile, updateAgentStatus } from '@/lib/auth';
import { getTickets } from '@/lib/tickets';
import { getAllAgents } from '@/lib/agents';

export default function App() {
  // Check if we're on a public route
  const isSubmitTicketPage = window.location.pathname === '/submit-ticket';
  const isTicketLookupPage = window.location.pathname.startsWith('/ticket/');
  
  // If it's a public route, render the appropriate view without authentication
  if (isSubmitTicketPage) {
    return <UserTicketView />;
  }
  
  if (isTicketLookupPage) {
    return <TicketLookupView />;
  }

  const [currentView, setCurrentView] = useState<ViewType>(Views.TICKETS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [showSettings, setShowSettings] = useState(false);
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

      // Load all agents
      const allAgents = await getAllAgents();
      setAgents(allAgents);
      
      const agentProfile = await getAgentProfile(user.id);
      console.log('Agent profile:', agentProfile);
      if (agentProfile) {
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

        // Load tickets assigned to current agent
        const ticketData = await getTickets({ 
          assigned_to: user.id,
          status: [TicketStatus.OPEN, TicketStatus.WAITING_CUSTOMER_REPLY]
        });
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
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load current agent and their tickets
  useEffect(() => {
    loadInitialData();
  }, [activeTicket?.customer_id]);

  // Update agent status
  useEffect(() => {
    if (currentAgent) {
      updateAgentStatus(currentAgent.id, isAvailable ? AgentStatus.ONLINE : AgentStatus.AWAY)
        .catch(console.error);
    }
  }, [isAvailable, currentAgent]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <AgentSettingsModal
        isAvailable={isAvailable}
        setIsAvailable={setIsAvailable}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        currentAgent={currentAgent}
      />
      <ReassignTicketModal
        showReassignModal={showReassignModal}
        setShowReassignModal={setShowReassignModal}
        currentAgent={currentAgent}
        setCurrentAgent={setCurrentAgent}
        agents={agents}
      />
      <Layout
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setShowSettings={setShowSettings}
      >
        {currentView === Views.TICKETS && (
          <div className="flex flex-1 overflow-hidden">
            {!activeTicket ? (
              <div className="w-full overflow-auto">
                <TicketQueue tickets={tickets} setActiveTicket={setActiveTicket} />
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
                />
              </div>
            )}
          </div>
        )}
        {currentView === Views.DASHBOARD && <DashboardView />}
        {currentView === Views.AGENTS && (
          <AgentsView 
            agents={agents} 
            onAgentUpdated={() => {
              // Reload the agent list
              loadInitialData();
            }} 
          />
        )}
        {currentView === Views.CHAT && <ChatView />}
        {currentView === Views.KNOWLEDGE_BASE && <KnowledgeBaseView />}
      </Layout>
    </>
  );
}
