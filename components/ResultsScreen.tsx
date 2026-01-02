
import React from 'react';
import { Language, TriageResult, TriageLevel } from '../types';
import { TRANSLATIONS, MOCK_FACILITIES } from '../constants';
import FacilityMap from './FacilityMap';

interface ResultsScreenProps {
  lang: Language;
  result: TriageResult;
  onRestart: () => void;
  onEdit: () => void;
  onFeedback: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ lang, result, onRestart, onEdit, onFeedback }) => {
  const t = TRANSLATIONS[lang];

  const levelStyles = {
    [TriageLevel.GREEN]: { bg: 'bg-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-600', border: 'border-emerald-200', icon: '✅' },
    [TriageLevel.YELLOW]: { bg: 'bg-amber-100', text: 'text-amber-800', badge: 'bg-amber-600', border: 'border-amber-200', icon: '⚠️' },
    [TriageLevel.RED]: { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-600', border: 'border-red-200', icon: '🚨' }
  };

  const style = levelStyles[result.level];

  const handleCopy = () => {
    const summary = lang === 'hi' ? result.summaryHi : result.summaryEn;
    navigator.clipboard.writeText(summary);
    alert('Summary copied!');
  };

  const handleWhatsApp = () => {
    const summary = lang === 'hi' ? result.summaryHi : result.summaryEn;
    const url = `whatsapp://send?text=${encodeURIComponent(summary)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700" role="main" aria-label="Triage Results">
      {/* Top Status Banner */}
      <div className={`${style.bg} ${style.border} border-2 rounded-3xl p-8 flex flex-col md:flex-row md:items-center md:text-left items-center text-center shadow-sm relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl pointer-events-none select-none">
          {style.icon}
        </div>
        
        <div className="z-10 flex-1">
          <div className={`${style.badge} text-white inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-sm`}>
            {result.level}
          </div>
          <h2 className={`text-2xl md:text-3xl font-black ${style.text} leading-tight mb-2`}>
            {lang === 'hi' ? result.explanationHi : result.explanationEn}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-75">{t.notDiagnosis}</p>
        </div>

        {/* Red Alert Action Button (if applicable) */}
        {result.level === TriageLevel.RED && (
          <div className="mt-6 md:mt-0 md:ml-6 z-10">
            <a href="tel:108" className="flex items-center space-x-2 bg-red-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition active:scale-95 animate-pulse">
              <span className="text-xl">📞</span>
              <span>108 HELP</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Clinical Actions */}
        <div className="space-y-6">
           {/* Grounding Links */}
          {result.groundingLinks && result.groundingLinks.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center px-1">
                <span className="bg-blue-500 w-1.5 h-1.5 rounded-full mr-2"></span>
                Verified Sources
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.groundingLinks.slice(0, 4).map((chunk, i) => {
                  const link = chunk.web || chunk.maps;
                  if (!link) return null;
                  return (
                    <a 
                      key={i} 
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center transition shadow-sm max-w-full"
                    >
                      <span className="mr-2 opacity-70">{chunk.maps ? '📍' : '🔗'}</span>
                      <span className="truncate max-w-[150px]">{link.title || 'Source'}</span>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* Do Now Cards */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 flex items-center mb-4">
              <span className="bg-blue-100 text-blue-700 p-2 rounded-xl mr-3">📋</span>
              {t.doNow}
            </h3>
            <div className="divide-y divide-slate-100">
              {(lang === 'hi' ? result.doNowHi : result.doNowEn).map((item, i) => (
                <div key={i} className="py-3 text-sm text-slate-700 font-medium flex items-start leading-relaxed">
                   <span className="text-blue-500 mr-3 font-black text-lg leading-none mt-0.5">•</span>
                   {item}
                </div>
              ))}
            </div>
          </section>

          {/* Danger Signs */}
          <section className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-red-900 flex items-center mb-4">
              <span className="bg-red-100 text-red-700 p-2 rounded-xl mr-3">🚩</span>
              {t.dangerSigns}
            </h3>
            <div className="divide-y divide-red-100">
              {(lang === 'hi' ? result.dangerSignsHi : result.dangerSignsEn).map((item, i) => (
                <div key={i} className="py-3 text-sm text-red-800 font-bold flex items-start leading-relaxed">
                   <span className="text-red-500 mr-3 font-black">!</span>
                   {item}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Summary & Map */}
        <div className="space-y-6">
          {/* Facilities Map */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
             <h3 className="text-lg font-black text-slate-800 flex items-center mb-4">
              <span className="bg-violet-100 text-violet-700 p-2 rounded-xl mr-3">📍</span>
              {t.nearbyFacilities}
            </h3>
            <div className="h-64 md:h-80 w-full rounded-2xl overflow-hidden">
               <FacilityMap facilities={MOCK_FACILITIES} lang={lang} />
            </div>
          </section>

          {/* Doctor Summary */}
          <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center mb-4">
              <span className="bg-white border border-slate-200 text-slate-700 p-2 rounded-xl mr-3 shadow-sm">🏥</span>
              {t.doctorSummary}
            </h3>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-inner">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed font-medium">
                {lang === 'hi' ? result.summaryHi : result.summaryEn}
              </pre>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleCopy}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 active:scale-95 transition tracking-widest uppercase"
              >
                {t.copySummary}
              </button>
              <button 
                onClick={handleWhatsApp}
                className="flex-1 py-3 bg-[#25D366] text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:bg-[#20bd5c] active:scale-95 transition tracking-widest uppercase flex items-center justify-center"
              >
                <span className="mr-2 text-base">💬</span> WhatsApp
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col space-y-4 pt-8 border-t border-slate-100 max-w-lg mx-auto">
        <button 
          onClick={onRestart}
          className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 transition active:scale-[0.98] hover:bg-blue-700"
        >
          {t.startOver}
        </button>
        <div className="flex items-center justify-between px-4">
          <button onClick={onEdit} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition">{t.editAnswers}</button>
          <button onClick={onFeedback} className="text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-700 transition">{t.somethingWrong}</button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
