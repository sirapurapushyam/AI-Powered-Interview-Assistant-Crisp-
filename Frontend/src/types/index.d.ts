// frontend/src/types/index.ts
export interface Candidate {  // <-- Add 'export' here
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeText?: string;
  resumeUrl?: string;
  status: 'collecting-info' | 'in-progress' | 'completed';
  finalScore?: number;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  expectedTopics: string[];
  hints: string[];
  answer?: string;
  score?: number;
  feedback?: string;
  startTime?: string;
  endTime?: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  questions: Question[];
  currentQuestionIndex: number;
  isPaused?: boolean;
  isCompleted?: boolean;
  startTime: string;
  endTime?: string;
}

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

export interface Answer {
  questionId: string;
  text: string;
  submittedAt: Date;
}

// Add any other missing types that might be needed
export interface UploadResponse {
  candidateId: string;
  parsedData: {
    name: string;
    email: string;
    phone: string;
  };
  missingFields: string[];
}

export interface FilterOptions {
  status?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}