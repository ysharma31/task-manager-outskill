import React from 'react';
import { useEffect } from 'react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import { supabase, getCurrentUser } from './lib/supabase';

function App() {
  const [currentPage, setCurrentPage] = React.useState<'home' | 'login' | 'signup' | 'dashboard' | 'profile'>('home');
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const envCheck = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20),
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      allEnvKeys: Object.keys(import.meta.env)
    };
    console.log('App mounted. Env check:', envCheck);

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('CRITICAL: Supabase environment variables are not loaded!');
      console.error('Available env keys:', Object.keys(import.meta.env));
      setLoading(false);
      return;
    }

    // Check if user is already logged in
    getCurrentUser().then((user) => {
      setUser(user);
      if (user) {
        setCurrentPage('dashboard');
      }
      setLoading(false);
    }).catch(err => {
      console.error('Error getting current user:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentPage('dashboard');
      } else if (event === 'SIGNED_OUT') {
        setCurrentPage('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    setCurrentPage('login');
  };

  const handleSignup = () => {
    setCurrentPage('signup');
  };

  const handleDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setCurrentPage('home');
    setUser(null);
  };

  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
  };

  const handleSignupSuccess = () => {
    setCurrentPage('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-teal-900 text-xl font-display">Loading...</div>
      </div>
    );
  }

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center p-4">
        <div className="max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700 mb-4">
            Supabase environment variables are not loaded. Please refresh the page.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono text-gray-600">
            <p>Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</p>
            <p>Loaded: {Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')).join(', ') || 'None'}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'login') {
    return <LoginPage onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'signup') {
    return <SignupPage onBack={handleBackToHome} onSignupSuccess={handleSignupSuccess} />;
  }

  if (currentPage === 'dashboard') {
    return <Dashboard onLogout={handleLogout} onProfile={() => setCurrentPage('profile')} />;
  }

  if (currentPage === 'profile') {
    return <ProfilePage onBack={() => setCurrentPage('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-cream-300 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-400 rounded-full opacity-30 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400 rounded-full opacity-30 blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-4xl w-full text-center relative z-10">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-teal-900 mb-4">
          Creative Task Manager
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-teal-800 mb-16 max-w-2xl mx-auto leading-relaxed">
          Organize your tasks, boost your productivity, and achieve your goals with our intuitive task management system.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-3xl mx-auto">
          <button
            onClick={handleLogin}
            className="w-full sm:w-64 bg-white text-teal-700 font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-teal-50 border-2 border-teal-200"
          >
            Login
          </button>

          <button
            onClick={handleSignup}
            className="w-full sm:w-64 bg-amber-500 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-amber-600"
          >
            Get Started
          </button>

          <button
            onClick={handleDashboard}
            className={`w-full sm:w-64 font-semibold py-4 px-8 rounded-xl text-lg border-2 shadow-lg transition-all duration-300 ${
              user
                ? 'bg-teal-600 text-white border-teal-600 hover:shadow-xl transform hover:scale-105 hover:bg-teal-700'
                : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed opacity-50'
            }`}
            disabled={!user}
          >
            {user ? 'Go to Dashboard' : 'Dashboard'}
          </button>
        </div>

        {/* Additional spacing */}
        <div className="mt-20">
          <div className="flex flex-wrap justify-center gap-6 text-teal-700 text-sm">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              Simple & Intuitive
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              Secure & Reliable
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              Always Available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;