import { TicketStatus, TicketPriority } from '../types';

export const getStatusStyle = (status: TicketStatus): string => {
  switch (status) {
    case TicketStatus.OPEN:
      return 'bg-green-100 text-green-800';
    case TicketStatus.WAITING_CUSTOMER_REPLY:
      return 'bg-yellow-100 text-yellow-800';
    case TicketStatus.RESOLVED:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityStyle = (priority: TicketPriority): string => {
  switch (priority) {
    case TicketPriority.URGENT:
      return 'bg-red-100 text-red-800';
    case TicketPriority.HIGH:
      return 'bg-orange-100 text-orange-800';
    case TicketPriority.MEDIUM:
      return 'bg-yellow-100 text-yellow-800';
    case TicketPriority.LOW:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const baseTicketBadgeStyle = 'px-2 py-1 text-xs rounded-full'; 