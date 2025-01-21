-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE agent_role AS ENUM ('admin', 'agent', 'supervisor');
CREATE TYPE agent_status AS ENUM ('online', 'offline', 'busy', 'away');

-- Create agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role agent_role NOT NULL DEFAULT 'agent',
    status agent_status NOT NULL DEFAULT 'offline',
    avatar TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    number TEXT NOT NULL UNIQUE,
    priority ticket_priority NOT NULL DEFAULT 'medium',
    status ticket_status NOT NULL DEFAULT 'open',
    assigned_to UUID REFERENCES agents(id),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    attachments JSONB,
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_conversations_ticket_id ON conversations(ticket_id);
CREATE INDEX idx_agents_auth_id ON agents(auth_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_last_updated
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Agents can view all agents"
    ON agents FOR SELECT
    USING (true);

CREATE POLICY "Agents can view all tickets"
    ON tickets FOR SELECT
    USING (true);

CREATE POLICY "Agents can view all conversations"
    ON conversations FOR SELECT
    USING (true);

-- Only allow agents to modify their own status
CREATE POLICY "Agents can update their own status"
    ON agents FOR UPDATE
    USING (auth_id = auth.uid())
    WITH CHECK (auth_id = auth.uid());

-- Allow agents to create tickets
CREATE POLICY "Agents can create tickets"
    ON tickets FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM agents 
        WHERE agents.auth_id = auth.uid()
    ));

-- Allow agents to update assigned tickets
CREATE POLICY "Agents can update assigned tickets"
    ON tickets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE agents.auth_id = auth.uid() 
            AND (
                agents.id = tickets.assigned_to 
                OR agents.role = 'admin'
            )
        )
    );

-- Allow agents to create conversations
CREATE POLICY "Agents can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM agents 
        WHERE agents.auth_id = auth.uid()
    ));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO agents (auth_id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::agent_role, 'agent'::agent_role)
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 