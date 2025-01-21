import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { TicketQueue } from "./views/TicketsView/TicketQueue";
import { TicketDetail } from "./views/TicketsView/TicketDetail";
import { DashboardView } from "./views/DashboardView";
import { AgentsView } from "./views/AgentsView";
import { ChatView } from "./views/ChatView";
import { 
  type Ticket, 
  type Agent, 
  type ViewType, 
  Views, 
  TicketPriority, 
  TicketStatus,
  AgentStatus,
  AgentRole,
} from '@/types';
import { getTickets, getAgents, getTicketConversations, updateAgentStatus } from '@/lib/api';

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
  const [assignedAgent, setAssignedAgent] = useState<string>("");
  
  // State for data from Supabase
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsData, agentsData] = await Promise.all([
          getTickets(),
          getAgents()
        ]);
        setTickets(ticketsData);
        setAgents(agentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch conversations when active ticket changes
  useEffect(() => {
    const fetchConversations = async () => {
      if (activeTicket) {
        try {
          const conversations = await getTicketConversations(activeTicket.id);
          setActiveTicket(prev => prev ? { ...prev, conversation: conversations } : null);
        } catch (error) {
          console.error('Error fetching conversations:', error);
        }
      }
    };

    fetchConversations();
  }, [activeTicket?.id]);

  // Update agent status
  useEffect(() => {
    const updateStatus = async () => {
      const currentAgent = agents[0]; // Assuming first agent is current user
      if (currentAgent) {
        try {
          await updateAgentStatus(
            currentAgent.id,
            isAvailable ? AgentStatus.ONLINE : AgentStatus.AWAY
          );
        } catch (error) {
          console.error('Error updating agent status:', error);
        }
      }
    };

    updateStatus();
  }, [isAvailable, agents]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
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
                  {assignedAgent}
                </span>
              </p>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-3 rounded-lg border hover:bg-gray-50 cursor-pointer flex items-center justify-between ${
                      assignedAgent === agent.name ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      setAssignedAgent(agent.name);
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
                      {assignedAgent === agent.name && (
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
        {currentView === Views.TICKETS &&
          (activeTicket ? (
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
            />
          ) : (
            <TicketQueue tickets={tickets} setActiveTicket={setActiveTicket} />
          ))}
        {currentView === Views.DASHBOARD && <DashboardView />}
        {currentView === Views.AGENTS && <AgentsView />}
        {currentView === Views.CHAT && <ChatView />}
      </Layout>
    </>
  );
}
