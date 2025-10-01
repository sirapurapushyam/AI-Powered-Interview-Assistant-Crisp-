# backend/app/routers/interview.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import Dict, Optional
from app.models.candidate import Candidate
from app.models.session import InterviewSession, Question
from app.services.groq_service import GroqService
from app.services.resume_parser import ResumeParser
import uuid
from bson import ObjectId
from datetime import datetime
from app.database.connection import get_db
import time
from app.services.cloudinary_service import CloudinaryService

cloudinary_service = CloudinaryService()


router = APIRouter()
groq_service = GroqService()
resume_parser = ResumeParser()

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    database = get_db()
    
    if database is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    content = await file.read()
    
    # Upload to Cloudinary first
    try:
        cloudinary_result = await cloudinary_service.upload_resume(content, file.filename)
        resume_url = cloudinary_result["url"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Parse resume content
    parsed_data = await resume_parser.parse_resume(content, file.content_type)
    
    # Return parsed data with resume URL
    missing_fields = []
    if not parsed_data.get("name", ""):
        missing_fields.append("name")
    if not parsed_data.get("email", ""):
        missing_fields.append("email")
    if not parsed_data.get("phone", ""):
        missing_fields.append("phone")
    
    return {
        "parsedData": {
            "name": parsed_data.get("name", ""),
            "email": parsed_data.get("email", ""),
            "phone": parsed_data.get("phone", ""),
            "resumeText": parsed_data.get("full_text", ""),
            "resumeUrl": resume_url  # Add this
        },
        "missingFields": missing_fields
    }

@router.post("/create-or-check-candidate")
async def create_or_check_candidate(data: Dict[str, str]):
    """Create new candidate or check if exists"""
    database = get_db()
    
    if database is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    
    email = data.get("email", "")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if candidate exists
    existing_candidate = await database.candidates.find_one({"email": email})
    
    if existing_candidate:
        # Check if interview is completed
        existing_session = await database.sessions.find_one({
            "candidate_id": str(existing_candidate["_id"]),
            "is_completed": True
        })
        
        return {
            "exists": True,
            "candidateId": str(existing_candidate["_id"]),
            "status": existing_candidate.get("status", ""),
            "isCompleted": existing_session is not None,
            "candidateData": {
                "name": existing_candidate.get("name", ""),
                "email": existing_candidate.get("email", ""),
                "phone": existing_candidate.get("phone", ""),
                "resumeUrl": existing_candidate.get("resume_url", ""),  # Include resume URL
                "final_score": existing_candidate.get("final_score"),
                "summary": existing_candidate.get("summary", "")
            }
        }
    
    # Create new candidate with resume URL
    candidate_data = {
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone", ""),
        "resume_text": data.get("resumeText", ""),
        "resume_url": data.get("resumeUrl", ""),  # Add resume URL
        "status": "ready",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Save to database
    result = await database.candidates.insert_one(candidate_data)
    candidate_id = str(result.inserted_id)
    
    return {
        "exists": False,
        "candidateId": candidate_id,
        "status": "ready",
        "isCompleted": False
    }

@router.post("/update-candidate-info/{candidate_id}")
async def update_candidate_info(candidate_id: str, data: Dict[str, str]):
    """Update missing candidate information"""
    database = get_db()
    
    if database is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    
    # Get current candidate
    candidate = await database.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Filter out fields that shouldn't be updated
    update_data = {}
    
    for key, value in data.items():
        # Skip if value is empty
        if not value:
            continue
            
        # Special handling for email
        if key == "email":
            # If candidate already has an email, don't update it
            if candidate.get("email"):
                continue
                
            # Check if this email is already taken by another candidate
            existing = await database.candidates.find_one({
                "email": value,
                "_id": {"$ne": ObjectId(candidate_id)}
            })
            if existing:
                raise HTTPException(
                    status_code=400, 
                    detail="This email is already registered with another candidate"
                )
        
        # Only add to update if value is different from current
        if candidate.get(key) != value:
            update_data[key] = value
    
    # Only update if there's new data
    if update_data:
        try:
            update_result = await database.candidates.update_one(
                {"_id": ObjectId(candidate_id)},
                {"$set": update_data}
            )
            
            if update_result.modified_count == 0:
                # No error, just nothing to update
                return {"message": "No changes needed"}
                
        except Exception as e:
            if "duplicate key error" in str(e):
                raise HTTPException(
                    status_code=400,
                    detail="Email already exists in the system"
                )
            raise HTTPException(status_code=500, detail=str(e))
    
    return {"message": "Information updated successfully"}
@router.post("/start-interview/{candidate_id}")
async def start_interview(candidate_id: str):
    """Start or resume interview session"""
    database = get_db()
    
    if database is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    
    # Check if candidate exists and has all required info
    candidate = await database.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if not all([candidate.get("name"), candidate.get("email"), candidate.get("phone")]):
        raise HTTPException(status_code=400, detail="Missing required candidate information")
    
    # Check for existing session
    existing_session = await database.sessions.find_one({
        "candidate_id": candidate_id
    })
    
    # If candidate is completed and session exists, return the completed interview data
    if candidate.get("status") == "completed" and existing_session and existing_session.get("is_completed"):
        # Convert datetime objects to strings for JSON serialization
        questions = existing_session.get("questions", [])
        for q in questions:
            if q.get("start_time") and hasattr(q["start_time"], "isoformat"):
                q["start_time"] = q["start_time"].isoformat()
            if q.get("end_time") and hasattr(q["end_time"], "isoformat"):
                q["end_time"] = q["end_time"].isoformat()
        
        return {
            "interview_completed": True,
            "session_id": str(existing_session["_id"]),
            "final_score": candidate.get("final_score", 0),
            "summary": candidate.get("summary", ""),
            "questions": questions,
            "completed_at": existing_session.get("end_time").isoformat() if existing_session.get("end_time") else None,
            "message": "Interview already completed. Showing your results."
        }
    
    if existing_session:
        session_id = str(existing_session["_id"])
        
        # If session exists but not completed, resume
        if not existing_session.get("is_completed"):
            # Find the current unanswered question
            current_index = existing_session["current_question_index"]
            questions = existing_session["questions"]
            
            # Find first unanswered question
            for idx, q in enumerate(questions):
                if q.get("answer") is None:
                    current_index = idx
                    break
            
            if current_index < len(questions):
                current_question = questions[current_index]
                
                # Calculate elapsed time if question has start_time
                elapsed_time = 0
                if current_question.get("start_time"):
                    if isinstance(current_question["start_time"], str):
                        start_time = datetime.fromisoformat(current_question["start_time"].replace('Z', '+00:00'))
                    else:
                        start_time = current_question["start_time"]
                    elapsed_time = int((datetime.utcnow() - start_time).total_seconds())
                
                # Convert datetime to string for JSON serialization
                if current_question.get("start_time") and hasattr(current_question["start_time"], "isoformat"):
                    current_question["start_time"] = current_question["start_time"].isoformat()
                
                return {
                    "session_id": session_id,
                    "question": current_question,
                    "resuming": True,
                    "question_number": current_index + 1,
                    "elapsed_time": elapsed_time,
                    "current_question_index": current_index
                }
    
    # Create new interview session only if no session exists
    session_data = {
        "candidate_id": candidate_id,
        "questions": [],
        "current_question_index": 0,
        "is_paused": False,
        "is_completed": False,
        "start_time": datetime.utcnow(),
        "end_time": None
    }
    
    result = await database.sessions.insert_one(session_data)
    session_id = str(result.inserted_id)
    
    # Update candidate status
    await database.candidates.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {"status": "in-progress"}}
    )
    
    # Generate first question
    first_question = await groq_service.generate_interview_question("easy", "fullstack")
    question = Question(
        id=str(uuid.uuid4()),
        text=first_question["question"],
        difficulty="easy",
        time_limit=first_question["time_limit"],
        expected_topics=first_question["expected_topics"],
        hints=first_question["hints"],
        start_time=datetime.utcnow()
    )
    
    # Add question to session
    await database.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"questions": question.dict()}}
    )
    
    return {
        "session_id": session_id,
        "question": question.dict(),
        "resuming": False,
        "question_number": 1,
        "elapsed_time": 0
    }


