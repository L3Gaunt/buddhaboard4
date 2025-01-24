import { FC, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FeedbackQueue } from './FeedbackQueue';
import { TicketStatus, TicketPriority, type Ticket } from '@/types';
import { getTicketById } from '@/lib/tickets';

interface FeedbackView {
  currentAgent?: {
    id: string;
    name: string;
    role: string;
  } | null;
  setActiveTicket: (ticket: Ticket | null) => void;
}

interface SupabaseFeedback {
  id: string;
  ticket_number: number;
  rating: number;
  feedback_text: string | null;
  created_at: string;
  tickets: {
    title: string;
    assigned_to: string | null;
    status: string;
    priority: string;
  };
}

interface FeedbackItem {
  id: string;
  ticketNumber: number;
  rating: number;
  feedbackText: string | null;
  createdAt: Date;
  ticket: {
    title: string;
    assignedTo: string | null;
    status: TicketStatus;
    priority: TicketPriority;
  };
}

export const FeedbackView: FC<FeedbackView> = ({ currentAgent, setActiveTicket }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_feedback`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch feedback');
        }

        const { data: feedbackData } = await response.json();

        if (feedbackData) {
          const typedFeedbackData = feedbackData as SupabaseFeedback[];
          setFeedbackItems(
            typedFeedbackData.map((item) => ({
              id: item.id,
              ticketNumber: item.ticket_number,
              rating: item.rating,
              feedbackText: item.feedback_text,
              createdAt: new Date(item.created_at),
              ticket: {
                title: item.tickets.title,
                assignedTo: item.tickets.assigned_to,
                status: item.tickets.status as TicketStatus,
                priority: item.tickets.priority as TicketPriority,
              },
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to load feedback. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  const handleSetActiveTicket = async (ticketNumber: number) => {
    try {
      const ticket = await getTicketById(ticketNumber);
      if (ticket) {
        window.history.pushState({}, '', `/tickets/${ticketNumber}`);
        setActiveTicket(ticket);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <FeedbackQueue
        feedbackItems={feedbackItems}
        setActiveTicket={handleSetActiveTicket}
        currentAgent={currentAgent}
      />
    </div>
  );
}; 