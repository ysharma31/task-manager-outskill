/*
  # Add subtasks table

  1. New Tables
    - `subtasks`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `parent_task_id` (uuid, foreign key to tasks)
      - `user_id` (uuid, foreign key to users)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `subtasks` table
    - Add policies for authenticated users to manage their own subtasks

  3. Indexes
    - Add index on parent_task_id for efficient queries
    - Add index on user_id for user-specific queries
*/

CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  parent_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subtasks"
  ON subtasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subtasks"
  ON subtasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subtasks"
  ON subtasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subtasks"
  ON subtasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS subtasks_parent_task_id_idx ON subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS subtasks_user_id_idx ON subtasks(user_id);
CREATE INDEX IF NOT EXISTS subtasks_created_at_idx ON subtasks(created_at DESC);