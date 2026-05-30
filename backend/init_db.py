import sys
import os

# Add parent directory to path so we can import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, Base
from backend.models import *  # This registers all models with Base.metadata

def init_database():
    print("Connecting to PostgreSQL database to create tables...")
    try:
        # Drop all tables to force a clean recreation of the entire database schema
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Successfully dropped and recreated all tables in the PostgreSQL database!")
    except Exception as e:
        print("Error initializing database:", e)
        sys.exit(1)

if __name__ == "__main__":
    init_database()
