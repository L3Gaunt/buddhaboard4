-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding columns to kb_articles
ALTER TABLE kb_articles 
ADD COLUMN IF NOT EXISTS metadata_embedding vector(1536),
ADD COLUMN IF NOT EXISTS content_embedding vector(1536),
ADD COLUMN IF NOT EXISTS is_metadata_embedding_in_progress BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_content_embedding_in_progress BOOLEAN DEFAULT false;

-- Create indexes for better vector search performance
CREATE INDEX IF NOT EXISTS kb_articles_metadata_embedding_idx 
ON kb_articles 
USING hnsw (metadata_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS kb_articles_content_embedding_idx 
ON kb_articles 
USING hnsw (content_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create indexes for embedding progress tracking
CREATE INDEX IF NOT EXISTS kb_articles_metadata_embedding_progress_idx
ON kb_articles(is_metadata_embedding_in_progress)
WHERE is_metadata_embedding_in_progress = true;

CREATE INDEX IF NOT EXISTS kb_articles_content_embedding_progress_idx
ON kb_articles(is_content_embedding_in_progress)
WHERE is_content_embedding_in_progress = true;

-- Create a type for the search mode
CREATE TYPE kb_search_mode AS ENUM ('metadata', 'content');

-- Create a function to search knowledge base by vector similarity
CREATE OR REPLACE FUNCTION search_kb_articles(
  query_embedding vector(1536),
  search_mode kb_search_mode,
  similarity_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
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
    CASE search_mode
      WHEN 'metadata' THEN 1 - (kb.metadata_embedding <=> query_embedding)
      WHEN 'content' THEN 1 - (kb.content_embedding <=> query_embedding)
    END as similarity
  FROM kb_articles kb
  WHERE 
    CASE search_mode
      WHEN 'metadata' THEN 
        kb.metadata_embedding IS NOT NULL AND
        1 - (kb.metadata_embedding <=> query_embedding) > similarity_threshold
      WHEN 'content' THEN 
        kb.content_embedding IS NOT NULL AND
        1 - (kb.content_embedding <=> query_embedding) > similarity_threshold
    END
    AND kb.status = 'published'
  ORDER BY 
    CASE search_mode
      WHEN 'metadata' THEN kb.metadata_embedding <=> query_embedding
      WHEN 'content' THEN kb.content_embedding <=> query_embedding
    END
  LIMIT match_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_kb_articles TO authenticated;

-- Example of how to use the function with a chained query:
COMMENT ON FUNCTION search_kb_articles IS 'Search knowledge base articles by vector similarity. Example usage:
SELECT 
  a.*,
  s.similarity
FROM search_kb_articles(
  query_embedding := embedding_vector,
  search_mode := ''metadata'',
  similarity_threshold := 0.7,
  match_count := 5
) s
JOIN kb_articles a ON a.id = s.id
ORDER BY s.similarity DESC;'; 