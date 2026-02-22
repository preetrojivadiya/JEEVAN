import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, UserProfile, Metric, LogEntry, MealTemplate, WorkoutTemplate, CustomFood, HealthRecords } from '../types';
import { INITIAL_USER, INITIAL_METRICS } from '../constants';

const INITIAL_RECORDS: HealthRecords = {
  nutrients: {
    macros: { carbs: 0, protein: 0, fats: 0 },
    vitamins: { A: 0, D: 0, E: 0, K: 0, B1: 0, B2: 0, B3: 0, B5: 0, B6: 0, B7: 0, B9: 0, B12: 0, C: 0 },
    minerals: { Calcium: 0, Chloride: 0, Magnesium: 0, Phosphorus: 0, Potassium: 0, Sodium: 0, Chromium: 0, Copper: 0, Fluoride: 0, Iodine: 0, Iron: 0, Manganese: 0, Molybdenum: 0, Selenium: 0, Zinc: 0 }
  },
  organs: {
    eyes: { leftFar: 0, rightFar: 0, leftClose: 0, rightClose: 0 },
    heart: { bpSystolic: 120, bpDiastolic: 80, cholesterol: 0, bmi: 0 },
    lungs: { fvc: 0, fev1: 0, lungVolume: 0, pef: 0 },
    liver: { alt: 0, ast: 0, alp: 0, ggt: 0, bilirubin: 0 }
  },
  other: {
    bio: { age: INITIAL_USER.age, weight: 75, height: 175 },
    environment: { location: '', aqi: 0, temperature: 0, uvLevel: 0 }
  }
};

const AppContext = createContext<AppState | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecords>(INITIAL_RECORDS);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const recalculateMetrics = (currentLogs: LogEntry[]) => {
    // Basic aggregation for current day
    const dateStr = selectedDate.toDateString();
    const todaysLogs = currentLogs.filter(l => new Date(l.timestamp).toDateString() === dateStr);
    
    setMetrics((prevMetrics) => {
      return prevMetrics.map((m) => {
        if (m.category === 'Macro') {
            const totalImpact = todaysLogs.reduce((sum, log) => {
                // For activities, metricsImpact is negative, so this naturally deducts
                return sum + ((log.metricsImpact[m.name] || 0) * (log.quantity || 1));
             }, 0);
            return { ...m, actual: totalImpact };
        }
        return m;
      });
    });
  };

  const updateMetricGoal = (name: string, value: number) => {
      setMetrics(prev => prev.map(m => m.name === name ? { ...m, required: value } : m));
  };

  const addLog = (log: LogEntry) => {
    setLogs(prev => {
        const newLogs = [log, ...prev];
        recalculateMetrics(newLogs);
        return newLogs;
    });
  };

  const updateLog = (id: string, updates: Partial<LogEntry>) => {
    setLogs(prev => {
        const newLogs = prev.map(log => log.id === id ? { ...log, ...updates } : log);
        recalculateMetrics(newLogs);
        return newLogs;
    });
  };

  const removeLog = (id: string) => {
    setLogs(prev => {
        const newLogs = prev.filter(log => log.id !== id);
        recalculateMetrics(newLogs);
        return newLogs;
    });
  };

  const addTemplate = (template: MealTemplate) => {
    setTemplates(prev => [template, ...prev]);
  };

  const updateTemplate = (id: string, template: MealTemplate) => {
    setTemplates(prev => prev.map(t => t.id === id ? template : t));
  };

  const addWorkoutTemplate = (template: WorkoutTemplate) => {
    setWorkoutTemplates(prev => [template, ...prev]);
  };

  const removeWorkoutTemplate = (id: string) => {
    setWorkoutTemplates(prev => prev.filter(t => t.id !== id));
  };

  const addCustomFood = (food: CustomFood) => {
      setCustomFoods(prev => [food, ...prev]);
  };

  const updateCustomFood = (id: string, updatedFood: CustomFood) => {
      setCustomFoods(prev => prev.map(f => f.id === id ? updatedFood : f));
  };

  const removeCustomFood = (id: string) => {
      setCustomFoods(prev => prev.filter(f => f.id !== id));
  };

  const updateHealthRecords = (newRecords: Partial<HealthRecords>) => {
      setHealthRecords(prev => ({
          ...prev,
          ...newRecords,
          // Deep merge for nested objects if needed, simplified here
          nutrients: { ...prev.nutrients, ...(newRecords.nutrients || {}) },
          organs: { ...prev.organs, ...(newRecords.organs || {}) },
          other: { ...prev.other, ...(newRecords.other || {}) }
      }));
  };

  const updateMetrics = (newMetrics: Metric[]) => {
    setMetrics(newMetrics);
  };

  const switchUser = (newUser: UserProfile) => {
    setUser(newUser);
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const logout = () => {
    // Simulating logout by reloading to reset state
    window.location.reload();
  };

  return (
    <AppContext.Provider value={{ 
        user, metrics, logs, templates, workoutTemplates, customFoods, healthRecords, selectedDate, setSelectedDate,
        addLog, updateLog, removeLog, addTemplate, updateTemplate, 
        addWorkoutTemplate, removeWorkoutTemplate,
        addCustomFood, updateCustomFood, removeCustomFood,
        updateHealthRecords,
        updateMetrics, updateMetricGoal, switchUser,
        updateUserProfile, logout
    }}>
      {children}
    </AppContext.Provider>
  );
};