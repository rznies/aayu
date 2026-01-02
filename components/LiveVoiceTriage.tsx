
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Language, TriageResult, TriageLevel } from '../types';
import { TRANSLATIONS } from '../constants';

interface LiveVoiceTriageProps {
  lang: Language;
  onComplete: (result: TriageResult) => void;
  onCancel: () => void;
}

// Manual encoding/decoding utilities as required by guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const finalizeTriageFunction: FunctionDeclaration = {
  name: 'recordTriageResult',
  parameters: {
    type: Type.OBJECT,
    description: 'Finalizes the triage process and saves results.',
    properties: {
      level: { type: Type.STRING, enum: ['GREEN', 'YELLOW', 'RED'] },
      explanationEn: { type: Type.STRING },
      explanationHi: { type: Type.STRING },
      doNowEn: { type: Type.ARRAY, items: { type: Type.STRING } },
      doNowHi: { type: Type.ARRAY, items: { type: Type.STRING } },
      dangerSignsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
      dangerSignsHi: { type: Type.ARRAY, items: { type: Type.STRING } },
      summaryEn: { type: Type.STRING },
      summaryHi: { type: Type.STRING },
    },
    required: ['level', 'explanationEn', 'explanationHi', 'doNowEn', 'doNowHi', 'dangerSignsEn', 'dangerSignsHi', 'summaryEn', 'summaryHi'],
  },
};

const getEnvironmentalContextFunction: FunctionDeclaration = {
  name: 'getEnvironmentalContext',
  parameters: {
    type: Type.OBJECT,
    description: 'Grounds the triage in real-time weather and public health data.',
    properties: {
      location: { type: Type.STRING, description: 'User\'s location (city, state).' },
    },
    required: ['location'],
  },
};

