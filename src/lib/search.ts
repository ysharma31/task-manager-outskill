import { supabase } from './supabase';

export interface SearchResult {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'done';
  similarity: number;
  created_at: string;
}

// Smart search using vector similarity
export const smartSearch = async (query: string): Promise<{ data: SearchResult[] | null; error: any }> => {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-search`;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: errorData };
    }

    const { results } = await response.json();
    return { data: results, error: null };

  } catch (error) {
    return { data: null, error: { message: 'Failed to perform search' } };
  }
};