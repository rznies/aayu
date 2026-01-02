
import React, { useState, useCallback, useMemo } from 'react';
import { Language, PatientProfile, Question, Answer, TriageResult, TriageLevel } from './types';
import { TRANSLATIONS } from './constants';
import Header from './components/Header';
import HomeView from './components/HomeView';
import IntakeScreen from './components/IntakeScreen';
import QuestionScreen from './components/QuestionScreen';
import ResultsScreen from './components/ResultsScreen';
import LiveVoiceTriage from './components/LiveVoiceTriage';
import EmergencyModal from './components/EmergencyModal';
import FeedbackModal from './components/FeedbackModal';
import LoadingScreen from './components/LoadingScreen';
import { analyzeIntake, finalizeTriage } from './services/geminiService';
import { saveTriageHistory } from './services/historyService';

enum Screen {
  HOME,
  INTAKE,
  QUESTIONS,
  RESULTS,
  LOADING,
  VOICE_TRIAGE
}

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  const handleStartCheck = async (profileData: PatientProfile, symptomData: string) => {
    setProfile(profileData);
    setSymptoms(symptomData);
    setAppError(null);
    setCurrentScreen(Screen.LOADING);

    try {
      const data = await analyzeIntake(profileData, symptomData);
      
      if (data.isEmergency) {
        const finalRes = { ...data.initialTriage!, timestamp: Date.now(), id: crypto.randomUUID() };
        setResult(finalRes);
        saveTriageHistory({
          id: finalRes.id,
          timestamp: finalRes.timestamp,
          profile: profileData,
          symptoms: symptomData,
          result: finalRes
        });
        setShowEmergency(true);
        setCurrentScreen(Screen.RESULTS);
      } else {
        setQuestions(data.questions);
        setCurrentQuestionIdx(0);
        setCurrentScreen(Screen.QUESTIONS);
      }
    } catch (error) {
      console.error("Intake phase error:", error);
      setAppError(lang === 'hi' ? "सेवा वर्तमान में उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।" : "Service unavailable. Please check your connection and try again.");
      setCurrentScreen(Screen.INTAKE);
    }
  };

  const handleAnswer = async (value: string | boolean | number) => {
    const newAnswers = [...answers, { questionId: questions[currentQuestionIdx].id, value }];
    setAnswers(newAnswers);

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setAppError(null);
      setCurrentScreen(Screen.LOADING);
      try {
        const finalResult = await finalizeTriage(profile!, symptoms, newAnswers);
        const finalRes = { ...finalResult, timestamp: Date.now(), id: crypto.randomUUID() };
        setResult(finalRes);
        
        saveTriageHistory({
          id: finalRes.id,
          timestamp: finalRes.timestamp,
          profile: profile!,
          symptoms: symptoms,
          result: finalRes
        });

        if (finalRes.level === TriageLevel.RED) {
          setShowEmergency(true);
        }
        setCurrentScreen(Screen.RESULTS);
      } catch (error) {
        console.error("Final triage error:", error);
        setAppError(lang === 'hi' ? "परिणाम तैयार करने में समस्या हुई।" : "Failed to generate results. Please try again.");
        setCurrentScreen(Screen.QUESTIONS);
      }
    }
  };

  const handleVoiceTriageComplete = (res: TriageResult) => {
    const finalRes = { ...res, timestamp: Date.now(), id: crypto.randomUUID() };
    setResult(finalRes);
    saveTriageHistory({
      id: finalRes.id,
      timestamp: finalRes.timestamp,
      profile: { type: 'Adult', age: 'N/A (Voice)', riskFactors: [] },
      symptoms: 'Voice-Assisted Session',
      result: finalRes
    });
    if (finalRes.level === TriageLevel.RED) {
      setShowEmergency(true);
    }
    setCurrentScreen(Screen.RESULTS);
  };

  const handleRestart = () => {
    setProfile(null);
    setSymptoms('');
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setShowEmergency(false);
    setAppError(null);
    setCurrentScreen(Screen.HOME);
  };

  return (
    <div className="min-h-screen w-full md:max-w-6xl mx-auto bg-slate-50 md:bg-white shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-slate-200 md:my-4 md:rounded-3xl md:h-[calc(100vh-2rem)] transition-all duration-300">
      <Header lang={lang} setLang={setLang} showBack={currentScreen !== Screen.HOME} onBack={handleRestart} />
      
      {appError && (
        <div className="bg-red-500 text-white px-4 py-2 text-xs font-black text-center animate-in slide-in-from-top duration-300 z-50">
          {appError}
          <button onClick={() => setAppError(null)} className="ml-3 underline">Close</button>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {currentScreen === Screen.LOADING && (
            <LoadingScreen lang={lang} />
          )}

          {currentScreen === Screen.HOME && (
            <HomeView lang={lang} onStartNew={() => setCurrentScreen(Screen.INTAKE)} onViewHistory={(item) => {
              setProfile(item.profile);
              setSymptoms(item.symptoms);
              setResult(item.result);
              setCurrentScreen(Screen.RESULTS);
            }} onEmergency={() => setShowEmergency(true)} onStartVoice={() => setCurrentScreen(Screen.VOICE_TRIAGE)} />
          )}

          {currentScreen === Screen.INTAKE && <IntakeScreen lang={lang} onStart={handleStartCheck} onEmergency={() => setShowEmergency(true)} />}

          {currentScreen === Screen.QUESTIONS && questions.length > 0 && (
            <QuestionScreen lang={lang} question={questions[currentQuestionIdx]} total={questions.length} current={currentQuestionIdx + 1} onAnswer={handleAnswer} onBack={() => {
              if (currentQuestionIdx > 0) { setCurrentQuestionIdx(prev => prev - 1); setAnswers(prev => prev.slice(0, -1)); } else { setCurrentScreen(Screen.INTAKE); }
            }} />
          )}

          {currentScreen === Screen.RESULTS && result && <ResultsScreen lang={lang} result={result} onRestart={handleRestart} onEdit={() => setCurrentScreen(Screen.QUESTIONS)} onFeedback={() => setShowFeedback(true)} />}

          {currentScreen === Screen.VOICE_TRIAGE && <LiveVoiceTriage lang={lang} onComplete={handleVoiceTriageComplete} onCancel={() => setCurrentScreen(Screen.HOME)} />}
        </div>
      </main>

      {showEmergency && <EmergencyModal lang={lang} onClose={() => setShowEmergency(false)} />}
      {showFeedback && <FeedbackModal lang={lang} onClose={() => setShowFeedback(false)} />}

      {/* Persistent Legal Disclaimer */}
      <div className="fixed bottom-1 right-1 z-50 pointer-events-none md:absolute md:bottom-2 md:right-6 mix-blend-multiply opacity-60">
        <p className="text-[8px] text-slate-400 font-medium font-mono text-right max-w-[150px] leading-tight select-none">
          {t.legalDisclaimer}
        </p>
      </div>
    </div>
  );
};

export default App;
