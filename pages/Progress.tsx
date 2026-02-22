import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  Area
} from 'recharts';
import { useApp } from '../context/AppContext';
import { CalendarRange, Activity, TrendingUp } from 'lucide-react';

type Timeframe = '1W' | '1M' | '6M' | '1Y';

export const Progress: React.FC = () => {
  const { logs, metrics, user } = useApp();
  const [period, setPeriod] = useState<Timeframe>('1W');

  // --- 1. Data Processing Logic ---
  const chartData = useMemo(() => {
    const today = new Date();
    const dataPoints: any[] = [];
    let daysToSubtract = 7;

    if (period === '1M') daysToSubtract = 30;
    if (period === '6M') daysToSubtract = 180;
    if (period === '1Y') daysToSubtract = 365;

    // Get Goal Values
    const calGoal = metrics.find(m => m.name === 'Calories')?.required || 2000;
    const weightBaseline = metrics.find(m => m.name === 'Weight')?.baseline || 75;
    
    // Simulate Weight Trend based on Caloric Deficit/Surplus (3500kcal = ~0.45kg)
    // This creates a "Live" weight trend from data instead of static logs
    let currentSimulatedWeight = weightBaseline;

    for (let i = daysToSubtract; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = d.toDateString();
      const displayDate = d.toLocaleDateString('en-US', { 
        month: period === '1Y' ? 'short' : 'numeric', 
        day: 'numeric' 
      });

      // Filter logs for this specific day
      const dayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === dateKey);

      // Aggregation: Sum impacts. Activities are negative, Food is positive.
      // Math: Net = Sum(Food) + Sum(Activities [negative])
      const stats = dayLogs.reduce((acc, log) => {
        const qty = log.quantity || 1;
        // Check if log has specific activity details for more accurate sets/reps calc
        let multiplier = qty;
        if (log.type === 'ACTIVITY' && log.activityDetails) {
            // Logic handled in updateLog, metricsImpact is already total for the entry
            multiplier = 1; 
        }

        return {
          Calories: acc.Calories + (log.metricsImpact['Calories'] || 0) * multiplier,
          Protein: acc.Protein + (log.metricsImpact['Protein'] || 0) * multiplier,
          Fats: acc.Fats + (log.metricsImpact['Fats'] || 0) * multiplier,
          Carbs: acc.Carbs + (log.metricsImpact['Carbs'] || 0) * multiplier,
        };
      }, { Calories: 0, Protein: 0, Fats: 0, Carbs: 0 });

      // Calculate Weight Change for this day: (Net - Goal) / 7700 kcal per kg approx
      // If Net Calories is 0 (no logs), assume Maintenance (Goal) for smooth chart
      const netForWeight = stats.Calories === 0 ? calGoal : stats.Calories;
      const weightChange = (netForWeight - calGoal) / 7700;
      currentSimulatedWeight += weightChange;

      dataPoints.push({
        name: displayDate,
        fullDate: dateKey,
        NetCalories: Math.round(Math.max(0, stats.Calories)), // Show 0 if negative for bar chart visuals
        Protein: Math.round(Math.max(0, stats.Protein)),
        Fats: Math.round(Math.max(0, stats.Fats)),
        Carbs: Math.round(Math.max(0, stats.Carbs)),
        WeightTrend: Number(currentSimulatedWeight.toFixed(2)),
        CalorieGoal: calGoal
      });
    }
    return dataPoints;
  }, [logs, period, metrics]);

  // --- 2. Custom Tooltip Component ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-xs">
          <p className="font-bold text-slate-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-gray-500 capitalize">{entry.name}:</span>
              <span className="font-bold text-slate-700">
                {entry.value} {entry.name === 'WeightTrend' ? 'kg' : (entry.name === 'NetCalories' || entry.name === 'CalorieGoal' ? 'kcal' : 'g')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 pb-24 space-y-8 bg-slate-50 min-h-screen">
      
      {/* 1. Header & Timeframe Selection */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-indigo-600"/> Health Analytics
        </h1>
        <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 flex justify-between">
          {(['1W', '1M', '6M', '1Y'] as Timeframe[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                period === p 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-slate-600'
              }`}
            >
              {p === '1W' ? '1 Week' : p === '1M' ? '1 Month' : p === '6M' ? '6 Months' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Energy Balance Chart */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-orange-500"/> Energy Balance
            </h3>
            <p className="text-xs text-gray-400">Net Calories (Food - Activity) vs Goal</p>
        </div>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        dy={10}
                        interval={period === '1W' ? 0 : 'preserveStartEnd'}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <ReferenceLine y={chartData[0]?.CalorieGoal} stroke="#6366f1" strokeDasharray="3 3" />
                    <Bar dataKey="NetCalories" barSize={12} fill="url(#colorCal)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="CalorieGoal" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={false}/>
                </ComposedChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Macronutrient Breakdown */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-emerald-500"/> Macro Composition
            </h3>
            <p className="text-xs text-gray-400">Daily Net Intake Breakdown</p>
        </div>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} stackOffset="sign">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        dy={10}
                        interval={period === '1W' ? 0 : 'preserveStartEnd'}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                    <Bar dataKey="Protein" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Carbs" stackId="a" fill="#eab308" />
                    <Bar dataKey="Fats" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Weight Trend (Calculated) */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600"/> Projected Weight
            </h3>
            <p className="text-xs text-gray-400">Trend based on Net Caloric Surplus/Deficit</p>
        </div>
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        dy={10}
                        interval={period === '1W' ? 0 : 'preserveStartEnd'}
                    />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="WeightTrend" stroke="#6366f1" strokeWidth={3} dot={period === '1W'} activeDot={{r: 6}} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};