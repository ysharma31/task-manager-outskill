import React, { useState } from 'react';
import { signUp } from '../lib/supabase';

interface SignupPageProps {
  onBack: () => void;
  onSignupSuccess: () => void;
}

function SignupPage({ onBack, onSignupSuccess }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await signUp(email, password, name);
      
      if (error) {
        setError(error.message);
      } else if (data.user) {
        setSuccess('Account created successfully! You can now login.');
        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        // Redirect to login after a short delay
        setTimeout(() => {
          onSignupSuccess();
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-light-blue flex items-center justify-center p-4 font-open-sans">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 text-white/80 hover:text-white transition-colors duration-200 flex items-center text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        {/* Signup Form Container */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Heading */}
          <h1 className="text-4xl font-bold text-light-blue-700 mb-8 text-center">
            Create Account
          </h1>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-light-blue-500 focus:outline-none transition-colors duration-200 text-gray-700 placeholder-gray-400"
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-light-blue-500 focus:outline-none transition-colors duration-200 text-gray-700 placeholder-gray-400"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-light-blue-500 focus:outline-none transition-colors duration-200 text-gray-700 placeholder-gray-400"
                placeholder="Create a password"
                required
                disabled={loading}
              />
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-light-blue-600 text-white font-semibold py-4 px-6 rounded-lg text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 hover:bg-light-blue-700 mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button className="text-light-blue-600 hover:text-light-blue-700 font-semibold transition-colors duration-200">
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;