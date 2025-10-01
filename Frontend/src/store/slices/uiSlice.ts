// frontend/src/store/slices/uiSlice.ts
import { createSlice} from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isLoading: boolean;
  error: string | null;
  welcomeBackModalOpen: boolean;
  welcomeBackData: {
    candidateName: string;
    questionNumber: number;
  } | null;
}

const initialState: UIState = {
  isLoading: false,
  error: null,
  welcomeBackModalOpen: false,
  welcomeBackData: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    showWelcomeBackModal: (state, action: PayloadAction<{ candidateName: string; questionNumber: number }>) => {
      state.welcomeBackModalOpen = true;
      state.welcomeBackData = action.payload;
    },
    hideWelcomeBackModal: (state) => {
      state.welcomeBackModalOpen = false;
      state.welcomeBackData = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setLoading, setError, showWelcomeBackModal, hideWelcomeBackModal, clearError } = uiSlice.actions;
export default uiSlice.reducer;