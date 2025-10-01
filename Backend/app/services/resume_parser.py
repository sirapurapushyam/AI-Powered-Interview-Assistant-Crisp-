# backend/app/services/resume_parser.py
import PyPDF2
from docx import Document
import re
from typing import Dict, Optional
import io

class ResumeParser:
    def __init__(self):
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.phone_pattern = re.compile(r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}')
        self.name_indicators = ['name', 'Name', 'NAME']
    
    async def parse_resume(self, file_content: bytes, file_type: str) -> Dict[str, Optional[str]]:
        """Extract information from resume"""
        text = ""
        
        if file_type == "application/pdf":
            text = self._extract_pdf_text(file_content)
        elif "wordprocessingml" in file_type or file_type.endswith("docx"):
            text = self._extract_docx_text(file_content)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        return {
            "name": self._extract_name(text),
            "email": self._extract_email(text),
            "phone": self._extract_phone(text),
            "full_text": text
        }
    
    def _extract_pdf_text(self, content: bytes) -> str:
        """Extract text from PDF"""
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    
    def _extract_docx_text(self, content: bytes) -> str:
        """Extract text from DOCX"""
        doc = Document(io.BytesIO(content))
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    
    def _extract_email(self, text: str) -> Optional[str]:
        """Extract email from text"""
        match = self.email_pattern.search(text)
        return match.group(0) if match else None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from text"""
        match = self.phone_pattern.search(text)
        return match.group(0) if match else None
    
    def _extract_name(self, text: str) -> Optional[str]:
        """Extract name from text - simplified version"""
        lines = text.split('\n')
        # Usually the name is in the first few lines
        for i, line in enumerate(lines[:10]):
            line = line.strip()
            if line and len(line.split()) <= 4:  # Names are usually 1-4 words
                # Check if it's not an email or phone
                if not self.email_pattern.search(line) and not self.phone_pattern.search(line):
                    # Simple heuristic: if it's at the beginning and doesn't contain numbers
                    if not any(char.isdigit() for char in line) and len(line) > 2:
                        return line
        return None