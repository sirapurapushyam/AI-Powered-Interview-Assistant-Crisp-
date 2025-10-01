from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db.database = db.client[settings.DATABASE_NAME]
        
        # Test connection
        await db.client.server_info()
        logger.info("Successfully connected to MongoDB")
        
        # Create indexes
        await create_indexes()
        
    except ServerSelectionTimeoutError:
        logger.error("Unable to connect to MongoDB")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Candidates indexes
        await db.database.candidates.create_index("email", unique=True)
        await db.database.candidates.create_index("status")
        await db.database.candidates.create_index([("final_score", -1)])
        await db.database.candidates.create_index("created_at")
        
        # Sessions indexes
        await db.database.sessions.create_index("candidate_id")
        await db.database.sessions.create_index("is_completed")
        
        logger.info("Database indexes created")
    except Exception as e:
        logger.warning(f"Could not create indexes: {e}")

def get_database():
    """Get database instance"""
    if db.database is None:
        raise RuntimeError("Database is not initialized. Please check MongoDB connection.")
    return db.database

# Use function call instead of direct assignment
def get_db():
    return db.database