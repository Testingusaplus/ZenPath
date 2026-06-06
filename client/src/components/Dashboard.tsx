import React, { useState, useEffect } from 'react';
import { User, WellnessEntry } from '../types';
import { Award, BookOpen, Clock, Flame, Play, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react';

interface Props {
  entries: WellnessEntry[];
  user: User;
  onCheckIn: () => void;
  onViewCalendar: () => void;
  onUpgradeClick: () => void;
}

const Dashboard: React.FC<Props> = ({ entries, user, onCheckIn, onViewCalendar, onUpgradeClick }) => {
  // 1. Pomodoro Timer State
  const [timerType, setTimerType] = useState<'focus' | 'short' | 'long'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(25 * 60);

  // 2. Mock Daily Habits State
  const [habits, setHabits] = useState([
    { id: 1, name: 'Drink 8 cups of water', completed: false, category: 'physical' },
    { id: 2, name: '10-minute mindfulness', completed: false, category: 'mental' },
    { id: 3, name: 'Stretch and walk outside', completed: false, category: 'physical' }
  ]);

  // Handle Timer ticking
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      alert(`${timerType === 'focus' ? 'Focus session' : 'Break'} completed!`);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, timerType]);

  const changeTimerType = (type: 'focus' | 'short' | 'long') => {
    setTimerType(type);
    setTimerRunning(false);
    let time = 25 * 60;
    if (type === 'short') time = 5 * 60;
    if (type === 'long') time = 15 * 60;
    setTimeLeft(time);
    setInitialTime(time);
  };

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(initialTime);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Find today's entry
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === todayStr);

  const toggleHabit = (id: number) => {
    setHabits(habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  const completedHabitsCount = habits.filter(h => h.completed).length;

  return (
    <div className="h-full overflow-y-auto p-4 pb-24 safe-pb scroll-smooth">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* TOP GREETING BANNER */}
        <div className="bg-gradient-to-br from-teal-500 via-theme-sage to-emerald-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-15 transform translate-y-10 translate-x-10 pointer-events-none">
            <Award size={200} />
          </div>
          <div className="relative z-10 space-y-2">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Daily Planner
            </span>
            <h2 className="font-outfit text-2xl font-bold">Hello, {user.name}!</h2>
            <p className="text-sm opacity-90 max-w-md">
              {todayEntry 
                ? "Excellent! You've logged your wellness state today. Track your consistency on the calendar." 
                : "Welcome to your mindfulness space. Take a minute to complete your daily check-in!"}
            </p>
            <div className="pt-2">
              <button 
                onClick={onCheckIn}
                className="bg-white text-teal-700 hover:bg-teal-50 px-5 py-2.5 rounded-2xl text-xs font-bold font-outfit shadow-md active:scale-98 transition-all flex items-center gap-1.5"
              >
                {todayEntry ? 'Edit Check-In' : 'Complete Daily Log'}
              </button>
            </div>
          </div>
        </div>

        {/* WIDGET GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* POMODORO FOCUS TIMER */}
          <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm flex flex-col items-center">
            <div className="flex items-center gap-1.5 self-start text-gray-500 mb-4 text-xs font-semibold">
              <Clock size={16} />
              <span>Mindfulness Timer</span>
            </div>
            
            {/* SVG PROGRESS CIRCLE */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  className="stroke-gray-100 dark:stroke-gray-900 fill-none" 
                  strokeWidth="6" 
                />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  className="stroke-teal-500 fill-none transition-all duration-300" 
                  strokeWidth="6" 
                  strokeDasharray="439.8" 
                  strokeDashoffset={439.8 - (439.8 * timeLeft) / initialTime}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-3xl font-outfit font-bold text-gray-800 dark:text-white">
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* TIMER TYPE TOGGLE */}
            <div className="flex gap-1.5 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl mt-5 w-full">
              {(['focus', 'short', 'long'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => changeTimerType(type)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all ${
                    timerType === type 
                      ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {type === 'focus' ? 'Focus' : type === 'short' ? 'Short Break' : 'Long Break'}
                </button>
              ))}
            </div>

            {/* CONTROLS */}
            <div className="flex gap-3 mt-4">
              <button 
                onClick={toggleTimer} 
                className="w-12 h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
              >
                {timerRunning ? <span className="font-bold">||</span> : <Play size={18} className="ml-0.5 fill-current" />}
              </button>
              <button 
                onClick={resetTimer} 
                className="w-12 h-12 bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-800 active:scale-95 transition-all"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* COMPACT DAILY HABITS */}
          <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold">
                  <Flame size={16} className="text-orange-500" />
                  <span>Today's Streaks</span>
                </div>
                <span className="text-[10px] bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold">
                  {completedHabitsCount}/{habits.length} Done
                </span>
              </div>

              <div className="space-y-3">
                {habits.map(habit => (
                  <label 
                    key={habit.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-gray-100 dark:hover:border-gray-800 cursor-pointer transition-all"
                  >
                    <input 
                      type="checkbox" 
                      checked={habit.completed}
                      onChange={() => toggleHabit(habit.id)}
                      className="w-4 h-4 rounded text-teal-600 border-gray-300 focus:ring-teal-500 dark:bg-gray-800 dark:border-gray-700" 
                    />
                    <span className={`text-xs ${habit.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {habit.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={onViewCalendar}
              className="w-full text-center text-xs text-teal-600 dark:text-teal-400 hover:underline font-bold mt-4"
            >
              View Full Calendar Log &rarr;
            </button>
          </div>

        </div>

        {/* TODAY'S WELLNESS CHECK-IN SUMMARY */}
        {todayEntry && (
          <div className="bg-teal-50/50 dark:bg-teal-950/20 p-5 rounded-3xl border border-teal-100/50 dark:border-teal-900/40">
            <h3 className="font-outfit font-bold text-teal-800 dark:text-teal-400 text-sm mb-3">Today's Reflection</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white dark:bg-gray-950 p-3.5 rounded-2xl border border-teal-50 dark:border-teal-950/30">
                <span className="text-gray-400 font-semibold block mb-0.5">Mood Rating</span>
                <span className="text-lg font-outfit font-bold text-teal-700 dark:text-teal-300">{todayEntry.mood}/10</span>
              </div>
              <div className="bg-white dark:bg-gray-950 p-3.5 rounded-2xl border border-teal-50 dark:border-teal-950/30">
                <span className="text-gray-400 font-semibold block mb-0.5">Energy Rating</span>
                <span className="text-lg font-outfit font-bold text-teal-700 dark:text-teal-300">{todayEntry.energy}/10</span>
              </div>
              {todayEntry.gratitude && (
                <div className="col-span-2 bg-white dark:bg-gray-950 p-3.5 rounded-2xl border border-teal-50 dark:border-teal-950/30">
                  <span className="text-gray-400 font-semibold block mb-1 flex items-center gap-1"><BookOpen size={14} /> Grateful for</span>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">"{todayEntry.gratitude}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MOCK AD BANNER (For Free Users) */}
        {!user.isPremium && (
          <div className="bg-gray-100 dark:bg-gray-900 rounded-3xl p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <span className="bg-gray-200 dark:bg-gray-800 text-gray-500 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Sponsored</span>
              <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300 mt-1">Soothe Meditation App</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">10-day audio meditations to reduce anxiety. Download today!</p>
            </div>
            <button 
              onClick={onUpgradeClick}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-sm active:scale-95 transition-all whitespace-nowrap"
            >
              Simulate Upgrade (Hide Ads)
            </button>
          </div>
        )}

        {/* AFFILIATE RECOMMENDATION SECTION */}
        <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag size={18} className="text-teal-600" />
            <h3 className="font-outfit font-bold text-sm text-gray-800 dark:text-white">Wellness Recommendations</h3>
          </div>
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/10 dark:to-emerald-950/10 p-5 rounded-2xl border border-teal-100/50 dark:border-teal-900/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">8-12% Commission</span>
              <h4 className="font-bold text-sm text-gray-800 dark:text-white mt-2">Mindfulness Dotted Journal</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Premium hardbound bullet journal for positive reflections and gratitude prompts.</p>
            </div>
            <a 
              href="https://amazon.com"
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-gray-900 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-gray-800 px-4 py-2 rounded-xl border border-teal-200 dark:border-teal-900 text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
            >
              Buy on Amazon
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
