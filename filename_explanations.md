src/App.tsx: Main application component handling routing, authentication, and view management for the support desk system.
src/RichTextEditor.tsx: Rich text editor component for composing and formatting messages in ticket conversations.
src/components/Layout.tsx: Layout component providing the main structure and navigation for the application.
src/components/Sidebar.tsx: Sidebar component for navigating between different views (tickets, dashboard, agents, chat).
src/components/modals/AgentSettingsModal.tsx: Modal for managing agent settings, including availability and personal information.
src/components/modals/CreateAgentModal.tsx: Modal for creating new agents with form inputs for name, email, role, and department.
src/components/modals/EditAgentModal.tsx: Modal for editing existing agent profiles, including updating personal information and changing passwords.
src/components/modals/ReassignTicketModal.tsx: Modal for reassigning tickets to different agents, displaying a list of available agents.
src/components/ui/button.tsx: Reusable button component with various styles and sizes.
src/components/ui/index.tsx: Exports UI components for easy import.
src/components/ui/input.tsx: Reusable input component for form fields.
src/components/ui/label.tsx: Reusable label component for form inputs.
src/components/ui/select.tsx: Reusable select dropdown component for form inputs.
src/env.d.ts: TypeScript declarations for environment variables.
src/index.css: Global CSS styles and Tailwind configuration.
src/index.tsx: Entry point for the React application, rendering the main App component.
src/lib/agents.ts: Functions for managing agent data, including fetching, updating, and creating agents.
src/lib/auth.ts: Functions for handling authentication, including sign-in, sign-out, and user profile management.
src/lib/supabase.ts: Initialization of the Supabase client for interacting with the backend.
src/lib/tickets.ts: Functions for managing ticket data, including fetching, creating, updating, and adding messages to tickets.
src/lib/utils.ts: Utility functions, including a class name merging utility.
src/types.ts: Type definitions and interfaces used throughout the application.
src/types/supabase.ts: TypeScript types generated from the Supabase database schema.
src/views/AgentsView/index.tsx: View for managing and displaying a list of agents.
src/views/ChatView/index.tsx: View for live chat functionality, currently displaying a placeholder.
src/views/CustomerProfileView/index.tsx: View for displaying customer profiles and their associated tickets.
src/views/DashboardView/index.tsx: View for displaying analytics and metrics related to tickets and agents.
src/views/LoginView/index.tsx: Login view for authenticating agents.
src/views/TicketLookupView/index.tsx: View for customers to look up and interact with their tickets using a ticket hash.
src/views/TicketsView/TicketDetail.tsx: Detailed view of a single ticket, including conversation history and management options, for the agent.
src/views/TicketsView/TicketQueue.tsx: View displaying a queue of tickets, allowing agents to select and manage them.
src/views/UserTicketView/index.tsx: View for customers to submit new support tickets.
supabase/.gitignore: Specifies files and directories to be ignored by Git in the Supabase project.
supabase/config.toml: Configuration file for the Supabase local development environment.
supabase/functions/_shared/cors.ts: Shared CORS headers configuration for Supabase functions.
supabase/functions/change_password/index.ts: Supabase function for changing an agent's password.
supabase/functions/create_agent/index.ts: Supabase function for creating new agents.
supabase/functions/customer_ticket/index.ts: Supabase function for handling customer ticket creation and updates.
supabase/migrations/20240321000000_create_users_and_agents.sql: Database migration script for creating users and agents tables.
supabase/migrations/20250121222047_create_tickets_table.sql: Database migration script for creating the tickets table and related functions.