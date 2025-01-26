import { XCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Agent } from "@/types";
import { AgentCard } from "@/components/AgentCard";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { updateTicket } from "@/lib/tickets";

interface ReassignTicketModalProps {
  showReassignModal: boolean;
  setShowReassignModal: (show: boolean) => void;
  currentAgent: Agent | null;
  agents: Agent[];
  ticketNumber: number;
  onTicketReassigned: (ticketNumber: number, newAgentId: string) => void;
}

export function ReassignTicketModal({
  showReassignModal,
  setShowReassignModal,
  currentAgent,
  agents,
  ticketNumber,
  onTicketReassigned,
}: ReassignTicketModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!showReassignModal) return null;

  const filteredAgents = agents.filter(agent => {
    const searchLower = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(searchLower) ||
      agent.email.toLowerCase().includes(searchLower) ||
      agent.metadata?.department?.toLowerCase().includes(searchLower)
    );
  });

  const handleAgentSelect = async (agent: Agent) => {
    try {
      setIsUpdating(true);
      // Update the ticket in the database
      await updateTicket(ticketNumber, {
        assigned_to: agent.id
      });
      
      // Update local state
      onTicketReassigned(ticketNumber, agent.id);
      setShowReassignModal(false);
    } catch (error) {
      console.error('Error reassigning ticket:', error);
      alert('Failed to reassign ticket. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search agents by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex-1 overflow-auto">
          <div className="space-y-2">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={currentAgent?.id === agent.id}
                onClick={() => !isUpdating && handleAgentSelect(agent)}
              />
            ))}
            {filteredAgents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No agents found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 