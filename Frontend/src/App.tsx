// frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
import TabLayout from './components/Layout/TabLayout';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure redux-persist has rehydrated
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <TabLayout />
        <Toaster position="top-right" />
      </div>
    </ErrorBoundary>
  );
}

export default App;