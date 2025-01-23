import { useState, type FC } from 'react';
import { Button } from "@/components/ui/button";
import { type Agent, AgentStatus, AgentRole } from '@/types';
import { EditAgentModal } from '@/components/modals/EditAgentModal';
import { CreateAgentModal } from '@/components/modals/CreateAgentModal';
import { updateAgentProfile, changeAgentPassword } from '@/lib/agents';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

interface AgentsViewProps {
  agents: Agent[];
  onAgentUpdated: () => void; // Callback to refresh the agents list
}

export const AgentsView: FC<AgentsViewProps> = ({ agents, onAgentUpdated }) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusStyle = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.ONLINE:
        return "bg-green-100 text-green-800";
      case AgentStatus.BUSY:
        return "bg-yellow-100 text-yellow-800";
      case AgentStatus.AWAY:
        return "bg-orange-100 text-orange-800";
      case AgentStatus.OFFLINE:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleStyle = (role: AgentRole) => {
    switch (role) {
      case AgentRole.ADMIN:
        return "bg-purple-100 text-purple-800";
      case AgentRole.SUPERVISOR:
        return "bg-blue-100 text-blue-800";
      case AgentRole.AGENT:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {agent.avatar ? (
                  <img 
                    src={agent.avatar} 
                    alt={agent.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerText = agent.name.substring(0, 2).toUpperCase();
                    }}
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {agent.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="ml-4">
                <h3 className="font-medium">{agent.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleStyle(agent.role)}`}>
                    {agent.role.replace("_", " ")}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusStyle(agent.status)}`}>
                    {agent.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{agent.email}</p>
                {agent.metadata?.department && (
                  <p className="text-sm text-gray-500">Department: {agent.metadata.department}</p>
                )}
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => setSelectedAgent(agent)}
              disabled={isUpdating}
            >
              Edit Profile
            </Button>
          </div>
        ))}
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
