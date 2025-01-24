-- Create ticket feedback table
CREATE TABLE ticket_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number BIGINT REFERENCES tickets(number) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ticket_number)
);

-- Add updated_at trigger
CREATE TRIGGER update_ticket_feedback_updated_at
    BEFORE UPDATE ON ticket_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant access to service role only
REVOKE ALL ON ticket_feedback FROM authenticated;
REVOKE ALL ON ticket_feedback FROM anon;
GRANT ALL ON ticket_feedback TO service_role; 