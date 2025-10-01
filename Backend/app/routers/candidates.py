from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.database.connection import get_db
from bson import ObjectId

router = APIRouter()

@router.get("/")
async def get_candidates(
    status: Optional[str] = Query(None),
    sort_by: str = Query("final_score", description="Sort by field"),
    order: str = Query("desc", description="asc or desc")
):
    """Get all candidates with optional filtering and sorting"""
    database = get_db()
    
    if database is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    
    query = {}
    if status:
        query["status"] = status
    
    sort_direction = -1 if order == "desc" else 1
    
    candidates = []
    cursor = database.candidates.find(query).sort(sort_by, sort_direction)
    
    async for candidate in cursor:
        # Convert ObjectId to string
        candidate["id"] = str(candidate.pop("_id"))
        candidates.append(candidate)
    
    return candidates

@router.get("/{candidate_id}")
async def get_candidate_details(candidate_id: str):
    """Get detailed candidate information including interview session"""
    database = get_db()
    
    if database is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    
    # Get candidate
    candidate = await database.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Convert ObjectId to string
    candidate["id"] = str(candidate.pop("_id"))
    
    # Get interview session
    session = await database.sessions.find_one({"candidate_id": candidate_id})
    if session:
        session["id"] = str(session.pop("_id"))
        candidate["session"] = session
    
    return candidate