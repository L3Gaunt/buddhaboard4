import React, { useRef, useEffect, useState } from 'react';
import type { FC } from 'react';
import { ArrowLeft, UserPlus, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "../../RichTextEditor";
import CustomerProfileView from '../CustomerProfileView';
import { addMessageToTicket, updateTicketPriority, updateTicket, getAllCustomerTickets } from '@/lib/tickets';
import { getAgentProfile } from '@/lib/auth';
import { AgentCard } from '@/components/AgentCard';
import { 
  type Ticket, 
  type TicketDetailProps, 
  TicketPriority, 
  TicketStatus,
  type Message,
  type UnwrapReadonly,
  type Agent,
  createMessageId
} from '@/types';
import { TicketBadge } from '../../components/TicketBadge';
import { supabase } from '@/lib/supabaseClient';

// Add new interface for feedback
interface TicketFeedback {
  rating: number;
  feedbackText: string;
}

interface FeedbackData {
  rating: number;
  feedback_text: string | null;
}

interface FeedbackResponse {
  data: FeedbackData | null;
  error?: string;
}

export const TicketDetail: FC<TicketDetailProps> = ({
  ticket,
  setActiveTicket,
  ticketPriority,
  setTicketPriority,
  ticketStatus,
  setTicketStatus,
  setShowReassignModal,
  response,
  setResponse,
  customer,
  isCustomerView = false,
}) => {
  const [showCustomerProfile, setShowCustomerProfile] = React.useState(false);
  const [customerTickets, setCustomerTickets] = useState<Ticket[]>([]);
  const [assignedAgent, setAssignedAgent] = useState<Agent | null>(null);
  const [showAgentCard, setShowAgentCard] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Add new state for feedback
  const [feedback, setFeedback] = useState<TicketFeedback>({ rating: 5, feedbackText: '' });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  // Check if feedback exists
  useEffect(() => {
    if (isCustomerView && ['resolved', 'closed'].includes(ticketStatus)) {
      const fetchFeedback = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit_ticket_feedback?ticketNumber=${ticket.number}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              },
            }
          );

          const { data, error }: FeedbackResponse = await response.json();
          
          if (error) {
            throw new Error(error);
          }

          if (data) {
            setFeedback({ rating: data.rating, feedbackText: data.feedback_text || '' });
            setFeedbackSubmitted(true);
          }
        } catch (error) {
          console.error('Error fetching feedback:', error);
        }
      };

      fetchFeedback();
    }
  }, [isCustomerView, ticketStatus, ticket.number]);

  // Add feedback submission handler
  const handleSubmitFeedback = async () => {
    setIsSubmittingFeedback(true);
    setFeedbackError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit_ticket_feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          ticketNumber: ticket.number,
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

  // Fetch assigned agent when ticket changes
  useEffect(() => {
    if (ticket.assignedTo) {
      getAgentProfile(ticket.assignedTo.toString())
        .then(agent => setAssignedAgent(agent))
        .catch(error => console.error('Error fetching assigned agent:', error));
    } else {
      setAssignedAgent(null);
    }
  }, [ticket.assignedTo]);

  // Fetch all customer tickets when showing profile
  useEffect(() => {
    if (showCustomerProfile && customer) {
      getAllCustomerTickets(customer.id.toString())
        .then(tickets => setCustomerTickets(tickets))
        .catch(error => console.error('Error fetching customer tickets:', error));
    }
  }, [showCustomerProfile, customer]);

  // Scroll to bottom when conversation updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [ticket.conversation]);

  const handleSendMessage = async () => {
    if (!response.trim()) return;

    const newMessage: Message = {
      id: createMessageId(`msg_${Date.now()}`),
      isFromCustomer: isCustomerView, // Set based on viewer type
      message: response,
      timestamp: new Date()
    };

    try {
      // Convert TicketId to number using valueOf()
      const numericId = Number(ticket.id.valueOf());
      
      await addMessageToTicket(numericId, {
        id: newMessage.id,
        isFromCustomer: newMessage.isFromCustomer,
        message: newMessage.message,
        timestamp: newMessage.timestamp.toISOString()
      });

      // Update local state
      const updatedTicket = {
        ...ticket,
        conversation: [...ticket.conversation, newMessage],
        lastUpdated: new Date()
      } as UnwrapReadonly<Ticket>;

      setActiveTicket(updatedTicket);
      setResponse("");
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Add error handling UI
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    try {
      const numericId = Number(ticket.id.valueOf());
      await updateTicketPriority(numericId, newPriority);
      setTicketPriority(newPriority);
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      // TODO: Add error handling UI
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      const numericId = Number(ticket.id.valueOf());
      await updateTicket(numericId, {
        status: newStatus
      });
      setTicketStatus(newStatus);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      // TODO: Add error handling UI
    }
  };

  return (
    <div className="flex">
      <div className={`bg-white rounded-lg shadow flex-grow ${showCustomerProfile ? 'mr-4' : ''} flex flex-col h-[calc(100vh-4rem)]`}>
        <div className="border-b border-gray-200 p-4 flex-shrink-0">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => {
              window.history.pushState({}, '', '/tickets');
              setActiveTicket(null);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Queue
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{ticket.title}</h2>
              <p className="text-sm text-gray-500">Ticket #{ticket.number}</p>
              {assignedAgent && !isCustomerView && (
                <p className="text-sm text-gray-500 mt-1">
                  Assigned to:{' '}
                  <button
                    onClick={() => setShowAgentCard(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {assignedAgent.name}
                  </button>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isCustomerView && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerProfile(!showCustomerProfile)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {showCustomerProfile ? 'Hide Customer' : 'Show Customer'}
                  </Button>
                  <select
                    className="px-3 py-1 text-sm border rounded-md"
                    value={ticketPriority}
                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                  >
                    <option value={TicketPriority.LOW}>Low Priority</option>
                    <option value={TicketPriority.MEDIUM}>Medium Priority</option>
                    <option value={TicketPriority.HIGH}>High Priority</option>
                    <option value={TicketPriority.URGENT}>Urgent</option>
                  </select>
                </>
              )}
              <select
                className="px-3 py-1 text-sm border rounded-md"
                value={ticketStatus}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              >
                <option value={TicketStatus.OPEN}>Open</option>
                <option value={TicketStatus.WAITING_CUSTOMER_REPLY}>Waiting for Customer Reply</option>
                <option value={TicketStatus.RESOLVED}>Resolved</option>
                <option value={TicketStatus.CLOSED}>Closed</option>
              </select>
              {!isCustomerView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReassignModal(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Reassign
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <TicketBadge type="priority" value={ticketPriority} />
              <TicketBadge type="status" value={ticketStatus} />
            </div>
          </div>
        </div>
        <div ref={chatContainerRef} className="p-6 space-y-6 flex-grow overflow-y-auto">
          {ticket.conversation.map((message, index) => {
            const messageDate = new Date(message.timestamp);
            const isOwnMessage = isCustomerView ? message.isFromCustomer : !message.isFromCustomer;
            return (
              <div
                key={index}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    isOwnMessage ? "bg-green-100" : "bg-blue-100"
                  }`}
                >
                  <div className="font-medium text-sm mb-1">
                    {isCustomerView ? 
                      (message.isFromCustomer ? "Me" : "Support") : 
                      (message.isFromCustomer ? "Customer" : "Agent")}
                  </div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: message.message,
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    {messageDate.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add feedback section for customers when ticket is resolved/closed */}
          {isCustomerView && ['resolved', 'closed'].includes(ticketStatus) && (
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
                              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit_ticket_feedback?ticketNumber=${ticket.number}`,
                              {
                                method: 'GET',
                                headers: {
                                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
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
        <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
          <div className="space-y-2">
            <RichTextEditor content={response} onChange={setResponse} />
            <div className="flex justify-end">
              <Button onClick={handleSendMessage}>
                Send Response
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {showCustomerProfile && (
        <CustomerProfileView
          customer={customer}
          customerTickets={customerTickets}
          onClose={() => setShowCustomerProfile(false)}
          isExpanded={false}
          onTicketSelect={(selectedTicket) => {
            setActiveTicket(selectedTicket);
            setShowCustomerProfile(false);
          }}
        />
      )}

      {showAgentCard && assignedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAgentCard(false)}
              >
                ×
              </Button>
            </div>
            <AgentCard agent={assignedAgent} showStatus={true} />
          </div>
        </div>
      )}
    </div>
  );
};
