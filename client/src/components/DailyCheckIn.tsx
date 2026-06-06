import React, { useState } from 'react';
import { api } from '../services/api';
import { WellnessEntry } from '../types';
import { Smile, Zap, Bookmark, Star, ArrowLeft } from 'lucide-react';

interface Props {
  date: string;
  userId: string;
  existingEntry?: WellnessEntry;
  onSave: (entry: WellnessEntry) => void;
  onCancel: () => void;
}

const DailyCheckIn: React.FC<Props> = ({ date, userId, existingEntry, onSave, onCancel }) => {
  const [mood, setMood] = useState(existingEntry?.mood || 7);
  const [energy, setEnergy] = useState(existingEntry?.energy || 6);
  const [gratitude, setGratitude] = useState(existingEntry?.gratitude || '');
  const [focus, setFocus] = useState(existingEntry?.focus || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const saved = await api.users.saveEntry({
        date,
        mood,
        energy,
        gratitude,
        focus
      });
      onSave(saved);
    } catch (err: any) {
      setError(err.message || 'Failed to save log entry.');
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (val: number) => {
    if (val <= 2) return '😢';
    if (val <= 4) return '🙁';
    if (val <= 6) return '😐';
    if (val <= 8) return '🙂';
    return '😃';
  };

  const getEnergyEmoji = (val: number) => {
    if (val <= 3) return '😴';
    if (val <= 6) return '🥱';
    if (val <= 8) return '⚡';
    return '🔥';
  };

  return (
    <div className="h-full overflow-y-auto p-4 pb-24 safe-pb scroll-smooth">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-outfit text-lg font-bold text-gray-800 dark:text-white">Daily Wellness Log</h2>
            <p className="text-xs text-gray-400 font-semibold">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Mood Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Smile size={16} className="text-yellow-500" />
                <span>Current Mood</span>
              </label>
              <span className="font-outfit text-sm font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <span>{getMoodEmoji(mood)}</span>
                <span>{mood}/10</span>
              </span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-full accent-teal-500 bg-gray-100 dark:bg-gray-800 rounded-lg h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-1">
              <span>Low / Sad</span>
              <span>Happy / Energetic</span>
            </div>
          </div>

          {/* Energy Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Zap size={16} className="text-orange-500" />
                <span>Physical Energy</span>
              </label>
              <span className="font-outfit text-sm font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <span>{getEnergyEmoji(energy)}</span>
                <span>{energy}/10</span>
              </span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full accent-teal-500 bg-gray-100 dark:bg-gray-800 rounded-lg h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-1">
              <span>Exhausted</span>
              <span>Peak Vitality</span>
            </div>
          </div>

          {/* Gratitude Prompt */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Star size={16} className="text-teal-500" />
              <span>One thing you are grateful for today</span>
            </label>
            <input 
              type="text" 
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl px-4 py-3 outline-none text-xs text-gray-855 dark:text-white"
              placeholder="e.g. Sunny weather, coffee, a friendly talk"
              required
            />
          </div>

          {/* Focus Goal */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Bookmark size={16} className="text-indigo-500" />
              <span>Primary wellness focus/goal</span>
            </label>
            <input 
              type="text" 
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl px-4 py-3 outline-none text-xs text-gray-855 dark:text-white"
              placeholder="e.g. 20 minute meditation, read a chapter"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 text-gray-500 dark:text-gray-400 rounded-2xl font-bold font-outfit text-xs active:scale-98 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-2xl font-bold font-outfit shadow-md shadow-teal-500/10 text-xs active:scale-98 transition-all"
            >
              {loading ? 'Saving...' : 'Save Log'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DailyCheckIn;
