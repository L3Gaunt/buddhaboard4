import React, { useRef, useEffect, useState } from 'react';
import type { FC } from 'react';
import { ArrowLeft, UserPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "../../RichTextEditor";
import CustomerProfileView from '../CustomerProfileView';
import { addMessageToTicket, updateTicketPriority, updateTicket, getAllCustomerTickets } from '@/lib/tickets';
import { 
  type Ticket, 
  type TicketDetailProps, 
  TicketPriority, 
  TicketStatus,
  type Message,
  type UnwrapReadonly,
  createMessageId
} from '@/types';
import { TicketBadge } from '../../components/TicketBadge';

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
}) => {
  const [showCustomerProfile, setShowCustomerProfile] = React.useState(false);
  const [customerTickets, setCustomerTickets] = useState<Ticket[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
      isFromCustomer: false, // Agent message
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
            </div>
            <div className="flex items-center gap-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReassignModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Reassign
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <TicketBadge type="priority" value={ticketPriority} />
            <TicketBadge type="status" value={ticketStatus} />
          </div>
        </div>
        <div ref={chatContainerRef} className="p-6 space-y-6 flex-grow overflow-y-auto">
          {ticket.conversation.map((message, index) => {
            const messageDate = new Date(message.timestamp);
            return (
              <div
                key={index}
                className={`flex ${message.isFromCustomer ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.isFromCustomer ? "bg-blue-100" : "bg-green-100"
                  }`}
                >
                  <div className="font-medium text-sm mb-1">
                    {message.isFromCustomer ? "Customer" : "Agent"}
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
    </div>
  );
};
