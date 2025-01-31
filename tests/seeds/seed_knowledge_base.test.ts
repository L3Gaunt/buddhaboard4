import { describe, it, expect, beforeAll } from 'vitest';
import { createConfirmedUser, supabase } from './setup_users.ts';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

interface Article {
  id?: string;
  title: string;
  description?: string;
  slug: string;
  content: string;
  status: 'draft' | 'published';
  tags?: string[];
  newTags?: Array<{
    name: string;
    slug: string;
    color: string;
  }>;
}

describe('Knowledge Base Seeding', () => {
  it('should seed the knowledge base with articles', async () => {
    try {
      // Create an admin if not exists
      const adminEmail = 'kb_admin@buddhaboard.com';
      const adminPassword = 'n1rvana';
      const adminName = 'Knowledge Base Admin';
      
      let admin;
      try {
        admin = await createConfirmedUser(adminEmail, adminPassword);
        console.log('Created new admin:', admin.id);
      } catch (error: any) {
        // If user already exists, sign in instead
        if (error?.message?.includes('already been registered')) {
          const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: adminPassword,
          });
          if (signInError) throw signInError;
          admin = user;
          console.log('Using existing admin:', admin.id);
        } else {
          throw error;
        }
      }

      // Create or update admin profile
      const { error: profileError } = await supabase
        .from('agents')
        .upsert({
          id: admin.id,
          email: adminEmail,
          name: adminName,
          role: 'admin',
          status: 'online',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminName.toLowerCase().replace(' ', '')}`,
          metadata: {
            department: 'Knowledge Base',
            skills: ['content management', 'technical writing', 'knowledge base'],
            languages: ['en']
          }
        }, { onConflict: 'id' });
      
      if (profileError) {
        console.error('Error creating admin profile:', profileError);
        throw profileError;
      }

      // Get the session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      // Read and parse CSV file
      const csvContent = fs.readFileSync('tests/seeds/knowledge_base_with_conversations_reshuffled.csv', 'utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true
      });

      // Take first 28 articles
      const articles = records.slice(0, 28).map((record: any) => ({
        title: record['input.title'],
        description: record['input.description'],
        content: record['input.content'],
        slug: record['input.title'].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        status: 'published' as const
      }));

      // Insert articles using the API
      for (const article of articles) {
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/knowledge-base`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            method: 'POST',
            path: 'articles',
            body: article
          })
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Error inserting article:', article.title, error);
          throw new Error(`Failed to insert article: ${error.message}`);
        } else {
          const data = await response.json();
          console.log('Inserted article:', data.title);
        }
      }

      // Verify articles were inserted using the API
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/knowledge-base`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'GET',
          path: 'articles',
          params: {
            limit: 50 // Get enough articles to verify our seeding
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch articles: ${error.message}`);
      }

      const { data: insertedArticles } = await response.json();
      
      expect(insertedArticles).toBeDefined();
      expect(insertedArticles.length).toBeGreaterThanOrEqual(28);
      
      console.log('Knowledge base seeding completed!');
    } catch (error) {
      console.error('Error seeding knowledge base:', error);
      throw error;
    }
  });
});