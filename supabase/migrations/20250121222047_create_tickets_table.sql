-- Create or replace a function to validate each conversation item
CREATE OR REPLACE FUNCTION validate_conversation_format(conversation JSONB[])
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  AS $$
DECLARE
  item JSONB;
BEGIN
  IF conversation IS NULL THEN
    RETURN TRUE; -- or FALSE, depending on whether you allow NULL or an empty array
  END IF;

  FOREACH item IN ARRAY conversation
  LOOP
    IF jsonb_typeof(item) <> 'object'
      OR NOT (item ? 'id')
      OR NOT (item ? 'sender')
      OR NOT (item ? 'message')
      OR NOT (item ? 'timestamp')
    THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- Create tickets table
CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
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

-- Create a function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.number = 'TKT-' || TO_CHAR(NEW.id, 'FM000000');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate ticket numbers
CREATE TRIGGER generate_ticket_number_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_ticket_number(); 