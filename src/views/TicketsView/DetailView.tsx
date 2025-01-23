import React from 'react';
import { Ticket } from '../../types';
import { TicketBadge } from '../../components/TicketBadge';

interface DetailViewProps {
  ticket: Ticket;
}

const DetailView: React.FC<DetailViewProps> = ({ ticket }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">{ticket.title}</h2>
        {ticket.conversation[0] && (
          <p className="text-gray-600">{ticket.conversation[0].message}</p>
        )}
      </div>
      <TicketBadge type="status" value={ticket.status} />
    </div>
  );
};

export default DetailView; 