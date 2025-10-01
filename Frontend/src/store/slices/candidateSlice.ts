// frontend/src/store/slices/candidateSlice.ts
import { createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import type { Candidate } from '../../types';

interface CandidateState {
  currentCandidate: Candidate | null;
  allCandidates: Candidate[];
  loading: boolean;
  error: string | null;
  parsedResumeData: any | null; // Store parsed data temporarily
}

const initialState: CandidateState = {
  currentCandidate: null,
  allCandidates: [],
  loading: false,
  error: null,
  parsedResumeData: null,
};

export const fetchCandidates = createAsyncThunk(
  'candidate/fetchAll',
  async (filters?: { status?: string; sortBy?: string }) => {
    const response = await api.getCandidates(filters);
    return response.data;
  }
);

export const uploadResume = createAsyncThunk(
  'candidate/uploadResume',
  async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.uploadResume(formData);
    return response.data;
  }
);

export const createOrCheckCandidate = createAsyncThunk(
  'candidate/createOrCheck',
  async (data: Record<string, string>) => {
    const response = await api.createOrCheckCandidate(data);
    return response.data;
  }
);

const candidateSlice = createSlice({
  name: 'candidate',
  initialState,
  reducers: {
    setCurrentCandidate: (state, action: PayloadAction<Candidate>) => {
      state.currentCandidate = action.payload;
    },
    updateCandidateInfo: (state, action: PayloadAction<Partial<Candidate>>) => {
      if (state.currentCandidate) {
        state.currentCandidate = { ...state.currentCandidate, ...action.payload };
      }
    },
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
    },
    resetCandidate: () => initialState,
    setParsedResumeData: (state, action: PayloadAction<any>) => {
      state.parsedResumeData = action.payload;
    },
    updateParsedResumeData: (state, action: PayloadAction<Partial<any>>) => {
      if (state.parsedResumeData) {
        state.parsedResumeData = { ...state.parsedResumeData, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.allCandidates = action.payload;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch candidates';
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        // Just store the parsed data, don't create candidate yet
        state.parsedResumeData = action.payload.parsedData;
      })
      
      .addCase(createOrCheckCandidate.fulfilled, (state, action) => {
        const { exists, candidateId, status, isCompleted, candidateData } = action.payload;
        
        if (exists && candidateData) {
          state.currentCandidate = {
            id: candidateId,
            name: candidateData.name,
            email: candidateData.email,
            phone: candidateData.phone,
            status: isCompleted ? 'completed' : status,
            final_score: candidateData.final_score,
            summary: candidateData.summary,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        } else {
          // New candidate created
          state.currentCandidate = {
            id: candidateId,
            name: state.parsedResumeData?.name || '',
            email: state.parsedResumeData?.email || '',
            phone: state.parsedResumeData?.phone || '',
            status: 'ready',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      });
  },
});

export const { 
  setCurrentCandidate, 
  updateCandidateInfo, 
  clearCurrentCandidate, 
  resetCandidate,
  setParsedResumeData,
  updateParsedResumeData
} = candidateSlice.actions;

export default candidateSlice.reducer;