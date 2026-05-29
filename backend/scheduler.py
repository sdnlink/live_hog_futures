import time
import datetime
import threading
import traceback
from .database import SessionLocal
from .scraper import (
    fetch_live_futures, fetch_spot_prices, fetch_provincial_prices,
    fetch_breeding_indicators, fetch_swine_capacity, fetch_sentiment_radar,
    LH_CONTRACTS, fetch_historical_kline
)

# Global flag to control scheduler
_running = False

def is_trading_hours():
    """DCE commodity trading hours: Mon-Fri 09:00-11:30, 13:30-15:00"""
    now = datetime.datetime.now()
    if now.weekday() > 4:  # Saturday & Sunday
        return False
        
    current_time = now.time()
    morning_start = datetime.time(9, 0, 0)
    morning_end = datetime.time(11, 30, 0)
    afternoon_start = datetime.time(13, 30, 0)
    afternoon_end = datetime.time(15, 0, 0)
    
    return (morning_start <= current_time <= morning_end) or (afternoon_start <= current_time <= afternoon_end)

def realtime_scheduler_loop():
    """Task running every 10 seconds during trading hours to fetch live quotes"""
    global _running
    db = SessionLocal()
    print("Real-time futures quote scheduler loop started.")
    
    while _running:
        try:
            if is_trading_hours():
                # print("Trading hours: updating real-time quotes...")
                fetch_live_futures(db)
            # Sleep 15 seconds
            time.sleep(15)
        except Exception as e:
            print("Error in real-time scheduler loop:", e)
            time.sleep(30)
            
    db.close()
    print("Real-time futures quote scheduler loop stopped.")

def daily_scheduler_loop():
    """Task running every hour, checking if it is time (e.g. 16:30) to pull daily statistics"""
    global _running
    db = SessionLocal()
    print("Daily macro statistics scheduler loop started.")
    
    last_update_date = None
    
    while _running:
        try:
            now = datetime.datetime.now()
            # Run update at 16:30 every day, or if it is a new day and we haven't updated yet
            if now.hour == 16 and now.date() != last_update_date:
                print(f"Time is 16:30 on {now.date()}: Starting daily macro updates...")
                
                # Fetch daily indicators
                fetch_spot_prices(db)
                fetch_provincial_prices(db)
                fetch_breeding_indicators(db)
                fetch_swine_capacity(db)
                fetch_sentiment_radar(db)
                
                # Sync daily K-line closures
                fetch_historical_kline("LH0", db)
                for symbol in LH_CONTRACTS:
                    fetch_historical_kline(symbol, db)
                    
                last_update_date = now.date()
                print("Daily macro updates completed.")
                
            # Check every 30 minutes
            time.sleep(1800)
        except Exception as e:
            print("Error in daily scheduler loop:", e)
            time.sleep(600)
            
    db.close()
    print("Daily macro statistics scheduler loop stopped.")

def start_scheduler():
    global _running
    if _running:
        return
        
    _running = True
    
    t1 = threading.Thread(target=realtime_scheduler_loop, daemon=True)
    t1.start()
    
    t2 = threading.Thread(target=daily_scheduler_loop, daemon=True)
    t2.start()
    
    print("Background schedulers successfully initialized.")

def stop_scheduler():
    global _running
    _running = False
    print("Stopping background schedulers...")
