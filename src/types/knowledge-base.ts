export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  kb_article_tags?: {
    kb_tags: KBTag;
  }[];
}

export interface KBTag {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface KBArticlesResponse {
  data: KBArticle[];
  pagination: {
    total: number;
    total_pages: number;
    page: number;
    page_size: number;
  };
} 