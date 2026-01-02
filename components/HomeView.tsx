
import React, { useEffect, useState } from 'react';
import { Language, TriageHistoryItem } from '../types';
import { TRANSLATIONS } from '../constants';
import { getTriageHistory } from '../services/historyService';

interface HomeViewProps {
  lang: Language;
  onStartNew: () => void;
  onViewHistory: (item: TriageHistoryItem) => void;
  onEmergency: () => void;
  onStartVoice: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ lang, onStartNew, onViewHistory, onEmergency, onStartVoice }) => {
  const t = TRANSLATIONS[lang];
  const [history, setHistory] = useState<TriageHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getTriageHistory());
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Welcome & CTA */}
      <section className="text-center space-y-6 pt-4 md:pt-10">
        <div className="bg-blue-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-2 text-5xl shadow-inner border border-blue-100">
          🩺
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight px-4">
            {t.appName}
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-sm mx-auto font-medium leading-relaxed">
            {t.tagline}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 max-w-md mx-auto pt-2">
          <button 
            onClick={onStartNew}
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition"
          >
            {t.startCheck}
          </button>
          <button 
            onClick={onStartVoice}
            className="flex-1 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-lg hover:bg-blue-50 active:scale-95 transition flex items-center justify-center space-x-2"
          >
            <span>🎙️</span>
            <span>{t.startVoiceCheck}</span>
          </button>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm mx-2 md:mx-0">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
          {t.howItWorks}
        </h3>
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
          <div className="flex items-start space-x-4 md:flex-col md:space-x-0 md:space-y-3 md:text-center md:items-center">
            <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-black text-lg">1</div>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">{t.howStep1}</p>
          </div>
          <div className="flex items-start space-x-4 md:flex-col md:space-x-0 md:space-y-3 md:text-center md:items-center">
            <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-black text-lg">2</div>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">{t.howStep2}</p>
          </div>
          <div className="flex items-start space-x-4 md:flex-col md:space-x-0 md:space-y-3 md:text-center md:items-center">
            <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-black text-lg">3</div>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">{t.howStep3}</p>
          </div>
        </div>
      </section>

      {/* History & Emergency Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2 md:px-0">
        {/* History */}
        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
            {t.recentHistory}
          </h3>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => onViewHistory(item)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 transition text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-10 rounded-full ${
                      item.result.level === 'GREEN' ? 'bg-emerald-500' : 
                      item.result.level === 'YELLOW' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{item.profile.type} ({item.profile.age})</h4>
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[150px] md:max-w-[200px]">{item.symptoms}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-slate-300 group-hover:text-blue-500 transition-colors">→</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 h-32 flex items-center justify-center">
              <p className="text-slate-400 text-sm font-medium">{t.noHistory}</p>
            </div>
          )}
        </section>

        {/* Quick Emergency Action */}
        <section className="flex flex-col justify-start">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
            {t.emergencyTitle}
          </h3>
          <button 
            onClick={onEmergency}
            className="w-full h-32 md:flex-1 bg-red-50 text-red-600 border border-red-100 rounded-3xl font-black flex flex-col items-center justify-center space-y-2 hover:bg-red-100 transition shadow-sm hover:shadow-md"
          >
            <span className="text-4xl">🚨</span>
            <span className="text-lg">{t.emergencyCheck}</span>
          </button>
        </section>
      </div>
    </div>
  );
};

export default HomeView;
