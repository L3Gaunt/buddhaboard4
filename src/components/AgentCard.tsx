import { Check } from "lucide-react";
import { Agent, AgentStatus, AgentRole } from "@/types";

interface AgentCardProps {
  agent: Agent;
  isSelected?: boolean;
  onClick?: (agent: Agent) => void;
  actionButton?: React.ReactNode;
  showStatus?: boolean;
}

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

export function AgentCard({ agent, isSelected, onClick, actionButton, showStatus = true }: AgentCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border hover:bg-gray-50 ${onClick ? "cursor-pointer" : ""} ${
        isSelected ? "border-blue-500 bg-blue-50" : ""
      }`}
      onClick={() => onClick?.(agent)}
    >
      <div className="flex items-center justify-between">
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
              {showStatus && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusStyle(agent.status)}`}>
                  {agent.status.replace("_", " ")}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{agent.email}</p>
            {agent.metadata?.department && (
              <p className="text-sm text-gray-500">Department: {agent.metadata.department}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {actionButton}
          {isSelected && <Check className="h-5 w-5 text-blue-500" />}
        </div>
      </div>
    </div>
  );
} 