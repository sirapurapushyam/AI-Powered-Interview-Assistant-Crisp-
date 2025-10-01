// Alternative approach with explicit height calculation
import React, { useRef, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeUrl: string;
  candidateName: string;
}

const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  onClose,
  resumeUrl,
  candidateName,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(600);

  useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        const windowHeight = window.innerHeight;
        const headerHeight = 80; // Approximate header height
        const padding = 32; // Total vertical padding
        setContentHeight(windowHeight * 0.9 - headerHeight - padding);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [isOpen]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle>{candidateName}'s Resume</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {/* <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(resumeUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button> */}
              <Button
                // variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div ref={contentRef} className="p-2 overflow-hidden">
          <div 
            className="w-full bg-gray-100 rounded overflow-hidden"
            style={{ height: `${contentHeight}px` }}
          >
            {resumeUrl.toLowerCase().endsWith('.pdf') || resumeUrl.includes('/pdf/') ? (
              <iframe
                src={`${resumeUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0"
                title={`${candidateName}'s Resume`}
              />
            ) : (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`}
                className="w-full h-full border-0"
                title={`${candidateName}'s Resume`}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeModal;