-- First, insert users into auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data)
VALUES
  -- Admins
  ('d0d54e51-d85a-4a4e-9d5f-83b87b7aa1b6', 'admin@buddhaboard.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'),
  ('e1e65f62-e96b-5b5f-94e6-94c98c8bb2c7', 'admin2@buddhaboard.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'),
  
  -- Agents
  ('f2f76f73-fa7c-4c6f-a5f7-a5da9d9cc3d8', 'agent1@buddhaboard.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'),
  ('a3a87f84-ab8d-4d7f-b6a8-b6eb0e0dd4e9', 'agent2@buddhaboard.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'),
  ('b4b98f95-bc9e-4e8f-c7b9-c7fc1f1ee5fa', 'agent3@buddhaboard.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'),

  -- Customers
  ('c5c76d51-cd9f-5d9f-d8c9-d8fd2f2ff6fb', 'john.doe@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'),
  ('d6d87e62-de0a-6e0a-e9d0-e9ae3a3aa7ac', 'jane.smith@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'),
  ('e7e98f73-ef1b-7f1b-f0e1-f0bf4b4bb8bd', 'maria.garcia@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'),
  ('f8f09a84-fa2c-8a2c-a1f2-a1ca5c5cc9ce', 'david.wilson@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'),
  ('a9a10b95-ab3d-9b3d-b2a3-b2db6d6ddadf', 'yuki.tanaka@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}');

-- Insert admins into agents table
INSERT INTO public.agents (id, email, name, role, status, avatar, metadata, created_at, updated_at)
VALUES
  ('d0d54e51-d85a-4a4e-9d5f-83b87b7aa1b6', 'admin@buddhaboard.com', 'Main Admin', 'admin', 'online', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin1', '{"department": "Management", "skills": ["customer service", "technical support", "management"], "languages": ["en", "es"]}', NOW(), NOW()),
  ('e1e65f62-e96b-5b5f-94e6-94c98c8bb2c7', 'admin2@buddhaboard.com', 'Secondary Admin', 'admin', 'online', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin2', '{"department": "Management", "skills": ["customer service", "technical support", "management"], "languages": ["en", "fr"]}', NOW(), NOW());

-- Insert agents
INSERT INTO public.agents (id, email, name, role, status, avatar, metadata, created_at, updated_at)
VALUES
  ('f2f76f73-fa7c-4c6f-a5f7-a5da9d9cc3d8', 'agent1@buddhaboard.com', 'Sarah Johnson', 'agent', 'online', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', '{"department": "Support", "skills": ["customer service", "technical support"], "languages": ["en"]}', NOW(), NOW()),
  ('a3a87f84-ab8d-4d7f-b6a8-b6eb0e0dd4e9', 'agent2@buddhaboard.com', 'Michael Chen', 'agent', 'offline', 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael', '{"department": "Support", "skills": ["customer service", "billing"], "languages": ["en", "zh"]}', NOW(), NOW()),
  ('b4b98f95-bc9e-4e8f-c7b9-c7fc1f1ee5fa', 'agent3@buddhaboard.com', 'Emma Rodriguez', 'supervisor', 'away', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma', '{"department": "Support", "skills": ["customer service", "technical support", "training"], "languages": ["en", "es"]}', NOW(), NOW());

-- Insert customers
INSERT INTO public.users (id, email, name, created_at, avatar, phone, company, metadata)
VALUES
  ('c5c76d51-cd9f-5d9f-d8c9-d8fd2f2ff6fb', 'john.doe@example.com', 'John Doe', NOW(), 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', '+1234567890', 'Acme Corp', '{"preferences": {"language": "en", "notifications": true}, "lastLogin": "2024-03-21T10:00:00Z"}'),
  ('d6d87e62-de0a-6e0a-e9d0-e9ae3a3aa7ac', 'jane.smith@example.com', 'Jane Smith', NOW(), 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', '+1987654321', 'TechStart Inc', '{"preferences": {"language": "en", "notifications": true}, "lastLogin": "2024-03-21T11:00:00Z"}'),
  ('e7e98f73-ef1b-7f1b-f0e1-f0bf4b4bb8bd', 'maria.garcia@example.com', 'Maria Garcia', NOW(), 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', '+1122334455', 'InnovateCo', '{"preferences": {"language": "es", "notifications": true}, "lastLogin": "2024-03-21T12:00:00Z"}'),
  ('f8f09a84-fa2c-8a2c-a1f2-a1ca5c5cc9ce', 'david.wilson@example.com', 'David Wilson', NOW(), 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', '+1555666777', 'Global Systems', '{"preferences": {"language": "en", "notifications": false}, "lastLogin": "2024-03-21T13:00:00Z"}'),
  ('a9a10b95-ab3d-9b3d-b2a3-b2db6d6ddadf', 'yuki.tanaka@example.com', 'Yuki Tanaka', NOW(), 'https://api.dicebear.com/7.x/avataaars/svg?seed=yuki', '+8109876543', 'Japan Tech Ltd', '{"preferences": {"language": "ja", "notifications": true}, "lastLogin": "2024-03-21T14:00:00Z"}');