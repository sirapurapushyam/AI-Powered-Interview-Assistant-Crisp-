from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List
from bson import ObjectId


class CandidateBase(BaseModel):
    name: str
    email: str
    phone: str
    resume_text: Optional[str] = None
    resume_url: Optional[str] = None
    status: str = "collecting-info"
    final_score: Optional[float] = None
    summary: Optional[str] = None


class Candidate(CandidateBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class CandidateInDB(Candidate):
    id: str = Field(alias="_id")
    
    @field_validator('id', mode='before')
    @classmethod
    def validate_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v


class CandidateCreate(BaseModel):
    name: str
    email: str
    phone: str
    resume_text: Optional[str] = None