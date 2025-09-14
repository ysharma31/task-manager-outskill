import React from 'react';
import { useEffect } from 'react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import { supabase, getCurrentUser } from './lib/supabase';

function App() {
  const [currentPage, setCurrentPage] = React.useState<'home' | 'login' | 'signup' | 'dashboard'>('home');
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    // Check if user is already logged in
    getCurrentUser().then((user) => {
      setUser(user);
      if (user) {
        setCurrentPage('dashboard');
      }
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
      <div className="min-h-screen bg-gradient-light-blue flex items-center justify-center">
        <div className="text-white text-xl font-open-sans">Loading...</div>
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
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-light-blue flex items-center justify-center p-4 font-open-sans">
      <div className="max-w-4xl w-full text-center">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg">
          Welcome to My Task Manager
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-white/90 mb-16 font-light drop-shadow-md max-w-2xl mx-auto leading-relaxed">
          Organize your tasks, boost your productivity, and achieve your goals with our intuitive task management system.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-3xl mx-auto">
          <button
            onClick={handleLogin}
            className="w-full sm:w-64 bg-white text-light-blue-600 font-semibold py-4 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-light-blue-50 border-2 border-transparent hover:border-light-blue-200"
          >
            Login
          </button>
          
          <button
            onClick={handleSignup}
            className="w-full sm:w-64 bg-light-blue-600 text-white font-semibold py-4 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-light-blue-700 border-2 border-light-blue-600 hover:border-light-blue-500"
          >
            Signup
          </button>
          
          <button
            onClick={handleDashboard}
            className="w-full sm:w-64 bg-transparent text-white font-semibold py-4 px-8 rounded-lg text-lg border-2 border-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-white hover:text-light-blue-600"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Additional spacing */}
        <div className="mt-20">
          <div className="flex justify-center space-x-8 text-white/70 text-sm">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-white/70 rounded-full mr-2"></div>
              Simple & Intuitive
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-white/70 rounded-full mr-2"></div>
              Secure & Reliable
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-white/70 rounded-full mr-2"></div>
              Always Available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;