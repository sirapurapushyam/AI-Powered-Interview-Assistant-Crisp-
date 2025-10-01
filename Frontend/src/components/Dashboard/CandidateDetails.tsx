// frontend/src/components/Dashboard/CandidateDetails.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Calendar, Trophy, Clock, CheckCircle, XCircle, FileText, Eye } from 'lucide-react';
import ResumeModal from './ResumeModal';

interface CandidateDetailsProps {
  candidateId: string;
}

const CandidateDetails: React.FC<CandidateDetailsProps> = ({ candidateId }) => {
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await api.getCandidateDetails(candidateId);
        console.log('Candidate details:', response.data);
        setCandidate(response.data);
      } catch (error) {
        console.error('Failed to fetch candidate details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [candidateId]);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
    );
  }

  if (!candidate) {
    return (
      <Card className="p-6">
        <p className="text-red-500">Failed to load candidate details</p>
      </Card>
    );
  }

  const getMaxScoreForDifficulty = (difficulty: string): number => {
    switch (difficulty) {
      case 'easy': return 2;
      case 'medium': return 3;
      case 'hard': return 5;
      default: return 3;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreVariant = (score: number | null, maxScore: number): "default" | "secondary" | "destructive" => {
    if (score === null) return "secondary";
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70) return "default";
    if (percentage >= 40) return "secondary";
    return "destructive";
  };

  return (
    <>
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <User className="h-6 w-6" />
                {candidate.name}
              </h2>
              <div className="text-gray-600 mt-2 space-y-1">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {candidate.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {candidate.phone}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Applied: {new Date(candidate.created_at).toLocaleString()}
                </p>
              </div>
              
              {/* Resume View Button */}
              {candidate.resume_url && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResumeModalOpen(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Resume
                    <Eye className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <Badge className="mb-2" variant={candidate.status === 'completed' ? 'default' : 'secondary'}>
                {candidate.status}
              </Badge>
              {candidate.final_score !== undefined && (
                <p className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  {candidate.final_score}/20
                </p>
              )}
            </div>
          </div>
          
          {candidate.summary && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">AI Summary</h3>
              <p className="text-gray-700">{candidate.summary}</p>
            </div>
          )}
        </div>

        {candidate.session && (
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
              <TabsTrigger value="chat">Interview Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="questions" className="mt-4">
              <div className="space-y-4">
                {candidate.session.questions && candidate.session.questions.length > 0 ? (
                  candidate.session.questions.map((question: any, index: number) => {
                    const maxScore = getMaxScoreForDifficulty(question.difficulty);
                    return (
                      <Card key={question.id} className="p-4">
                        <div className="mb-2">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                Question {index + 1}
                              </h4>
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {question.answer !== null && (
                                <Badge variant={getScoreVariant(question.score, maxScore)}>
                                  Score: {question.score ?? 0}/{maxScore}
                                </Badge>
                              )}
                              {question.answer === null && (
                                <Badge variant="outline" className="text-gray-500">
                                  Not answered
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{question.text}</p>
                        </div>
                        
                        {question.answer !== null ? (
                          <div className="border-t pt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <p className="font-medium">Answer:</p>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                              {question.answer || "No answer provided"}
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
                  })
                ) : (
                  <Card className="p-6 text-center text-gray-500">
                    <p>No questions found for this interview session</p>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="chat" className="mt-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">Interview Timeline</h3>
                  
                  {/* Resume Upload */}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">Resume Uploaded</p>
                      <p className="text-sm text-gray-500">
                        {new Date(candidate.created_at).toLocaleString()}
                      </p>
                      {candidate.resume_url && (
                        <p className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline"
                           onClick={() => setIsResumeModalOpen(true)}>
                          View uploaded resume
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Rest of timeline content remains the same */}
                  {candidate.session?.start_time && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">Interview Started</p>
                        <p className="text-sm text-gray-500">
                          {new Date(candidate.session.start_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Questions Timeline */}
                  {candidate.session?.questions?.map((q: any, idx: number) => {
                    const maxScore = getMaxScoreForDifficulty(q.difficulty);
                    return (
                      <div key={q.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          q.answer !== null ? 'bg-blue-500' : 'bg-gray-300'
                        }`}></div>
                        <div className="flex-1">
                          <p className="font-medium">
                            Question {idx + 1} ({q.difficulty})
                            {q.answer !== null ? ' - Answered' : ' - Skipped'}
                          </p>
                          {q.start_time && (
                            <p className="text-sm text-gray-500">
                              {new Date(q.start_time).toLocaleString()}
                              {q.end_time && ` - ${new Date(q.end_time).toLocaleString()}`}
                            </p>
                          )}
                          {q.score !== null && (
                            <p className="text-sm text-gray-600 mt-1">
                              Score: {q.score}/{maxScore}
                            </p>
                                                   )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Interview End */}
                  {candidate.session?.is_completed && candidate.session?.end_time && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">Interview Completed</p>
                        <p className="text-sm text-gray-500">
                          {new Date(candidate.session.end_time).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Final Score: {candidate.final_score}/20
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!candidate.session?.is_completed && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 animate-pulse"></div>
                      <div className="flex-1">
                        <p className="font-medium text-yellow-600">Interview In Progress</p>
                        <p className="text-sm text-gray-500">
                          Currently on question {(candidate.session?.current_question_index ?? 0) + 1}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        
        {!candidate.session && (
          <Card className="p-6 text-center text-gray-500">
            <p>No interview session found for this candidate</p>
          </Card>
        )}
      </Card>

      {/* Resume Modal */}
      {candidate?.resume_url && (
        <ResumeModal
          isOpen={isResumeModalOpen}
          onClose={() => setIsResumeModalOpen(false)}
          resumeUrl={candidate.resume_url}
          candidateName={candidate.name}
        />
      )}
    </>
  );
};

export default CandidateDetails;
                          