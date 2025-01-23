import { useState, type FC } from 'react';
import { Button } from "@/components/ui/button";
import { type Agent } from '@/types';
import { EditAgentModal } from '@/components/modals/EditAgentModal';
import { CreateAgentModal } from '@/components/modals/CreateAgentModal';
import { updateAgentProfile, changeAgentPassword } from '@/lib/agents';
import { toast } from 'sonner';
import { UserPlus, Search } from 'lucide-react';
import { AgentCard } from '@/components/AgentCard';
import { Input } from "@/components/ui/input";

interface AgentsViewProps {
  agents: Agent[];
  onAgentUpdated: () => void; // Callback to refresh the agents list
}

export const AgentsView: FC<AgentsViewProps> = ({ agents, onAgentUpdated }) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUpdateAgent = async (updates: Partial<Agent>) => {
    if (!selectedAgent) return;
    
    setIsUpdating(true);
    try {
      await updateAgentProfile(selectedAgent.id, updates);
      toast.success('Agent profile updated successfully');
      onAgentUpdated();
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update agent profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (agentId: string, newPassword: string) => {
    setIsUpdating(true);
    try {
      await changeAgentPassword(agentId, newPassword);
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
      throw error; // Re-throw to be handled by the modal
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const searchLower = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(searchLower) ||
      agent.email.toLowerCase().includes(searchLower) ||
      agent.metadata?.department?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Agent Management</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Agent
        </Button>
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
      <div className="space-y-4">
        {filteredAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            actionButton={
              <Button 
                variant="outline"
                onClick={() => setSelectedAgent(agent)}
                disabled={isUpdating}
              >
                Edit Profile
              </Button>
            }
          />
        ))}
        {filteredAgents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No agents found matching your search.
          </div>
        )}
      </div>

      {selectedAgent && (
        <EditAgentModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onSave={handleUpdateAgent}
          onPasswordChange={handlePasswordChange}
        />
      )}

      <CreateAgentModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAgentCreated={onAgentUpdated}
      />
    </div>
  );
};
