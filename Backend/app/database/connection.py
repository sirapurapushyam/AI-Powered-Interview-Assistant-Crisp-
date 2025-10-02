from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db.database = db.client[settings.DATABASE_NAME]
        await db.client.server_info()
        await create_indexes()
    except ServerSelectionTimeoutError:
        raise

async def close_mongo_connection():
    if db.client:
        db.client.close()

async def create_indexes():
    await db.database.candidates.create_index("email", unique=True)
    await db.database.candidates.create_index("status")
    await db.database.candidates.create_index([("final_score", -1)])
    await db.database.candidates.create_index("created_at")
    
    await db.database.sessions.create_index("candidate_id")
    await db.database.sessions.create_index("is_completed")

def get_database():
    if db.database is None:
        raise RuntimeError("Database is not initialized. Please check MongoDB connection.")
    return db.database

def get_db():
    return db.database
