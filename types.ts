
export type Language = 'en' | 'hi';

export type PatientType = 'Adult' | 'Child' | 'Pregnant' | 'Elderly';

export interface PatientProfile {
  type: PatientType;
  age: string;
  sex?: string;
  weeksPregnant?: string;
  riskFactors: string[];
}

export interface Question {
  id: string;
  textEn: string;
  textHi: string;
  type: 'boolean' | 'choice' | 'number';
  optionsEn?: string[];
  optionsHi?: string[];
  whyEn?: string;
  whyHi?: string;
}

export enum TriageLevel {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED'
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string };
}

export interface TriageResult {
  id?: string;
  timestamp?: number;
  level: TriageLevel;
  explanationEn: string;
  explanationHi: string;
  doNowEn: string[];
  doNowHi: string[];
  dangerSignsEn: string[];
  dangerSignsHi: string[];
  summaryEn: string;
  summaryHi: string;
  groundingLinks?: GroundingChunk[];
}

export interface Answer {
  questionId: string;
  value: string | boolean | number;
}

export interface Facility {
  name: string;
  type: string;
  hours: string;
  phone: string;
  distance: string;
  lat: number;
  lng: number;
}

export interface TriageHistoryItem {
  id: string;
  timestamp: number;
  profile: PatientProfile;
  symptoms: string;
  result: TriageResult;
}
