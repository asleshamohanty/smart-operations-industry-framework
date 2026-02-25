from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase Database Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")

if not all([SUPABASE_URL, SUPABASE_KEY, SUPABASE_DB_PASSWORD]):
    raise ValueError("Missing Supabase environment variables. Please set SUPABASE_URL, SUPABASE_KEY, and SUPABASE_DB_PASSWORD")

# Extract database URL from Supabase URL
# Supabase URL format: https://your-project.supabase.co
# Database URL format: postgresql+asyncpg://postgres:[password]@db.your-project.supabase.co:5432/postgres
supabase_project_id = SUPABASE_URL.split("//")[1].split(".")[0]

# Try asyncpg first (more reliable on Windows), fallback to psycopg2
try:
    import asyncpg
    DATABASE_URL = f"postgresql+asyncpg://postgres:{SUPABASE_DB_PASSWORD}@db.{supabase_project_id}.supabase.co:5432/postgres"
    print("✅ Using asyncpg driver")
except ImportError:
    try:
        import psycopg2
        DATABASE_URL = f"postgresql://postgres:{SUPABASE_DB_PASSWORD}@db.{supabase_project_id}.supabase.co:5432/postgres"
        print("✅ Using psycopg2 driver")
    except ImportError:
        raise ImportError("Neither asyncpg nor psycopg2 is available. Please install one of them.")

# Create engine
engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
