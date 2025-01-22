import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { TicketQueue } from "./views/TicketsView/TicketQueue";
import { TicketDetail } from "./views/TicketsView/TicketDetail";
import { DashboardView } from "./views/DashboardView";
import { AgentsView } from "./views/AgentsView";
import { ChatView } from "./views/ChatView";
import { LoginView } from "./views/LoginView";
import { supabase } from './lib/supabase';
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
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Agent Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Availability Status</h3>
                  <p className="text-sm text-gray-500">
                    Set your current availability
                  </p>
                </div>
                <Button
                  variant={isAvailable ? "default" : "secondary"}
                  onClick={() => setIsAvailable(!isAvailable)}
                >
                  {isAvailable ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {isAvailable ? "Available" : "Away"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[480px] max-h-[600px] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Reassign Ticket</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReassignModal(false)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Current agent:{" "}
                <span className="font-medium text-gray-900">
                  {currentAgent?.name}
                </span>
              </p>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-3 rounded-lg border hover:bg-gray-50 cursor-pointer flex items-center justify-between ${
                      currentAgent?.id === agent.id ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      setCurrentAgent(agent);
                      setShowReassignModal(false);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {agent.avatar}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{agent.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          agent.status === AgentStatus.ONLINE
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {agent.status}
                      </span>
                      {currentAgent?.id === agent.id && (
                        <Check className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
