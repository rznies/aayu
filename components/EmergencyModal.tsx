
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface EmergencyModalProps {
  lang: Language;
  onClose: () => void;
}

const EmergencyModal: React.FC<EmergencyModalProps> = ({ lang, onClose }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-slate-200 rounded-full" />
        </div>
        
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-red-100 text-red-600 p-3 rounded-2xl text-2xl animate-pulse">
            🚨
          </div>
          <h2 className="text-2xl font-black text-red-600 tracking-tight">
            {t.emergencyTitle}
          </h2>
        </div>

        <div className="bg-red-50 p-4 rounded-xl mb-8">
          <p className="text-sm font-bold text-red-900 mb-2">{t.emergencyDangerSigns}</p>
          <ul className="text-xs text-red-700 space-y-1.5 font-medium">
            <li>• Severe difficulty breathing / साँस लेने में बहुत कठिनाई</li>
            <li>• Chest pain or pressure / छाती में दर्द या दबाव</li>
            <li>• Confusion or slurred speech / भ्रम या अस्पष्ट वाणी</li>
            <li>• Sudden weakness or paralysis / अचानक कमजोरी या लकवा</li>
            <li>• Severe headache or vision changes / गंभीर सिरदर्द या दृष्टि परिवर्तन</li>
          </ul>
        </div>

        <div className="space-y-3">
          <a 
            href="tel:108"
            className="flex items-center justify-center w-full py-5 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-200 active:scale-95 transition"
          >
            <span className="mr-3 text-2xl">📞</span> {t.callHelp} (108)
          </a>
          
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition"
          >
            {t.back}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
