// frontend/src/components/Dashboard/InterviewerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchCandidates } from '../../store/slices/candidateSlice';
import CandidateList from './CandidateList';
import CandidateDetails from './CandidateDetails';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

const InterviewerDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const candidates = useAppSelector((state) => state.candidate.allCandidates);
  const loading = useAppSelector((state) => state.candidate.loading);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('final_score');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchCandidates({ 
      status: filterStatus !== 'all' ? filterStatus : undefined, 
      sortBy 
    }));
  }, [dispatch, filterStatus, sortBy]);

  // Improved filter with better null/undefined handling
  const filteredCandidates = React.useMemo(() => {
    if (!Array.isArray(candidates)) {
      return [];
    }

    return candidates.filter(candidate => {
      // Skip if candidate is null/undefined
      if (!candidate) return false;
      
      // If no search term, return all candidates
      if (!searchTerm || searchTerm.trim() === '') {
        return true;
      }
      
      // Safely get values with fallback to empty string
      const name = (candidate.name || '').toString();
      const email = (candidate.email || '').toString();
      const phone = (candidate.phone || '').toString();
      const search = searchTerm.toLowerCase().trim();
      
      // Search in name, email, and phone
      return name.toLowerCase().includes(search) || 
             email.toLowerCase().includes(search) ||
             phone.toLowerCase().includes(search);
    });
  }, [candidates, searchTerm]);

  // Sort candidates with proper null handling
  const sortedCandidates = React.useMemo(() => {
    if (!Array.isArray(filteredCandidates)) {
      return [];
    }

    return [...filteredCandidates].sort((a, b) => {
      // Ensure both candidates exist
      if (!a || !b) return 0;
      
      switch (sortBy) {
        case 'final_score':
          // Handle null/undefined scores - put them at the end
          const scoreA = a.final_score ?? -1;
          const scoreB = b.final_score ?? -1;
          return scoreB - scoreA; // Descending order
        
        case 'created_at':
          // Sort by date, newest first
          const dateA = a.createdAt || a.created_at || '';
          const dateB = b.createdAt || b.created_at || '';
          
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        
        case 'name':
          // Sort alphabetically with null handling
          const nameA = (a.name || '').toString().toLowerCase();
          const nameB = (b.name || '').toString().toLowerCase();
          
          if (!nameA && !nameB) return 0;
          if (!nameA) return 1;
          if (!nameB) return -1;
          
          return nameA.localeCompare(nameB);
        
        default:
          return 0;
      }
    });
  }, [filteredCandidates, sortBy]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Candidates</h2>
          
          <div className="space-y-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="collecting-info">Collecting Info</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="final_score">Score</SelectItem>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <CandidateList
            candidates={sortedCandidates}
            selectedId={selectedCandidate}
            onSelect={setSelectedCandidate}
            loading={loading}
          />
        </Card>
      </div>
      
      <div className="lg:col-span-2">
        {selectedCandidate ? (
          <CandidateDetails candidateId={selectedCandidate} />
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Select a candidate to view details</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InterviewerDashboard;