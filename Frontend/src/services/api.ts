// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Resume operations
  uploadResume: (formData: FormData) => 
    apiClient.post('/interview/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // New endpoint to check or create candidate
  createOrCheckCandidate: (data: Record<string, string>) =>
    apiClient.post('/interview/create-or-check-candidate', data),

  updateCandidateInfo: (candidateId: string, data: Record<string, string>) =>
    apiClient.post(`/interview/update-candidate-info/${candidateId}`, data),

  // Interview operations
  startInterview: (candidateId: string) =>
    apiClient.post(`/interview/start-interview/${candidateId}`),

  submitAnswer: (sessionId: string, answer: string) =>
    apiClient.post(`/interview/submit-answer/${sessionId}`, { answer }),

  // Candidate operations
  getCandidates: (params?: { status?: string; sortBy?: string }) =>
    apiClient.get('/candidates', { params }),

  getCandidateDetails: (candidateId: string) =>
    apiClient.get(`/candidates/${candidateId}`),
};