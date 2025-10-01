// frontend/src/components/Chat/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { submitAnswer, startInterview, setTimeRemaining } from '../../store/slices/sessionSlice';
import MessageBubble from './MessageBubble';
import QuestionTimer from './QuestionTimer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, AlertCircle, Trophy, CheckCircle, XCircle, RotateCcw, User, Mail, Phone } from 'lucide-react';
import { updateCandidateInfo, resetCandidate } from '../../store/slices/candidateSlice';
import { resetSession } from '../../store/slices/sessionSlice';
import { api } from '../../services/api';
import { toast } from "react-hot-toast";

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

let messageIdCounter = 0;
const generateMessageId = () => {
  messageIdCounter += 1;
  return `msg_${Date.now()}_${messageIdCounter}`;
};

const ChatInterface: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentQuestion = useAppSelector((state) => state.session.currentQuestion);
  const sessionId = useAppSelector((state) => state.session.currentSession?.id);
  const questionNumber = useAppSelector((state) => state.session.questionNumber);
  const isActive = useAppSelector((state) => state.session.isInterviewActive);
  const currentCandidate = useAppSelector((state) => state.candidate.currentCandidate);
  const isPaused = useAppSelector((state) => state.session.isPaused);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [candidateDetails, setCandidateDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousQuestionId = useRef<string | null>(null);
  const isResuming = useRef(false);

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

  const completedInterviewData = useAppSelector((state) => state.session.completedInterviewData);
  
  useEffect(() => {
    if (currentCandidate?.status === 'completed' && !isActive && !candidateDetails) {
      if (completedInterviewData) {
        setCandidateDetails({
          ...currentCandidate,
          final_score: completedInterviewData.finalScore,
          summary: completedInterviewData.summary,
          session: {
            questions: completedInterviewData.questions,
            _id: completedInterviewData.sessionId,
            is_completed: true,
            end_time: completedInterviewData.completedAt
          }
        });
      } else {
        setLoadingDetails(true);
        api.getCandidateDetails(currentCandidate.id)
          .then(response => {
            setCandidateDetails(response.data);
          })
          .catch(error => {
            console.error('Failed to fetch candidate details:', error);
          })
          .finally(() => {
            setLoadingDetails(false);
          });
      }
    }
  }, [currentCandidate, isActive, candidateDetails, completedInterviewData]);

  useEffect(() => {
    if (currentCandidate?.status === 'completed' && !isActive && !candidateDetails) {
      setLoadingDetails(true);
      api.getCandidateDetails(currentCandidate.id)
        .then(response => {
          setCandidateDetails(response.data);
        })
        .catch(error => {
          console.error('Failed to fetch candidate details:', error);
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [currentCandidate, isActive, candidateDetails]);

  useEffect(() => {
    if (!hasInitialized && isActive && sessionId && currentQuestion) {
      setMessages([
        {
          id: generateMessageId(),
          type: 'bot',
          content: 'Welcome back! Continuing your interview...',
          timestamp: new Date()
        },
        {
          id: generateMessageId(),
          type: 'bot',
          content: `Question ${questionNumber}/6 (${currentQuestion.difficulty}): ${currentQuestion.text}`,
          timestamp: new Date()
        }
      ]);
      setHasInitialized(true);
    }
  }, [isActive, sessionId, currentQuestion, questionNumber, hasInitialized]);

  useEffect(() => {
    if (currentQuestion && isActive && hasInitialized && !isPaused) {
      const lastMessage = messages[messages.length - 1];
      const questionText = `Question ${questionNumber}/6 (${currentQuestion.difficulty}): ${currentQuestion.text}`;
      
      if (!lastMessage || !lastMessage.content.includes(currentQuestion.text)) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          type: 'bot',
          content: questionText,
          timestamp: new Date()
        }]);
      }
    }
  }, [currentQuestion?.id, questionNumber, isActive, hasInitialized, isPaused]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fixed timer reset logic - only reset for truly new questions
  useEffect(() => {
    if (currentQuestion && isActive && !isResuming.current) {
      // Only reset timer if this is actually a new question (not resuming)
      if (previousQuestionId.current !== currentQuestion.id && previousQuestionId.current !== null) {
        previousQuestionId.current = currentQuestion.id;
        const newTimeLimit = currentQuestion.timeLimit || currentQuestion.time_limit || 60;
        dispatch(setTimeRemaining(newTimeLimit));
      } else if (previousQuestionId.current === null) {
        // First question and not resuming
        previousQuestionId.current = currentQuestion.id;
      }
    }
  }, [currentQuestion, isActive, dispatch]);

  const handleStartInterview = async () => {
    if (!currentCandidate?.id) return;
    
    setIsStarting(true);
    try {
      const result = await dispatch(startInterview(currentCandidate.id)).unwrap();
      
      if (result.interview_completed) {
        toast('Your interview is already completed. Loading your results...');
        
        if (currentCandidate) {
          dispatch(updateCandidateInfo({ 
            status: 'completed',
            final_score: result.final_score,
            summary: result.summary
          }));
        }
        
        setCandidateDetails({
          ...currentCandidate,
          final_score: result.final_score,
          summary: result.summary,
          session: {
            questions: result.questions,
            _id: result.session_id,
            is_completed: true,
            end_time: result.completed_at
          }
        });
        
        return;
      }
      
      if (result.resuming) {
        toast.success('Resuming your interview...');
        isResuming.current = true;
        
        // Calculate and set the correct remaining time when resuming
        const timeLimit = result.question.timeLimit || result.question.time_limit || 60;
        const elapsedTime = result.elapsed_time || 0;
        const remainingTime = Math.max(0, timeLimit - elapsedTime);
        
        // Set the remaining time instead of full time
        dispatch(setTimeRemaining(remainingTime));
        
        // Set the current question ID so we don't reset timer again
        if (result.question) {
          previousQuestionId.current = result.question.id;
        }
        
        setHasInitialized(true);
        
        // Reset resuming flag after a short delay
        setTimeout(() => {
          isResuming.current = false;
        }, 1000);
      } else {
        toast.success('Interview started! Good luck!');
        isResuming.current = false;
        
        // For new interview, set the initial timer
        const timeLimit = result.question?.timeLimit || result.question?.time_limit || 60;
        dispatch(setTimeRemaining(timeLimit));
        
        setMessages([{
          id: generateMessageId(),
          type: 'bot',
          content: 'Welcome to your AI Interview! I will ask you 6 questions about Full Stack Development (React/Node.js).\n\nScoring:\n• Easy questions (2): 2 marks each\n• Medium questions (2): 3 marks each\n• Hard questions (2): 5 marks each\n\nTotal: 20 marks. Let\'s begin!',
          timestamp: new Date()
        }]);
        setHasInitialized(true);
      }
    } catch (error: any) {
      console.error('Start interview error:', error);
      toast.error('Failed to start interview. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmit = async (autoSubmit: boolean = false) => {
    if (!sessionId || isSubmitting) return;

    if (!autoSubmit && !answer.trim()) return;

    setIsSubmitting(true);
    
    const submittedAnswer = answer.trim() || (autoSubmit ? "[No answer provided - Time expired]" : "");
    
    setMessages(prev => [...prev, {
      id: generateMessageId(),
      type: 'user',
      content: submittedAnswer,
      timestamp: new Date()
    }]);

    try {
      const result = await dispatch(submitAnswer({ sessionId, answer: submittedAnswer })).unwrap();
      
      if (result.already_answered) {
        toast.info('Moving to next question...');
        setAnswer('');
        return;
      }
      
      if (result.evaluation && currentQuestion) {
        const maxScore = getMaxScoreForDifficulty(currentQuestion.difficulty);
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          type: 'bot',
          content: `Score: ${result.evaluation.score || 0}/${maxScore}. ${result.evaluation.feedback || 'Answer received.'}`,
          timestamp: new Date()
        }]);
      }

      if (result.completed) {
        const finalScore = result.final_score || result.finalScore || 0;
        const summary = result.summary || 'Interview completed successfully.';
        
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          type: 'bot',
          content: `Interview completed! Final score: ${finalScore}/20\n\n${summary}`,
          timestamp: new Date()
        }]);
        
        if (currentCandidate) {
          dispatch(updateCandidateInfo({ status: 'completed' }));
        }
        
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
      
      setAnswer('');
    } catch (error) {
      console.error('Failed to submit answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    if (!isSubmitting) {
      handleSubmit(true);
    }
  };

  const handleStartOver = () => {
    dispatch(resetCandidate());
    dispatch(resetSession());
    localStorage.removeItem('persist:candidate');
    localStorage.removeItem('persist:session');
    window.location.reload();
  };

  if (currentCandidate?.status === 'completed' && !isActive) {
    if (loadingDetails) {
      return (
        <Card className="w-full max-w-4xl mx-auto p-8">
          <div className="text-center">
                       <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto mb-6" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
      );
    }

    if (candidateDetails) {
      return (
        <Card className="w-full max-w-4xl mx-auto p-8 max-h-[80vh] overflow-y-auto">
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

          {candidateDetails.summary && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">AI Summary</h3>
              <p className="text-gray-700">{candidateDetails.summary}</p>
            </div>
          )}

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
              }) || (
                <p className="text-gray-500 text-center">No questions found</p>
              )}
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

    return (
      <Card className="w-full max-w-4xl mx-auto p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-semibold mb-4">Interview Already Completed</h2>
          <p className="text-gray-600 mb-4">
            You have already completed your interview. 
          </p>
          <Button onClick={handleStartOver} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Start New Interview
          </Button>
        </div>
      </Card>
    );
  }

  if (!isActive && !sessionId) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to Start Your Interview?</h2>
        
        {/* Display candidate information */}
        {currentCandidate && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 max-w-md mx-auto">
            <h3 className="font-semibold mb-3 text-left text-blue-900">Your Information:</h3>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="font-medium text-gray-700 min-w-[60px]">Name:</span>
                <span className="text-gray-900">{currentCandidate.name || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="font-medium text-gray-700 min-w-[60px]">Email:</span>
                <span className="text-gray-900 break-all">{currentCandidate.email || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="font-medium text-gray-700 min-w-[60px]">Phone:</span>
                <span className="text-gray-900">{currentCandidate.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-gray-600 mb-6">
          You'll be asked 6 technical questions about Full Stack Development.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
          <h3 className="font-semibold mb-2">Scoring System:</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• 2 Easy questions: 2 marks each (20 seconds)</li>
            <li>• 2 Medium questions: 3 marks each (60 seconds)</li>
            <li>• 2 Hard questions: 5 marks each (120 seconds)</li>
            <li className="font-semibold pt-2">Total: 20 marks</li>
          </ul>
        </div>
        
        <Button 
          onClick={handleStartInterview} 
          disabled={isStarting}
          size="lg"
        >
          {isStarting ? 'Starting Interview...' : 'Start Interview'}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isActive && currentQuestion && (
        <>
          <QuestionTimer
            key={currentQuestion.id}
            timeLimit={currentQuestion.timeLimit || currentQuestion.time_limit || 60}
            onTimeUp={handleTimeUp}
            isPaused={isPaused}
          />
          
          <div className="p-4 border-t">
            <div className="mb-2 flex justify-between items-center text-sm text-gray-600">
              <span>Question {questionNumber}/6 ({currentQuestion.difficulty})</span>
              <span>Max Score: {getMaxScoreForDifficulty(currentQuestion.difficulty)} marks</span>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="flex-1"
                rows={3}
                disabled={isSubmitting}
              />
              <Button
                onClick={() => handleSubmit(false)}
                disabled={!answer.trim() || isSubmitting}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default ChatInterface;