const LiveVoiceTriage: React.FC<LiveVoiceTriageProps> = ({ lang, onComplete, onCancel }) => {
  const t = TRANSLATIONS[lang];
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('connecting');
  const [transcription, setTranscription] = useState('');
  const [isGatheringContext, setIsGatheringContext] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextIn = useRef<AudioContext | null>(null);
  const audioContextOut = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTime = useRef(0);
  const sources = useRef(new Set<AudioBufferSourceNode>());
  const sessionRef = useRef<any>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    let scriptProcessor: ScriptProcessorNode | null = null;
    let micStream: MediaStream | null = null;

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        audioContextIn.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextOut.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const sourceNode = audioContextIn.current!.createMediaStreamSource(micStream);
        
        analyserRef.current = audioContextIn.current!.createAnalyser();
        analyserRef.current.fftSize = 128;
        sourceNode.connect(analyserRef.current);
        
        const draw = () => {
          if (!canvasRef.current || !analyserRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d')!;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / dataArray.length) * 2;
          let x = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            ctx.fillStyle = `rgba(96, 165, 250, ${dataArray[i] / 255 + 0.3})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
          animationFrameRef.current = requestAnimationFrame(draw);
        };
        draw();

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setStatus('active');
              scriptProcessor = audioContextIn.current!.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob })).catch(err => {
                   console.error("Input stream error:", err);
                   setStatus('error');
                });
              };
              analyserRef.current!.connect(scriptProcessor);
              scriptProcessor.connect(audioContextIn.current!.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioBase64 && audioContextOut.current) {
                nextStartTime.current = Math.max(nextStartTime.current, audioContextOut.current.currentTime);
                const buffer = await decodeAudioData(decode(audioBase64), audioContextOut.current, 24000, 1);
                const source = audioContextOut.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextOut.current.destination);
                source.start(nextStartTime.current);
                nextStartTime.current += buffer.duration;
                sources.current.add(source);
                source.onended = () => sources.current.delete(source);
              }

              if (message.serverContent?.outputTranscription) {
                setTranscription(message.serverContent.outputTranscription.text);
              }

              if (message.serverContent?.interrupted) {
                sources.current.forEach(s => s.stop());
                sources.current.clear();
                nextStartTime.current = 0;
              }

              if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                  if (fc.name === 'recordTriageResult') {
                    onComplete(fc.args as TriageResult);
                    sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { status: 'recorded' } } }));
                  } else if (fc.name === 'getEnvironmentalContext') {
                    setIsGatheringContext(true);
                    try {
                      const searchAi = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                      const searchRes = await searchAi.models.generateContent({
                        model: 'gemini-3-pro-preview',
                        contents: `Current local health outbreaks, air quality, and extreme weather in ${fc.args.location}, India.`,
                        config: { tools: [{ googleSearch: {} }] }
                      });
                      sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { context: searchRes.text } } }));
                    } catch (e) {
                      sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { error: 'Grounding failed' } } }));
                    } finally {
                      setIsGatheringContext(false);
                    }
                  }
                }
              }
            },
            onerror: (e) => {
              console.error("Live session error:", e);
              setStatus('error');
            },
            onclose: () => setStatus('idle'),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: lang === 'hi' ? 'Kore' : 'Zephyr' } } },
            outputAudioTranscription: {},
            tools: [{ functionDeclarations: [finalizeTriageFunction, getEnvironmentalContextFunction] }],
            systemInstruction: `You are Dr. Aayu, a warm, patient family physician. Greeting: "Hello, I am Dr. Aayu. How can I help you today?". Follow the provided clinical interaction guidelines strictly.`,
          },
        });
        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Startup error:", err);
        setStatus('error');
      }
    };
    startSession();
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (scriptProcessor) scriptProcessor.disconnect();
      if (micStream) micStream.getTracks().forEach(t => t.stop());
      if (audioContextIn.current) audioContextIn.current.close();
      if (audioContextOut.current) audioContextOut.current.close();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [lang]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-3xl overflow-hidden p-6 relative">
      <div className="absolute top-8 left-0 right-0 px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/10">👨‍⚕️</div>
          <div>
            <h2 className="text-lg font-black text-blue-400 leading-tight">Dr. Aayu</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Assistant</p>
          </div>
        </div>
        {status === 'active' && (
          <div className="flex items-center space-x-2 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Live</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12 mt-16">
        {status === 'error' ? (
          <div className="text-center space-y-4 px-4">
            <div className="text-5xl">⚠️</div>
            <h3 className="text-xl font-black text-red-400">Connection Error</h3>
            <p className="text-sm text-slate-400">Unable to establish voice link. Please check your internet or microphone permissions.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-blue-600 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <div className="relative w-full flex flex-col items-center">
              <div className="w-full h-32 mb-8 relative flex items-center justify-center">
                 <canvas ref={canvasRef} width={400} height={128} className="w-full max-w-sm h-full opacity-60" />
                 {isGatheringContext && (
                   <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-blue-500/20">
                     <div className="text-center space-y-2">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] animate-pulse">Checking Health Context...</p>
                     </div>
                   </div>
                 )}
              </div>
              <div className={`w-40 h-40 rounded-full bg-blue-500/10 flex items-center justify-center border-2 border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] ${status === 'active' ? 'animate-pulse' : ''}`}>
                <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-2xl shadow-blue-500/40 transition-transform ${status === 'active' ? 'scale-110' : 'scale-100'}`}>
                  <span className="text-5xl drop-shadow-lg">🩺</span>
                </div>
              </div>
            </div>
            <div className="w-full max-w-sm">
               <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl text-sm leading-relaxed text-blue-100 min-h-[140px] flex flex-col items-center justify-center border border-white/10 shadow-2xl transition-all relative overflow-hidden" aria-live="polite">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />
                  <span className="text-blue-500 font-black mb-3 text-[10px] tracking-[0.3em] uppercase">{status === 'active' ? 'Dr. Aayu is listening...' : 'Initializing...'}</span>
                  <p className="text-center font-medium italic text-lg leading-snug">
                    {transcription || (status === 'connecting' ? "Connecting..." : "Dr. Aayu is waiting for you.")}
                  </p>
               </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4">
        <button onClick={onCancel} className="py-5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-white rounded-2xl font-black transition active:scale-95 shadow-lg flex items-center justify-center space-x-3">
          <span className="text-xl">🛑</span>
          <span>{t.endSession}</span>
        </button>
      </div>
    </div>
  );
};

export default LiveVoiceTriage;
