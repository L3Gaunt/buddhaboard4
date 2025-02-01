-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to kb_articles
ALTER TABLE kb_articles 
ADD COLUMN IF NOT EXISTS metadata_embedding vector(1536),
ADD COLUMN IF NOT EXISTS is_metadata_embedding_in_progress BOOLEAN DEFAULT false;

-- Create index for better vector search performance
CREATE INDEX IF NOT EXISTS kb_articles_metadata_embedding_idx 
ON kb_articles 
USING ivfflat (metadata_embedding vector_l2_ops)
WITH (lists = 100);

-- Create index for embedding progress tracking
CREATE INDEX IF NOT EXISTS kb_articles_metadata_embedding_progress_idx
ON kb_articles(is_metadata_embedding_in_progress)
WHERE is_metadata_embedding_in_progress = true;

-- Create a function to search knowledge base by metadata similarity
CREATE OR REPLACE FUNCTION search_kb_articles(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.5, -- not active anymore
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.description,
    kb.content,
    1 - (kb.metadata_embedding <=> query_embedding) as similarity
  FROM kb_articles kb
  WHERE 
    TRUE kb.metadata_embedding IS NOT NULL
    --AND 1 - (kb.metadata_embedding <=> query_embedding) > similarity_threshold
    --AND kb.status = 'published'
  ORDER BY kb.metadata_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_kb_articles TO authenticated;