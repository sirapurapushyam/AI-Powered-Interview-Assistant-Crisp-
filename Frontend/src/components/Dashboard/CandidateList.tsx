// frontend/src/components/Dashboard/CandidateList.tsx
import React from 'react';
// import { Candidate } from '../../types';
import type { Candidate } from '../../types';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, Trophy } from 'lucide-react';

interface CandidateListProps {
  candidates: Candidate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  selectedId,
  onSelect,
  loading
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      {candidates.map((candidate) => (
        <div
          key={candidate.id}
          onClick={() => onSelect(candidate.id)}
          className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
            selectedId === candidate.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              {candidate.name}
            </h3>
            <Badge className={getStatusColor(candidate.status)} variant="secondary">
              {candidate.status}
            </Badge>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              {candidate.email}
            </p>
            {candidate.final_score !== undefined && (
              <p className="flex items-center gap-2 font-medium">
                <Trophy className="h-3 w-3" />
                Score: {candidate.final_score}/20
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CandidateList;