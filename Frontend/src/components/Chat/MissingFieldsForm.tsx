import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateParsedResumeData, createOrCheckCandidate } from '../../store/slices/candidateSlice';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

interface MissingFieldsFormProps {
  missingFields: string[];
}

const MissingFieldsForm: React.FC<MissingFieldsFormProps> = ({ missingFields }) => {
  const dispatch = useAppDispatch();
  const parsedResumeData = useAppSelector((state) => state.candidate.parsedResumeData);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phone.length >= 10 && phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (missingFields.includes('email') && formData.email && !validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (missingFields.includes('phone') && formData.phone && !validatePhone(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setSubmitting(true);
    
    try {
      // Update parsed resume data in Redux
      dispatch(updateParsedResumeData(formData));
      
      // Combine with existing parsed data
      const completeData = {
        ...parsedResumeData,
        ...formData
      };
      
      // Now check/create candidate
      const result = await dispatch(createOrCheckCandidate(completeData)).unwrap();
      
      if (result.exists && result.isCompleted) {
        toast.success('Welcome back! Loading your interview results...');
      } else if (result.exists && !result.isCompleted) {
        toast.success('Welcome back! Resuming your interview...');
      } else {
        toast.success('Profile created! Starting your interview...');
      }
      
    } catch (error: any) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Failed to process your information');
      }
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Complete Your Profile</h2>
      <p className="text-gray-600 mb-6">
        We need a few more details before proceeding.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {missingFields.includes('name') && (
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
        )}
        
        {missingFields.includes('email') && (
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>
        )}
        
        {missingFields.includes('phone') && (
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
            />
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={submitting || missingFields.some(field => !formData[field])}
        >
          {submitting ? 'Processing...' : 'Continue'}
        </Button>
      </form>
    </Card>
  );
};

export default MissingFieldsForm;