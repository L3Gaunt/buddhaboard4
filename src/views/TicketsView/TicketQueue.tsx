import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { type Ticket, type TicketQueueProps, TicketPriority, type AgentId } from '@/types';
import { getAgentProfile } from '@/lib/auth';

export const TicketQueue: FC<TicketQueueProps> = ({ tickets, setActiveTicket }) => {
  const [agentNames, setAgentNames] = useState<Record<AgentId, string>>({});

  useEffect(() => {
    // Fetch agent names for all assigned tickets
    const fetchAgentNames = async () => {
      const uniqueAgentIds = [...new Set(tickets
        .map(ticket => ticket.assignedTo)
        .filter((id): id is AgentId => id !== undefined))];

      const names: Record<AgentId, string> = {};
      for (const agentId of uniqueAgentIds) {
        try {
          const agent = await getAgentProfile(agentId);
          if (agent) {
            names[agentId] = agent.name;
          }
        } catch (error) {
          console.error(`Error fetching agent name for ${agentId}:`, error);
        }
      }
      setAgentNames(names);
    };

    fetchAgentNames();
  }, [tickets]);

  const getPriorityStyle = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.LOW:
        return "bg-blue-100 text-blue-800";
      case TicketPriority.MEDIUM:
        return "bg-yellow-100 text-yellow-800";
      case TicketPriority.HIGH:
        return "bg-orange-100 text-orange-800";
      case TicketPriority.URGENT:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Ticket Queue</h2>
      <div className="space-y-4">
        {tickets.map((ticket: Ticket) => (
          <div
            key={ticket.id}
            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => setActiveTicket(ticket)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{ticket.title}</h3>
                {ticket.conversation[0] && (
                  <p className="text-sm text-gray-500">{ticket.conversation[0].message}</p>
                )}
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityStyle(ticket.priority)}`}>
                {ticket.priority.replace("_", " ")} Priority
              </span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>Ticket #{ticket.number}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(ticket.createdAt)}</span>
              {ticket.assignedTo && (
                <>
                  <span className="mx-2">•</span>
                  <span>Assigned to: {agentNames[ticket.assignedTo] || 'Loading...'}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
