
import React, { useState, useEffect } from 'react';
import { Language, PatientProfile, PatientType } from '../types';
import { TRANSLATIONS, PATIENT_TYPES, RISK_FACTORS } from '../constants';

interface IntakeScreenProps {
  lang: Language;
  onStart: (profile: PatientProfile, symptoms: string) => void;
  onEmergency: () => void;
}

const IntakeScreen: React.FC<IntakeScreenProps> = ({ lang, onStart, onEmergency }) => {
  const t = TRANSLATIONS[lang];
  const [patientType, setPatientType] = useState<PatientType>('Adult');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Male');
  const [weeksPregnant, setWeeksPregnant] = useState('');
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState('');
  const [durationValue, setDurationValue] = useState('');
  const [durationUnit, setDurationUnit] = useState('days');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleRiskToggle = (id: string) => {
    setSelectedRisks(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setError(t.voiceError);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSymptoms(prev => prev ? prev + ' ' + transcript : transcript);
    };

    recognition.start();
  };

  const handleStart = () => {
    if (!age || !consent) {
      setError(t.mandatoryFields);
      return;
    }
    if (patientType === 'Pregnant' && !weeksPregnant) {
      setError(t.weeksMandatory);
      return;
    }
    setError('');
    
    // Combine symptoms and duration for the AI service
    const durationText = durationValue ? ` Duration: ${durationValue} ${durationUnit}.` : '';
    const fullSymptomDescription = `${symptoms}${durationText}`;
    
    onStart({
      type: patientType,
      age,
      sex,
      weeksPregnant,
      riskFactors: selectedRisks
    }, fullSymptomDescription);
  };

  const isFormValid = age && consent && (patientType !== 'Pregnant' || weeksPregnant);

  return (
    <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl shadow-sm">
        <div className="flex items-start">
          <span className="text-amber-500 mr-2">ℹ️</span>
          <p className="text-sm text-amber-900 font-medium leading-relaxed">{t.tagline}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Profile */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full">
          <h2 className="text-lg font-black mb-6 text-slate-800 flex items-center">
            <span className="bg-blue-100 text-blue-700 p-2 rounded-xl mr-3">👤</span>
            {t.patientProfile}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {PATIENT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setPatientType(type.id as PatientType)}
                className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition flex items-center justify-center ${patientType === type.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
              >
                {lang === 'hi' ? type.labelHi : type.labelEn}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">{t.age}</label>
              <input 
                type="number" 
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition" 
                placeholder="e.g. 30"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">{t.sex}</label>
              <select 
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition appearance-none"
              >
                <option value="Male">Male / पुरुष</option>
                <option value="Female">Female / महिला</option>
                <option value="Other">Other / अन्य</option>
              </select>
            </div>
          </div>

          {patientType === 'Pregnant' && (
            <div className="mb-4">
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">{t.weeksPregnant}</label>
              <input 
                type="number" 
                value={weeksPregnant}
                onChange={(e) => setWeeksPregnant(e.target.value)}
                className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                placeholder="1-42"
              />
            </div>
          )}

          <div className="space-y-3 mt-4">
            <p className="text-xs font-black text-slate-400 uppercase ml-1">Medical History</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {RISK_FACTORS.map(risk => (
                <label key={risk.id} className={`flex items-center p-3 rounded-xl border transition cursor-pointer ${selectedRisks.includes(risk.id) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={selectedRisks.includes(risk.id)}
                    onChange={() => handleRiskToggle(risk.id)}
                  />
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition ${selectedRisks.includes(risk.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                    {selectedRisks.includes(risk.id) && <span className="text-xs">✓</span>}
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate">
                    {lang === 'hi' ? risk.labelHi : risk.labelEn}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Symptoms */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full">
          <h2 className="text-lg font-black mb-6 text-slate-800 flex items-center">
            <span className="bg-emerald-100 text-emerald-700 p-2 rounded-xl mr-3">🤒</span>
            {t.symptoms}
          </h2>
          <div className="relative group mb-6 flex-grow">
            <textarea 
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full h-full min-h-[160px] p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-base font-medium text-slate-700 placeholder:text-slate-400 transition"
              placeholder={t.describeSymptoms}
            />
            <button 
              type="button"
              onClick={handleVoiceInput}
              className={`absolute right-4 bottom-4 p-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 ${isListening ? 'bg-red-500 text-white scale-110 animate-pulse' : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-100'}`}
            >
               <span className="text-xl">🎤</span>
               {isListening && <span className="text-[10px] font-black uppercase tracking-widest">{t.listening}</span>}
            </button>
          </div>

          {/* Symptom Duration Field */}
          <div className="mt-auto animate-in fade-in duration-500">
            <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">
              {t.symptomDuration}
            </label>
            <div className="flex space-x-2">
              <input 
                type="number"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                className="flex-1 p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition"
                placeholder={t.durationPlaceholder}
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                className="w-32 p-4 border border-slate-100 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition cursor-pointer"
              >
                <option value="hours">{t.hours}</option>
                <option value="days">{t.days}</option>
                <option value="weeks">{t.weeks}</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* Consent & CTA */}
      <div className="space-y-5 px-1 pt-2 max-w-2xl mx-auto">
        <label className="flex items-start space-x-4 cursor-pointer p-4 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition">
          <input 
            type="checkbox" 
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 w-6 h-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" 
          />
          <span className="text-sm text-slate-500 font-bold leading-relaxed">{t.consent}</span>
        </label>

        {error && <p className="text-red-500 text-sm font-black bg-red-50 p-4 rounded-2xl border border-red-100 text-center animate-shake">{error}</p>}

        <button 
          onClick={handleStart}
          disabled={!isFormValid}
          className={`w-full py-5 text-white rounded-2xl font-black text-lg transition shadow-xl ${isFormValid ? 'bg-blue-600 shadow-blue-200 hover:bg-blue-700 active:scale-[0.98]' : 'bg-slate-300 shadow-none cursor-not-allowed opacity-70'}`}
        >
          {t.startCheck}
        </button>
      </div>
    </div>
  );
};

export default IntakeScreen;
