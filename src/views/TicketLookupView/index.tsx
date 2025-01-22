import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { TicketData } from "@/lib/tickets";
import { RichTextEditor } from "@/RichTextEditor";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

export function TicketLookupView() {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const ticketHash = window.location.pathname.split('/ticket/')[1];

  // Scroll to bottom when conversation updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [ticket?.conversation]);

  useEffect(() => {
    async function lookupTicket() {
      try {
        console.log('Looking up ticket with hash:', ticketHash);
        
        if (!ticketHash) {
          console.error('No ticket hash provided');
          setError('No ticket hash provided');
          setLoading(false);
          return;
        }

        // Use the new database function to lookup the ticket
        const { data, error: ticketError } = await supabase
          .rpc('get_ticket_by_hash', { hash: ticketHash });

        if (ticketError) {
          console.error('Error looking up ticket:', ticketError);
          throw ticketError;
        }

        if (!data || !Array.isArray(data) || data.length === 0) {
          console.error('No ticket found');
          throw new Error('Ticket not found');
        }

        console.log('Ticket found:', data);
        // Take the first ticket from the array
        setTicket(data[0]);
      } catch (err) {
        console.error('Error looking up ticket:', err);
        setError('Invalid ticket hash or ticket not found');
      } finally {
        setLoading(false);
      }
    }

    lookupTicket();
  }, [ticketHash]);

  const handleSendMessage = async () => {
    if (!response.trim() || !ticketHash) return;

    try {
      const { data, error } = await fetch(`${supabaseUrl}/functions/v1/customer_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'append_message',
          ticketHash,
          message: response
        })
      }).then(res => res.json());

      if (error) throw error;

      // Update local state
      setTicket(data);
      setResponse("");
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

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
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full flex flex-col h-[calc(100vh-8rem)]">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Ticket #{ticket.number}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="capitalize">Status: {ticket.status}</span>
            <span>•</span>
            <span className="capitalize">Priority: {ticket.priority}</span>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto mb-6" ref={chatContainerRef}>
          <div className="space-y-6">
            <div>
              <h2 className="font-medium text-gray-900">{ticket.title}</h2>
            </div>

            {ticket.conversation && ticket.conversation.length > 0 && (
              <div className="space-y-4">
                {ticket.conversation.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isFromCustomer ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.isFromCustomer ? "bg-blue-100" : "bg-green-100"
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">
                        {msg.isFromCustomer ? "You" : "Support Agent"}
                      </div>
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: msg.message,
                        }}
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(msg.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 flex-shrink-0">
          <div className="space-y-2">
            <RichTextEditor content={response} onChange={setResponse} />
            <div className="flex justify-end">
              <Button onClick={handleSendMessage}>
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 