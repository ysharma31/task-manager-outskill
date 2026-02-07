/*
  # Update Vector Search Function to Include Category

  1. Changes
    - Drop and recreate `search_tasks_by_similarity` function to include category field
    - Ensures search results include all task information including category

  2. Notes
    - Must drop existing function due to return type change
    - No data changes, only function signature update
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS search_tasks_by_similarity(vector, float, int, uuid);

-- Recreate the vector search function with category included
CREATE OR REPLACE FUNCTION search_tasks_by_similarity(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  category text,
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
    t.category,
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