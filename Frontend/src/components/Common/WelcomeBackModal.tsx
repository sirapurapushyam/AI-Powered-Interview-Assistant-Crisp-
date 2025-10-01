// frontend/src/components/Common/WelcomeBackModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { resumeInterview, resetSession, pauseInterview } from '@/store/slices/sessionSlice';
import { resetCandidate } from '@/store/slices/candidateSlice';


const WelcomeBackModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector((state) => state.session.currentSession);
  const isInterviewActive = useAppSelector((state) => state.session.isInterviewActive);
  const currentCandidate = useAppSelector((state) => state.candidate.currentCandidate);
  const questionNumber = useAppSelector((state) => state.session.questionNumber);
  const timeRemaining = useAppSelector((state) => state.session.timeRemaining);

  useEffect(() => {
    // Only check once after rehydration
    if (!hasChecked) {
      const checkTimer = setTimeout(() => {
        // Debug log to see what's happening
        console.log('WelcomeBackModal check:', {
          currentSession,
          isInterviewActive,
          currentCandidate,
          questionNumber
        });
        
        if (
          currentSession && 
          currentSession.id &&
          isInterviewActive === true && 
          !currentSession.isCompleted && 
          currentCandidate &&
          questionNumber > 0
        ) {
          console.log('Showing welcome back modal');
          dispatch(pauseInterview());
          setIsOpen(true);
        }
        setHasChecked(true);
      }, 2000); // Give more time for state rehydration

      return () => clearTimeout(checkTimer);
    }
  }, [currentSession, isInterviewActive, currentCandidate, questionNumber, dispatch, hasChecked]);

  const handleResume = () => {
    dispatch(resumeInterview());
    setIsOpen(false);
  };

  const handleNewSession = () => {
    dispatch(resetSession());
    dispatch(resetCandidate());
    setIsOpen(false);
    // Clear specific persist keys instead of entire root
    localStorage.removeItem('persist:candidate');
    localStorage.removeItem('persist:session');
    window.location.reload();
  };

  // Format time properly
  const formatTimeDisplay = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentCandidate || !currentSession || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome Back, {currentCandidate.name}!</DialogTitle>
          <DialogDescription>
            You have an unfinished interview session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-2">
          <p className="text-sm">
            <strong>Progress:</strong> Question {questionNumber} of 6
          </p>
          <p className="text-sm">
            <strong>Time remaining on current question:</strong> {formatTimeDisplay(timeRemaining)}
          </p>
          <p className="text-sm text-gray-600 mt-3">
            Would you like to continue where you left off or stop the interview?
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Note: Stopping the interview will start from next question.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleNewSession}>
            Stop Interview
          </Button>
          <Button onClick={handleResume}>
            Resume Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeBackModal;