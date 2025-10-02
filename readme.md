# AI-Powered Interview Assistant

A full-stack application that conducts AI-powered technical interviews with real-time evaluation and scoring. Built with React, TypeScript, FastAPI, and integrated with Groq AI for intelligent question generation and answer evaluation.


## Features

- **Resume Upload & Parsing**: Automatically extracts candidate information from PDF/DOCX files
- **Smart Information Collection**: AI chatbot collects any missing candidate details
- **Timed Technical Interviews**: 6 questions (2 easy, 2 medium, 2 hard) with auto-submit
- **AI-Powered Evaluation**: Uses Groq API for question generation and answer scoring
- **Real-time Dashboard**: Live updates for interviewers to monitor candidate progress
- **Session Persistence**: Resume interrupted interviews with Redux Persist
- **Dual Interface**: Separate tabs for interviewees and interviewers
- **WebSocket Support**: Real-time communication between interviewee and interviewer tabs

## Tech Stack

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

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18.0.0 or higher)
- npm or yarn package manager
- Python (v3.9 or higher)
- MongoDB (v5.0 or higher)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sirapurapushyam/AI-Powered-Interview-Assistant-Crisp-.git
cd AI-Powered-Interview-Assistant-Crisp-
```

### 2. Setup Backend

#### Navigate to Backend Directory
```bash
cd backend
```

```bash
# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Setup Environment Variables

```bash
cp .env.example .env
```
Edit the .env file with your credentials


### 3. Setup Frontend

#### Navigate to Frontend Directory
```bash
cd ../frontend
```
#### Install Node Dependencies
```bash
npm install
# or using yarn
yarn install
```
#### Setup Environment Variables
```bash
cp .env.example .env
```
Edit the .env file


###  Running the Application
#### Start Backend Server
```bash
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
```

#### The backend will be available at:
####  API: http://localhost:8000 
#### API Documentation: http://localhost:8000/docs
#### Alternative API Docs: http://localhost:8000/redoc

#### Start Frontend Development Server

In a new terminal:
```bash
cd frontend

# Run the development server
npm run dev
# or using yarn
yarn dev
```
The frontend will be available at http://localhost:5173