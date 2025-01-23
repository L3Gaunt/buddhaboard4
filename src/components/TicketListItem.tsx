import React from 'react';
import { Ticket } from '../types';
import { getStatusStyle, getPriorityStyle, baseTicketBadgeStyle } from '../utils/ticketStyles';

interface TicketListItemProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
}

export const TicketListItem: React.FC<TicketListItemProps> = ({ ticket, onClick }) => {
  return (
    <div 
      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
      onClick={() => onClick?.(ticket)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{ticket.title}</h4>
          {ticket.conversation[0] && (
            <p className="text-sm text-gray-500">{ticket.conversation[0].message}</p>
          )}
        </div>
        <div className="flex gap-2">
          <span className={`${baseTicketBadgeStyle} ${getStatusStyle(ticket.status)}`}>
            {ticket.status.replace("_", " ")}
          </span>
          <span className={`${baseTicketBadgeStyle} ${getPriorityStyle(ticket.priority)}`}>
            {ticket.priority}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center text-sm text-gray-500">
        <span>Ticket #{ticket.number}</span>
        <span className="mx-2">•</span>
        <span>{new Date(ticket.createdAt).toLocaleString()}</span>
      </div>
    </div>
  );
}; 