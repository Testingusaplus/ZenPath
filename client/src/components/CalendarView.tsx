import React, { useState } from 'react';
import { WellnessEntry } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MessageSquare, Info } from 'lucide-react';

interface Props {
  entries: WellnessEntry[];
  onSelectDate: (date: string) => void;
}

const CalendarView: React.FC<Props> = ({ entries, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<WellnessEntry | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Helper to generate days of current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    const d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const startDayIndex = days[0].getDay(); // 0 is Sun, 6 is Sat
  const blanks = Array(startDayIndex).fill(null);

  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getMoodColor = (mood: number) => {
    if (mood <= 2) return 'bg-red-400 dark:bg-red-900/60 text-white';
    if (mood <= 4) return 'bg-orange-400 dark:bg-orange-950/60 text-white';
    if (mood <= 6) return 'bg-yellow-400 dark:bg-yellow-950/60 text-gray-800 dark:text-yellow-300';
    if (mood <= 8) return 'bg-teal-400 dark:bg-teal-950/60 text-white dark:text-teal-300';
    return 'bg-green-400 dark:bg-green-950/60 text-white dark:text-green-300';
  };

  const handleDayClick = (date: Date) => {
    const dateStr = formatDateStr(date);
    setSelectedDateStr(dateStr);
    const entry = entries.find(e => e.date === dateStr);
    if (entry) {
      setSelectedEntry(entry);
    } else {
      setSelectedEntry(null);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedEntry(null);
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedEntry(null);
    setSelectedDateStr(null);
  };

  const monthYearLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      
      {/* Calendar Grid card */}
      <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-teal-500" size={20} />
            <h3 className="font-outfit font-bold text-gray-855 dark:text-white text-base">{monthYearLabel}</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevMonth}
              className="p-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl transition-colors text-gray-500"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl transition-colors text-gray-500"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-gray-400 uppercase mb-2">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="aspect-square"></div>
          ))}
          {days.map((day, i) => {
            const dateStr = formatDateStr(day);
            const entry = entries.find(e => e.date === dateStr);
            const isSelected = selectedDateStr === dateStr;
            const moodColor = entry ? getMoodColor(entry.mood) : '';
            
            return (
              <button
                key={`day-${i}`}
                onClick={() => handleDayClick(day)}
                className={`aspect-square flex flex-col items-center justify-center rounded-2xl relative text-xs font-semibold font-outfit border transition-all active:scale-95 ${
                  entry 
                    ? `${moodColor} border-transparent shadow-sm` 
                    : isToday(day)
                      ? 'bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-950/20 dark:border-teal-900'
                      : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                } ${isSelected ? 'ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-gray-950 scale-105 z-10' : ''}`}
              >
                <span>{day.getDate()}</span>
                {entry && (
                  <span className="w-1 h-1 bg-white/60 dark:bg-current rounded-full absolute bottom-1.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day details or Checkin trigger card */}
      <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm min-h-[140px] flex flex-col justify-center">
        {selectedDateStr ? (
          selectedEntry ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-900">
                <h4 className="font-outfit font-bold text-sm text-gray-800 dark:text-white">Log Details</h4>
                <button 
                  onClick={() => onSelectDate(selectedDateStr)}
                  className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline font-bold"
                >
                  Edit Log
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-transparent">
                  <span className="text-[10px] text-gray-400 block mb-0.5">Mood</span>
                  <span className="font-bold text-gray-855 dark:text-white">{selectedEntry.mood}/10</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-transparent">
                  <span className="text-[10px] text-gray-400 block mb-0.5">Energy</span>
                  <span className="font-bold text-gray-855 dark:text-white">{selectedEntry.energy}/10</span>
                </div>
                {selectedEntry.gratitude && (
                  <div className="col-span-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-transparent">
                    <span className="text-[10px] text-gray-400 block mb-1 flex items-center gap-1"><Info size={12} /> Gratitude</span>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">"{selectedEntry.gratitude}"</p>
                  </div>
                )}
                {selectedEntry.focus && (
                  <div className="col-span-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-transparent">
                    <span className="text-[10px] text-gray-400 block mb-1 flex items-center gap-1"><MessageSquare size={12} /> Goal</span>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedEntry.focus}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-gray-400">No wellness data logged for this date ({selectedDateStr}).</p>
              <button
                onClick={() => onSelectDate(selectedDateStr)}
                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-2xl text-[10px] font-bold font-outfit shadow-sm active:scale-95 transition-all inline-block"
              >
                Log Wellness Now
              </button>
            </div>
          )
        ) : (
          <div className="text-center py-6 text-gray-400 space-y-2">
            <CalendarIcon size={24} className="mx-auto text-gray-300 dark:text-gray-800" />
            <p className="text-xs">Select a day in the calendar to view logged details or start a new check-in.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default CalendarView;
