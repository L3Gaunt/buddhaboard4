-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for customers
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    avatar TEXT,
    phone TEXT,
    company TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create agents table that extends auth.users
CREATE TYPE agent_role AS ENUM ('admin', 'agent', 'supervisor');
CREATE TYPE agent_status AS ENUM ('online', 'offline', 'busy', 'away');

CREATE TABLE agents (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    role agent_role NOT NULL DEFAULT 'agent',
    status agent_status NOT NULL DEFAULT 'offline',
    avatar TEXT,
    email TEXT UNIQUE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT agents_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid() IN (
        SELECT a.id FROM agents a
        UNION
        SELECT users.id FROM users
    ));

CREATE POLICY "Only agents can insert users"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IN (SELECT id FROM agents));

CREATE POLICY "Only agents can update users"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM agents));

-- Agents policies
CREATE POLICY "Agents can view other agents"
    ON agents FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM agents));

CREATE POLICY "Only admins can insert agents"
    ON agents FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM agents WHERE role = 'admin'
        )
    );

CREATE POLICY "Only admins can update agents"
    ON agents FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM agents WHERE role = 'admin'
        )
    ); 