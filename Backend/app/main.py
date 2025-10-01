from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

# Add this import
from app.config import settings
from app.routers import interview, candidates, websocket
from app.database.connection import connect_to_mongo, close_mongo_connection

# Use lifespan instead of deprecated on_event
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection
app = FastAPI(
    title="AI Interview Assistant",
    lifespan=lifespan  # Add lifespan here
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["candidates"])
app.include_router(websocket.router, tags=["websocket"])

@app.get("/")
async def root():
    return {"message": "AI Interview Assistant API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}