import { supabase } from './supabase';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

// Get current user's profile
export const getProfile = async (currentUser?: any): Promise<{ data: Profile | null; error: any }> => {
  let user = currentUser;
  
  if (!user) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  }
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { data, error };
};

// Update user profile
export const updateProfile = async (updates: Partial<Profile>, currentUser?: any): Promise<{ data: Profile | null; error: any }> => {
  let user = currentUser;
  
  if (!user) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  }
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();

  return { data, error };
};

// Upload profile picture
export const uploadProfilePicture = async (file: File, currentUser?: any): Promise<{ data: { path: string; url: string } | null; error: any }> => {
  let user = currentUser;
  
  if (!user) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  }
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  // Create unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/avatar.${fileExt}`;

  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('profile-pictures')
    .upload(fileName, file, {
      upsert: true // Replace existing file
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(fileName);

  // Update profile with new avatar URL
  const { error: updateError } = await updateProfile({
    avatar_url: publicUrl
  }, user);

  if (updateError) {
    return { data: null, error: updateError };
  }

  return {
    data: {
      path: uploadData.path,
      url: publicUrl
    },
    error: null
  };
};

// Delete profile picture
export const deleteProfilePicture = async (currentUser?: any): Promise<{ error: any }> => {
  let user = currentUser;
  
  if (!user) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  }
  
  if (!user) {
    return { error: { message: 'User not authenticated' } };
  }

  // Delete from storage
  const { error: deleteError } = await supabase.storage
    .from('profile-pictures')
    .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.jpeg`]);

  // Update profile to remove avatar URL
  const { error: updateError } = await updateProfile({
    avatar_url: null
  }, user);

  return { error: deleteError || updateError };
};