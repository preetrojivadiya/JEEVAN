import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight, Search, Plus, Trash2, Zap, Dumbbell, Sparkles, X, Minus, ArrowRight, LayoutList, Save, Clock } from 'lucide-react';
import { searchActivityDatabase } from '../services/geminiService';
import { LogEntry, CustomFood, WorkoutTemplate } from '../types';

export const Activities: React.FC = () => {
  const { logs, addLog, updateLog, removeLog, selectedDate, setSelectedDate, customFoods, addCustomFood, workoutTemplates, addWorkoutTemplate, removeWorkoutTemplate } = useApp();

  // --- UI State ---
  const [viewMonth, setViewMonth] = useState(new Date());
  const [dates, setDates] = useState<Date[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateScrollRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', calories: '', fats: '' });
  
  const [showDescribe, setShowDescribe] = useState(false);
  
  // --- Workout Builder State ---
  const [showWorkouts, setShowWorkouts] = useState(false);
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [builderName, setBuilderName] = useState('');
  const [builderItems, setBuilderItems] = useState<LogEntry[]>([]);
  const [builderSearchQuery, setBuilderSearchQuery] = useState('');
  const [builderPredictions, setBuilderPredictions] = useState<any[]>([]);

  // --- Date Sync & Centering Logic ---
  useEffect(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const d = [];
    for (let i = 1; i <= daysInMonth; i++) {
      d.push(new Date(year, month, i));
    }
    setDates(d);
    
    // Auto-scroll logic
    if (selectedDate.getMonth() === month && dateScrollRef.current) {
        const dayIndex = selectedDate.getDate() - 1;
        const scrollPos = dayIndex * 60; // Approx width of item + margin
        dateScrollRef.current.scrollTo({ left: scrollPos - 100, behavior: 'smooth' });
    }
  }, [viewMonth, selectedDate]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewMonth(newDate);
  };

  // --- Search Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        const results = await searchActivityDatabase(searchQuery);
        setPredictions(results);
        setIsSearching(false);
      } else {
        setPredictions([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

   useEffect(() => {
      const delay = setTimeout(async () => {
          if (builderSearchQuery.length > 2) {
              const results = await searchActivityDatabase(builderSearchQuery);
              setBuilderPredictions(results);
          } else {
              setBuilderPredictions([]);
          }
      }, 300);
      return () => clearTimeout(delay);
  }, [builderSearchQuery]);

  // --- Helper: Create Activity Log Object ---
  const createActivityLog = (item: any, date: Date): LogEntry => {
    const burnPerUnit = item.calories || 0;
    const fatBurnPerUnit = item.fats || 0;
    const initialSets = 1;
    const initialReps = [10]; // Default 10 reps for 1 set

    const totalReps = initialReps.reduce((a, b) => a + b, 0);
    const totalBurn = -(burnPerUnit * totalReps);
    const totalFatBurn = -(fatBurnPerUnit * totalReps);

    return {
      id: Date.now().toString() + Math.random(),
      timestamp: date.getTime(),
      type: 'ACTIVITY',
      description: item.name,
      metricsImpact: {
        'Calories': totalBurn,
        'Fats': totalFatBurn
      },
      baseMetrics: {
        'Calories': burnPerUnit,
        'Fats': fatBurnPerUnit
      },
      quantity: 1, 
      activityDetails: {
        sets: initialSets,
        reps: initialReps
      }
    };
  };

  // --- Add Activity Logic ---
  const handleAddActivity = (item: any) => {
    const newLog = createActivityLog(item, selectedDate);
    addLog(newLog);
    setSearchQuery('');
    setPredictions([]);
  };

  // --- Update Sets & Reps (Core Logic) ---
  const handleUpdateDetails = (log: LogEntry, newSets: number, repArray: number[]) => {
      const baseCal = log.baseMetrics?.['Calories'] || 0;
      const baseFat = log.baseMetrics?.['Fats'] || 0;
      
      // Resize rep array if sets changed
      let updatedReps = [...repArray];
      if (newSets > updatedReps.length) {
          // Add new sets, copying the last set's rep count or default to 10
          const lastVal = updatedReps[updatedReps.length - 1] || 10;
          updatedReps = [...updatedReps, ...Array(newSets - updatedReps.length).fill(lastVal)];
      } else if (newSets < updatedReps.length) {
          // Trim array
          updatedReps = updatedReps.slice(0, newSets);
      }

      // Calculate Totals
      const totalReps = updatedReps.reduce((a, b) => a + b, 0);
      const totalBurn = -(baseCal * totalReps);
      const totalFatBurn = -(baseFat * totalReps);

      updateLog(log.id, {
          activityDetails: { sets: newSets, reps: updatedReps },
          metricsImpact: {
              'Calories': totalBurn,
              'Fats': totalFatBurn
          }
      });
  };

  const handleRepChange = (log: LogEntry, setIndex: number, newValue: number) => {
      if (!log.activityDetails) return;
      const newReps = [...log.activityDetails.reps];
      newReps[setIndex] = newValue;
      handleUpdateDetails(log, log.activityDetails.sets, newReps);
  };

  // --- Custom Activity ---
  const handleCreateCustom = (e: React.FormEvent) => {
      e.preventDefault();
      addCustomFood({
          id: Date.now().toString(),
          name: customForm.name,
          metrics: {
              'Calories': Number(customForm.calories),
              'Fats': Number(customForm.fats)
          }
      });
      setCustomForm({ name: '', calories: '', fats: '' });
      setShowCustomModal(false);
  };

  const handleAddCustomToLog = (food: CustomFood) => {
      handleAddActivity({
          name: food.name,
          calories: food.metrics['Calories'],
          fats: food.metrics['Fats'],
          unit: 'rep'
      });
  };

  // --- Workout Builder Logic ---
  const handleAddToBuilder = (item: any) => {
      const log = createActivityLog(item, new Date());
      setBuilderItems([...builderItems, log]);
      setBuilderSearchQuery('');
      setBuilderPredictions([]);
  };

  const handleUpdateBuilderItem = (index: number, newSets: number, repArray: number[]) => {
      const item = builderItems[index];
      const baseCal = item.baseMetrics?.['Calories'] || 0;
      
      let updatedReps = [...repArray];
      if (newSets > updatedReps.length) {
          const lastVal = updatedReps[updatedReps.length - 1] || 10;
          updatedReps = [...updatedReps, ...Array(newSets - updatedReps.length).fill(lastVal)];
      } else if (newSets < updatedReps.length) {
          updatedReps = updatedReps.slice(0, newSets);
      }
      
      const totalReps = updatedReps.reduce((a, b) => a + b, 0);
      
      const updatedItem = {
          ...item,
          activityDetails: { sets: newSets, reps: updatedReps },
          metricsImpact: { ...item.metricsImpact, 'Calories': -(baseCal * totalReps) }
      };
      
      const newItems = [...builderItems];
      newItems[index] = updatedItem;
      setBuilderItems(newItems);
  };

  const saveWorkout = () => {
      if (!builderName) return;
      addWorkoutTemplate({
          id: Date.now().toString(),
          name: builderName,
          items: builderItems
      });
      setBuilderName('');
      setBuilderItems([]);
      setShowWorkoutBuilder(false);
  };

  const applyWorkout = (template: WorkoutTemplate) => {
      template.items.forEach((item, i) => {
          addLog({
              ...item,
              id: Date.now().toString() + i,
              timestamp: selectedDate.getTime()
          });
      });
      setShowWorkouts(false);
  };

  const dayLogs = logs.filter(l => 
    l.type === 'ACTIVITY' && 
    new Date(l.timestamp).toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="flex flex-col h-full relative bg-slate-50">
      
      {/* 1. Synced Date Bar */}
      <div className="bg-white shadow-sm z-30 sticky top-0">
         <div className="pt-4 pb-2 px-6 flex justify-between items-center bg-white relative">
            <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                <h2 className="text-lg font-bold text-slate-800">{viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <Calendar className="text-indigo-600 w-5 h-5" />
            </button>
         </div>
         <div ref={dateScrollRef} className="overflow-x-auto whitespace-nowrap px-4 pb-3 no-scrollbar scroll-smooth">
            {dates.map((date) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                    <button key={date.toString()} onClick={() => setSelectedDate(date)} className={`inline-flex flex-col items-center justify-center w-14 h-16 mx-1 rounded-2xl transition-all border ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-105 border-indigo-600' : 'bg-white text-gray-400 border-gray-100'}`}>
                        <span className="text-[10px] uppercase font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-lg font-bold">{date.getDate()}</span>
                    </button>
                )
            })}
         </div>
      </div>

      {/* 2. AI Search Bar */}
      <div className="p-4 z-20 relative">
         <div className="relative">
             <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
             <input type="text" placeholder="Search exercises (e.g. Bench Press)..." className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             {isSearching && <div className="absolute right-4 top-3.5 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
         </div>
         {predictions.length > 0 && (
             <div className="absolute top-full left-4 right-4 bg-white rounded-xl shadow-xl border border-gray-100 mt-2 p-2 animate-in fade-in slide-in-from-top-2 z-50">
                 {predictions.map((item, idx) => (
                     <button key={idx} onClick={() => handleAddActivity(item)} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg flex justify-between items-center group">
                        <div>
                            <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700">{item.name}</p>
                            <p className="text-[10px] text-gray-400">
                                {item.calories} cal/{item.unit} • {item.fats}g fat
                            </p>
                        </div>
                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                     </button>
                 ))}
             </div>
         )}
      </div>

      {/* 3. Activity List */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
          {dayLogs.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3"><Dumbbell className="w-6 h-6" /></div>
                 <p className="text-sm">No exercises logged today</p>
             </div>
          ) : (
             dayLogs.map((log) => {
                 const details = log.activityDetails || { sets: 1, reps: [10] };
                 return (
                     <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all hover:border-indigo-100">
                         <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                                     <Zap size={18} />
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-slate-700 text-sm">{log.description}</h4>
                                     <div className="flex gap-2 text-[10px] text-gray-400">
                                        <span>Base: {log.baseMetrics?.['Calories']} cal/rep</span>
                                        <span>•</span>
                                        <span>Base: {log.baseMetrics?.['Fats']} g/rep</span>
                                     </div>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <span className="block font-bold text-orange-500 text-lg">
                                     {Math.abs(Math.round(log.metricsImpact['Calories']))} <span className="text-xs font-normal text-gray-400">kcal</span>
                                 </span>
                                 <span className="block text-[10px] font-bold text-gray-400">
                                     {Math.abs(Math.round(log.metricsImpact['Fats'] || 0))} g Fat
                                 </span>
                             </div>
                         </div>
                         
                         {/* Sets & Reps Controls */}
                         <div className="bg-gray-50 rounded-lg p-3">
                             <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                                 <span className="text-[10px] font-bold text-gray-400 uppercase">Sets</span>
                                 <div className="flex items-center bg-white rounded border border-gray-200">
                                     <button onClick={() => handleUpdateDetails(log, Math.max(1, details.sets - 1), details.reps)} className="px-2 py-1 hover:bg-gray-50"><Minus size={10}/></button>
                                     <span className="w-6 text-center text-xs font-bold">{details.sets}</span>
                                     <button onClick={() => handleUpdateDetails(log, details.sets + 1, details.reps)} className="px-2 py-1 hover:bg-gray-50"><Plus size={10}/></button>
                                 </div>
                             </div>
                             
                             <div className="grid grid-cols-4 gap-2">
                                 {details.reps.map((rep, idx) => (
                                     <div key={idx} className="flex flex-col items-center">
                                        <span className="text-[8px] text-gray-400 mb-1">Set {idx + 1}</span>
                                        <input 
                                            type="number" 
                                            value={rep} 
                                            onChange={(e) => handleRepChange(log, idx, Number(e.target.value))}
                                            className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded py-1 focus:ring-1 focus:ring-indigo-500"
                                        />
                                     </div>
                                 ))}
                             </div>
                             
                             <div className="flex justify-end mt-2">
                                <button onClick={() => removeLog(log.id)} className="text-gray-300 hover:text-red-500 p-1">
                                    <Trash2 size={14} />
                                </button>
                             </div>
                         </div>
                     </div>
                 )
             })
          )}
      </div>

      {/* 4. Bottom Action Bar */}
      <div className="fixed bottom-[4.5rem] left-4 right-4 bg-white rounded-2xl shadow-xl border border-indigo-50 p-2 flex justify-between items-center z-40">
          <button onClick={() => setShowCustomModal(true)} className="flex flex-col items-center justify-center w-20 py-1 gap-1 text-gray-500 hover:text-indigo-600 active:scale-95 transition-all">
              <Plus className="w-5 h-5" /><span className="text-[9px] font-bold">Custom Activity</span>
          </button>
          <div className="w-px h-8 bg-gray-100 mx-1"></div>
          <button onClick={() => setShowWorkouts(true)} className="flex flex-col items-center justify-center w-16 py-1 gap-1 text-gray-500 hover:text-indigo-600 active:scale-95 transition-all">
              <LayoutList className="w-5 h-5" /><span className="text-[9px] font-bold">Workouts</span>
          </button>
          <button onClick={() => setShowDescribe(true)} className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
              <Sparkles className="w-4 h-4" /><span className="text-xs font-bold">Describe Workout</span>
          </button>
      </div>

      {/* Workout List Modal */}
      {showWorkouts && (
          <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom-5">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-slate-800">My Workouts</h3>
                  <button onClick={() => setShowWorkouts(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                  <button onClick={() => { setShowWorkoutBuilder(true); setShowWorkouts(false); }} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md mb-6 flex items-center justify-center gap-2">
                      <Plus size={16}/> Create New Workout
                  </button>
                  
                  <div className="space-y-3">
                      {workoutTemplates.map(t => (
                          <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-bold text-slate-800">{t.name}</h4>
                                  <button onClick={() => removeWorkoutTemplate(t.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                              </div>
                              <p className="text-xs text-gray-400 mb-4">{t.items.length} Exercises</p>
                              <button onClick={() => applyWorkout(t)} className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-100">
                                  Log Workout <ArrowRight size={12}/>
                              </button>
                          </div>
                      ))}
                      {workoutTemplates.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">No saved workouts yet.</p>}
                  </div>
              </div>
          </div>
      )}

      {/* Workout Builder (Full Screen) */}
      {showWorkoutBuilder && (
          <div className="fixed inset-0 bg-white z-[70] flex flex-col animate-in slide-in-from-bottom-5">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-slate-800">New Workout Plan</h3>
                  <div className="flex gap-2">
                      <button onClick={() => { setShowWorkoutBuilder(false); setBuilderItems([]); }} className="px-3 py-1.5 text-xs font-bold text-gray-500">Cancel</button>
                      <button onClick={saveWorkout} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">Save Plan</button>
                  </div>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                  <input type="text" placeholder="Workout Name (e.g. Leg Day)" value={builderName} onChange={e => setBuilderName(e.target.value)} className="w-full text-xl font-bold border-b border-gray-200 py-2 mb-6 focus:border-indigo-600 outline-none" />
                  
                  <div className="relative mb-6">
                       <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                       <input type="text" placeholder="Add exercise..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 text-sm" value={builderSearchQuery} onChange={(e) => setBuilderSearchQuery(e.target.value)} />
                       {builderPredictions.length > 0 && (
                           <div className="absolute top-full left-0 right-0 bg-white shadow-xl border border-gray-100 rounded-xl mt-2 p-2 z-50">
                               {builderPredictions.map((item, i) => (
                                   <button key={i} onClick={() => handleAddToBuilder(item)} className="w-full text-left p-2 text-xs hover:bg-indigo-50 flex justify-between">
                                       <span>{item.name}</span>
                                       <Plus size={14} className="text-gray-300"/>
                                   </button>
                               ))}
                           </div>
                       )}
                  </div>

                  <div className="space-y-4">
                      {builderItems.map((item, i) => {
                          const details = item.activityDetails || { sets: 1, reps: [10] };
                          return (
                              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                                  <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-bold text-slate-700 text-sm">{item.description}</h4>
                                      <button onClick={() => { const n = [...builderItems]; n.splice(i, 1); setBuilderItems(n); }} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                                      <span>Sets: {details.sets}</span>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleUpdateBuilderItem(i, details.sets + 1, details.reps)} className="bg-gray-100 px-2 rounded hover:bg-gray-200"><Plus size={10}/></button>
                                          <button onClick={() => handleUpdateBuilderItem(i, Math.max(1, details.sets - 1), details.reps)} className="bg-gray-100 px-2 rounded hover:bg-gray-200"><Minus size={10}/></button>
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                      {builderItems.length === 0 && <p className="text-center text-gray-300 text-sm italic">Add exercises to build your plan</p>}
                  </div>
              </div>
          </div>
      )}

      {/* Custom Activity Modal */}
      {showCustomModal && (
          <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom-5">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-slate-800">Add Custom Activity</h3>
                  <button onClick={() => setShowCustomModal(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6">
                  <form onSubmit={handleCreateCustom} className="space-y-4 mb-8">
                       <input required type="text" placeholder="Activity Name" value={customForm.name} onChange={e => setCustomForm({...customForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                       <div className="flex gap-3">
                           <input type="number" placeholder="Cal Burn (per rep/min)" value={customForm.calories} onChange={e => setCustomForm({...customForm, calories: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                           <input type="number" placeholder="Fat Burn (g/rep)" value={customForm.fats} onChange={e => setCustomForm({...customForm, fats: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                       </div>
                       <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md">Save Custom Activity</button>
                  </form>
                  
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Saved Activities</h4>
                  <div className="space-y-3">
                       {customFoods.filter(f => !f.metrics['Protein']).map((act) => (
                           <div key={act.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                               <div>
                                   <p className="font-bold text-slate-800">{act.name}</p>
                                   <p className="text-xs text-gray-400">{act.metrics['Calories']} cal/rep • {act.metrics['Fats']} g/rep</p>
                               </div>
                               <button onClick={() => handleAddCustomToLog(act)} className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1">Add <ArrowRight size={12}/></button>
                           </div>
                       ))}
                  </div>
              </div>
          </div>
      )}

      {/* Describe Workout Modal Placeholder */}
      {showDescribe && (
          <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative">
                  <button onClick={() => setShowDescribe(false)} className="absolute top-4 right-4 text-gray-400"><X size={20}/></button>
                  <h3 className="font-bold text-lg mb-4">Describe Workout</h3>
                  <textarea className="w-full h-32 border rounded-xl p-3 text-sm mb-4" placeholder="e.g. I did 3 sets of 12 bench presses and ran for 10 mins."></textarea>
                  <button onClick={() => setShowDescribe(false)} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm">Analyze (Coming Soon)</button>
              </div>
          </div>
      )}

    </div>
  );
};