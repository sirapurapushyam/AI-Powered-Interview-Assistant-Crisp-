import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { decrementTime } from '../../store/slices/sessionSlice';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface QuestionTimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  isPaused: boolean;
}

const QuestionTimer: React.FC<QuestionTimerProps> = ({ timeLimit, onTimeUp, isPaused }) => {
  const dispatch = useAppDispatch();
  const timeRemaining = useAppSelector((state) => state.session.timeRemaining);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledTimeUp = useRef(false);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Reset the flag when a new question starts
    hasCalledTimeUp.current = false;
  }, [timeLimit]);

  useEffect(() => {
    if (!isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        dispatch(decrementTime());
      }, 1000);
    } else if (isPaused && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dispatch, isPaused, timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0 && !hasCalledTimeUp.current && !isPaused) {
      hasCalledTimeUp.current = true;
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp, isPaused]);

  const getTimerColor = () => {
    const percentage = (timeRemaining / timeLimit) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-4 mx-4 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span className="font-medium">Time Remaining: {formatTime(timeRemaining)}</span>
        </div>
        {isPaused && (
          <span className="text-sm text-yellow-600 font-medium">Paused</span>
        )}
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${getTimerColor()}`}
          style={{ width: `${(timeRemaining / timeLimit) * 100}%` }}
        />
      </div>
    </Card>
  );
};

export default QuestionTimer;