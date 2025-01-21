import { useState } from "react";
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
  createTicketId,
  createAgentId,
  createMessageId
} from '@/types';

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
  const [assignedAgent, setAssignedAgent] = useState<string>("John Doe");

  // Create IDs once and reuse them
  const agent1Id = createAgentId("agent_1");
  const agent2Id = createAgentId("agent_2");
  const agent3Id = createAgentId("agent_3");
  const agent4Id = createAgentId("agent_4");

  const agents: Agent[] = [
    {
      id: agent1Id,
      name: "John Doe",
      role: AgentRole.AGENT,
      status: AgentStatus.ONLINE,
      avatar: "JD",
      email: "john.doe@example.com"
    },
    {
      id: agent2Id,
      name: "Jane Smith",
      role: AgentRole.AGENT,
      status: AgentStatus.ONLINE,
      avatar: "JS",
      email: "jane.smith@example.com"
    },
    {
      id: agent3Id,
      name: "Mike Johnson",
      role: AgentRole.AGENT,
      status: AgentStatus.AWAY,
      avatar: "MJ",
      email: "mike.johnson@example.com"
    },
    {
      id: agent4Id,
      name: "Sarah Wilson",
      role: AgentRole.SUPERVISOR,
      status: AgentStatus.ONLINE,
      avatar: "SW",
      email: "sarah.wilson@example.com"
    },
  ];

  // Create ticket IDs once
  const ticket1Id = createTicketId(1);
  const ticket2Id = createTicketId(2);

  const tickets: Ticket[] = [
    {
      id: ticket1Id,
      title: "Cannot access account after password reset",
      description: "Customer reported issues logging in...",
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      number: "1234",
      createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      lastUpdated: new Date(Date.now() - 3600000), // 1 hour ago
      conversation: [
        {
          id: createMessageId("conv_1"),
          sender: "Customer",
          message: "Hi, I can't log into my account after resetting my password. The new password isn't working.",
          timestamp: new Date(Date.now() - 7200000),
        },
        {
          id: createMessageId("conv_2"),
          sender: "System",
          message: "Password reset request processed",
          timestamp: new Date(Date.now() - 5400000),
        },
        {
          id: createMessageId("conv_3"),
          sender: agent1Id,
          message: "Hello! I understand you're having trouble logging in. Could you please confirm if you received the password reset email?",
          timestamp: new Date(Date.now() - 3600000),
        },
      ],
      assignedTo: agent1Id,
    },
    {
      id: ticket2Id,
      title: "Feature request: Dark mode",
      description: "User suggesting new feature implementation...",
      priority: TicketPriority.LOW,
      status: TicketStatus.OPEN,
      number: "1235",
      createdAt: new Date(Date.now() - 10800000), // 3 hours ago
      lastUpdated: new Date(Date.now() - 10800000),
      conversation: [
        {
          id: createMessageId("conv_4"),
          sender: "Customer",
          message: "Would love to see a dark mode option in the app!",
          timestamp: new Date(Date.now() - 10800000),
        },
      ],
    },
  ];

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
