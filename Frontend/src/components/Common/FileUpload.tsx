// frontend/src/components/Common/FileUpload.tsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { uploadResume, createOrCheckCandidate } from '../../store/slices/candidateSlice';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onUploadComplete: (data: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const dispatch = useAppDispatch();
  const [uploading, setUploading] = React.useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      toast.error('Please upload a PDF or DOCX file');
      return;
    }

    setUploading(true);
    try {
      const result = await dispatch(uploadResume(file)).unwrap();
      
      // Check if all fields are present
      if (result.missingFields.length === 0) {
        // All fields present, check/create candidate immediately
        const candidateResult = await dispatch(createOrCheckCandidate(result.parsedData)).unwrap();
        
        if (candidateResult.exists && candidateResult.isCompleted) {
          toast.success('Welcome back! Your interview is already completed.');
        } else if (candidateResult.exists && !candidateResult.isCompleted) {
          toast.success('Welcome back! You can continue your interview.');
        } else {
          toast.success('Resume uploaded successfully!');
        }
      } else {
        toast.success('Resume uploaded! Please complete your profile.');
      }
      
      onUploadComplete(result);
    } catch (error) {
      toast.error('Failed to upload resume');
      console.error(error);
    } finally {
      setUploading(false);
    }
  }, [dispatch, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      
      {isDragActive ? (
        <p className="text-lg">Drop your resume here...</p>
      ) : (
        <div>
          <p className="text-lg mb-2">Drag & drop your resume here</p>
          <p className="text-sm text-gray-500">or click to browse</p>
          <p className="text-xs text-gray-400 mt-2">Supported formats: PDF, DOCX</p>
        </div>
      )}
      
      {uploading && (
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm">Uploading and parsing resume...</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;