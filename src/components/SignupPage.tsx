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
        console.error('Signup error:', error);
        if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please try logging in instead.');
        } else if (error.message.includes('Database error saving new user')) {
          setError('There was an issue creating your account. Please try again or contact support if the problem persists.');
        } else if (error.message.includes('Failed to fetch')) {
          setError('Unable to connect to the authentication service. Please check your internet connection and try again.');
        } else {
          setError(error.message || 'An error occurred during signup');
        }
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
    } catch (err: any) {
      console.error('Signup exception:', err);
      if (err?.message?.includes('Failed to fetch')) {
        setError('Unable to connect to the authentication service. Please check your internet connection and try again.');
      } else {
        setError(err?.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-300 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-400 rounded-full opacity-20 blur-3xl -translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400 rounded-full opacity-20 blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 text-teal-700 hover:text-teal-900 transition-colors duration-200 flex items-center text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        {/* Signup Form Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Heading */}
          <h1 className="text-4xl font-display font-bold text-teal-800 mb-8 text-center">
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
              <label htmlFor="name" className="block text-sm font-semibold text-teal-900 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors duration-200 text-teal-900 placeholder-gray-400"
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-teal-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors duration-200 text-teal-900 placeholder-gray-400"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-teal-900 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors duration-200 text-teal-900 placeholder-gray-400"
                placeholder="Create a password"
                required
                disabled={loading}
              />
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-white font-semibold py-4 px-6 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 hover:bg-amber-600 mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <p className="text-teal-700 text-sm">
              Already have an account?{' '}
              <button className="text-teal-600 hover:text-teal-800 font-semibold transition-colors duration-200">
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