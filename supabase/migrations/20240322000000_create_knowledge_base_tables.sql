-- Create knowledge base articles table
CREATE TABLE kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tags table
CREATE TABLE kb_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create junction table for articles and tags
CREATE TABLE kb_article_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES kb_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, tag_id)
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kb_articles_updated_at
  BEFORE UPDATE ON kb_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_kb_articles_status ON kb_articles(status);
CREATE INDEX idx_kb_articles_slug ON kb_articles(slug);
CREATE INDEX idx_kb_tags_slug ON kb_tags(slug);
CREATE INDEX idx_kb_article_tags_article_id ON kb_article_tags(article_id);
CREATE INDEX idx_kb_article_tags_tag_id ON kb_article_tags(tag_id); 