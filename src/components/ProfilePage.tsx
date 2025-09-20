import React, { useState, useEffect } from 'react';
import { User, Upload, Camera, Trash2 } from 'lucide-react';
import { getProfile, updateProfile, uploadProfilePicture, deleteProfilePicture, Profile } from '../lib/profiles';
import { getCurrentUser } from '../lib/supabase';

interface ProfilePageProps {
  onBack: () => void;
}

function ProfilePage({ onBack }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    
    // Get current user
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      // Get profile data
      const { data, error } = await getProfile();
      if (error) {
        console.error('Error loading profile:', error);
      } else {
        setProfile(data);
        setFullName(data?.full_name || '');
      }
    }
    
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    
    const { data, error } = await uploadProfilePicture(file);
    
    if (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } else if (data) {
      // Reload profile to get updated avatar URL
      await loadProfile();
    }
    
    setUploading(false);
    // Clear the input
    event.target.value = '';
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setUpdating(true);
    
    const { data, error } = await updateProfile({
      full_name: fullName.trim()
    });
    
    if (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } else {
      setProfile(data);
    }
    
    setUpdating(false);
  };

  const handleDeletePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setUploading(true);
    
    const { error } = await deleteProfilePicture();
    
    if (error) {
      console.error('Error deleting picture:', error);
      alert('Error deleting picture. Please try again.');
    } else {
      await loadProfile();
    }
    
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-light-blue flex items-center justify-center font-open-sans">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light-blue p-4 font-open-sans">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 text-white/80 hover:text-white transition-colors duration-200 flex items-center text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-12 text-center drop-shadow-lg">
          Profile
        </h1>

        {/* Profile Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          
          {/* Profile Picture Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              {/* Profile Picture Display */}
              <div className="w-32 h-32 mx-auto mb-6 relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-4 border-light-blue-200 shadow-lg"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-light-blue-100 border-4 border-light-blue-200 shadow-lg flex items-center justify-center">
                    <User className="w-16 h-16 text-light-blue-400" />
                  </div>
                )}
                
                {/* Delete Picture Button */}
                {profile?.avatar_url && (
                  <button
                    onClick={handleDeletePicture}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50"
                    title="Delete profile picture"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id="profile-upload"
                />
                <label
                  htmlFor="profile-upload"
                  className={`inline-flex items-center px-6 py-3 bg-light-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 hover:bg-light-blue-700 cursor-pointer ${
                    uploading ? 'opacity-50 cursor-not-allowed transform-none' : ''
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      Upload Profile Picture
                    </>
                  )}
                </label>
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                Max file size: 5MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>
          </div>

          {/* Profile Information Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-light-blue-500 focus:outline-none transition-colors duration-200 text-gray-700 placeholder-gray-400"
                placeholder="Enter your full name"
                disabled={updating}
              />
            </div>

            <button
              type="submit"
              disabled={updating || !fullName.trim() || fullName === profile?.full_name}
              className="w-full bg-light-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 hover:bg-light-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {updating ? 'Updating Profile...' : 'Update Profile'}
            </button>
          </form>

          {/* Profile Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-light-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-semibold text-light-blue-700">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="bg-light-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-semibold text-light-blue-700">
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;