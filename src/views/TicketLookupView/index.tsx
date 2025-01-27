import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { TicketData } from "@/lib/tickets";
import { RichTextEditor } from "@/RichTextEditor";
import { Star } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

interface TicketFeedback {
  rating: number;
  feedbackText: string;
}

interface FeedbackResponse {
  data: {
    rating: number;
    feedback_text: string | null;
  } | null;
  error?: string;
}

export function TicketLookupView() {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const ticketHash = window.location.pathname.split('/ticket/')[1];
  
  // Add feedback state
  const [feedback, setFeedback] = useState<TicketFeedback>({ rating: 5, feedbackText: '' });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  // Scroll to bottom when conversation updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [ticket?.conversation]);

  // Check for existing feedback
  useEffect(() => {
    if (ticket && ['resolved', 'closed'].includes(ticket.status)) {
      const fetchFeedback = async () => {
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/submit_ticket_feedback?ticketHash=${ticketHash}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const { data, error }: FeedbackResponse = await response.json();
          
          if (error) {
            throw new Error(error);
          }

          if (data) {
            setFeedback({ 
              rating: data.rating, 
              feedbackText: data.feedback_text || '' 
            });
            setFeedbackSubmitted(true);
          }
        } catch (error) {
          console.error('Error fetching feedback:', error);
        }
      };

      fetchFeedback();
    }
  }, [ticket?.status, ticketHash]);

  // Add feedback submission handler
  const handleSubmitFeedback = async () => {
    setIsSubmittingFeedback(true);
    setFeedbackError(null);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/submit_ticket_feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketHash,
          rating: feedback.rating,
          feedbackText: feedback.feedbackText.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setFeedbackSubmitted(true);
      setIsEditingFeedback(false);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

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

            {/* Add feedback section */}
            {ticket && ['resolved', 'closed'].includes(ticket.status) && (
              <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {feedbackSubmitted && !isEditingFeedback ? 'Your Feedback' : 'How was your experience?'}
                  </h3>
                  {feedbackSubmitted && !isEditingFeedback && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingFeedback(true)}
                    >
                      Edit Feedback
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => (!feedbackSubmitted || isEditingFeedback) && setFeedback(prev => ({ ...prev, rating: star }))}
                        disabled={feedbackSubmitted && !isEditingFeedback}
                        className={`text-2xl ${
                          star <= feedback.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        } transition-colors hover:text-yellow-400 disabled:cursor-not-allowed`}
                      >
                        <Star className="h-6 w-6" fill={star <= feedback.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={feedback.feedbackText}
                    onChange={(e) => (!feedbackSubmitted || isEditingFeedback) && setFeedback(prev => ({ ...prev, feedbackText: e.target.value }))}
                    disabled={feedbackSubmitted && !isEditingFeedback}
                    placeholder="Would you like to add any comments? (optional)"
                    className="w-full p-2 border rounded-md h-24 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />

                  {(!feedbackSubmitted || isEditingFeedback) && (
                    <div className="flex gap-2 justify-end">
                      {isEditingFeedback && (
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            setIsEditingFeedback(false);
                            try {
                              const response = await fetch(
                                `${supabaseUrl}/functions/v1/submit_ticket_feedback?ticketHash=${ticketHash}`,
                                {
                                  method: 'GET',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                }
                              );

                              const { data, error }: FeedbackResponse = await response.json();
                              
                              if (error) {
                                throw new Error(error);
                              }

                              if (data) {
                                setFeedback({ 
                                  rating: data.rating, 
                                  feedbackText: data.feedback_text || '' 
                                });
                              }
                            } catch (error) {
                              console.error('Error resetting feedback:', error);
                            }
                          }}
                          disabled={isSubmittingFeedback}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button 
                        onClick={handleSubmitFeedback}
                        disabled={isSubmittingFeedback}
                      >
                        {isSubmittingFeedback ? 'Submitting...' : (feedbackSubmitted ? 'Update Feedback' : 'Submit Feedback')}
                      </Button>
                    </div>
                  )}

                  {feedbackError && (
                    <p className="text-red-500 text-sm">{feedbackError}</p>
                  )}
                </div>
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