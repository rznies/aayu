
import React from 'react';
import { Language, Question } from '../types';
import { TRANSLATIONS } from '../constants';

interface QuestionScreenProps {
  lang: Language;
  question: Question;
  current: number;
  total: number;
  onAnswer: (val: string | boolean | number) => void;
  onBack: () => void;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({ lang, question, current, total, onAnswer, onBack }) => {
  const t = TRANSLATIONS[lang];
  const [showWhy, setShowWhy] = React.useState(false);

  return (
    <div className="flex flex-col h-full space-y-8 animate-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto w-full justify-center">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question {current} / {total}</span>
          <div className="flex space-x-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${i < current ? 'bg-blue-600 scale-100' : 'bg-slate-200 scale-90'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg shadow-slate-100/50">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-snug mb-8">
            {lang === 'hi' ? question.textHi : question.textEn}
          </h2>

          <div className="space-y-4">
            {question.type === 'boolean' && (
              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => onAnswer(true)}
                  className="flex-1 py-5 px-6 border-2 border-slate-100 bg-slate-50 rounded-2xl font-bold text-xl text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition active:scale-[0.98] shadow-sm"
                >
                  {lang === 'hi' ? 'हाँ' : 'Yes'}
                </button>
                <button 
                  onClick={() => onAnswer(false)}
                  className="flex-1 py-5 px-6 border-2 border-slate-100 bg-slate-50 rounded-2xl font-bold text-xl text-slate-700 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900 transition active:scale-[0.98] shadow-sm"
                >
                  {lang === 'hi' ? 'नहीं' : 'No'}
                </button>
              </div>
            )}

            {question.type === 'choice' && question.optionsEn && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.optionsEn.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => onAnswer(opt)}
                    className="w-full py-5 px-6 border-2 border-slate-100 bg-slate-50 rounded-2xl font-bold text-lg text-slate-700 text-left hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition active:scale-[0.98] shadow-sm flex items-center justify-between group"
                  >
                    <span>{lang === 'hi' && question.optionsHi ? question.optionsHi[idx] : opt}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                ))}
              </div>
            )}

            {question.type === 'number' && (
               <div className="space-y-6 max-w-sm mx-auto">
                  <input 
                    type="number"
                    className="w-full p-6 border-2 border-slate-200 rounded-2xl font-bold text-4xl focus:border-blue-500 outline-none text-center bg-slate-50 focus:bg-white transition"
                    autoFocus
                    placeholder="0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onAnswer((e.currentTarget as HTMLInputElement).value);
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.querySelector('input') as HTMLInputElement;
                      if (input.value) onAnswer(input.value);
                    }}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition active:scale-[0.98] text-lg"
                  >
                    {t.next}
                  </button>
               </div>
            )}
          </div>

          {(question.whyEn || question.whyHi) && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <button 
                onClick={() => setShowWhy(!showWhy)}
                className="text-sm font-bold text-blue-600 flex items-center hover:underline group"
              >
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-xs group-hover:bg-blue-200 transition">💡</span> 
                {t.whyAsk}
              </button>
              {showWhy && (
                <div className="mt-3 p-4 bg-blue-50 rounded-2xl text-sm text-blue-800 leading-relaxed animate-in fade-in slide-in-from-top-2 border border-blue-100 font-medium">
                  {lang === 'hi' ? question.whyHi : question.whyEn}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="pb-4">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 font-bold hover:text-slate-800 transition px-4 py-2 rounded-xl hover:bg-slate-100"
        >
          <span className="mr-2 text-lg">←</span> {t.back}
        </button>
      </div>
    </div>
  );
};

export default QuestionScreen;
