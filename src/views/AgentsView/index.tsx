import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { type Agent, AgentStatus, AgentRole } from '@/types';

export const AgentsView: FC = () => {
  const agents: Agent[] = [
    {
      id: "1",
      name: "John Doe",
      role: AgentRole.AGENT,
      status: AgentStatus.ONLINE,
      avatar: "",
      email: "john.doe@example.com"
    },
    {
      id: "2",
      name: "Jane Smith",
      role: AgentRole.SUPERVISOR,
      status: AgentStatus.BUSY,
      avatar: "",
      email: "jane.smith@example.com"
    },
    {
      id: "3",
      name: "Mike Johnson",
      role: AgentRole.ADMIN,
      status: AgentStatus.AWAY,
      avatar: "",
      email: "mike.johnson@example.com"
    }
  ];

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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Agent Management</h2>
      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="border rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {agent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
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
              </div>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
        ))}
      </div>
    </div>
  );
};
