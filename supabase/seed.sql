-- Create test users in auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES 
    ('d7bed83c-882c-4c89-b6c9-8d87f3a49b99', 'admin@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"role": "admin", "name": "Admin User"}'::jsonb),
    ('b5bed83c-882c-4c89-b6c9-8d87f3a49b98', 'agent@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"role": "agent", "name": "Support Agent"}'::jsonb),
    ('a3bed83c-882c-4c89-b6c9-8d87f3a49b97', 'supervisor@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"role": "supervisor", "name": "Team Lead"}'::jsonb);

-- Insert test agents (will be automatically created by trigger)
-- We only need to update their avatars
UPDATE agents 
SET avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
WHERE email = 'admin@example.com';

UPDATE agents 
SET avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=agent'
WHERE email = 'agent@example.com';

UPDATE agents 
SET avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=supervisor'
WHERE email = 'supervisor@example.com';

-- Insert test tickets
INSERT INTO tickets (title, description, number, priority, status, assigned_to) VALUES
    ('Cannot access dashboard', 'User reports being unable to access the main dashboard after login', 'TICK-001', 'high', 'open', (SELECT id FROM agents WHERE email = 'agent@example.com')),
    ('Feature request: Dark mode', 'Customer requesting dark mode implementation', 'TICK-002', 'medium', 'in_progress', (SELECT id FROM agents WHERE email = 'supervisor@example.com')),
    ('Login issues on mobile', 'Users experiencing login problems on iOS devices', 'TICK-003', 'urgent', 'open', NULL);

-- Insert test conversations
INSERT INTO conversations (ticket_id, sender, message) VALUES
    ((SELECT id FROM tickets WHERE number = 'TICK-001'), 'customer@example.com', 'I keep getting a blank screen after logging in.'),
    ((SELECT id FROM tickets WHERE number = 'TICK-001'), (SELECT email FROM agents WHERE role = 'agent'), 'Can you please clear your browser cache and try again?'),
    ((SELECT id FROM tickets WHERE number = 'TICK-002'), 'customer@example.com', 'Would love to have a dark mode option for late night work.'),
    ((SELECT id FROM tickets WHERE number = 'TICK-003'), 'customer@example.com', 'The login button does nothing when I tap it on my iPhone.'); 