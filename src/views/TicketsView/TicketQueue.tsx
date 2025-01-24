import { FC, useEffect, useState } from 'react';
import { TicketQueueProps, AgentId } from '../../types';
import { getAgentProfile } from '../../lib/auth';
import { TicketBadge } from '../../components/TicketBadge';

export const TicketQueue: FC<TicketQueueProps> = ({ tickets, setActiveTicket, isCustomerView = false }) => {
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{isCustomerView ? "My Tickets" : "Ticket Queue"}</h2>
        <button
          onClick={() => window.location.href = '/submit-ticket'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Submit New Ticket
        </button>
      </div>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              const newUrl = `/tickets/${ticket.number}`;
              window.history.pushState({}, '', newUrl);
              setActiveTicket(ticket);
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{ticket.title}</h3>
                {ticket.conversation[0] && (
                  <p className="text-sm text-gray-500">{ticket.conversation[0].message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <TicketBadge type="status" value={ticket.status} />
                <TicketBadge type="priority" value={ticket.priority} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>Ticket #{ticket.number}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(ticket.createdAt)}</span>
              {ticket.assignedTo && !isCustomerView && (
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
