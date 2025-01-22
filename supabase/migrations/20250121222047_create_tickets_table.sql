-- Create or replace a function to validate each conversation item
CREATE OR REPLACE FUNCTION validate_conversation_format(conversation JSONB[])
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  AS $$
DECLARE
  item JSONB;
BEGIN
  IF conversation IS NULL THEN
    RETURN TRUE;
  END IF;

  FOREACH item IN ARRAY conversation
  LOOP
    IF jsonb_typeof(item) <> 'object'
      OR NOT (item ? 'id')
      OR NOT (item ? 'isFromCustomer')
      OR NOT (item ? 'message')
      OR NOT (item ? 'timestamp')
    THEN
      RETURN FALSE;
    END IF;

    -- Additional type check for isFromCustomer
    IF jsonb_typeof(item->'isFromCustomer') <> 'boolean' THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- Create tickets table
CREATE TABLE tickets (
    number BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_to UUID REFERENCES auth.users(id),
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    conversation JSONB[] NOT NULL DEFAULT '{}',
    metadata JSONB,

    -- Reference the validation function in a CHECK constraint
    CONSTRAINT valid_conversation_format
      CHECK (validate_conversation_format(conversation))
);

-- Create indexes for common query patterns
CREATE INDEX tickets_status_idx ON tickets(status);
CREATE INDEX tickets_assigned_to_idx ON tickets(assigned_to);
CREATE INDEX tickets_customer_id_idx ON tickets(customer_id);
CREATE INDEX tickets_created_at_idx ON tickets(created_at DESC);

-- Create a function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_ticket_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before each update
CREATE TRIGGER update_ticket_last_updated_trigger
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_last_updated();

-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets
CREATE POLICY "Allow customers and agents to view tickets they are involved with"
    ON tickets FOR SELECT
    USING (
        auth.uid() = customer_id -- Customer can view their own tickets
        OR
        auth.uid() = assigned_to -- Assigned agent can view
        OR
        EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid()) -- All agents can view all tickets
    );

CREATE POLICY "Allow agents and customers to create their own tickets"
    ON tickets FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid())
        OR
        auth.uid() = customer_id -- Allow customers to create their own tickets
    );

CREATE POLICY "Allow agents to update any ticket and customers to update their open tickets"
    ON tickets FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM agents WHERE agents.id = auth.uid())
        OR
        (auth.uid() = customer_id) -- Customers can update their open tickets
    );

-- Create a secure function to view tickets by hash
CREATE OR REPLACE FUNCTION public.get_ticket_by_hash(hash text)
RETURNS TABLE (
    number BIGINT,
    title TEXT,
    description TEXT,
    priority TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ,
    assigned_to UUID,
    customer_id UUID,
    conversation JSONB[],
    metadata JSONB
) 
SECURITY DEFINER -- Run with privileges of defining user (typically service role)
SET search_path = public -- Set search path for security
LANGUAGE plpgsql
AS $$
DECLARE
    decoded text;
    ticket_number bigint;
    user_id uuid;
BEGIN
    -- Decode base64 hash
    BEGIN
        decoded := convert_from(decode(hash, 'base64'), 'UTF8');
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid hash format';
    END;

    -- Split decoded string into ticket number and user ID
    ticket_number := split_part(decoded, ':', 1)::bigint;
    user_id := split_part(decoded, ':', 2)::uuid;

    -- Return matching ticket if it exists and belongs to the user
    RETURN QUERY
    SELECT t.*
    FROM tickets t
    WHERE t.number = ticket_number
    AND t.customer_id = user_id;
END;
$$;

-- Grant execute permission to public (anonymous) users
GRANT EXECUTE ON FUNCTION public.get_ticket_by_hash(text) TO public; 