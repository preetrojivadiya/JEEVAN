import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MOCK_USERS } from '../constants';
import { parseMedicalReport } from '../services/geminiService';
import { 
  FileText, 
  Settings, 
  ShieldCheck, 
  Users, 
  ChevronDown, 
  Plus, 
  Download, 
  Upload, 
  Activity, 
  User,
  ArrowLeft,
  Save,
  Camera,
  Heart,
  Eye,
  Wind,
  Droplet,
  LogOut
} from 'lucide-react';

// --- Sub-Components ---
const PersonalDetailsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { user, updateUserProfile } = useApp();
    const [formData, setFormData] = useState({
        name: user.name,
        mobile: user.mobile || '',
        email: user.email || '',
        birthDate: user.birthDate || ''
    });

    const handleSave = () => {
        let updates: any = { ...formData };
        
        if (formData.birthDate) {
            const birthDate = new Date(formData.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            // Update age and cycle info based on birth date
            updates.age = age;
            updates.cycleStartAge = Math.floor(age / 5) * 5;
            updates.cycleEndAge = updates.cycleStartAge + 5;
            updates.currentCycleYear = (age % 5) + 1;
        }

        updateUserProfile(updates);
        onBack();
    };

    return (
        <div className="flex flex-col h-full bg-white absolute inset-0 z-50 overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-white sticky top-0 z-10">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-slate-600"/></button>
                <h2 className="text-lg font-bold text-slate-800">Personal Details</h2>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number</label>
                    <input 
                        type="tel" 
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                    <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Birth Date</label>
                    <input 
                        type="date" 
                        value={formData.birthDate}
                        onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-400">Used for 5-year cycle calculations.</p>
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all mt-8"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

const SettingsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { logout } = useApp();

    return (
        <div className="flex flex-col h-full bg-white absolute inset-0 z-50 overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-white sticky top-0 z-10">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-slate-600"/></button>
                <h2 className="text-lg font-bold text-slate-800">Settings</h2>
            </div>
            
            <div className="p-6 flex flex-col h-[calc(100%-60px)]">
                <div className="flex-1">
                    {/* Placeholder for other settings */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center text-gray-400 text-sm">
                        More settings coming soon...
                    </div>
                </div>

                <button 
                    onClick={logout}
                    className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl border border-red-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                    <LogOut size={20} />
                    Log Out
                </button>
            </div>
        </div>
    );
};

const InputField = ({ label, value, unit, onChange }: { label: string, value: any, unit?: string, onChange: (val: string) => void }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase font-bold text-gray-400">{label}</label>
        <div className="relative">
            <input 
                type="number" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none" 
            />
            {unit && <span className="absolute right-3 top-2 text-xs text-gray-400 font-medium">{unit}</span>}
        </div>
    </div>
);

const HealthRecordsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { healthRecords, updateHealthRecords } = useApp();
    const [activeTab, setActiveTab] = useState<'NUTRIENTS' | 'ORGANS' | 'OTHER'>('NUTRIENTS');
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helpers to update nested state safely
    const updateNutrient = (type: 'vitamins' | 'minerals', key: string, val: string) => {
        updateHealthRecords({
            nutrients: {
                ...healthRecords.nutrients,
                [type]: { ...healthRecords.nutrients[type], [key]: Number(val) }
            }
        });
    };

    const updateOrgan = (organ: keyof typeof healthRecords.organs, key: string, val: string) => {
        updateHealthRecords({
            organs: {
                ...healthRecords.organs,
                [organ]: { ...healthRecords.organs[organ], [key]: Number(val) }
            }
        });
    };
    
    const updateOther = (category: keyof typeof healthRecords.other, key: string, val: string) => {
        updateHealthRecords({
             other: {
                 ...healthRecords.other,
                 [category]: { ...healthRecords.other[category], [key]: category === 'environment' && key === 'location' ? val : Number(val) }
             }
        });
    };

    const handleScanReport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        const data = await parseMedicalReport(file);
        if (data) {
            // Merge logic (simplified)
            updateHealthRecords({
                nutrients: { ...healthRecords.nutrients, ...data.nutrients },
                organs: { ...healthRecords.organs, ...data.organs },
                other: { ...healthRecords.other, ...data.other }
            });
            alert("Report analyzed! Values updated.");
        } else {
            alert("Could not analyze report.");
        }
        setIsScanning(false);
    };

    return (
        <div className="flex flex-col h-full bg-white absolute inset-0 z-50 overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-slate-600"/></button>
                    <h2 className="text-lg font-bold text-slate-800">Health Records</h2>
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScanReport} />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100">
                        {isScanning ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <Camera size={16} />}
                        {isScanning ? 'Scanning...' : 'AI Scan'}
                    </button>
                    <button onClick={onBack} className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md">
                        <Save size={16} /> Save
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-4 gap-2 border-b border-gray-50 bg-gray-50/50">
                {['NUTRIENTS', 'ORGANS', 'OTHER'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6 space-y-8 pb-24">
                
                {activeTab === 'NUTRIENTS' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={18} className="text-orange-500"/> Macronutrients</h3>
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <InputField label="Carbs" unit="g" value={healthRecords.nutrients.macros.carbs} onChange={(v) => updateHealthRecords({ nutrients: { ...healthRecords.nutrients, macros: { ...healthRecords.nutrients.macros, carbs: Number(v) } } })} />
                            <InputField label="Protein" unit="g" value={healthRecords.nutrients.macros.protein} onChange={(v) => updateHealthRecords({ nutrients: { ...healthRecords.nutrients, macros: { ...healthRecords.nutrients.macros, protein: Number(v) } } })} />
                            <InputField label="Fats" unit="g" value={healthRecords.nutrients.macros.fats} onChange={(v) => updateHealthRecords({ nutrients: { ...healthRecords.nutrients, macros: { ...healthRecords.nutrients.macros, fats: Number(v) } } })} />
                        </div>

                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500"/> Vitamins</h3>
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {Object.entries(healthRecords.nutrients.vitamins).map(([key, val]) => (
                                <InputField key={key} label={`Vit ${key}`} unit={['A','D','E'].includes(key) ? 'IU' : 'mg'} value={val} onChange={(v) => updateNutrient('vitamins', key, v)} />
                            ))}
                        </div>

                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings size={18} className="text-slate-500"/> Minerals</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries(healthRecords.nutrients.minerals).map(([key, val]) => (
                                <InputField key={key} label={key} unit="mg" value={val} onChange={(v) => updateNutrient('minerals', key, v)} />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'ORGANS' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
                        {/* Eyes */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Eye size={16} className="text-blue-500"/> Eyes (Prescription)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-400 text-center">LEFT</p>
                                    <InputField label="Far" value={healthRecords.organs.eyes.leftFar} onChange={(v) => updateOrgan('eyes', 'leftFar', v)}/>
                                    <InputField label="Close" value={healthRecords.organs.eyes.leftClose} onChange={(v) => updateOrgan('eyes', 'leftClose', v)}/>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-400 text-center">RIGHT</p>
                                    <InputField label="Far" value={healthRecords.organs.eyes.rightFar} onChange={(v) => updateOrgan('eyes', 'rightFar', v)}/>
                                    <InputField label="Close" value={healthRecords.organs.eyes.rightClose} onChange={(v) => updateOrgan('eyes', 'rightClose', v)}/>
                                </div>
                            </div>
                        </div>

                        {/* Heart */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Heart size={16} className="text-red-500"/> Heart</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="BP Systolic" unit="mmHg" value={healthRecords.organs.heart.bpSystolic} onChange={(v) => updateOrgan('heart', 'bpSystolic', v)}/>
                                <InputField label="BP Diastolic" unit="mmHg" value={healthRecords.organs.heart.bpDiastolic} onChange={(v) => updateOrgan('heart', 'bpDiastolic', v)}/>
                                <InputField label="Cholesterol" unit="mg/dL" value={healthRecords.organs.heart.cholesterol} onChange={(v) => updateOrgan('heart', 'cholesterol', v)}/>
                                <InputField label="BMI" value={healthRecords.organs.heart.bmi} onChange={(v) => updateOrgan('heart', 'bmi', v)}/>
                            </div>
                        </div>

                        {/* Lungs */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Wind size={16} className="text-cyan-500"/> Lungs</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="FVC" unit="L" value={healthRecords.organs.lungs.fvc} onChange={(v) => updateOrgan('lungs', 'fvc', v)}/>
                                <InputField label="FEV1" unit="L" value={healthRecords.organs.lungs.fev1} onChange={(v) => updateOrgan('lungs', 'fev1', v)}/>
                                <InputField label="Volume" unit="L" value={healthRecords.organs.lungs.lungVolume} onChange={(v) => updateOrgan('lungs', 'lungVolume', v)}/>
                                <InputField label="PEF" unit="L/min" value={healthRecords.organs.lungs.pef} onChange={(v) => updateOrgan('lungs', 'pef', v)}/>
                            </div>
                        </div>
                         
                        {/* Liver */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Droplet size={16} className="text-amber-700"/> Liver</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <InputField label="ALT" unit="U/L" value={healthRecords.organs.liver.alt} onChange={(v) => updateOrgan('liver', 'alt', v)}/>
                                <InputField label="AST" unit="U/L" value={healthRecords.organs.liver.ast} onChange={(v) => updateOrgan('liver', 'ast', v)}/>
                                <InputField label="ALP" unit="U/L" value={healthRecords.organs.liver.alp} onChange={(v) => updateOrgan('liver', 'alp', v)}/>
                                <InputField label="GGT" unit="U/L" value={healthRecords.organs.liver.ggt} onChange={(v) => updateOrgan('liver', 'ggt', v)}/>
                                <InputField label="Bilirubin" unit="mg/dL" value={healthRecords.organs.liver.bilirubin} onChange={(v) => updateOrgan('liver', 'bilirubin', v)}/>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'OTHER' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-3">Biological Factors</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Age" value={healthRecords.other.bio.age} onChange={(v) => updateOther('bio', 'age', v)}/>
                                <InputField label="Weight" unit="kg" value={healthRecords.other.bio.weight} onChange={(v) => updateOther('bio', 'weight', v)}/>
                                <InputField label="Height" unit="cm" value={healthRecords.other.bio.height} onChange={(v) => updateOther('bio', 'height', v)}/>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-3">Environment</h4>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Location</label>
                                    <input 
                                        type="text" 
                                        value={healthRecords.other.environment.location} 
                                        onChange={(e) => updateOther('environment', 'location', e.target.value)}
                                        placeholder="City, Country"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none" 
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <InputField label="AQI" value={healthRecords.other.environment.aqi} onChange={(v) => updateOther('environment', 'aqi', v)}/>
                                    <InputField label="Temp" unit="°C" value={healthRecords.other.environment.temperature} onChange={(v) => updateOther('environment', 'temperature', v)}/>
                                    <InputField label="UV Index" value={healthRecords.other.environment.uvLevel} onChange={(v) => updateOther('environment', 'uvLevel', v)}/>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Profile: React.FC = () => {
  const { user, switchUser } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHealthRecords, setShowHealthRecords] = useState(false);
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const menuItems = [
    { label: 'Personal Details', icon: User, action: () => setShowPersonalDetails(true) },
    { label: 'Health Records', icon: Activity, action: () => setShowHealthRecords(true) },
    { label: 'Download Data', icon: Download, action: () => {} },
    { label: 'Upload Documents', icon: Upload, action: () => {} },
    { label: 'Settings', icon: Settings, action: () => setShowSettings(true) },
  ];

  if (showHealthRecords) {
      return <HealthRecordsView onBack={() => setShowHealthRecords(false)} />;
  }

  if (showPersonalDetails) {
      return <PersonalDetailsView onBack={() => setShowPersonalDetails(false)} />;
  }

  if (showSettings) {
      return <SettingsView onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="p-6 relative">
      {/* Header Section */}
      <div className="flex items-start gap-4 mb-8">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold border-4 border-white shadow-sm">
            {user.name[0]}
          </div>
          
          <div className="relative mt-2">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full hover:bg-indigo-100 transition-colors"
            >
              Switch User <ChevronDown size={12} />
            </button>

            {/* User Switcher Dropdown */}
            {showUserMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Family Members
                </div>
                {MOCK_USERS.map((u) => (
                  <button
                    key={u.name}
                    onClick={() => {
                      switchUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      u.name === user.name ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600'
                    }`}
                  >
                     <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold">
                        {u.name[0]}
                     </div>
                     {u.name}
                  </button>
                ))}
                <button className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-indigo-600 hover:bg-indigo-50 font-medium border-t border-gray-50">
                   <div className="w-6 h-6 rounded-full border border-dashed border-indigo-300 flex items-center justify-center">
                      <Plus size={14} />
                   </div>
                   Add Profile
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2">
           <h1 className="text-2xl font-bold text-slate-800">{user.name}</h1>
           <div className="flex items-center gap-2 mt-1">
             <span className="text-sm text-gray-500">Age {user.age}</span>
             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
             <span className="text-sm text-gray-500">Cycle {user.currentCycleYear}/5</span>
           </div>
           <div className="mt-3 flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit">
              <ShieldCheck size={14} />
              <span className="text-xs font-medium">Doctor Verified</span>
           </div>
        </div>
      </div>

      {/* Options Menu */}
      <div className="space-y-3">
        {menuItems.map((item) => (
          <button 
            key={item.label} 
            onClick={item.action}
            className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-indigo-200 hover:shadow-sm transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <item.icon size={20} />
              </div>
              <span className="font-semibold text-slate-700">{item.label}</span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 group-hover:text-indigo-400">
               <ChevronDown size={20} className="-rotate-90" />
            </div>
          </button>
        ))}
      </div>
      
      {/* Version info footer */}
      <div className="mt-12 text-center text-xs text-gray-300">
        JEEVAN v1.0.4 (Prototype)
      </div>

      {/* Backdrop for menu */}
      {showUserMenu && (
        <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </div>
  );
};