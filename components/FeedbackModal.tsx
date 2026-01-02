
import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface FeedbackModalProps {
  lang: Language;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ lang, onClose }) => {
  const t = TRANSLATIONS[lang];
  const [visited, setVisited] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send to API
    setSuccess(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-300">
        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-emerald-600">{t.success}</h2>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-6">{t.feedbackTitle}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea 
                required
                className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder={t.feedbackPlaceholder}
              />
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-600">{t.visitedDoctor}</span>
                <button 
                  type="button"
                  onClick={() => setVisited(!visited)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${visited ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${visited ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {visited && (
                <textarea 
                  className="w-full h-20 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm animate-in slide-in-from-top-2"
                  placeholder={t.doctorSaid}
                />
              )}

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100"
                >
                  {t.submit}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
