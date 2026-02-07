/*
  # Fix Embedding Vector Dimension

  1. Changes
    - Update the embedding column to use 1536 dimensions (matching text-embedding-3-small model)
    - Update the search function to use vector(1536)
    - Recreate the index with correct dimensions

  2. Notes
    - text-embedding-3-small outputs 1536 dimensions
    - This ensures compatibility between the model and database column
*/

-- Drop the existing index
DROP INDEX IF EXISTS tasks_embedding_idx;

-- Recreate the index with correct dimensions for text-embedding-3-small
CREATE INDEX IF NOT EXISTS tasks_embedding_idx ON tasks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
