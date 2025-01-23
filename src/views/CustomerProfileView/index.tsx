import React, { useState, useCallback, useEffect } from 'react';
import { CustomerProfileProps, CustomerTicketListProps } from '../../types';
import { TicketBadge } from '../../components/TicketBadge';
import { RichTextEditor } from '../../RichTextEditor';
import { updateCustomerNotes } from '../../lib/customers';
import debounce from 'lodash/debounce';

const CustomerTicketList: React.FC<CustomerTicketListProps> = ({ tickets, onTicketSelect }) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Tickets</h3>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              const newUrl = `/tickets/${ticket.number}`;
              window.history.pushState({}, '', newUrl);
              onTicketSelect(ticket);
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{ticket.title}</h4>
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
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<string>(propCustomer.metadata?.notes?.toString() || '');

  useEffect(() => {
    setLocalNotes(propCustomer.metadata?.notes?.toString() || '');
  }, [propCustomer.metadata?.notes]);

  const debouncedUpdateNotes = useCallback(
    debounce(async (notes: string) => {
      try {
        setIsSaving(true);
        setError(null);
        await updateCustomerNotes(String(propCustomer.id), notes);
      } catch (err) {
        setError('Failed to save notes. Please try again.');
        console.error('Error saving notes:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [propCustomer.id]
  );

  const handleNotesChange = (notes: string) => {
    setLocalNotes(notes);
    debouncedUpdateNotes(notes);
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${isExpanded ? 'w-full' : 'w-96'}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold">{propCustomer.name}</h2>
          <p className="text-sm text-gray-500">{propCustomer.email}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          ×
        </button>
      </div>
      <div className="space-y-4">
        {propCustomer.phone && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Phone</h3>
            <p>{propCustomer.phone}</p>
          </div>
        )}
        {propCustomer.company && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Company</h3>
            <p>{propCustomer.company}</p>
          </div>
        )}
        <div>
          <h3 className="text-sm font-medium text-gray-500">Customer Since</h3>
          <p>{new Date(propCustomer.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Notes</h3>
            {isSaving && <span className="text-sm text-gray-500">Saving...</span>}
            {error && <span className="text-sm text-red-500">{error}</span>}
          </div>
          <RichTextEditor
            content={localNotes}
            onChange={handleNotesChange}
          />
        </div>
      </div>
      
      {onTicketSelect && (
        <CustomerTicketList
          tickets={propCustomerTickets}
          onTicketSelect={onTicketSelect}
        />
      )}
    </div>
  );
};

export default CustomerProfileView; 