# backend/app/routers/interview.py - Update the submit-answer endpoint

@router.post("/submit-answer/{session_id}")
async def submit_answer(session_id: str, data: Dict[str, str]):
    """Submit answer and get next question"""
    database = get_db()
    
    if database is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    
    answer = data.get("answer", "")
    
    # Get session
    session = await database.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    current_index = session["current_question_index"]
    
    # Check if current_index is valid
    if current_index >= len(session["questions"]):
        raise HTTPException(status_code=400, detail="No more questions available")
    
    current_question = session["questions"][current_index]
    
    # Check if question was already answered
    if current_question.get("answer") is not None:
        # Question already answered, just return the next question or completion
        next_index = current_index + 1
        
        if next_index >= 6:
            # Already completed
            return {
                "completed": True,
                "message": "Interview already completed"
            }
        else:
            # Return next question info
            return {
                "already_answered": True,
                "question_number": next_index + 1,
                "message": "Moving to next question"
            }
    
    # Evaluate answer using Groq with difficulty
    evaluation = await groq_service.evaluate_answer(
        current_question["text"],
        answer,
        current_question["expected_topics"],
        current_question["difficulty"]  # Pass difficulty for proper scoring
    )
    
    # Update the specific question in the array
    update_key = f"questions.{current_index}"
    await database.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                f"{update_key}.answer": answer,
                f"{update_key}.score": evaluation["score"],
                f"{update_key}.feedback": evaluation["feedback"],
                f"{update_key}.end_time": datetime.utcnow().isoformat()
            }
        }
    )
    
    next_index = current_index + 1
    
    if next_index >= 6:  # All questions completed
        # Calculate final score with new scoring system (out of 20)
        session = await database.sessions.find_one({"_id": ObjectId(session_id)})
        total_score = sum(q.get("score") or 0 for q in session["questions"] if q.get("score") is not None)
        
        # Get candidate info
        candidate = await database.candidates.find_one({"_id": ObjectId(session["candidate_id"])})
        
        summary = await groq_service.generate_candidate_summary(
            candidate["name"],
            session["questions"],
            total_score
        )
        
        # Update session completion
        await database.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "is_completed": True,
                    "end_time": datetime.utcnow()
                }
            }
        )
        
        # Update candidate
        await database.candidates.update_one(
            {"_id": ObjectId(session["candidate_id"])},
            {
                "$set": {
                    "status": "completed",
                    "final_score": total_score,
                    "summary": summary
                }
            }
        )
        
        return {
            "completed": True,
            "final_score": total_score,
            "summary": summary,
            "evaluation": evaluation
        }
    
    # Generate next question
    difficulty_map = {0: "easy", 1: "easy", 2: "medium", 3: "medium", 4: "hard", 5: "hard"}
    next_difficulty = difficulty_map[next_index]
    
    # Get previously asked questions to avoid repetition
    previous_questions = [q["text"] for q in session["questions"]]
    
    next_question_data = await groq_service.generate_interview_question(
        next_difficulty, 
        "fullstack",
        previous_questions
    )
    
    next_question = Question(
        id=str(uuid.uuid4()),
        text=next_question_data["question"],
        difficulty=next_difficulty,
        time_limit=next_question_data["time_limit"],
        expected_topics=next_question_data["expected_topics"],
        hints=next_question_data["hints"],
        start_time=datetime.utcnow()
    )
    
    # Add next question and update index
    await database.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$push": {"questions": next_question.dict()},
            "$set": {"current_question_index": next_index}
        }
    )
    
    return {
        "evaluation": evaluation,
        "next_question": next_question.dict(),
        "question_number": next_index + 1
    }