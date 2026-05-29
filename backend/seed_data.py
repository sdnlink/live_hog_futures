import sys
import os
import datetime

# Add parent directory to path so we can import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.scraper import (
    fetch_historical_kline, fetch_spot_prices, fetch_provincial_prices,
    fetch_breeding_indicators, fetch_swine_capacity, fetch_epidemic_reports,
    fetch_sentiment_radar, LH_CONTRACTS
)

def run_seeding():
    db = SessionLocal()
    print("=================== Starting Data Seeding ===================")
    
    # 1. Historical K-Lines for continuous index LH0 (very important for long charts)
    print("\n1. Fetching historical K-line for continuous index LH0...")
    fetch_historical_kline("LH0", db)
    
    # 2. Historical K-Lines for active contracts
    for symbol in LH_CONTRACTS:
        print(f"\n2. Fetching historical K-line for active contract {symbol}...")
        fetch_historical_kline(symbol, db)
        
    # 3. National Spot Prices
    print("\n3. Fetching national spot price trend from AkShare...")
    fetch_spot_prices(db)
    
    # 4. Provincial Price Rankings
    print("\n4. Fetching current provincial price rankings...")
    fetch_provincial_prices(db)
    
    # 5. Breeding Profits and Feed Costs
    print("\n5. Fetching corn/soybean meal spot trends and computing profits...")
    fetch_breeding_indicators(db)
    
    # 6. Swine Capacity
    print("\n6. Fetching swine capacity indicators (Sow Capacity)...")
    fetch_swine_capacity(db)
    
    # 7. Epidemic announcements
    print("\n7. Seeding epidemic reports...")
    fetch_epidemic_reports(db)
    
    # 8. Sentiment Indices
    print("\n8. Seeding news sentiment radar...")
    fetch_sentiment_radar(db)
    
    print("\n=================== Seeding Completed Successfully! ===================")
    db.close()

if __name__ == "__main__":
    run_seeding()
