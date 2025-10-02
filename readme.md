# AI-Powered Interview Assistant 🤖

A full-stack application that conducts AI-powered technical interviews with real-time evaluation and scoring. Built with React, TypeScript, FastAPI, and integrated with Groq AI for intelligent question generation and answer evaluation.

![Interview Assistant Demo](./demo-placeholder.png)

## 🌟 Features

- **Resume Upload & Parsing**: Automatically extracts candidate information from PDF/DOCX files
- **Smart Information Collection**: AI chatbot collects any missing candidate details
- **Timed Technical Interviews**: 6 questions (2 easy, 2 medium, 2 hard) with auto-submit
- **AI-Powered Evaluation**: Uses Groq API for question generation and answer scoring
- **Real-time Dashboard**: Live updates for interviewers to monitor candidate progress
- **Session Persistence**: Resume interrupted interviews with Redux Persist
- **Dual Interface**: Separate tabs for interviewees and interviewers
- **WebSocket Support**: Real-time communication between interviewee and interviewer tabs

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Redux Toolkit** + Redux Persist for state management
- **Tailwind CSS** + shadcn/ui for styling
- **Vite** for fast development and building
- **WebSocket** for real-time updates
- **React Router v6** for navigation
- **Axios** for API calls

### Backend
- **FastAPI** (Python) for REST API
- **Groq API** for AI/LLM capabilities
- **MongoDB** for data persistence
- **Cloudinary** for resume storage
- **WebSockets** for real-time communication
- **PyMongo** for MongoDB integration
- **Python-Multipart** for file uploads
- **PyPDF2** & **python-docx** for resume parsing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18.0.0 or higher)
- npm or yarn package manager
- Python (v3.9 or higher)
- MongoDB (v5.0 or higher)
- Git

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-interview-assistant.git
cd ai-interview-assistant


2. Setup Backend
Navigate to Backend Directory
bash
cd backend
Create Virtual Environment
bash
# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
Install Python Dependencies
bash
pip install -r requirements.txt
Setup Environment Variables
bash
cp .env.example .env
Edit the .env file with your credentials:

env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017/
DATABASE_NAME=ai_interview_assistant

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=mixtral-8x7b-32768

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# CORS Configuration
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# Server Configuration
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

# JWT Configuration (for future authentication)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
3. Setup Frontend
Navigate to Frontend Directory
bash
cd ../frontend
Install Node Dependencies
bash
npm install
# or using yarn
yarn install
Setup Environment Variables
bash
cp .env.example .env
Edit the .env file:

env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Application Settings
VITE_APP_NAME=AI Interview Assistant
VITE_INTERVIEW_DURATION_MINUTES=30
VITE_QUESTION_TIME_LIMIT_SECONDS=300

# Feature Flags (optional)
VITE_ENABLE_RESUME_PREVIEW=true
VITE_ENABLE_VOICE_RECORDING=false
4. Configure MongoDB
Ensure MongoDB is installed and running:

bash
# Check MongoDB status
# On macOS with Homebrew
brew services list | grep mongodb

# On Ubuntu/Debian
sudo systemctl status mongod

# On Windows
# Check Services app for MongoDB service
If MongoDB is not running:

bash
# Start MongoDB
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
5. API Keys Configuration
Groq API Key
Visit Groq Console
Sign up for a free account
Navigate to API Keys section
Generate a new API key
Copy and paste into .env file
Cloudinary Setup
Visit Cloudinary
Sign up for a free account
From dashboard, copy:
Cloud Name
API Key
API Secret
Add these to your backend .env file
🏃‍♂️ Running the Application
Start Backend Server
bash
cd backend

# Make sure virtual environment is activated
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Run the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the Python command
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
The backend will be available at:

API: http://localhost:8000
API Documentation: http://localhost:8000/docs
Alternative API Docs: http://localhost:8000/redoc
Start Frontend Development Server
In a new terminal:

bash
cd frontend

# Run the development server
npm run dev
# or using yarn
yarn dev
The frontend will be available at http://localhost:5173