import { supabase } from './supabase';

export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'done';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'done';
}

export interface UpdateTaskData {
  title?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'done';
}

// Get all tasks for the current user
export const getTasks = async (): Promise<{ data: Task[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
};

// Create a new task
export const createTask = async (taskData: CreateTaskData): Promise<{ data: Task | null; error: any }> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Please log in to create tasks');
  }

  // Generate embedding for the new task
  let embedding = null;
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-task-embeddings`;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const openAIResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-large',
          input: taskData.title
        }),
      });
      
      if (openAIResponse.ok) {
        const openAIData = await openAIResponse.json();
        embedding = openAIData.data[0].embedding;
      }
    }
  } catch (error) {
    console.log('Failed to generate embedding for new task, will create without embedding');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        ...taskData,
        user_id: user.id,
        embedding,
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  return { data, error };
};

// Update a task
export const updateTask = async (id: string, updates: UpdateTaskData): Promise<{ data: Task | null; error: any }> => {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

// Delete a task
export const deleteTask = async (id: string): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  return { error };
};

// Get task counts by status
export const getTaskStats = async (): Promise<{ data: any; error: any }> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('status')
    .then(({ data, error }) => {
      if (error) return { data: null, error };
      
      const stats = {
        pending: data?.filter(task => task.status === 'pending').length || 0,
        in_progress: data?.filter(task => task.status === 'in_progress').length || 0,
        done: data?.filter(task => task.status === 'done').length || 0,
        total: data?.length || 0
      };
      
      return { data: stats, error: null };
    });

  return { data, error };
};