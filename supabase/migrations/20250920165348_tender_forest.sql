/*
  # Add Vector Search Function for Tasks

  1. New Functions
    - `search_tasks_by_similarity` - Performs vector similarity search on tasks
      - Parameters: query_embedding (vector), similarity_threshold (float), match_count (integer), user_id (uuid)
      - Returns: Tasks with similarity scores above threshold, ordered by similarity

  2. Prerequisites
    - Requires pgvector extension to be enabled
    - Requires embedding column on tasks table
    
  3. Notes
    - This function enables AI-powered semantic search on task titles
    - Returns only tasks belonging to the specified user
    - Similarity threshold filters out low-relevance results
*/

-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to tasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE tasks ADD COLUMN embedding vector(1536);
  END IF;
END $$;

-- Create index on embedding column for faster similarity searches
CREATE INDEX IF NOT EXISTS tasks_embedding_idx ON tasks USING ivfflat (embedding vector_cosine_ops);

-- Create the vector search function
CREATE OR REPLACE FUNCTION search_tasks_by_similarity(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  priority text,
  status text,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.priority,
    t.status,
    (1 - (t.embedding <=> query_embedding)) as similarity,
    t.created_at
  FROM tasks t
  WHERE 
    t.user_id = search_tasks_by_similarity.user_id
    AND t.embedding IS NOT NULL
    AND (1 - (t.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;