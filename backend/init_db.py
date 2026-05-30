import sys
import os

# Add parent directory to path so we can import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, Base
from backend.models import *  # This registers all models with Base.metadata

def init_database():
    print("Connecting to PostgreSQL database to create tables...")
    try:
        # Drop tables to force recreation with new schema
        from backend.models import SwineCapacity, PorkPrice
        SwineCapacity.__table__.drop(bind=engine, checkfirst=True)
        PorkPrice.__table__.drop(bind=engine, checkfirst=True)
        Base.metadata.create_all(bind=engine)
        print("Successfully created all tables in the PostgreSQL database!")
    except Exception as e:
        print("Error initializing database:", e)
        sys.exit(1)

if __name__ == "__main__":
    init_database()
