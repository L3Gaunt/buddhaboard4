import { supabase } from '../lib/supabase';
import type { KBArticle, KBArticlesResponse, KBTag } from '../types/knowledge-base';

export async function getArticles(page: number, pageSize: number) {
  const { data, error } = await supabase.functions.invoke<KBArticlesResponse>('knowledge-base', {
    body: {
      method: 'GET',
      path: 'articles',
      params: { page, limit: pageSize }
    }
  });

  if (error) throw error;
  return data;
}

export async function getArticle(id: string) {
  const { data, error } = await supabase.functions.invoke<KBArticle>('knowledge-base', {
    body: {
      method: 'GET',
      path: `articles/${id}`
    }
  });

  if (error) throw error;
  return data;
}

export async function getTags() {
  const { data, error } = await supabase.functions.invoke<KBTag[]>('knowledge-base', {
    body: {
      method: 'GET',
      path: 'tags'
    }
  });

  if (error) throw error;
  return data;
}

type CreateTagInput = {
  name: string;
  color?: string;
}

export async function createTag(tag: CreateTagInput) {
  const { data, error } = await supabase.functions.invoke<KBTag>('knowledge-base', {
    body: {
      method: 'POST',
      path: 'tags',
      body: tag
    }
  });

  if (error) throw error;
  return data;
}

type CreateArticleInput = Omit<
  KBArticle,
  'id' | 'created_at' | 'updated_at'
> & {
  newTags?: Array<{
    name: string;
    slug: string;
    color: string;
  }>;
}

export async function createArticle(article: CreateArticleInput) {
  const { data, error } = await supabase.functions.invoke<KBArticle>('knowledge-base', {
    body: {
      method: 'POST',
      path: 'articles',
      body: article
    }
  });

  if (error) throw error;
  return data;
}

type UpdateArticleInput = {
  title: string;
  description?: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
}

export async function updateArticle(id: string, article: UpdateArticleInput) {
  const { data, error } = await supabase.functions.invoke<KBArticle>('knowledge-base', {
    body: {
      method: 'PUT',
      path: `articles/${id}`,
      body: article
    }
  });

  if (error) throw error;
  return data;
}

export async function updateArticleTags(articleId: string, tagIds: string[], newTags?: Array<{
  name: string;
  slug: string;
  color: string;
}>) {
  const { data, error } = await supabase.functions.invoke<KBArticle>('knowledge-base', {
    body: {
      method: 'PUT',
      path: `articles/${articleId}/tags`,
      body: { tagIds, newTags }
    }
  });

  if (error) throw error;
  return data;
}

export async function deleteArticle(id: string) {
  const { error } = await supabase.functions.invoke('knowledge-base', {
    body: {
      method: 'DELETE',
      path: `articles/${id}`
    }
  });

  if (error) throw error;
} 