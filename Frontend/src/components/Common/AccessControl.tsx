import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface AccessControlProps {
  children: React.ReactNode;
}

const AccessControl: React.FC<AccessControlProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Check if already authenticated from localStorage
  React.useEffect(() => {
    const authStatus = localStorage.getItem('interviewer_auth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple password check - in production, this should be server-side
    if (password === 'interviewer123') {
      setIsAuthenticated(true);
      localStorage.setItem('interviewer_auth', 'authenticated');
      toast.success('Access granted!');
    } else {
      toast.error('Invalid password');
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto p-6 mt-8">
        <div className="text-center mb-6">
          <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold">Interviewer Access Required</h2>
          <p className="text-gray-600 mt-2">
            This dashboard is restricted to authorized interviewers only.
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter interviewer password"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Access Dashboard
          </Button>
        </form>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          For demo purposes, use password: interviewer123
        </p>
      </Card>
    );
  }

  return <>{children}</>;
};

export default AccessControl;