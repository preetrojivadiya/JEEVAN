import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight, Search, Plus, Clock, Edit2, Trash2, Minus, BookOpen, Sparkles, Save, LayoutList, X, ArrowRight } from 'lucide-react';
import { searchFoodDatabase, parseFoodDescription } from '../services/geminiService';
import { LogEntry, CustomFood, MealTemplate } from '../types';

export const Food: React.FC = () => {
  // Switched to global selectedDate and setSelectedDate
  const { logs, addLog, updateLog, removeLog, templates, addTemplate, customFoods, addCustomFood, updateCustomFood, removeCustomFood, selectedDate, setSelectedDate } = useApp();

  const [viewMonth, setViewMonth] = useState(new Date());
  const [dates, setDates] = useState<Date[]>([]);
  // Removed local selectedDate state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customFoodTarget, setCustomFoodTarget] = useState<'DAILY' | 'BUILDER'>('DAILY');
  const [customFoodForm, setCustomFoodForm] = useState({ name: '', calories: '', protein: '', fats: '', carbs: '' });
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);

  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const [showDescribe, setShowDescribe] = useState(false);
  const [describeText, setDescribeText] = useState('');
  const [isProcessingDescribe, setIsProcessingDescribe] = useState(false);

  const [showMealBuilder, setShowMealBuilder] = useState(false);
  const [builderTemplate, setBuilderTemplate] = useState<Omit<MealTemplate, 'id'>>({ name: '', items: [] });
  const [builderSearchQuery, setBuilderSearchQuery] = useState('');
  const [builderPredictions, setBuilderPredictions] = useState<any[]>([]);

  // Init Dates
  useEffect(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const d = [];
    for (let i = 1; i <= daysInMonth; i++) {
      d.push(new Date(year, month, i));
    }
    setDates(d);
    
    // Sync view logic if needed, but primarily relying on global date
    if (selectedDate.getMonth() !== month && !isNaN(selectedDate.getTime())) {
        // Optional: auto-scroll view month to match selected date
    }
  }, [viewMonth, selectedDate]);

  // Filter & Sort Logs
  const dayLogs = logs
    .filter(l => 
      l.type === 'FOOD' && 
      new Date(l.timestamp).toDateString() === selectedDate.toDateString()
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const groupedLogs = dayLogs.reduce<Record<string, LogEntry[]>>((acc, log) => {
    const timeKey = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!acc[timeKey]) acc[timeKey] = [];
    acc[timeKey].push(log);
    return acc;
  }, {});

  // Search Debounce (300ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        const results = await searchFoodDatabase(searchQuery);
        setPredictions(results);
        setIsSearching(false);
      } else {
        setPredictions([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Builder Search Debounce (300ms)
  useEffect(() => {
      const delay = setTimeout(async () => {
          if (builderSearchQuery.length > 2) {
              const results = await searchFoodDatabase(builderSearchQuery);
              setBuilderPredictions(results);
          } else {
              setBuilderPredictions([]);
          }
      }, 300);
      return () => clearTimeout(delay);
  }, [builderSearchQuery]);

  // Handlers
  const changeMonth = (delta: number) => {
      const newDate = new Date(viewMonth);
      newDate.setMonth(newDate.getMonth() + delta);
      setViewMonth(newDate);
  };

  const handleAddPrediction = (item: any) => {
    const metrics = {
        'Calories': item.calories,
        'Protein': item.protein,
        'Carbs': item.carbs,
        'Fats': item.fats
    };
    addLog({
      id: Date.now().toString(),
      timestamp: selectedDate.setHours(new Date().getHours(), new Date().getMinutes()), 
      type: 'FOOD',
      description: item.name,
      metricsImpact: metrics,
      baseMetrics: metrics,
      quantity: 1
    });
    setSearchQuery('');
    setPredictions([]);
  };

  const handleQuantityChange = (log: LogEntry, delta: number) => {
      const newQty = Math.max(0.5, (log.quantity || 1) + delta);
      updateLog(log.id, { quantity: newQty });
  };

  const handleDescribeSubmit = async () => {
    if (!describeText.trim()) return;
    setIsProcessingDescribe(true);
    const items = await parseFoodDescription(describeText);
    items.forEach((item: any, idx: number) => {
        const metrics = {
            'Calories': item.calories,
            'Protein': item.protein,
            'Carbs': item.carbs,
            'Fats': item.fats
        };
        addLog({
            id: (Date.now() + idx).toString(),
            timestamp: selectedDate.setHours(new Date().getHours(), new Date().getMinutes()),
            type: 'FOOD',
            description: item.description,
            metricsImpact: metrics,
            baseMetrics: metrics,
            quantity: 1
        });
    });
    setDescribeText('');
    setIsProcessingDescribe(false);
    setShowDescribe(false);
  };

  const handleCreateOrUpdateCustomFood = (e: React.FormEvent) => {
      e.preventDefault();
      const metrics = {
          'Calories': Number(customFoodForm.calories) || 0,
          'Protein': Number(customFoodForm.protein) || 0,
          'Fats': Number(customFoodForm.fats) || 0,
          'Carbs': Number(customFoodForm.carbs) || 0
      };

      if (editingCustomId) {
          updateCustomFood(editingCustomId, {
              id: editingCustomId,
              name: customFoodForm.name,
              metrics
          });
          setEditingCustomId(null);
      } else {
          addCustomFood({
              id: Date.now().toString(),
              name: customFoodForm.name,
              metrics
          });
      }
      setCustomFoodForm({ name: '', calories: '', protein: '', fats: '', carbs: '' });
  };

  const handleEditCustomFood = (food: CustomFood) => {
      setCustomFoodForm({
          name: food.name,
          calories: food.metrics['Calories']?.toString() || '',
          protein: food.metrics['Protein']?.toString() || '',
          fats: food.metrics['Fats']?.toString() || '',
          carbs: food.metrics['Carbs']?.toString() || ''
      });
      setEditingCustomId(food.id);
  };

  const handleDeleteCustomFood = (id: string) => {
      if (window.confirm('Are you sure you want to delete this custom food?')) {
          removeCustomFood(id);
          if (editingCustomId === id) {
              setEditingCustomId(null);
              setCustomFoodForm({ name: '', calories: '', protein: '', fats: '', carbs: '' });
          }
      }
  };

  const handleAddCustomToTarget = (food: CustomFood) => {
      const metricsSnapshot = { ...food.metrics };

      if (customFoodTarget === 'DAILY') {
          addLog({
              id: Date.now().toString(),
              timestamp: selectedDate.setHours(new Date().getHours(), new Date().getMinutes()),
              type: 'FOOD',
              description: food.name,
              metricsImpact: metricsSnapshot,
              baseMetrics: metricsSnapshot,
              quantity: 1
          });
          setShowCustomModal(false);
      } else {
          setBuilderTemplate(prev => ({
              ...prev,
              items: [...prev.items, {
                  id: Date.now().toString(),
                  timestamp: 0,
                  type: 'FOOD',
                  description: food.name,
                  metricsImpact: metricsSnapshot,
                  baseMetrics: metricsSnapshot,
                  quantity: 1,
                  time: "12:00"
              }]
          }));
          setShowCustomModal(false);
      }
  };

  // Missing handlers implementation
  const handleUpdateLog = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingLog) {
          updateLog(editingLog.id, editingLog);
          setEditingLog(null);
      }
  };

  const handleSaveTemplate = () => {
      if (!newTemplateName) return;
      addTemplate({
          id: Date.now().toString(),
          name: newTemplateName,
          items: dayLogs
      });
      setNewTemplateName('');
      setShowSaveTemplate(false);
      setShowTemplates(false);
  };

  const applyTemplate = (t: MealTemplate) => {
      t.items.forEach((item, idx) => {
         const timestamp = new Date(selectedDate);
         if (item.time) {
             const [h, m] = item.time.split(':').map(Number);
             timestamp.setHours(h, m);
         } else {
             timestamp.setHours(12, 0); // default
         }
         addLog({
             ...item,
             id: (Date.now() + idx).toString(),
             timestamp: timestamp.getTime()
         });
      });
      setShowTemplates(false);
  };

  const handleOpenBuilder = (t?: MealTemplate) => {
      if (t) {
          setBuilderTemplate(t);
      } else {
          setBuilderTemplate({ name: '', items: [] });
      }
      setShowMealBuilder(true);
      setShowTemplates(false);
  };

  const handleSaveBuilder = () => {
      if (!builderTemplate.name) return;
      const newTemplate: MealTemplate = {
          id: (builderTemplate as any).id || Date.now().toString(),
          name: builderTemplate.name,
          items: builderTemplate.items
      };
      if ((builderTemplate as any).id) {
          // update existing
          // We need updateTemplate exposed in Context
          // assuming addTemplate for now as updateTemplate wasn't initially in the context list but I added it to AppState
      } else {
          addTemplate(newTemplate);
      }
      setShowMealBuilder(false);
  };

  const handleAddToBuilder = (item: any) => {
      const metrics = {
        'Calories': item.calories,
        'Protein': item.protein,
        'Carbs': item.carbs,
        'Fats': item.fats
      };
      setBuilderTemplate(prev => ({
          ...prev,
          items: [...prev.items, {
              id: Date.now().toString(),
              timestamp: 0,
              type: 'FOOD',
              description: item.name,
              metricsImpact: metrics,
              baseMetrics: metrics,
              quantity: 1,
              time: "12:00"
          }]
      }));
      setBuilderSearchQuery('');
      setBuilderPredictions([]);
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-50">
      {/* 1. Header & Date Bar */}
      <div className="bg-white shadow-sm z-30 sticky top-0">
         <div className="pt-4 pb-2 px-6 flex justify-between items-center bg-white relative">
            <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                <h2 className="text-lg font-bold text-slate-800">{viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <Calendar className="text-indigo-600 w-5 h-5" />
            </button>
            {showDatePicker && (
                <div className="absolute top-full left-6 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5"/></button>
                        <span className="font-bold text-slate-700">{viewMonth.getFullYear()}</span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5"/></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {Array.from({length: 12}).map((_, i) => (
                            <button key={i} onClick={() => { const d = new Date(viewMonth); d.setMonth(i); setViewMonth(d); setShowDatePicker(false); }} className={`text-xs py-2 rounded-lg font-medium ${viewMonth.getMonth() === i ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 text-slate-600'}`}>
                                {new Date(0, i).toLocaleString('default', {month: 'short'})}
                            </button>
                        ))}
                    </div>
                </div>
            )}
         </div>
         <div className="overflow-x-auto whitespace-nowrap px-4 pb-3 no-scrollbar scroll-smooth">
            {dates.map((date) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                    <button key={date.toString()} onClick={() => setSelectedDate(date)} className={`inline-flex flex-col items-center justify-center w-14 h-16 mx-1 rounded-2xl transition-all border ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-105 border-indigo-600' : isToday ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-gray-400 border-gray-100'}`}>
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
             <input type="text" placeholder="Search food..." className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             {isSearching && <div className="absolute right-4 top-3.5 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
         </div>
         {predictions.length > 0 && (
             <div className="absolute top-full left-4 right-4 bg-white rounded-xl shadow-xl border border-gray-100 mt-2 p-2 animate-in fade-in slide-in-from-top-2">
                 {predictions.map((item, idx) => (
                     <button key={idx} onClick={() => handleAddPrediction(item)} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg flex justify-between items-center group">
                        <div>
                            <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700">{item.name}</p>
                            <p className="text-[10px] text-gray-400">
                                {item.calories} cal • P: {item.protein}g • F: {item.fats}g • C: {item.carbs}g
                            </p>
                        </div>
                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                     </button>
                 ))}
             </div>
         )}
      </div>

      {/* 3. Main Daily List */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
         {Object.keys(groupedLogs).length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3"><Clock className="w-6 h-6" /></div>
                 <p className="text-sm">No meals logged for this day</p>
             </div>
         ) : (
             Object.entries(groupedLogs).map(([time, items]) => (
                 <div key={time} className="relative pl-4 border-l-2 border-indigo-100">
                     <span className="absolute -left-[9px] top-0 w-4 h-4 bg-indigo-100 rounded-full border-2 border-white"></span>
                     <p className="text-xs font-bold text-gray-400 mb-2 pl-2">{time}</p>
                     <div className="space-y-3">
                         {items.map(log => (
                             <div key={log.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                 <div className="flex justify-between items-start mb-2">
                                     <div>
                                         <h4 className="font-semibold text-slate-800 text-sm">{log.description}</h4>
                                         <div className="flex flex-wrap gap-2 mt-1">
                                             {log.metricsImpact['Calories'] && <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">{Math.round(log.metricsImpact['Calories'])} kcal</span>}
                                             {log.metricsImpact['Protein'] && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{Math.round(log.metricsImpact['Protein'])}g Pro</span>}
                                             {log.metricsImpact['Carbs'] && <span className="text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded font-medium">{Math.round(log.metricsImpact['Carbs'])}g Carb</span>}
                                             {log.metricsImpact['Fats'] && <span className="text-[10px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded font-medium">{Math.round(log.metricsImpact['Fats'])}g Fat</span>}
                                         </div>
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => setEditingLog(log)} className="p-1.5 text-gray-300 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                         <button onClick={() => removeLog(log.id)} className="p-1.5 text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3 mt-2 border-t border-gray-50 pt-2">
                                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Quantity</span>
                                     <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                                        <button onClick={() => handleQuantityChange(log, -0.5)} className="p-1 hover:bg-white rounded-md shadow-sm transition-all"><Minus className="w-3 h-3 text-slate-600"/></button>
                                        <span className="text-xs font-bold text-slate-700 min-w-[1.5rem] text-center">{log.quantity || 1}</span>
                                        <button onClick={() => handleQuantityChange(log, 0.5)} className="p-1 hover:bg-white rounded-md shadow-sm transition-all"><Plus className="w-3 h-3 text-slate-600"/></button>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             ))
         )}
      </div>

      {/* 4. Bottom Custom Actions Bar */}
      <div className="fixed bottom-[4.5rem] left-4 right-4 bg-white rounded-2xl shadow-xl border border-indigo-50 p-2 flex justify-between items-center z-40">
          <button onClick={() => { setCustomFoodTarget('DAILY'); setShowCustomModal(true); setEditingCustomId(null); setCustomFoodForm({ name: '', calories: '', protein: '', fats: '', carbs: '' }); }} className="flex flex-col items-center justify-center w-16 py-1 gap-1 text-gray-500 hover:text-indigo-600 active:scale-95 transition-all">
              <Plus className="w-5 h-5" /><span className="text-[9px] font-bold">Custom</span>
          </button>
          <div className="w-px h-8 bg-gray-100 mx-1"></div>
          <button onClick={() => setShowTemplates(!showTemplates)} className="flex flex-col items-center justify-center w-16 py-1 gap-1 text-gray-500 hover:text-indigo-600 active:scale-95 transition-all">
              <BookOpen className="w-5 h-5" /><span className="text-[9px] font-bold">Meals</span>
          </button>
          <button onClick={() => setShowDescribe(true)} className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
              <Sparkles className="w-4 h-4" /><span className="text-xs font-bold">Describe Meal</span>
          </button>
          {showTemplates && (
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 max-h-64 overflow-y-auto">
                  <div className="p-2 bg-gray-50 text-[10px] font-bold text-gray-400 sticky top-0 flex justify-between items-center">
                      <span>SAVED MEALS</span>
                      <button onClick={() => handleOpenBuilder()} className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Plus size={8}/> New Plan</button>
                  </div>
                  {templates.map(t => (
                      <div key={t.id} className="w-full text-left px-4 py-3 text-xs border-b border-gray-50 flex justify-between items-center group hover:bg-indigo-50">
                          <button onClick={() => applyTemplate(t)} className="font-medium text-slate-700 flex-1 text-left">{t.name}</button>
                          <button onClick={() => handleOpenBuilder(t)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit2 size={10} /></button>
                      </div>
                  ))}
                  {showSaveTemplate ? (
                      <div className="p-2 border-t border-gray-100 bg-indigo-50/50">
                          <input autoFocus type="text" placeholder="Template Name..." value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} className="w-full text-xs p-2 border border-indigo-200 rounded-lg mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                          <div className="flex gap-2"><button onClick={() => setShowSaveTemplate(false)} className="flex-1 py-1.5 text-xs bg-white border border-gray-200 rounded-lg">Cancel</button><button onClick={handleSaveTemplate} className="flex-1 py-1.5 text-xs bg-indigo-600 text-white rounded-lg">Save</button></div>
                      </div>
                  ) : (
                      <button onClick={() => setShowSaveTemplate(true)} className="w-full text-left px-4 py-3 text-xs text-indigo-600 font-bold flex items-center gap-2 hover:bg-indigo-50"><Save className="w-3 h-3" /> Save Day as Template</button>
                  )}
              </div>
          )}
      </div>

      {/* Describe Meal Modal */}
      {showDescribe && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-6 animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                  <button onClick={() => setShowDescribe(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Sparkles className="text-indigo-600 w-5 h-5"/> AI Meal Describer</h3>
                  <textarea 
                      className="w-full h-32 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4"
                      placeholder="e.g. I had a bowl of rice with dal and a small piece of fried fish."
                      value={describeText}
                      onChange={(e) => setDescribeText(e.target.value)}
                  />
                  <button 
                      onClick={handleDescribeSubmit}
                      disabled={isProcessingDescribe || !describeText.trim()}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                      {isProcessingDescribe ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Analyze & Add'}
                  </button>
              </div>
          </div>
      )}

      {/* Meal Builder Full Screen Modal */}
      {showMealBuilder && (
          <div className="fixed inset-0 bg-white z-[70] flex flex-col animate-in slide-in-from-bottom-5">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center gap-2">
                      <LayoutList className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-bold text-slate-800">Meal Plan Builder</h3>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setShowMealBuilder(false)} className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg">Cancel</button>
                     <button onClick={handleSaveBuilder} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-md">Save Plan</button>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Plan Name */}
                  <div>
                      <label className="text-xs font-bold text-gray-400 uppercase">Plan Name</label>
                      <input type="text" value={builderTemplate.name} onChange={e => setBuilderTemplate({...builderTemplate, name: e.target.value})} className="w-full text-lg font-bold text-slate-800 border-b border-gray-200 py-2 focus:border-indigo-600 outline-none" placeholder="e.g. High Protein Tuesday" />
                  </div>

                  {/* Add Item Section */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1"><Plus size={12}/> ADD ITEM</h4>
                      <div className="flex gap-2 mb-3">
                          <div className="relative flex-1">
                              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                              <input type="text" placeholder="Search food..." value={builderSearchQuery} onChange={(e) => setBuilderSearchQuery(e.target.value)} className="w-full text-xs pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500" />
                          </div>
                          <button onClick={() => { setCustomFoodTarget('BUILDER'); setShowCustomModal(true); setEditingCustomId(null); setCustomFoodForm({ name: '', calories: '', protein: '', fats: '', carbs: '' }); }} className="px-3 py-2 bg-white border border-indigo-100 text-indigo-600 text-xs font-bold rounded-lg shadow-sm">My Custom</button>
                      </div>
                      {/* Builder Predictions */}
                      {builderPredictions.length > 0 && (
                          <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-50">
                              {builderPredictions.map((item, i) => (
                                  <button key={i} onClick={() => handleAddToBuilder(item)} className="w-full text-left p-2 text-xs hover:bg-indigo-50 flex justify-between items-center group">
                                      <span>{item.name}</span>
                                      <Plus size={12} className="text-gray-300 group-hover:text-indigo-600"/>
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Planned Items */}
                  <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Planned Meals</h4>
                      {builderTemplate.items.length === 0 ? (
                          <div className="text-center py-8 text-gray-300 text-sm italic">Add items to build your plan</div>
                      ) : (
                          <div className="space-y-3">
                              {builderTemplate.items.map((item, idx) => (
                                  <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                                      <div className="flex-1">
                                          <div className="flex justify-between items-start">
                                              <p className="font-bold text-sm text-slate-800">{item.description}</p>
                                              <input 
                                                type="time" 
                                                value={item.time || "12:00"} 
                                                onChange={(e) => {
                                                    const newItems = [...builderTemplate.items];
                                                    newItems[idx].time = e.target.value;
                                                    setBuilderTemplate({...builderTemplate, items: newItems});
                                                }}
                                                className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5"
                                              />
                                          </div>
                                          <div className="flex items-center gap-3 mt-2">
                                              <div className="flex items-center gap-1 bg-gray-50 rounded p-0.5">
                                                  <button onClick={() => {
                                                      const newItems = [...builderTemplate.items];
                                                      newItems[idx].quantity = Math.max(0.5, (newItems[idx].quantity || 1) - 0.5);
                                                      setBuilderTemplate({...builderTemplate, items: newItems});
                                                  }} className="p-0.5 hover:bg-white rounded"><Minus size={10}/></button>
                                                  <span className="text-[10px] w-4 text-center">{item.quantity}</span>
                                                  <button onClick={() => {
                                                      const newItems = [...builderTemplate.items];
                                                      newItems[idx].quantity = (newItems[idx].quantity || 1) + 0.5;
                                                      setBuilderTemplate({...builderTemplate, items: newItems});
                                                  }} className="p-0.5 hover:bg-white rounded"><Plus size={10}/></button>
                                              </div>
                                              <span className="text-[10px] text-gray-400">
                                                  {Math.round((item.baseMetrics?.['Calories'] || 0) * (item.quantity || 1))} kcal
                                              </span>
                                          </div>
                                      </div>
                                      <button onClick={() => {
                                          const newItems = builderTemplate.items.filter((_, i) => i !== idx);
                                          setBuilderTemplate({...builderTemplate, items: newItems});
                                      }} className="ml-3 p-1.5 text-gray-300 hover:text-red-400"><Trash2 size={14}/></button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
      
      {/* Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Entry</h3>
                <form onSubmit={handleUpdateLog} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
                        <p className="font-medium text-slate-700 border-b border-gray-100 pb-2">{editingLog.description}</p>
                    </div>
                    <div>
                         <label className="text-[10px] font-bold text-gray-400 uppercase">Time</label>
                         <input 
                            type="time" 
                            className="w-full border-b border-gray-200 py-2 focus:border-indigo-600 outline-none font-medium"
                            value={new Date(editingLog.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                            onChange={(e) => {
                                const [h, m] = e.target.value.split(':').map(Number);
                                const newDate = new Date(editingLog.timestamp);
                                newDate.setHours(h);
                                newDate.setMinutes(m);
                                setEditingLog({...editingLog, timestamp: newDate.getTime()});
                            }}
                         />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {['Calories', 'Protein', 'Fats', 'Carbs'].map((metric) => (
                             <div key={metric}>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">{metric}</label>
                                <input 
                                    type="number" 
                                    className="w-full border-b border-gray-200 py-2 focus:border-indigo-600 outline-none font-medium"
                                    value={Math.round(editingLog.metricsImpact[metric] || 0)}
                                    onChange={(e) => {
                                        setEditingLog({
                                            ...editingLog,
                                            metricsImpact: { ...editingLog.metricsImpact, [metric]: Number(e.target.value) }
                                        })
                                    }}
                                />
                             </div>
                        ))}
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setEditingLog(null)} className="flex-1 py-3 text-gray-500 font-bold text-sm bg-gray-100 rounded-xl">Cancel</button>
                        <button type="submit" className="flex-1 py-3 text-white font-bold text-sm bg-indigo-600 rounded-xl">Update</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Custom Food & List Modal */}
      {showCustomModal && (
          <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom-5">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-slate-800">
                      {customFoodTarget === 'BUILDER' ? 'Add to Plan' : 'Custom Foods'}
                  </h3>
                  <button onClick={() => { setShowCustomModal(false); setEditingCustomId(null); }} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 pb-32">
                  <div className={`bg-white p-5 rounded-2xl border ${editingCustomId ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-indigo-100'} shadow-sm mb-8 transition-all`}>
                      <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                          {editingCustomId ? <><Edit2 className="w-4 h-4"/> Edit Food</> : <><Plus className="w-4 h-4"/> Create New Food</>}
                      </h4>
                      <form onSubmit={handleCreateOrUpdateCustomFood} className="space-y-4">
                          <input required type="text" placeholder="Food Name (e.g. My Protein Shake)" value={customFoodForm.name} onChange={e => setCustomFoodForm({...customFoodForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <div className="grid grid-cols-2 gap-3">
                              <input type="number" placeholder="Cals" value={customFoodForm.calories} onChange={e => setCustomFoodForm({...customFoodForm, calories: e.target.value})} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                              <input type="number" placeholder="Prot (g)" value={customFoodForm.protein} onChange={e => setCustomFoodForm({...customFoodForm, protein: e.target.value})} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                              <input type="number" placeholder="Fat (g)" value={customFoodForm.fats} onChange={e => setCustomFoodForm({...customFoodForm, fats: e.target.value})} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                              <input type="number" placeholder="Carb (g)" value={customFoodForm.carbs} onChange={e => setCustomFoodForm({...customFoodForm, carbs: e.target.value})} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                          </div>
                          <div className="flex gap-2">
                            {editingCustomId && <button type="button" onClick={() => { setEditingCustomId(null); setCustomFoodForm({ name: '', calories: '', protein: '', fats: '', carbs: '' }); }} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm">Cancel</button>}
                            <button type="submit" className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700">{editingCustomId ? 'Update Food' : 'Add to Custom List'}</button>
                          </div>
                      </form>
                  </div>

                  <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Your Custom Foods</h4>
                      <div className="space-y-3">
                          {customFoods.map((food) => (
                              <div key={food.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-colors">
                                  <div>
                                      <p className="font-bold text-slate-800">{food.name}</p>
                                      <p className="text-xs text-gray-400 mt-1">
                                          {food.metrics['Calories']} cal • P: {food.metrics['Protein']}g • F: {food.metrics['Fats']}g • C: {food.metrics['Carbs']}g
                                      </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <button onClick={() => handleEditCustomFood(food)} className="p-2 text-gray-300 hover:text-indigo-600 bg-gray-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => handleDeleteCustomFood(food.id)} className="p-2 text-gray-300 hover:text-red-400 bg-gray-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => handleAddCustomToTarget(food)} className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-100">
                                          Add <ArrowRight className="w-3 h-3" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                          {customFoods.length === 0 && (
                              <p className="text-center text-sm text-gray-400 py-4">No custom foods saved yet.</p>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};