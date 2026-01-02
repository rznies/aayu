
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface LoadingScreenProps {
  lang: Language;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const loadingSteps = lang === 'hi' ? [
    'रोगी प्रोफाइल की समीक्षा की जा रही है...',
    'लक्षणों की गंभीरता का विश्लेषण...',
    'स्थानीय स्वास्थ्य अलर्ट की जाँच...',
    'चिकित्सीय डेटा का मिलान...',
    'सुरक्षित मार्गदर्शन तैयार किया जा रहा है...'
  ] : [
    'Initializing secure clinical review...',
    'Parsing symptom patterns...',
    'Correlating with regional health data...',
    'Cross-referencing medical safety protocols...',
    'Synthesizing final guidance...'
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        // Natural feeling progress: slows down as it gets closer to the end of a step
        const stepTarget = ((step + 1) / loadingSteps.length) * 100;
        const diff = stepTarget - prev;
        return prev + (diff * 0.1);
      });
    }, 100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [step, loadingSteps.length]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-10 px-8 relative overflow-hidden bg-slate-50/50 backdrop-blur-sm">
      {/* Background Decorative Element: Subtle Mesh Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-200 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* High-Tech Scanner Visual */}
      <div className="relative group">
        {/* Outer Rotating Rings */}
        <div className="absolute inset-0 -m-8 border border-blue-100 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-0 -m-4 border border-blue-200/50 rounded-full animate-[spin_15s_linear_infinite_reverse] border-dashed" />
        
        {/* Central Clinical Hub */}
        <div className="relative w-40 h-40 flex items-center justify-center bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(37,99,235,0.1)] border border-blue-50 overflow-hidden">
          {/* Active Scanning Wave */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent animate-[scan_3s_ease-in-out_infinite]" />
          
          <div className="z-10 flex flex-col items-center space-y-2">
            <span className="text-5xl animate-bounce duration-[3000ms] drop-shadow-sm">🩺</span>
            
            {/* Real-time Heartbeat (EKG) Path */}
            <svg className="w-24 h-8 text-blue-500/40" viewBox="0 0 100 40">
              <path
                d="M0,20 L20,20 L25,10 L30,30 L35,0 L40,40 L45,20 L100,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-[ekg_2s_linear_infinite]"
              />
            </svg>
          </div>

          {/* HUD Data Readout Elements */}
          <div className="absolute top-2 left-3 font-mono text-[8px] text-blue-300 font-bold tracking-tighter opacity-50 uppercase">
            S-ID: {Math.random().toString(16).slice(2, 10)}
          </div>
          <div className="absolute bottom-2 right-3 font-mono text-[8px] text-blue-300 font-bold tracking-tighter opacity-50">
            {Math.floor(progress)}% COMPLETE
          </div>
        </div>
      </div>

      {/* Analysis Status */}
      <div className="text-center w-full max-w-[280px] space-y-5">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center justify-center">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
            {t.loading}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Clinical Engine v3.1
          </p>
        </div>
        
        <div className="h-10 flex items-center justify-center">
          <p key={step} className="text-blue-600 text-sm font-bold animate-in fade-in slide-in-from-bottom-3 duration-500 leading-tight">
            {loadingSteps[step]}
          </p>
        </div>

        {/* Professional Segmented Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)] relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
          </div>
          <div className="flex justify-between px-1">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Safe Data Processing</span>
             <span className="text-[8px] font-black text-blue-500 tabular-nums">{Math.floor(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Trust & Verification Footer */}
      <div className="pt-8 flex items-center space-x-6 opacity-30">
        <div className="flex flex-col items-center">
          <div className="text-lg mb-1">🛡️</div>
          <span className="text-[7px] font-black uppercase tracking-tighter">Encrypted</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-lg mb-1">⚖️</div>
          <span className="text-[7px] font-black uppercase tracking-tighter">Verified</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-lg mb-1">👤</div>
          <span className="text-[7px] font-black uppercase tracking-tighter">Private</span>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes ekg {
          0% { stroke-dasharray: 0 100; stroke-dashoffset: 0; }
          50% { stroke-dasharray: 100 0; stroke-dashoffset: 0; }
          100% { stroke-dasharray: 0 100; stroke-dashoffset: -100; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
