import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Send, Sparkles, X, Brain } from 'lucide-react';

interface Props {
  user: User;
  onClose: () => void;
}

interface ChatHistoryItem {
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

const WellnessChat: React.FC<Props> = ({ user, onClose }) => {
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        sender: 'coach',
        text: `Hi ${user.name}! I am ZenPath's AI Wellness Coach powered by Gemini. Whether you are feeling stressed, want to review a mindfulness routine, or want to discuss habits, I am here to support you. How are you feeling right now?`,
        timestamp: new Date().toISOString()
      }
    ]);
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, {
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString()
    }]);
    setLoading(true);

    try {
      const response = await api.ai.sendMessage(userText);
      setMessages(prev => [...prev, {
        sender: 'coach',
        text: response.text,
        timestamp: new Date().toISOString()
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'coach',
        text: "I apologize, but I am experiencing issues communicating with my core intelligence right now. Please try again in a few moments.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 w-[340px] h-[450px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-4 shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/10 rounded-xl">
            <Brain size={18} className="fill-current animate-pulse-slow" />
          </div>
          <div>
            <h3 className="font-outfit font-bold text-xs">AI Wellness Coach</h3>
            <span className="text-[9px] opacity-75">Gemini 3 Flash Assisted</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
        >
          <X size={14} />
        </button>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
        {messages.map((msg, i) => {
          const isCoach = msg.sender === 'coach';
          return (
            <div 
              key={i}
              className={`flex flex-col ${isCoach ? 'items-start' : 'items-end'}`}
            >
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed whitespace-pre-line ${
                  isCoach 
                    ? 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-805 dark:text-gray-250 rounded-tl-none' 
                    : 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[7.5px] text-gray-400 mt-1 px-1 font-semibold">
                {new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 p-2 font-semibold animate-pulse">
            <Sparkles size={14} className="animate-spin text-violet-500" />
            <span>Coach is reflecting...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Form Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-1.5 shrink-0">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about stress, meditation routines..."
          className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl px-3.5 py-2.5 outline-none text-[11px] text-gray-800 dark:text-white"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl active:scale-95 shadow-sm shadow-indigo-600/10 flex items-center justify-center"
        >
          <Send size={14} />
        </button>
      </form>

    </div>
  );
};

export default WellnessChat;
