import { supabase } from './supabase';

export interface Subtask {
  id: string;
  title: string;
  parent_task_id: string;
  user_id: string;
  status: 'pending' | 'in_progress' | 'done';
  created_at: string;
  updated_at: string;
}

export interface CreateSubtaskData {
  title: string;
  parent_task_id: string;
}

// Get subtasks for a specific task
export const getSubtasks = async (parentTaskId: string): Promise<{ data: Subtask[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('parent_task_id', parentTaskId)
    .order('created_at', { ascending: true });

  return { data, error };
};

// Create a new subtask
export const createSubtask = async (subtaskData: CreateSubtaskData): Promise<{ data: Subtask | null; error: any }> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const { data, error } = await supabase
    .from('subtasks')
    .insert([
      {
        ...subtaskData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  return { data, error };
};

// Update a subtask
export const updateSubtask = async (id: string, updates: Partial<Subtask>): Promise<{ data: Subtask | null; error: any }> => {
  const { data, error } = await supabase
    .from('subtasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

// Delete a subtask
export const deleteSubtask = async (id: string): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', id);

  return { error };
};

// Generate subtasks using AI
export const generateSubtasks = async (taskTitle: string): Promise<{ data: string[] | null; error: any }> => {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-subtasks`;
    
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ taskTitle })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: errorData };
    }

    const { subtasks } = await response.json();
    return { data: subtasks, error: null };

  } catch (error) {
    return { data: null, error: { message: 'Failed to generate subtasks' } };
  }
};