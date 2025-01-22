import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { TicketData } from "@/lib/tickets";

export function TicketLookupView() {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function lookupTicket() {
      try {
        const hash = window.location.pathname.split('/ticket/')[1];
        console.log('Looking up ticket with hash:', hash);
        
        if (!hash) {
          console.error('No ticket hash provided');
          setError('No ticket hash provided');
          setLoading(false);
          return;
        }

        // Decode the hash to get ticket number and user ID
        let decoded;
        try {
          decoded = atob(hash);
          console.log('Decoded hash:', decoded);
        } catch (decodeError) {
          console.error('Error decoding hash:', decodeError);
          setError('Invalid ticket hash format');
          setLoading(false);
          return;
        }

        const [ticketNumber, userId] = decoded.split(':');
        console.log('Parsed ticket data:', { ticketNumber, userId });

        if (!ticketNumber || !userId) {
          console.error('Invalid hash format - missing ticket number or user ID');
          setError('Invalid ticket hash format');
          setLoading(false);
          return;
        }

        // Fetch the ticket
        console.log('Fetching ticket from Supabase:', { ticketNumber: parseInt(ticketNumber, 10), userId });
        const { data, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('number', parseInt(ticketNumber, 10))
          .eq('customer_id', userId)
          .single();

        if (ticketError) {
          console.error('Supabase error:', ticketError);
          throw ticketError;
        }
        
        if (!data) {
          console.error('No ticket found');
          throw new Error('Ticket not found');
        }

        console.log('Ticket found:', data);
        setTicket(data);
      } catch (err) {
        console.error('Error looking up ticket:', err);
        setError('Invalid ticket hash or ticket not found');
      } finally {
        setLoading(false);
      }
    }

    lookupTicket();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">Loading ticket...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Error
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.href = '/submit-ticket'}>
              Submit New Ticket
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Ticket #{ticket.number}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="capitalize">Status: {ticket.status}</span>
            <span>•</span>
            <span className="capitalize">Priority: {ticket.priority}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="font-medium text-gray-900">{ticket.title}</h2>
            <p className="mt-2 text-gray-600 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {ticket.conversation && ticket.conversation.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Conversation</h3>
              <div className="space-y-4">
                {ticket.conversation.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.isFromCustomer
                        ? 'bg-blue-50 ml-4'
                        : 'bg-gray-50 mr-4'
                    }`}
                  >
                    <div className="text-sm text-gray-500 mb-1">
                      {msg.isFromCustomer ? 'You' : 'Support Agent'} •{' '}
                      {new Date(msg.timestamp).toLocaleString()}
                    </div>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 