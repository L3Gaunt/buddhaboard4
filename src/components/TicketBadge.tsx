import React from 'react';
import { TicketStatus, TicketPriority } from '../types';
import { getStatusStyle, getPriorityStyle, baseTicketBadgeStyle } from '../utils/ticketStyles';

interface TicketBadgeProps {
  type: 'status' | 'priority';
  value: TicketStatus | TicketPriority;
}

export const TicketBadge: React.FC<TicketBadgeProps> = ({ type, value }) => {
  const style = type === 'status' ? getStatusStyle(value as TicketStatus) : getPriorityStyle(value as TicketPriority);
  const displayValue = type === 'status' ? value.replace("_", " ") : `${value} Priority`;

  return (
    <span className={`${baseTicketBadgeStyle} ${style}`}>
      {displayValue}
    </span>
  );
}; 