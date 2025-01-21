import React from 'react';
import { CustomerProfileProps, CustomerTicketListProps, Ticket, createTicketId, createCustomerId, createMessageId, createAgentId, TicketStatus, TicketPriority } from '../../types';

const CustomerTicketList: React.FC<CustomerTicketListProps> = ({ tickets, onTicketSelect }) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Tickets</h3>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
            onClick={() => onTicketSelect(ticket)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{ticket.title}</h4>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-gray-500">#{ticket.number}</p>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    ticket.status === 'open' ? 'bg-emerald-50 text-emerald-700' :
                    ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                    ticket.status === 'resolved' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    ticket.priority === 'urgent' ? 'bg-red-50 text-red-700' :
                    ticket.priority === 'high' ? 'bg-orange-50 text-orange-700' :
                    ticket.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ticket.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
              {ticket.assignedTo && <span>• Assigned</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomerProfileView: React.FC<CustomerProfileProps> = ({
  customer: propCustomer,
  customerTickets: propCustomerTickets = [],
  onClose,
  isExpanded = false,
  onTicketSelect,
}) => {
  // Provide dummy data if customer is undefined
  const customer = propCustomer || {
    id: createCustomerId('dummy-1'),
    name: 'John Doe',
    email: 'john.doe@example.com',
    createdAt: new Date('2024-01-01'),
    avatar: 'https://ui-avatars.com/api/?name=John+Doe',
    phone: '+1 (555) 123-4567',
    company: 'Example Corp',
    metadata: {
      lastLogin: new Date('2024-01-20'),
      preferences: {
        language: 'English',
        notifications: true
      }
    }
  };

  // Provide dummy tickets if none are provided
  const customerTickets = propCustomerTickets.length > 0 ? propCustomerTickets : [
    {
      id: createTicketId(1),
      title: "Cannot access my account",
      description: "I've been trying to log in for the past hour but keep getting an error message.",
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      number: "TK-001",
      createdAt: new Date('2024-01-15'),
      lastUpdated: new Date('2024-01-15'),
      conversation: [
        {
          id: createMessageId('msg-1'),
          sender: customer.id,
          message: "I keep getting 'Invalid credentials' error when trying to log in.",
          timestamp: new Date('2024-01-15T10:00:00')
        },
        {
          id: createMessageId('msg-2'),
          sender: createAgentId('agent-1'),
          message: "I understand this is frustrating. Could you please confirm if you're using the correct email address? Also, have you tried the 'Forgot Password' option?",
          timestamp: new Date('2024-01-15T10:15:00')
        }
      ],
      assignedTo: createAgentId('agent-1')
    },
    {
      id: createTicketId(2),
      title: "Feature request: Dark mode",
      description: "Would love to see a dark mode option in the dashboard.",
      priority: TicketPriority.LOW,
      status: TicketStatus.IN_PROGRESS,
      number: "TK-002",
      createdAt: new Date('2024-01-10'),
      lastUpdated: new Date('2024-01-12'),
      conversation: [
        {
          id: createMessageId('msg-3'),
          sender: customer.id,
          message: "Dark mode would be great for reducing eye strain.",
          timestamp: new Date('2024-01-10T15:30:00')
        },
        {
          id: createMessageId('msg-4'),
          sender: createAgentId('agent-2'),
          message: "Thank you for the suggestion! We're actually working on implementing dark mode in our next release. I'll keep you updated on the progress.",
          timestamp: new Date('2024-01-10T16:45:00')
        },
        {
          id: createMessageId('msg-5'),
          sender: customer.id,
          message: "That's great to hear! Looking forward to it.",
          timestamp: new Date('2024-01-10T17:00:00')
        }
      ]
    },
    {
      id: createTicketId(3),
      title: "Billing issue",
      description: "I was charged twice for my last subscription payment.",
      priority: TicketPriority.URGENT,
      status: TicketStatus.RESOLVED,
      number: "TK-003",
      createdAt: new Date('2024-01-05'),
      lastUpdated: new Date('2024-01-07'),
      conversation: [
        {
          id: createMessageId('msg-6'),
          sender: customer.id,
          message: "Please help with the double charge on my account.",
          timestamp: new Date('2024-01-05T09:15:00')
        },
        {
          id: createMessageId('msg-7'),
          sender: createAgentId('agent-2'),
          message: "I apologize for this inconvenience. I can see the duplicate charge in our system. I've initiated a refund which should appear in your account within 3-5 business days.",
          timestamp: new Date('2024-01-05T09:30:00')
        },
        {
          id: createMessageId('msg-8'),
          sender: customer.id,
          message: "Thank you for the quick resolution!",
          timestamp: new Date('2024-01-05T10:00:00')
        },
        {
          id: createMessageId('msg-9'),
          sender: createAgentId('agent-2'),
          message: "You're welcome! The refund has been processed successfully. Is there anything else you need help with?",
          timestamp: new Date('2024-01-05T10:15:00')
        }
      ],
      assignedTo: createAgentId('agent-2')
    }
  ];

  return (
    <div className={`bg-gray-50 h-full overflow-auto ${isExpanded ? 'w-full' : 'w-[480px]'}`}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Customer Profile</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            {customer.avatar ? (
              <img
                src={customer.avatar}
                alt={customer.name}
                className="w-16 h-16 rounded-full ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 ring-2 ring-gray-100 flex items-center justify-center">
                <span className="text-2xl font-medium text-blue-700">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{customer.name}</h3>
              <p className="text-gray-500">{customer.email}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6">
            {customer.phone && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-gray-900">{customer.phone}</p>
              </div>
            )}
            {customer.company && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Company</p>
                <p className="text-gray-900">{customer.company}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-gray-900">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
            {customer.metadata?.lastLogin && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Last Login</p>
                <p className="text-gray-900">
                  {new Date(customer.metadata.lastLogin).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {customer.metadata?.preferences && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
              <div className="grid grid-cols-2 gap-6">
                {customer.metadata.preferences.language && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Language</p>
                    <p className="text-gray-900">{customer.metadata.preferences.language}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Notifications</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${customer.metadata.preferences.notifications ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <p className="text-gray-900">
                      {customer.metadata.preferences.notifications ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <CustomerTicketList
          tickets={customerTickets}
          onTicketSelect={(ticket) => {
            if (onTicketSelect) {
              onTicketSelect(ticket);
            } else {
              onClose();
            }
          }}
        />
      </div>
    </div>
  );
};

export default CustomerProfileView; 