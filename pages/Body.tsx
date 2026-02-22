import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Activity, Bone, Zap, Dumbbell, Droplets, TrendingUp, TrendingDown, Info } from 'lucide-react';

// --- Local Data Definitions for Prototype ---
const BODY_DATA = {
  SKIN: {
    icon: Droplets,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    categories: {
      Overall: [
        { name: 'Hydration', actual: 45, required: 50, unit: '%' },
        { name: 'Sebum Production', actual: 120, required: 100, unit: 'µg/cm²' },
        { name: 'Temperature', actual: 36.5, required: 37, unit: '°C' },
        { name: 'Elasticity Score', actual: 72, required: 85, unit: '/100' }
      ],
      Macros: [
        { name: 'Protein (Collagen)', actual: 45, required: 55, unit: 'g' },
        { name: 'Healthy Fats', actual: 22, required: 30, unit: 'g' },
        { name: 'Carbs', actual: 150, required: 130, unit: 'g' }
      ],
      Micros: [
        { name: 'Vitamin A', actual: 700, required: 900, unit: 'µg' },
        { name: 'Vitamin C', actual: 65, required: 90, unit: 'mg' },
        { name: 'Vitamin D', actual: 28, required: 40, unit: 'ng/mL' },
        { name: 'Vitamin E', actual: 12, required: 15, unit: 'mg' },
        { name: 'Zinc', actual: 9, required: 11, unit: 'mg' },
        { name: 'Silicon', actual: 15, required: 25, unit: 'mg' }
      ]
    }
  },
  MUSCLE: {
    icon: Dumbbell,
    color: 'text-red-500',
    bg: 'bg-red-50',
    categories: {
      Overall: [
        { name: 'Muscle Mass', actual: 32, required: 35, unit: 'kg' },
        { name: 'Strength Index', actual: 110, required: 120, unit: 'pts' },
        { name: 'Range of Motion', actual: 85, required: 95, unit: '%' }
      ],
      Macros: [
        { name: 'Protein', actual: 1.2, required: 1.6, unit: 'g/kg' },
        { name: 'Carbs (Glycogen)', actual: 200, required: 250, unit: 'g' },
        { name: 'Fats', actual: 60, required: 70, unit: 'g' }
      ],
      Micros: [
        { name: 'Magnesium', actual: 300, required: 420, unit: 'mg' },
        { name: 'Potassium', actual: 3.5, required: 4.7, unit: 'g' },
        { name: 'Calcium', actual: 900, required: 1000, unit: 'mg' },
        { name: 'Vitamin D', actual: 28, required: 40, unit: 'ng/mL' }
      ]
    }
  },
  NERVES: {
    icon: Zap,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    categories: {
      Overall: [
        { name: 'Reflex Speed', actual: 220, required: 200, unit: 'ms' },
        { name: 'NCV Score', actual: 52, required: 60, unit: 'm/s' },
        { name: 'HRV (Autonomic)', actual: 45, required: 60, unit: 'ms' }
      ],
      Macros: [
        { name: 'Fats (Myelin)', actual: 55, required: 65, unit: 'g' },
        { name: 'Protein', actual: 50, required: 60, unit: 'g' },
        { name: 'Carbs (Glucose)', actual: 120, required: 130, unit: 'g' }
      ],
      Micros: [
        { name: 'Vitamin B12', actual: 400, required: 500, unit: 'pg/mL' },
        { name: 'Vitamin B1', actual: 1.0, required: 1.2, unit: 'mg' },
        { name: 'Vitamin B6', actual: 1.5, required: 1.7, unit: 'mg' },
        { name: 'Copper', actual: 0.8, required: 0.9, unit: 'mg' }
      ]
    }
  },
  BONES: {
    icon: Bone,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    categories: {
      Overall: [
        { name: 'Bone Mineral Density', actual: -0.5, required: 0, unit: 'T-score' },
        { name: 'Fracture Risk', actual: 2, required: 1, unit: '%' }
      ],
      Macros: [
        { name: 'Protein', actual: 55, required: 70, unit: 'g' },
        { name: 'Fats', actual: 40, required: 50, unit: 'g' }
      ],
      Micros: [
        { name: 'Calcium', actual: 850, required: 1200, unit: 'mg' },
        { name: 'Vitamin D', actual: 28, required: 50, unit: 'ng/mL' },
        { name: 'Vitamin K2', actual: 80, required: 120, unit: 'µg' },
        { name: 'Phosphorus', actual: 600, required: 700, unit: 'mg' },
        { name: 'Magnesium', actual: 310, required: 400, unit: 'mg' }
      ]
    }
  }
};

