import type { FC } from 'react';
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "../../RichTextEditor";
import { 
  type Ticket, 
  type TicketDetailProps, 
  TicketPriority, 
  TicketStatus,
  type Conversation,
  type TicketId,
  type ConversationId,
  createTicketId,
  createConversationId
} from '@/types';
import { updateTicket, addConversation } from '@/lib/api';

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
}) => {
  const handleSendMessage = async () => {
    if (!response.trim()) return;

    try {
      const newConversation = await addConversation(
        createTicketId(Number(ticket.id)),
        response,
        "Agent" // TODO: Replace with actual agent ID
      );

      // Convert readonly objects to mutable ones
      const mutableTicket = JSON.parse(JSON.stringify(ticket)) as Ticket;
      const mutableConversation = {
        ...newConversation,
        id: createConversationId(newConversation.id),
        timestamp: new Date(newConversation.timestamp)
      } as Conversation;

      const updatedTicket: Ticket = {
        ...mutableTicket,
        conversation: [...mutableTicket.conversation, mutableConversation],
        lastUpdated: new Date()
      };

      setActiveTicket(updatedTicket);
      setResponse("");
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Add error handling UI
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    try {
      await updateTicket(createTicketId(Number(ticket.id)), { priority: newPriority });
      setTicketPriority(newPriority);
    } catch (error) {
      console.error('Error updating priority:', error);
      // TODO: Add error handling UI
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      await updateTicket(createTicketId(Number(ticket.id)), { status: newStatus });
      setTicketStatus(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      // TODO: Add error handling UI
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 p-4">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setActiveTicket(null)}
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
              <option value={TicketStatus.IN_PROGRESS}>In Progress</option>
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
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              ticketPriority === TicketPriority.LOW
                ? "bg-blue-100 text-blue-800"
                : ticketPriority === TicketPriority.MEDIUM
                ? "bg-yellow-100 text-yellow-800"
                : ticketPriority === TicketPriority.HIGH
                ? "bg-orange-100 text-orange-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {ticketPriority.replace("_", " ")} Priority
          </span>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              ticketStatus === TicketStatus.OPEN
                ? "bg-blue-100 text-blue-800"
                : ticketStatus === TicketStatus.IN_PROGRESS
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {ticketStatus.replace("_", " ")}
          </span>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {ticket.conversation.map((message) => {
          // Convert readonly message to mutable one
          const mutableMessage = JSON.parse(JSON.stringify(message));
          return (
            <div
              key={String(mutableMessage.id)}
              className={`flex ${mutableMessage.sender === "Customer" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${mutableMessage.sender === "System" ? "bg-gray-100 text-gray-600 text-sm" : mutableMessage.sender === "Customer" ? "bg-blue-100" : "bg-green-100"}`}
              >
                <div className="font-medium text-sm mb-1">{mutableMessage.sender}</div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: mutableMessage.message,
                  }}
                />
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(mutableMessage.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-200 p-4">
        <div className="space-y-4">
          <RichTextEditor content={response} onChange={setResponse} />
          <div className="flex justify-end">
            <Button onClick={handleSendMessage}>
              Send Response
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
