import React, { useState } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { ShieldCheck, Lock, Mail, Key, ShieldAlert } from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User) => void;
  onBack: () => void;
}

const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const data = await api.auth.adminLogin({ email, password });
      if (data.require2FA) {
        setRequire2FA(true);
        setInfoMessage(data.message || 'OTP verification required.');
      } else {
        // Fallback if 2FA disabled
        localStorage.setItem('zp_token', data.token);
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.auth.verify2FA({ email, otp });
      localStorage.setItem('zp_token', data.token);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl border border-gray-700 p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold font-outfit text-white">Admin Portal</h1>
          <p className="text-gray-400 text-xs mt-1">Super Admin Security Access</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/40 text-red-200 p-4 rounded-2xl flex items-center gap-2 text-xs mb-6">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="bg-indigo-900/20 border border-indigo-500/40 text-indigo-200 p-4 rounded-2xl text-xs mb-6">
            {infoMessage}
          </div>
        )}

        {!require2FA ? (
          /* Step 1: Login Form */
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-500" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-3 text-white outline-none text-xs transition-colors"
                  placeholder="admin@zenpath.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-500" size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-3 text-white outline-none text-xs transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-outfit py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 mt-6 text-xs active:scale-98"
            >
              {loading ? 'Authenticating Credentials...' : 'Request OTP Code'}
            </button>
          </form>
        ) : (
          /* Step 2: 2FA OTP Form */
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Enter 2FA Code</label>
              <div className="relative">
                <Key className="absolute left-3 top-3.5 text-gray-500" size={16} />
                <input 
                  type="text" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-3 text-white outline-none text-xs transition-colors font-mono tracking-widest text-center"
                  placeholder="884299"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-outfit py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 mt-6 text-xs active:scale-98"
            >
              {loading ? 'Verifying OTP...' : 'Access Secured Dashboard'}
            </button>

            <button 
              type="button" 
              onClick={() => setRequire2FA(false)}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-400 mt-2"
            >
              Back to credentials
            </button>
          </form>
        )}

        <button 
          onClick={onBack} 
          className="w-full text-center text-gray-550 text-xs mt-6 hover:text-gray-300 transition-colors font-semibold"
        >
          Return to ZenPath App
        </button>

        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-[9px] text-gray-600 font-mono">
          SYSTEM ID: ZP-8842-X • SECURE SSL CONNECT
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
