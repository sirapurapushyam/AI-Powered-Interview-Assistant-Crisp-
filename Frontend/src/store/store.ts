// frontend/src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import candidateReducer from './slices/candidateSlice';
import sessionReducer from './slices/sessionSlice';
import uiReducer from './slices/uiSlice';

const candidatePersistConfig = {
  key: 'candidate',
  storage,
  whitelist: ['currentCandidate', 'existingCandidateReturning']
};

const sessionPersistConfig = {
  key: 'session',
  storage,
  whitelist: [
    'currentSession',
    'currentQuestion',
    'questionNumber',
    'isInterviewActive',
    'timeRemaining',
    'isPaused',
    'currentQuestionIndex'
  ]
};

const persistedCandidateReducer = persistReducer(candidatePersistConfig, candidateReducer);
const persistedSessionReducer = persistReducer(sessionPersistConfig, sessionReducer);

export const store = configureStore({
  reducer: {
    candidate: persistedCandidateReducer,
    session: persistedSessionReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;