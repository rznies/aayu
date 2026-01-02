
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  showBack?: boolean;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ lang, setLang, showBack, onBack }) => {
  const t = TRANSLATIONS[lang];
  return (
    <header className="bg-white text-slate-900 px-4 py-5 sticky top-0 z-10 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {showBack && (
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition"
          >
            <span className="text-xl">🏠</span>
          </button>
        )}
        <div>
          <h1 className="text-lg font-black tracking-tighter text-blue-700">{t.appName}</h1>
        </div>
      </div>
      
      <div className="flex bg-slate-100 rounded-2xl p-1 border border-slate-200">
        <button 
          onClick={() => setLang('en')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
        >
          EN
        </button>
        <button 
          onClick={() => setLang('hi')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${lang === 'hi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
        >
          हिन्दी
        </button>
      </div>
    </header>
  );
};

export default Header;
