import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Droplets, Flame, ChevronLeft, ChevronRight } from 'lucide-react';

const HEADLINES = [
  "Stay Healthy",
  "Do Exercise",
  "talk less SLEEP MORE"
];

const METRIC_KEYS = ['Calories', 'Protein', 'Fats', 'Carbs', 'Water'];

export const Home: React.FC = () => {
  const { logs, metrics, selectedDate, setSelectedDate, updateMetricGoal } = useApp();
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [fade, setFade] = useState(true);
  
  // Date Picker State
  const [viewMonth, setViewMonth] = useState(new Date());
  const [dates, setDates] = useState<Date[]>([]);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  // --- 1. Looping Header Logic ---
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // Start fade out
      setTimeout(() => {
        setHeadlineIndex((prev) => (prev + 1) % HEADLINES.length);
        setFade(true); // Fade in
      }, 500); // Wait for fade out
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- 2. Date Picker Logic ---
  useEffect(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const d = [];
    for (let i = 1; i <= daysInMonth; i++) {
      d.push(new Date(year, month, i));
    }
    setDates(d);
    
    // Auto-sync view month if selectedDate changes externally
    if (selectedDate.getMonth() !== month && !isNaN(selectedDate.getTime())) {
        setViewMonth(new Date(selectedDate));
    }
  }, [viewMonth, selectedDate]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewMonth(newDate);
  };

  // --- 3. Metrics Calculation ---
  const dayLogs = logs.filter(l => 
    new Date(l.timestamp).toDateString() === selectedDate.toDateString()
  );

  const getActual = (key: string) => {
    return dayLogs.reduce((sum, log) => {
        const val = log.metricsImpact[key] || 0;
        return sum + (val * (log.quantity || 1));
    }, 0);
  };

  const getGoal = (key: string) => {
      const m = metrics.find(m => m.name === key);
      return m ? m.required : (key === 'Water' ? 2500 : (key === 'Calories' ? 2000 : 100)); // Fallbacks
  };

  return (
    <div className="p-6 pb-32">
      
      {/* 1. Looping Header */}
      <div className="flex justify-center mb-6 h-8 items-center bg-indigo-50/50 rounded-full py-1">
        <h2 className={`text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          {HEADLINES[headlineIndex]}
        </h2>
      </div>

      {/* 2. Date Picker (Synced) */}
      <div className="mb-8">
         <div className="flex justify-between items-center mb-3 px-1">
             <h3 className="text-lg font-bold text-slate-800">{viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
             <div className="flex gap-2">
                 <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full text-slate-400"><ChevronLeft size={20}/></button>
                 <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full text-slate-400"><ChevronRight size={20}/></button>
             </div>
         </div>
         <div className="overflow-x-auto whitespace-nowrap pb-2 no-scrollbar scroll-smooth -mx-6 px-6">
            {dates.map((date) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                    <button key={date.toString()} onClick={() => setSelectedDate(date)} className={`inline-flex flex-col items-center justify-center w-12 h-14 mx-1 rounded-2xl transition-all border ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-105 border-indigo-600' : isToday ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-gray-400 border-gray-100'}`}>
                        <span className="text-[9px] uppercase font-bold opacity-80">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-sm font-bold">{date.getDate()}</span>
                    </button>
                )
            })}
         </div>
      </div>

      {/* 3. Daily Goals Section */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex justify-between items-center px-1">
             <h3 className="font-bold text-slate-800">Daily Targets</h3>
             <span className="text-xs text-gray-400">Tap goal to edit</span>
         </div>
         
         <div className="grid grid-cols-1 gap-3">
             {METRIC_KEYS.map((key) => {
                 const actual = Math.round(getActual(key));
                 const goal = getGoal(key);
                 const percent = goal > 0 ? Math.min(100, Math.max(0, (actual / goal) * 100)) : 0;
                 const isEditing = editingGoal === key;

                 return (
                     <div key={key} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
                         {/* Progress Bar Background */}
                         <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
                             <div className={`h-full transition-all duration-1000 ${percent >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }}></div>
                         </div>
                         
                         <div className="flex justify-between items-center relative z-10">
                             <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${percent >= 100 ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                     {key === 'Calories' && <Flame size={16}/>}
                                     {key === 'Water' && <Droplets size={16}/>}
                                     {key === 'Protein' && <span className="text-[10px] font-black">PRO</span>}
                                     {key === 'Fats' && <span className="text-[10px] font-black">FAT</span>}
                                     {key === 'Carbs' && <span className="text-[10px] font-black">CAR</span>}
                                 </div>
                                 <span className="font-semibold text-slate-700">{key}</span>
                             </div>

                             <div className="flex items-center gap-1">
                                 <span className={`text-lg font-bold transition-colors ${actual > goal ? 'text-orange-500' : 'text-slate-800'}`}>{actual}</span>
                                 <span className="text-gray-400 text-xs">/</span>
                                 {isEditing ? (
                                     <input 
                                        autoFocus
                                        type="number" 
                                        className="w-16 border-b-2 border-indigo-500 focus:outline-none text-sm font-bold text-indigo-600 bg-transparent"
                                        defaultValue={goal}
                                        onBlur={(e) => {
                                            updateMetricGoal(key, Number(e.target.value));
                                            setEditingGoal(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                updateMetricGoal(key, Number(e.currentTarget.value));
                                                setEditingGoal(null);
                                            }
                                        }}
                                     />
                                 ) : (
                                     <button onClick={() => setEditingGoal(key)} className="text-xs font-medium text-gray-400 hover:text-indigo-600 border-b border-transparent hover:border-indigo-200 transition-all">
                                         {goal} {key === 'Calories' ? 'kcal' : (key === 'Water' ? 'ml' : 'g')}
                                     </button>
                                 )}
                             </div>
                         </div>
                     </div>
                 )
             })}
         </div>
      </div>
    </div>
  );
};