import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { ShieldAlert, Heart, Lock, Mail, User as UserIcon, Phone } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const data = await api.auth.register({ name, email, password, mobile, gender });
        localStorage.setItem('zp_token', data.token);
        onLogin(data.user);
      } else {
        const data = await api.auth.login({ email, password });
        localStorage.setItem('zp_token', data.token);
        onLogin(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminPortalRedirect = () => {
    window.history.replaceState(null, '', '?portal=admin');
    window.location.reload();
  };

  return (
    <div className="min-h-[90dvh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 relative overflow-hidden transition-all duration-200">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-theme-sage to-emerald-500"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shadow-inner mb-3">
            <Heart size={28} className="animate-pulse-slow fill-current" />
          </div>
          <h2 className="font-outfit text-2xl font-bold text-gray-800 dark:text-white">
            {isRegister ? 'Begin Your Journey' : 'Welcome to ZenPath'}
          </h2>
          <p className="text-xs text-gray-400 mt-1 text-center max-w-[280px]">
            {isRegister 
              ? 'Create your free account to track wellness patterns and connect with friends.' 
              : 'Log in to access your daily wellness log, calendar, and AI wellness coach.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-xs">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl pl-10 pr-4 py-3 outline-none text-sm transition-colors text-gray-800 dark:text-white"
                  placeholder="Arindam Roy"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl pl-10 pr-4 py-3 outline-none text-sm transition-colors text-gray-800 dark:text-white"
                placeholder="name@domain.com"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  type="tel" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl pl-10 pr-4 py-3 outline-none text-sm transition-colors text-gray-800 dark:text-white"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">Gender</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl px-4 py-3 outline-none text-sm transition-colors text-gray-800 dark:text-white cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl pl-10 pr-4 py-3 outline-none text-sm transition-colors text-gray-800 dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-2xl font-outfit font-bold shadow-lg shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-6 text-sm"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)} 
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 my-6"></div>

        <div className="text-center">
          <button 
            onClick={handleAdminPortalRedirect}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
          >
            Access Super Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
