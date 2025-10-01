// frontend/src/store/slices/sessionSlice.ts
import { createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import type { InterviewSession, Question } from '../../types';

interface SessionState {
  currentSession: InterviewSession | null;
  currentQuestion: Question | null;
  questionNumber: number;
  isInterviewActive: boolean;
  timeRemaining: number;
  isPaused: boolean;
  currentQuestionIndex: number;
  completedInterviewData: any | null; // Add this to store completed interview data
}

const initialState: SessionState = {
  currentSession: null,
  currentQuestion: null,
  questionNumber: 0,
  isInterviewActive: false,
  timeRemaining: 0,
  isPaused: false,
  currentQuestionIndex: 0,
  completedInterviewData: null,
};

export const startInterview = createAsyncThunk(
  'session/start',
  async (candidateId: string) => {
    const response = await api.startInterview(candidateId);
    return response.data;
  }
);

export const submitAnswer = createAsyncThunk(
  'session/submitAnswer',
  async ({ sessionId, answer }: { sessionId: string; answer: string }) => {
    const response = await api.submitAnswer(sessionId, answer);
    return response.data;
  }
);

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    decrementTime: (state) => {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
    },
    pauseInterview: (state) => {
      state.isPaused = true;
      console.log('Interview paused, current state:', {
        timeRemaining: state.timeRemaining,
        questionNumber: state.questionNumber,
        isInterviewActive: state.isInterviewActive
      });
    },
    resumeInterview: (state) => {
      state.isPaused = false;
      console.log('Interview resumed, current state:', {
        timeRemaining: state.timeRemaining,
        questionNumber: state.questionNumber,
        isInterviewActive: state.isInterviewActive
      });
    },
    resetSession: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(startInterview.fulfilled, (state, action) => {
        // Handle completed interview response
        if (action.payload.interview_completed) {
          state.completedInterviewData = {
            sessionId: action.payload.session_id,
            finalScore: action.payload.final_score,
            summary: action.payload.summary,
            questions: action.payload.questions,
            completedAt: action.payload.completed_at,
          };
          state.isInterviewActive = false;
          return;
        }
        
        // Handle normal interview start/resume
        const sessionId = action.payload.session_id || action.payload.sessionId;
        const question = action.payload.question;
        const resuming = action.payload.resuming || false;
        const questionNumber = action.payload.question_number || action.payload.questionNumber || 1;
        const elapsedTime = action.payload.elapsed_time || 0;
        const currentQuestionIndex = action.payload.current_question_index || 0;
        
        state.currentSession = {
          id: sessionId,
          candidateId: action.payload.candidateId || '',
          questions: [],
          currentQuestionIndex: currentQuestionIndex,
          isPaused: false,
          isCompleted: false,
          startTime: new Date().toISOString(),
        };
        
        state.currentQuestion = {
          ...question,
          timeLimit: question.timeLimit || question.time_limit
        };
        
        state.questionNumber = questionNumber;
        state.isInterviewActive = true;
        state.isPaused = false;
        state.currentQuestionIndex = currentQuestionIndex;
        
        // Calculate remaining time based on elapsed time
        const totalTime = question.timeLimit || question.time_limit || 60;
        state.timeRemaining = Math.max(0, totalTime - elapsedTime);
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        // Handle already answered case
        if (action.payload.already_answered) {
          state.questionNumber = action.payload.question_number;
          return;
        }
        
        if (action.payload.completed) {
          state.isInterviewActive = false;
          if (state.currentSession) {
            state.currentSession.isCompleted = true;
          }
          // Don't reset question number - keep it at 6 to indicate completion
        } else if (action.payload.next_question || action.payload.nextQuestion) {
          const nextQuestion = action.payload.next_question || action.payload.nextQuestion;
          state.currentQuestion = {
            ...nextQuestion,
            timeLimit: nextQuestion.timeLimit || nextQuestion.time_limit
          };
          state.questionNumber = action.payload.question_number || action.payload.questionNumber || state.questionNumber + 1;
          state.timeRemaining = nextQuestion.timeLimit || nextQuestion.time_limit || 60;
          state.currentQuestionIndex = state.currentQuestionIndex + 1;
        }
      });
  },
});

export const {
  setTimeRemaining,
  decrementTime,
  pauseInterview,
  resumeInterview,
  resetSession,
} = sessionSlice.actions;

export default sessionSlice.reducer;