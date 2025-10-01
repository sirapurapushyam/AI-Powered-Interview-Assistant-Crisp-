# backend/app/services/groq_service.py
from groq import Groq
from app.config import settings
import json
from typing import List, Dict
import asyncio

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"
        
        # Scoring configuration
        self.max_scores = {
            "easy": 2,
            "medium": 3,
            "hard": 5
        }
    
    async def generate_interview_question(
        self, 
        difficulty: str, 
        topic: str = "fullstack",
        previous_questions: List[str] = []
    ) -> Dict:
        """Generate interview questions using Groq"""
        
        # Different prompts based on difficulty
        if difficulty == "easy":
            difficulty_prompt = """For EASY level:
- Ask questions that can be answered in ONE WORD or a SHORT PHRASE (max 5-10 words)
- Examples: "What hook manages state in React?", "Which method sends POST requests in Express?", "What command installs npm packages?"
- The answer should be quick to type within 20 seconds
- Focus on terminology, command names, method names, or simple facts"""
            time_limit = 20
        elif difficulty == "medium":
            difficulty_prompt = """For MEDIUM level:
- Ask questions that need 2-3 sentences to answer
- Focus on explaining concepts, comparing features, or describing simple implementations
- The candidate should be able to read and answer within 60 seconds"""
            time_limit = 60
        else:  # hard
            difficulty_prompt = """For HARD level:
- Ask questions about system design, architecture, or complex scenarios
- Expect detailed explanations or step-by-step approaches
- The candidate should be able to provide a comprehensive answer within 120 seconds"""
            time_limit = 120
        
        prompt = f"""You are an expert technical interviewer. Generate a {difficulty} {topic} (React/Node.js) interview question.

Previous questions asked (avoid similar ones): {json.dumps(previous_questions[:3]) if previous_questions else "None"}

{difficulty_prompt}

Requirements:
- The question should be clear and concise
- For easy questions: answerable in one word or short phrase
- Ensure the question can be read and answered within the time limit

Return ONLY valid JSON in this exact format:
{{
    "question": "The interview question",
    "expected_topics": ["topic1", "topic2"],
    "hints": ["hint1", "hint2"],
    "time_limit": {time_limit}
}}"""

        try:
            loop = asyncio.get_event_loop()
            completion = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are an expert technical interviewer. Always respond with valid JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.model,
                    temperature=0.7,
                )
            )
            
            content = completion.choices[0].message.content
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                result = json.loads(json_str)
                result['time_limit'] = time_limit  # Ensure correct time limit
                return result
            else:
                return json.loads(content)
            
        except Exception as e:
            print(f"Error generating question: {e}")
            # Better fallback questions optimized for time
            fallback_questions = {
                "easy": [
                    "What React hook is used for managing component state?",
                    "Which HTTP method is used to update data in REST APIs?",
                    "What command creates a new React app?"
                ],
                "medium": [
                    "Explain the difference between useEffect and useLayoutEffect in React.",
                    "How does middleware work in Express.js?",
                    "What are the key differences between SQL and NoSQL databases?"
                ],
                "hard": [
                    "Design a scalable authentication system for a social media platform using JWT tokens and refresh tokens.",
                    "How would you implement real-time notifications in a MERN stack application serving millions of users?",
                    "Explain how you would optimize a React application that's experiencing performance issues with large lists."
                ]
            }
            
            import random
            selected = random.choice(fallback_questions.get(difficulty, fallback_questions["easy"]))
            
            return {
                "question": selected,
                "expected_topics": [topic],
                "hints": [],
                "time_limit": time_limit
            }
    
    async def evaluate_answer(
        self, 
        question: str, 
        answer: str, 
        expected_topics: List[str],
        difficulty: str = "medium"
    ) -> Dict:
        """Evaluate candidate's answer using proper scoring"""
        
        max_score = self.max_scores.get(difficulty, 3)
        
        # Handle empty or non-answers
        if not answer or answer.strip() == "" or answer.strip() == "[No answer provided - Time expired]":
            return {
                "score": 0,
                "feedback": "No answer provided.",
                "strengths": [],
                "improvements": ["No response given"],
                "topics_covered": []
            }
        
        # Check if answer is just a number or very short
        if answer.strip().isdigit() or len(answer.strip()) < 3:
            return {
                "score": 0,
                "feedback": "Invalid or incomplete answer.",
                "strengths": [],
                "improvements": ["Please provide a proper technical answer"],
                "topics_covered": []
            }
        
        prompt = f"""You are an expert technical interviewer evaluating a {difficulty} question.

Question: {question}
Expected topics: {', '.join(expected_topics)}
Candidate's Answer: {answer}

IMPORTANT SCORING RULES:
- This is a {difficulty.upper()} question worth maximum {max_score} marks
- Score STRICTLY between 0 and {max_score}
- For {difficulty} questions:
{self._get_scoring_criteria(difficulty, max_score)}

Evaluate based on:
1. Technical accuracy
2. Completeness relative to question difficulty
3. Understanding of core concepts

Return ONLY valid JSON in this exact format:
{{
    "score": <0-{max_score}>,
    "feedback": "Brief specific feedback about their answer",
    "strengths": ["strength1", "strength2"],
    "improvements": ["specific improvement needed"],
    "topics_covered": ["topic actually covered in answer"]
}}"""

        try:
            loop = asyncio.get_event_loop()
            completion = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": f"You are an expert technical interviewer. Score answers fairly based on merit, not arbitrary numbers. Maximum score for this {difficulty} question is {max_score}."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.model,
                    temperature=0.3,
                )
            )
            
            content = completion.choices[0].message.content
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                result = json.loads(json_str)
                
                # Ensure score is within bounds
                result['score'] = max(0, min(max_score, result.get('score', 0)))
                
                return result
            else:
                return json.loads(content)
                
        except Exception as e:
            print(f"Error evaluating answer: {e}")
            # Basic evaluation based on answer quality
            answer_length = len(answer.split())
            
            if difficulty == "easy":
                # Easy questions expect short answers
                if answer_length <= 5:
                    score = 1
                else:
                    score = 0.5
            elif difficulty == "medium":
                if answer_length >= 10:
                    score = 2
                elif answer_length >= 5:
                    score = 1
                else:
                    score = 0.5
            else:  # hard
                if answer_length >= 20:
                    score = 3
                elif answer_length >= 10:
                    score = 2
                else:
                    score = 1
            
            return {
                "score": min(score, max_score),
                "feedback": "Answer evaluated based on content length and complexity.",
                "strengths": ["Provided a response"],
                "improvements": ["Could provide more technical detail"],
                "topics_covered": []
            }
    
    def _get_scoring_criteria(self, difficulty: str, max_score: int) -> str:
        """Get scoring criteria based on difficulty"""
        if difficulty == "easy":
            return f"""  - {max_score} marks: Correct answer (exact term, method name, or concept)
  - 1 mark: Partially correct or close to correct answer
  - 0 marks: Incorrect or no answer"""
        elif difficulty == "medium":
            return f"""  - {max_score} marks: Complete, accurate explanation with good understanding
  - 2 marks: Mostly correct with minor gaps
  - 1 mark: Basic understanding but incomplete
  - 0 marks: Incorrect or no answer"""
        else:  # hard
            return f"""  - {max_score} marks: Comprehensive solution with excellent technical depth
  - 4 marks: Good solution with most key points covered
  - 3 marks: Decent approach but missing some important aspects
  - 2 marks: Basic understanding with significant gaps
  - 1 mark: Minimal understanding
  - 0 marks: Incorrect approach or no answer"""
    
    async def generate_candidate_summary(
        self, 
        candidate_name: str,
        questions_and_answers: List[Dict],
        total_score: float
    ) -> str:
        """Generate final interview summary"""
        
        # Calculate score breakdown
        easy_score = sum(qa.get('score', 0) for qa in questions_and_answers[:2])
        medium_score = sum(qa.get('score', 0) for qa in questions_and_answers[2:4])
        hard_score = sum(qa.get('score', 0) for qa in questions_and_answers[4:6])
        
        qa_text = "\n".join([
            f"Q{i+1} ({qa.get('difficulty', 'N/A')}): {qa.get('text', 'No question')}\nScore: {qa.get('score', 0)}/{self.max_scores.get(qa.get('difficulty', 'medium'), 3)}"
            for i, qa in enumerate(questions_and_answers)
        ])
        
        prompt = f"""Generate a brief professional summary for this technical interview.

Candidate: {candidate_name}
Overall Score: {total_score}/20

Score Breakdown:
- Easy Questions (2 questions × 2 marks): {easy_score}/4
- Medium Questions (2 questions × 3 marks): {medium_score}/6  
- Hard Questions (2 questions × 5 marks): {hard_score}/10

Question Performance:
{qa_text}

Provide a 2-3 sentence summary evaluating their technical knowledge, problem-solving skills, and areas for improvement."""

        try:
            loop = asyncio.get_event_loop()
            completion = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are an expert technical interviewer providing constructive feedback."},
                        {"role": "user", "content": prompt}
                    ],
                                    model=self.model,
                    temperature=0.5,
                    max_tokens=200
                )
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            print(f"Error generating summary: {e}")
            percentage = (total_score / 20) * 100
            if percentage >= 80:
                performance = "excellent"
                recommendation = "strong candidate for senior positions"
            elif percentage >= 60:
                performance = "good"
                recommendation = "suitable for mid-level positions"
            elif percentage >= 40:
                performance = "satisfactory"
                recommendation = "may need additional training"
            else:
                performance = "needs improvement"
                recommendation = "requires significant skill development"
                
            return f"{candidate_name} completed the technical interview with a score of {total_score}/20 ({percentage:.0f}%), showing {performance} performance. The candidate is {recommendation}."