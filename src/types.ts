// Common Types and Interfaces

// Enum for ticket priority
export enum TicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

// Enum for ticket status
export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed"
}

// Enum for agent status
export enum AgentStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  BUSY = "busy",
  AWAY = "away"
}

// Enum for agent roles
export enum AgentRole {
  ADMIN = "admin",
  AGENT = "agent",
  SUPERVISOR = "supervisor"
}

// Ticket related types
export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  number: string;
  time: string; // Consider using Date type if working with actual dates
  conversation: Conversation[];
  assignedTo?: string; // Optional agent assignment
  lastUpdated: string; // Consider using Date type if working with actual dates
}

export interface Conversation {
  id: string;
  sender: string;
  message: string;
  time: string; // Consider using Date type if working with actual dates
  attachments?: string[]; // Optional attachments
}

// Form Data type for ticket submission
export interface TicketFormData {
  title: string;
  description: string;
  priority: TicketPriority;
}

// Agent related types
export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  avatar: string;
  email: string;
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
  ticketPriority: TicketPriority;
  setTicketPriority: (priority: TicketPriority) => void;
  ticketStatus: TicketStatus;
  setTicketStatus: (status: TicketStatus) => void;
  setShowReassignModal: (show: boolean) => void;
  response: string;
  setResponse: (response: string) => void;
}

export interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
} 