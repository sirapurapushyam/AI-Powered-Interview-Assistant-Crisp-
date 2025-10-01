// frontend/src/components/Layout/TabLayout.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntervieweeTab from '../Chat/IntervieweeTab';
import InterviewerDashboard from '../Dashboard/InterviewerDashboard';
import WelcomeBackModal from '../Common/WelcomeBackModal';
import AccessControl from '../Common/AccessControl';

const TabLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('interviewee');

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold text-center mb-6">AI Interview Assistant</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interviewee">Interviewee</TabsTrigger>
          <TabsTrigger value="interviewer">Interviewer Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interviewee" className="mt-6">
          <IntervieweeTab />
          <WelcomeBackModal />
        </TabsContent>
        
        <TabsContent value="interviewer" className="mt-6">
          <AccessControl>
            <InterviewerDashboard />
          </AccessControl>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabLayout;