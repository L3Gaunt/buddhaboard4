// Common Types and Interfaces

/**
 * Enum for ticket priority levels
 * @readonly
 */
export const TicketPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent"
} as const;

export type TicketPriority = typeof TicketPriority[keyof typeof TicketPriority];

/**
 * Enum for ticket status
 * @readonly
 */
export const TicketStatus = {
  OPEN: "open",
  WAITING_CUSTOMER_REPLY: "waiting_customer_reply",
  WAITING_AGENT_REPLY: "waiting_agent_reply",
  RESOLVED: "resolved",
  CLOSED: "closed"
} as const;

export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];

/**
 * Enum for agent status
 * @readonly
 */
export const AgentStatus = {
  ONLINE: "online",
  OFFLINE: "offline",
  BUSY: "busy",
  AWAY: "away"
} as const;

export type AgentStatus = typeof AgentStatus[keyof typeof AgentStatus];

/**
 * Enum for agent roles
 * @readonly
 */
export const AgentRole = {
  ADMIN: "admin",
  AGENT: "agent",
  SUPERVISOR: "supervisor"
} as const;

export type AgentRole = typeof AgentRole[keyof typeof AgentRole];

// Custom type aliases for better type safety
export type TicketId = number & { readonly brand: unique symbol };
export type AgentId = string & { readonly brand: unique symbol };
export type MessageId = string & { readonly brand: unique symbol };
export type CustomerId = string & { readonly brand: unique symbol };

// Utility functions to create branded types
export const createTicketId = (id: number): TicketId => id as TicketId;
export const createAgentId = (id: string): AgentId => id as AgentId;
export const createMessageId = (id: string): MessageId => id as MessageId;
export const createCustomerId = (id: string): CustomerId => id as CustomerId;

/**
 * Represents a customer in the system
 */
export interface Customer {
  id: CustomerId;
  email: string;
  name: string;
  createdAt: Date;
  avatar?: string;
  phone?: string;
  company?: string;
  metadata?: {
    lastLogin?: Date;
    preferences?: {
      language?: string;
      notifications?: boolean;
    };
    [key: string]: unknown;
  };
}

/**
 * Represents a support ticket in the system
 */
export interface Ticket {
  id: TicketId;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  number: number;
  createdAt: Date;
  conversation: Message[];
  assignedTo?: AgentId;
  lastUpdated: Date;
  metadata?: Record<string, unknown>;
  customer_id: CustomerId;
}

/**
 * Represents a message in a ticket conversation
 */
export interface Message {
  id: MessageId;
  isFromCustomer: boolean;  // true if from customer, false if from agent
  message: string;
  timestamp: Date;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Form data structure for ticket submission
 */
export interface TicketFormData {
  title: string;
  priority: TicketPriority;
  attachments?: File[];
}

/**
 * Represents an agent in the system
 */
export interface Agent {
  id: AgentId;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  avatar: string;
  email: string;
  metadata?: {
    department?: string;
    skills?: string[];
    languages?: string[];
    [key: string]: unknown;
  };
}

/**
 * Available views in the application
 * @readonly
 */
export const Views = {
  TICKETS: "tickets",
  DASHBOARD: "dashboard",
  AGENTS: "agents",
  CHAT: "chat",
  CUSTOMER_PROFILE: "customer_profile",
  KNOWLEDGE_BASE: "knowledge_base",
} as const;

export type ViewType = typeof Views[keyof typeof Views];

// Utility type for making all properties in an object readonly
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends Function
  ? T
  : T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

// Special handling for branded types
export type UnwrapReadonly<T> = T extends DeepReadonly<infer U> ? U : T;

/**
 * Props for the Sidebar component
 */
export interface SidebarProps {
  readonly currentView: ViewType;
  readonly setCurrentView: (view: ViewType) => void;
  readonly isMobileMenuOpen: boolean;
}

/**
 * Props for the Layout component
 */
export interface LayoutProps {
  readonly currentView: ViewType;
  readonly setCurrentView: (view: ViewType) => void;
  readonly isMobileMenuOpen: boolean;
  readonly setIsMobileMenuOpen: (isOpen: boolean) => void;
  readonly children: React.ReactNode;
  readonly setShowSettings: (show: boolean) => void;
}

/**
 * Props for the TicketQueue component
 */
export interface TicketQueueProps {
  readonly tickets: ReadonlyArray<Ticket>;
  readonly setActiveTicket: (ticket: Ticket | null) => void;
  readonly isCustomerView?: boolean;
}

/**
 * Props for the TicketDetail component
 */
export interface TicketDetailProps {
  readonly ticket: DeepReadonly<Ticket>;
  readonly setActiveTicket: (ticket: Ticket | null) => void;
  readonly ticketPriority: TicketPriority;
  readonly setTicketPriority: (priority: TicketPriority) => void;
  readonly ticketStatus: TicketStatus;
  readonly setTicketStatus: (status: TicketStatus) => void;
  readonly setShowReassignModal: (show: boolean) => void;
  readonly response: string;
  readonly setResponse: (response: string) => void;
  readonly customer: DeepReadonly<Customer>;
  readonly customerTickets?: ReadonlyArray<Ticket>;
  readonly isCustomerView?: boolean;
}

/**
 * Props for the RichTextEditor component
 */
export interface RichTextEditorProps {
  readonly content: string;
  readonly onChange: (content: string) => void;
  readonly placeholder?: string;
  readonly readOnly?: boolean;
  readonly maxLength?: number;
}

/**
 * Props for the CustomerProfile components
 */
export interface CustomerProfileProps {
  readonly customer: DeepReadonly<Customer>;
  readonly customerTickets: ReadonlyArray<Ticket>;
  readonly onClose: () => void;
  readonly isExpanded?: boolean;
  readonly onTicketSelect?: (ticket: Ticket) => void;
}

export interface CustomerTicketListProps {
  readonly tickets: ReadonlyArray<Ticket>;
  readonly onTicketSelect: (ticket: Ticket) => void;
} 