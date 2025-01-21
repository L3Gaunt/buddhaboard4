// Common Types and Interfaces

// Ticket related types
export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: string;
  number: string;
  time: string;
  conversation: Conversation[];
}

export interface Conversation {
  sender: string;
  message: string;
  time: string;
}

// Form Data type for ticket submission
export interface TicketFormData {
  title: string;
  description: string;
  priority: string;
}

// Agent related types
export interface Agent {
  name: string;
  role: string;
  status: string;
  avatar: string;
}

// View types
export const Views = {
  TICKETS: "tickets",
  DASHBOARD: "dashboard",
  AGENTS: "agents",
  CHAT: "chat",
} as const;

export type ViewType = typeof Views[keyof typeof Views];

// Component Props Types
export interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  isMobileMenuOpen: boolean;
}

export interface LayoutProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
  setShowSettings: (show: boolean) => void;
}

export interface TicketQueueProps {
  tickets: Ticket[];
  setActiveTicket: (ticket: Ticket | null) => void;
}

export interface TicketDetailProps {
  ticket: Ticket;
  setActiveTicket: (ticket: Ticket | null) => void;
  ticketPriority: string;
  setTicketPriority: (priority: string) => void;
  ticketStatus: string;
  setTicketStatus: (status: string) => void;
  setShowReassignModal: (show: boolean) => void;
  response: string;
  setResponse: (response: string) => void;
}

export interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
} 