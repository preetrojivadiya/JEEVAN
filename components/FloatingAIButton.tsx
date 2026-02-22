import React, { useState, useRef } from 'react';
import { Camera, X, Send, Sparkles } from 'lucide-react';
import { analyzeFoodEntry } from '../services/geminiService';
import { useApp } from '../context/AppContext';

export const FloatingAIButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'IDLE' | 'PROCESSING' | 'RESULT'>('IDLE');
  const [result, setResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { addLog } = useApp();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMode('PROCESSING');
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      try {
        const data = await analyzeFoodEntry("Identify this food and estimate nutrition", file);
        if (data) {
           setResult(JSON.stringify(data, null, 2));
           // Automatically log it for demo purposes
           addLog({
             id: Date.now().toString(),
             timestamp: Date.now(),
             type: 'FOOD',
             description: data.description || "Scanned Food",
             metricsImpact: {
               'Calories': data.calories,
               'Protein': data.protein
             },
             imageUrl: objectUrl
           });
           setMode('RESULT');
        }
      } catch (err) {
        setResult("Failed to analyze image.");
        setMode('RESULT');
      }
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setMode('IDLE');
    setPreview(null);
    setResult('');
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all z-50 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        <Camera className="w-6 h-6" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col justify-end sm:justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative animate-slide-up">
            
            <div className="p-4 bg-indigo-600 flex justify-between items-center text-white">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Health Scanner
              </h3>
              <button onClick={closeModal}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-6 min-h-[300px] justify-center">
              
              {mode === 'IDLE' && (
                <>
                  <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 font-medium">Tap to Scan Food or Report</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-center text-gray-400">
                    Powered by Gemini Vision. Tracks Macros, Micros & identifies ingredients.
                  </p>
                </>
              )}

              {mode === 'PROCESSING' && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  {preview && <img src={preview} alt="Scanning" className="w-32 h-32 object-cover rounded-lg mb-4 opacity-50" />}
                  <p className="text-indigo-600 font-medium animate-pulse">Analyzing biological composition...</p>
                </div>
              )}

              {mode === 'RESULT' && (
                <div className="w-full">
                  <div className="flex items-start gap-4 mb-4">
                    {preview && <img src={preview} alt="Result" className="w-20 h-20 object-cover rounded-lg shadow-sm" />}
                    <div>
                        <h4 className="font-bold text-gray-800">Scan Complete</h4>
                        <p className="text-xs text-green-600 font-medium">Added to Daily Log</p>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono overflow-auto max-h-40">
                    <pre>{result}</pre>
                  </div>
                  <button onClick={closeModal} className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-xl font-medium">
                    Done
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};
