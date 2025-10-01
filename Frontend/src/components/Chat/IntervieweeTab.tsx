// frontend/src/components/Chat/IntervieweeTab.tsx
import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import FileUpload from '../Common/FileUpload';
import ChatInterface from './ChatInterface';
import MissingFieldsForm from './MissingFieldsForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resetCandidate, createOrCheckCandidate } from '@/store/slices/candidateSlice';
import { resetSession } from '@/store/slices/sessionSlice';
import { Trophy, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';

const IntervieweeTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentCandidate = useAppSelector((state) => state.candidate.currentCandidate);
  const parsedResumeData = useAppSelector((state) => state.candidate.parsedResumeData);
  const isInterviewActive = useAppSelector((state) => state.session.isInterviewActive);
  const [candidateDetails, setCandidateDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [shouldCreateCandidate, setShouldCreateCandidate] = useState(false);

  // Helper function to get max score for difficulty
  const getMaxScoreForDifficulty = (difficulty: string): number => {
    switch (difficulty) {
      case 'easy': return 2;
      case 'medium': return 3;
      case 'hard': return 5;
      default: return 3;
    }
  };

  // Helper function to get score badge variant based on percentage
  const getScoreBadgeVariant = (score: number, maxScore: number): "default" | "secondary" | "destructive" => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70) return "default";
    if (percentage >= 40) return "secondary";
    return "destructive";
  };

  // Fetch candidate details if completed
  useEffect(() => {
    if (currentCandidate?.id && currentCandidate.status === 'completed' && !isInterviewActive) {
      setLoading(true);
      api.getCandidateDetails(currentCandidate.id)
        .then(response => {
          setCandidateDetails(response.data);
        })
        .catch(error => {
          console.error('Failed to fetch candidate details:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [currentCandidate?.id, currentCandidate?.status, isInterviewActive]);

  // Handle auto-create candidate when all fields are present
  useEffect(() => {
    if (shouldCreateCandidate && parsedResumeData && !currentCandidate) {
      const { name, email, phone } = parsedResumeData;
      if (name && email && phone) {
        dispatch(createOrCheckCandidate(parsedResumeData));
        setShouldCreateCandidate(false);
      }
    }
  }, [shouldCreateCandidate, parsedResumeData, currentCandidate, dispatch]);

  // Check if we should auto-create candidate
  useEffect(() => {
    if (parsedResumeData && !currentCandidate) {
      const { name, email, phone } = parsedResumeData;
      if (name && email && phone) {
        setShouldCreateCandidate(true);
      }
    }
  }, [parsedResumeData, currentCandidate]);

  const handleResumeUploaded = async (data: any) => {
    console.log('Resume parsed:', data);
    // Data is now stored in Redux, we'll handle the database check after fields are complete
  };

  const handleStartOver = () => {
    dispatch(resetCandidate());
    dispatch(resetSession());
    localStorage.removeItem('persist:candidate');
    localStorage.removeItem('persist:session');
    window.location.reload();
  };

  // Loading state for completed interview
  if (loading) {
    return (
      <Card className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
      </Card>
    );
  }

  // No resume uploaded yet
  if (!parsedResumeData && !currentCandidate) {
    return (
      <Card className="p-8">
        <h2 className="text-2xl font-semibold mb-6">Welcome to AI Interview Assistant</h2>
        <p className="text-gray-600 mb-8">
          Please upload your resume to begin the interview process.
        </p>
        <FileUpload onUploadComplete={handleResumeUploaded} />
      </Card>
    );
  }

  // Check if interview is completed and show results
  if (currentCandidate && currentCandidate.status === 'completed' && candidateDetails && !isInterviewActive) {
    return (
      <Card className="p-8 max-w-4xl mx-auto max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-8">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-semibold mb-4">Interview Completed!</h2>
          <p className="text-gray-600 mb-2">
            {currentCandidate.name}, you have already completed your interview.
          </p>
          <p className="text-lg font-semibold">
            Final Score: {candidateDetails.final_score || 0}/20
          </p>
        </div>

        {/* AI Summary */}
        {candidateDetails.summary && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">AI Summary</h3>
            <p className="text-gray-700">{candidateDetails.summary}</p>
          </div>
        )}

        {/* Questions and Answers */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Your Interview Performance</h3>
          <div className="space-y-4">
            {candidateDetails.session?.questions?.map((question: any, index: number) => {
              const maxScore = getMaxScoreForDifficulty(question.difficulty);
              return (
                <Card key={question.id} className="p-4">
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">
                        Question {index + 1} ({question.difficulty})
                      </h4>
                      {question.score !== null && question.score !== undefined && (
                        <Badge variant={getScoreBadgeVariant(question.score, maxScore)}>
                          Score: {question.score}/{maxScore}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700">{question.text}</p>
                  </div>
                  
                  {question.answer !== null ? (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <p className="font-medium">Your Answer:</p>
                      </div>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                        {question.answer}
                      </p>
                      
                      {question.feedback && (
                        <div className="mt-3 bg-blue-50 p-3 rounded">
                          <p className="font-medium mb-1">AI Feedback:</p>
                          <p className="text-sm">{question.feedback}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-t pt-3 text-gray-500">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        <p>Question not answered</p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            To start a new interview, you'll need to use a different email address or clear your current session.
          </p>
          <Button onClick={handleStartOver} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Start New Interview
          </Button>
        </div>
      </Card>
    );
  }

  // Check for missing fields in parsed resume data
  if (parsedResumeData && !currentCandidate) {
    const missingFields = [];
    if (!parsedResumeData.name) missingFields.push('name');
    if (!parsedResumeData.email) missingFields.push('email');
    if (!parsedResumeData.phone) missingFields.push('phone');
    
    if (missingFields.length > 0) {
      return <MissingFieldsForm missingFields={missingFields} />;
    }
  }

  // Show chat interface if candidate is ready
  if (currentCandidate) {
    return <ChatInterface />;
  }

  // Default loading state
  return (
    <Card className="p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-sm">Processing...</p>
      </div>
    </Card>
  );
};

export default IntervieweeTab;