type SystemKey = keyof typeof BODY_DATA;

// --- Modular Components ---

const MetricRow: React.FC<{ item: any }> = ({ item }) => {
  const percentage = Math.min((item.actual / item.required) * 100, 100);
  const isLow = percentage < 85;
  const isHigh = percentage > 115; // Optional logic for high values
  
  return (
    <div className="flex flex-col py-3 border-b border-gray-50 last:border-0">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-medium text-slate-700">{item.name}</span>
        <div className="flex items-center gap-1">
            <span className={`text-sm font-bold ${isLow ? 'text-red-500' : 'text-slate-700'}`}>
                {item.actual}
            </span>
            <span className="text-xs text-gray-400">/ {item.required} {item.unit}</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden flex">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-400' : 'bg-green-500'}`} 
            style={{ width: `${percentage}%` }}
          />
      </div>
    </div>
  );
};

export const Body: React.FC = () => {
  const { user } = useApp();
  const [activeSystem, setActiveSystem] = useState<SystemKey>('SKIN');

  const currentSystemData = BODY_DATA[activeSystem];

  return (
    <div className="p-6 pb-24">
      {/* 1. Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Body Architecture</h1>
        <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Cycle {user.currentCycleYear}/5</span>
            <p className="text-xs text-gray-400">Baseline (Age {user.cycleStartAge}) vs Actual (Age {user.age})</p>
        </div>
      </div>

      {/* 2. System Selector (Tabs) */}
      <div className="flex p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto no-scrollbar">
        {(Object.keys(BODY_DATA) as SystemKey[]).map((sys) => {
           const Config = BODY_DATA[sys];
           const isActive = activeSystem === sys;
           return (
             <button
               key={sys}
               onClick={() => setActiveSystem(sys)}
               className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all min-w-[4.5rem] ${
                 isActive ? 'bg-white shadow-sm' : 'hover:bg-gray-200/50'
               }`}
             >
               <Config.icon size={20} className={`mb-1 ${isActive ? Config.color : 'text-gray-400'}`} />
               <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-slate-800' : 'text-gray-400'}`}>
                 {sys}
               </span>
             </button>
           )
        })}
      </div>

      {/* 3. System Analysis Content */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Overall Section */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity size={14}/> Overall Health
             </h3>
             <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                 {currentSystemData.categories.Overall.map((item, i) => (
                     <div key={i} className="mb-2">
                        <p className="text-xs text-gray-500 mb-0.5">{item.name}</p>
                        <p className="font-bold text-slate-800 text-lg flex items-baseline gap-1">
                            {item.actual} <span className="text-[10px] font-normal text-gray-400">{item.unit}</span>
                        </p>
                        {item.actual < item.required && <p className="text-[9px] text-red-400 flex items-center gap-0.5"><TrendingDown size={8}/> Below Target</p>}
                     </div>
                 ))}
             </div>
          </div>

          {/* Macros Section */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Required Macros</h3>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Daily Avg</span>
             </div>
             <div>
                 {currentSystemData.categories.Macros.map((item, i) => (
                     <MetricRow key={i} item={item} />
                 ))}
             </div>
          </div>

          {/* Micros Section */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Essential Micros</h3>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Blood Levels</span>
             </div>
             <div>
                 {currentSystemData.categories.Micros.map((item, i) => (
                     <MetricRow key={i} item={item} />
                 ))}
             </div>
          </div>

          {/* AI Insight Box */}
          <div className={`rounded-xl p-4 border flex gap-3 ${currentSystemData.bg} border-${currentSystemData.color.split('-')[1]}-100`}>
              <Info className={`w-5 h-5 flex-shrink-0 ${currentSystemData.color}`} />
              <div>
                  <h4 className={`text-xs font-bold ${currentSystemData.color} mb-1`}>AI Assessment</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                      Your {activeSystem.toLowerCase()} health shows a deviation in micronutrient absorption. 
                      Consider increasing intake of specific vitamins shown in red above to match your age cycle requirements.
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};