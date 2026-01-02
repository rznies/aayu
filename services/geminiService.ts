
import { GoogleGenAI, Type, GenerateContentParameters, GenerateContentResponse } from "@google/genai";
import { PatientProfile, Question, TriageLevel, TriageResult, Answer } from "../types";

const SYSTEM_INSTRUCTION = `You are Aayu, an AI assistant designed for medical triage in India.
Your goal is to help users decide the right next step: GREEN (Home care), YELLOW (Clinic visit), or RED (Urgent/Emergency).
You are NOT a diagnostic tool. You must emphasize safety and clear escalation.
Always communicate in both simple English and simple Hindi.

Context Awareness:
- Use grounding to check for local outbreaks, extreme weather, or public health advisories.
- If symptoms align with current local risks, prioritize safety.
- For final triage, assign a level: GREEN, YELLOW, or RED.`;

/**
 * Utility: Sanitizes user input to prevent injection or broken payloads
 */
const sanitizeInput = (str: string): string => {
  return str.replace(/[<>]/g, "").slice(0, 2000);
};

/**
 * Utility: Robust JSON extraction from LLM responses
 */
const extractJson = (text: string) => {
  try {
    // Attempt direct parse
    return JSON.parse(text);
  } catch (e) {
    // Attempt to extract from markdown blocks
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerE) {
        throw new Error("Could not parse extracted JSON");
      }
    }
    throw new Error("No JSON found in response");
  }
};

/**
 * Utility: Exponential backoff for API resilience
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable = error?.status === 429 || error?.status >= 500 || error?.message?.includes('fetch');
      if (i === maxRetries - 1 || !isRetryable) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("Max retries exceeded");
};

export const analyzeIntake = async (profile: PatientProfile, symptoms: string): Promise<{ isEmergency: boolean, questions: Question[], initialTriage?: TriageResult }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const sanitizedSymptoms = sanitizeInput(symptoms);
  
  const prompt = `Analyze this patient intake.
  Profile: ${JSON.stringify(profile)}
  Symptoms: ${sanitizedSymptoms}
  Decide: Is this an immediate RED emergency based on clinical red flags, or do you need 3-5 follow-up questions?`;

  const config: GenerateContentParameters = {
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + "\nStrictly adhere to the JSON schema for this specific response.",
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isEmergency: { type: Type.BOOLEAN },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                textEn: { type: Type.STRING },
                textHi: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['boolean', 'choice', 'number'] },
                optionsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
                optionsHi: { type: Type.ARRAY, items: { type: Type.STRING } },
                whyEn: { type: Type.STRING },
                whyHi: { type: Type.STRING },
              },
              required: ['id', 'textEn', 'textHi', 'type']
            }
          },
          initialTriage: {
             type: Type.OBJECT,
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
             required: ['level', 'explanationEn', 'explanationHi', 'doNowEn', 'doNowHi', 'dangerSignsEn', 'dangerSignsHi', 'summaryEn', 'summaryHi']
          }
        },
        required: ['isEmergency']
      }
    }
  };

  try {
    // Adding explicit type parameter to fix 'unknown' type errors for text property access
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent(config));
    if (!response.text) throw new Error("Empty AI response");
    return extractJson(response.text);
  } catch (error: any) {
    console.error("Intake analysis failed:", error);
    // Hard fallback if the AI logic fails completely
    return { isEmergency: false, questions: [{ id: 'err', textEn: 'Could you please describe your symptoms in more detail?', textHi: 'क्या आप अपने लक्षणों के बारे में विस्तार से बता सकते हैं?', type: 'boolean' }] };
  }
};

export const finalizeTriage = async (profile: PatientProfile, symptoms: string, answers: Answer[]): Promise<TriageResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const sanitizedSymptoms = sanitizeInput(symptoms);
  
  let lat = 28.6139;
  let lng = 77.2090;

  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) => 
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
    ).catch(() => null);
    if (pos) {
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    }
  } catch (e) {
    console.warn("Location error suppressed.");
  }

  // Resilient Pipeline Stage 1: Attempt Grounded Reasoning
  let reasoning = "Location context unavailable. Standard clinical triage applied.";
  let groundingLinks = [];
  
  try {
    // Adding explicit type parameter to fix 'unknown' type errors for text and candidates property access
    const groundedResponse = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Finalize medical triage. 
      Location: ${lat}, ${lng}. 
      User Profile: ${JSON.stringify(profile)}.
      Symptoms: ${sanitizedSymptoms}.
      Follow-up Answers: ${JSON.stringify(answers)}.
      Provide a triage decision (GREEN/YELLOW/RED) and explain why based on local health context.`,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
      },
    }));
    reasoning = groundedResponse.text || reasoning;
    groundingLinks = groundedResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  } catch (e) {
    console.warn("Grounding failed, proceeding with fallback reasoning.");
  }

  // Resilient Pipeline Stage 2: Structure final JSON
  const structureAi = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const finalConfig: GenerateContentParameters = {
    model: 'gemini-3-pro-preview',
    contents: `Structure the following medical triage reasoning into the requested JSON schema.
    Reasoning: ${reasoning}
    Original Profile: ${JSON.stringify(profile)}
    Original Symptoms: ${sanitizedSymptoms}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
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
        required: ['level', 'explanationEn', 'explanationHi', 'doNowEn', 'doNowHi', 'dangerSignsEn', 'dangerSignsHi', 'summaryEn', 'summaryHi']
      }
    }
  };

  try {
    // Adding explicit type parameter to fix 'unknown' type errors for text property access
    const finalResponse = await retryWithBackoff<GenerateContentResponse>(() => structureAi.models.generateContent(finalConfig));
    if (!finalResponse.text) throw new Error("Formatting failed");
    const result = extractJson(finalResponse.text);
    return { ...result, groundingLinks };
  } catch (error) {
    // Stage 3: Absolute Safety Fallback
    return {
      level: TriageLevel.YELLOW,
      explanationEn: "Unable to complete full AI analysis. For your safety, please consult a clinic for professional advice.",
      explanationHi: "पूरी तरह से विश्लेषण नहीं हो सका। सुरक्षा के लिए, कृपया सलाह के लिए डॉक्टर से मिलें।",
      doNowEn: ["Stay hydrated", "Monitor symptoms", "Consult a clinician if feeling worse"],
      doNowHi: ["पर्याप्त पानी पिएं", "लक्षणों पर नज़र रखें", "तबीयत खराब होने पर डॉक्टर को दिखाएं"],
      dangerSignsEn: ["Breathlessness", "High fever", "Severe pain"],
      dangerSignsHi: ["साँस लेने में तकलीफ", "तेज़ बुखार", "तेज़ दर्द"],
      summaryEn: "System Error during triage. Recommended caution.",
      summaryHi: "त्रुटि के कारण सावधानी बरतने की सलाह दी जाती है।"
    };
  }
};
