/*
  # Add category field to tasks table

  1. Changes
    - Add `category` column to `tasks` table
      - Type: text
      - Options: medical, groceries, household, children, work, personal, other
      - Default: 'personal'
      - Not null constraint

  2. Notes
    - Categories help users organize and filter their tasks by type
    - Using text type with check constraint for flexibility
    - Default value ensures existing tasks have a category
*/

-- Add category column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'category'
  ) THEN
    ALTER TABLE tasks ADD COLUMN category text NOT NULL DEFAULT 'personal' 
    CHECK (category IN ('medical', 'groceries', 'household', 'children', 'work', 'personal', 'other'));
  END IF;
END $$;

-- Create index for better performance when filtering by category
CREATE INDEX IF NOT EXISTS tasks_category_idx ON tasks(category);