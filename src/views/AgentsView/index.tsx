import { type FC, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { type Agent, AgentStatus, AgentRole } from '@/types';
import { getAgents } from '@/lib/api';

export const AgentsView: FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agentsData = await getAgents();
        setAgents(agentsData);
      } catch (error) {
        console.error('Error fetching agents:', error);
        // TODO: Add error handling UI
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Agent Management</h2>
      <div className="space-y-4">
        {agents.map((agent) => {
          // Convert readonly agent to mutable one for type safety
          const mutableAgent = JSON.parse(JSON.stringify(agent)) as Agent;
          return (
            <div
              key={String(mutableAgent.id)}
              className="border rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {mutableAgent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">{mutableAgent.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleStyle(mutableAgent.role)}`}>
                      {mutableAgent.role.replace("_", " ")}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusStyle(mutableAgent.status)}`}>
                      {mutableAgent.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{mutableAgent.email}</p>
                </div>
              </div>
              <Button variant="outline">Manage</Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
