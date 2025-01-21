import type { FC } from 'react';
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "../../RichTextEditor";
import { 
  type Ticket, 
  type TicketDetailProps, 
  TicketPriority, 
  TicketStatus,
  type Conversation 
} from '@/types';

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
  const handleSendMessage = () => {
    if (!response.trim()) return;

    const newMessage: Conversation = {
      id: Date.now().toString(),
      sender: "Agent",
      message: response,
      time: new Date().toLocaleTimeString()
    };

    setActiveTicket({
      ...ticket,
      conversation: [...ticket.conversation, newMessage],
      lastUpdated: new Date().toLocaleTimeString()
    });
    setResponse("");
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
              onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
            >
              <option value={TicketPriority.LOW}>Low Priority</option>
              <option value={TicketPriority.MEDIUM}>Medium Priority</option>
              <option value={TicketPriority.HIGH}>High Priority</option>
              <option value={TicketPriority.URGENT}>Urgent</option>
            </select>
            <select
              className="px-3 py-1 text-sm border rounded-md"
              value={ticketStatus}
              onChange={(e) => setTicketStatus(e.target.value as TicketStatus)}
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
        {ticket.conversation.map((message: { sender: string; message: string; time: string }, index: number) => (
          <div
            key={index}
            className={`flex ${message.sender === "Customer" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${message.sender === "System" ? "bg-gray-100 text-gray-600 text-sm" : message.sender === "Customer" ? "bg-blue-100" : "bg-green-100"}`}
            >
              <div className="font-medium text-sm mb-1">{message.sender}</div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: message.message,
                }}
              />
              <div className="text-xs text-gray-500 mt-2">{message.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 p-4">
        <div className="space-y-4">
          <RichTextEditor content={response} onChange={setResponse} />
          <div className="flex justify-end">
            <Button
              onClick={handleSendMessage}
            >
              Send Response
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
