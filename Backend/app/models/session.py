from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import List, Optional
from bson import ObjectId


class Question(BaseModel):
    id: str
    text: str
    difficulty: str
    time_limit: int
    expected_topics: List[str]
    hints: List[str]
    answer: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class InterviewSession(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    candidate_id: str
    questions: List[Question] = []
    current_question_index: int = 0
    is_paused: bool = False
    is_completed: bool = False
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    
    @field_validator('id', mode='before')
    @classmethod
    def validate_id(cls, v):
        if v is None:
            return str(ObjectId())
        if isinstance(v, ObjectId):
            return str(v)
        return v
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )