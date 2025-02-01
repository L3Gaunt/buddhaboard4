import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from './seeds/setup_users';

describe('Knowledge Base Search', () => {
  let adminSession: { access_token: string } | null = null;

  beforeAll(async () => {
    // Sign in as the admin user created in seed_knowledge_base.test.ts
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email: 'kb_admin@buddhaboard.com',
      password: 'n1rvana'
    });

    if (error) {
      throw new Error(`Failed to sign in as admin: ${error.message}`);
    }

    adminSession = session;
  });

  it('should search articles by semantic similarity', async () => {
    if (!adminSession?.access_token) {
      throw new Error('No admin session available');
    }

    const searchQuery = 'how to handle difficult customer conversations';
    
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/knowledge-base`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminSession.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'POST',
        path: 'search',
        body: {
          query: searchQuery,
          limit: 5,
          similarityThreshold: 0
        }
      })
    });

    expect(response.ok).toBe(true);

    const results = await response.json();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);

    // Check structure of results
    const firstResult = results[0];
    expect(firstResult).toHaveProperty('id');
    expect(firstResult).toHaveProperty('title');
    expect(firstResult).toHaveProperty('content');
    expect(firstResult).toHaveProperty('similarity');
    expect(firstResult.similarity).toBeGreaterThanOrEqual(0.);
    expect(firstResult.status).toBe('published');

    // Check results are sorted by similarity
    for (let i = 1; i < results.length; i++) {
      expect(results[i].similarity).toBeLessThanOrEqual(results[i-1].similarity);
    }
  });

  it('should handle empty search results gracefully', async () => {
    if (!adminSession?.access_token) {
      throw new Error('No admin session available');
    }

    // Use a very specific query that's unlikely to match anything
    const searchQuery = 'xyzabc123nonexistentquery';
    
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/knowledge-base`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminSession.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'POST',
        path: 'search',
        body: {
          query: searchQuery,
          limit: 5,
          similarityThreshold: 1.1 // High threshold to ensure no matches
        }
      })
    });

    expect(response.ok).toBe(true);

    const results = await response.json();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it('should respect the limit parameter', async () => {
    if (!adminSession?.access_token) {
      throw new Error('No admin session available');
    }

    const searchQuery = 'customer service';
    const limit = 3;
    
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/knowledge-base`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminSession.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'POST',
        path: 'search',
        body: {
          query: searchQuery,
          limit,
          similarityThreshold: 0.5
        }
      })
    });

    expect(response.ok).toBe(true);

    const results = await response.json();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(limit);
  });

  it('should require a search query', async () => {
    if (!adminSession?.access_token) {
      throw new Error('No admin session available');
    }
    
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/knowledge-base`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminSession.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'POST',
        path: 'search',
        body: {
          query: '', // Empty query
          limit: 5,
          similarityThreshold: 0.5
        }
      })
    });

    expect(response.ok).toBe(false);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toBe('Search query is required');
  });
}); 