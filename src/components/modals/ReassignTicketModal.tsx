import { XCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Agent, AgentStatus } from "@/types";

interface ReassignTicketModalProps {
  showReassignModal: boolean;
  setShowReassignModal: (show: boolean) => void;
  currentAgent: Agent | null;
  setCurrentAgent: (agent: Agent) => void;
  agents: Agent[];
}

export function ReassignTicketModal({
  showReassignModal,
  setShowReassignModal,
  currentAgent,
  setCurrentAgent,
  agents,
}: ReassignTicketModalProps) {
  if (!showReassignModal) return null;

  return (
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
  );
} 