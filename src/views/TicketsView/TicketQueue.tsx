import type { FC } from 'react';
import { type Ticket, type TicketQueueProps, TicketPriority } from '@/types';

export const TicketQueue: FC<TicketQueueProps> = ({ tickets, setActiveTicket }) => {
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Ticket Queue</h2>
      <div className="space-y-4">
        {tickets.map((ticket) => {
          // Convert readonly ticket to mutable one for type safety
          const mutableTicket = JSON.parse(JSON.stringify(ticket)) as Ticket;
          return (
            <div
              key={String(mutableTicket.id)}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setActiveTicket(mutableTicket)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{mutableTicket.title}</h3>
                  <p className="text-sm text-gray-500">{mutableTicket.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityStyle(mutableTicket.priority)}`}>
                  {mutableTicket.priority.replace("_", " ")} Priority
                </span>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>Ticket #{mutableTicket.number}</span>
                <span className="mx-2">•</span>
                <span>{new Date(mutableTicket.createdAt).toLocaleString()}</span>
                {mutableTicket.assignedTo && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Assigned to: {mutableTicket.assignedTo}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
