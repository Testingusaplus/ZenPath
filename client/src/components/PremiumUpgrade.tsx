import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { X, Sparkles, Check, DollarSign } from 'lucide-react';

interface Props {
  onUpgrade: (user: User) => void;
  onClose: () => void;
}

const PremiumUpgrade: React.FC<Props> = ({ onUpgrade, onClose }) => {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const data = await api.users.upgradePremium(plan);
      setSuccess(true);
      setTimeout(() => {
        onUpgrade(data.user);
      }, 1000);
    } catch (err) {
      alert("Payment simulation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Advanced wellness analytics & metrics overviews',
    'Custom dashboard theme selector (Rose, Sage, Lavender, Ocean)',
    '100% ad-free experience (Google AdMob / Facebook banners hidden)',
    'Prioritized response from AI Wellness Coach'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in">
        
        {/* Glow Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <X size={14} />
          </button>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full uppercase w-max tracking-wide">
              <Sparkles size={12} className="fill-current" />
              <span>Go Pro</span>
            </div>
            <h3 className="font-outfit text-xl font-bold">Unlock ZenPath Premium</h3>
            <p className="text-[10px] opacity-80">Take full control of your wellness streaks and routines.</p>
          </div>
        </div>

        {/* Upgrade Content */}
        <div className="p-5 space-y-5">
          {success ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold animate-bounce">
                ✓
              </div>
              <h4 className="font-outfit font-bold text-sm text-gray-800 dark:text-white">Payment Completed!</h4>
              <p className="text-[10px] text-gray-400">Upgrading your account to Pro status...</p>
            </div>
          ) : (
            <>
              {/* Feature checklist */}
              <div className="space-y-2.5">
                {features.map((feat, i) => (
                  <div key={i} className="flex gap-2 items-start text-[10px] text-gray-655 dark:text-gray-300">
                    <Check size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Plans toggles */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-950 p-1.5 rounded-2xl border dark:border-gray-800">
                <button
                  onClick={() => setPlan('monthly')}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center border transition-all ${
                    plan === 'monthly'
                      ? 'bg-white dark:bg-gray-900 border-indigo-200 dark:border-indigo-900 shadow-sm text-indigo-650 dark:text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-650'
                  }`}
                >
                  <span className="text-[10px] font-bold">Monthly</span>
                  <span className="font-outfit text-base font-bold mt-1">$2.99</span>
                </button>

                <button
                  onClick={() => setPlan('yearly')}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center border relative transition-all ${
                    plan === 'yearly'
                      ? 'bg-white dark:bg-gray-900 border-indigo-200 dark:border-indigo-900 shadow-sm text-indigo-650 dark:text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-650'
                  }`}
                >
                  <span className="absolute -top-2.5 bg-indigo-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase">Save 45%</span>
                  <span className="text-[10px] font-bold">Yearly</span>
                  <span className="font-outfit text-base font-bold mt-1">$19.99</span>
                </button>
              </div>

              {/* simulated payment checkout button */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 hover:opacity-95 text-white rounded-2xl font-bold font-outfit text-xs active:scale-98 shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1"
              >
                <DollarSign size={14} /> {loading ? 'Processing Transaction...' : 'Confirm Simulated Checkout'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default PremiumUpgrade;
