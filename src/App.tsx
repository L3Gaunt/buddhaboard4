import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { TicketQueue } from "./views/TicketsView/TicketQueue";
import { TicketDetail } from "./views/TicketsView/TicketDetail";
import { DashboardView } from "./views/DashboardView";
import { AgentsView } from "./views/AgentsView";
import { ChatView } from "./views/ChatView";
import { LoginView } from "./views/LoginView";
import { supabase } from './lib/supabase';
import { AgentSettingsModal } from "@/components/modals/AgentSettingsModal";
import { ReassignTicketModal } from "@/components/modals/ReassignTicketModal";
import { 
  type Ticket, 
  type Agent,
  type ViewType, 
  type Customer,
  Views, 
  TicketPriority, 
  TicketStatus,
  AgentStatus,
  createTicketId,
  createAgentId,
  createCustomerId
} from '@/types';

// Import Supabase services
import { getCurrentUser, getAgentProfile, updateAgentStatus } from '@/lib/auth';
import { getTickets } from '@/lib/tickets';

export default function App() {
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
  const [agents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load current agent and their tickets
  useEffect(() => {
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
            status: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS]
          });
          console.log('Ticket data:', ticketData);

          setTickets(ticketData.map(ticket => ({
            id: createTicketId(ticket.id),
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            number: ticket.number,
            createdAt: new Date(ticket.created_at),
            lastUpdated: new Date(ticket.last_updated),
            conversation: ticket.conversation || [],
            assignedTo: ticket.assigned_to ? createAgentId(ticket.assigned_to) : undefined,
            customer_id: createCustomerId(ticket.customer_id)
          })));

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
                avatar: customerData.avatar,
                phone: customerData.phone,
                company: customerData.company,
                metadata: customerData.metadata
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
      <AgentSettingsModal
        isAvailable={isAvailable}
        setIsAvailable={setIsAvailable}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
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
            <div className="w-1/3 overflow-auto border-r">
              <TicketQueue tickets={tickets} setActiveTicket={setActiveTicket} />
            </div>
            {activeTicket && customer && (
              <div className="w-2/3 overflow-auto">
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
        {currentView === Views.AGENTS && <AgentsView agents={agents} />}
        {currentView === Views.CHAT && <ChatView />}
      </Layout>
    </>
  );
}
