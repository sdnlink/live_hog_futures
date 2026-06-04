import time
import datetime
import threading
import traceback
from sqlalchemy import text
from sqlalchemy.orm import Session
from .database import SessionLocal
from .logger import logger
from .scraper import (
    fetch_live_futures,
    fetch_spot_prices,
    fetch_provincial_prices,
    fetch_breeding_indicators,
    fetch_swine_capacity,
    fetch_sentiment_radar,
    LH_CONTRACTS,
    fetch_historical_kline,
    fetch_pork_prices,
    fetch_live_stocks,
    fetch_stock_klines,
    fetch_frozen_pork_storage,
    fetch_epidemic_reports,
    fetch_biopharm_data,
    fetch_consumables_data,
    fetch_feed_breakdown,
    fetch_logistics_safety,
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

    return (morning_start <= current_time <= morning_end) or (
        afternoon_start <= current_time <= afternoon_end
    )


def is_stock_trading_hours():
    """A-share stock trading hours: Mon-Fri 09:30-11:30, 13:00-15:00"""
    now = datetime.datetime.now()
    if now.weekday() > 4:  # Saturday & Sunday
        return False

    current_time = now.time()
    morning_start = datetime.time(9, 30, 0)
    morning_end = datetime.time(11, 30, 0)
    afternoon_start = datetime.time(13, 0, 0)
    afternoon_end = datetime.time(15, 0, 0)

    return (morning_start <= current_time <= morning_end) or (
        afternoon_start <= current_time <= afternoon_end
    )


def realtime_scheduler_loop():
    """Task running every 10 seconds during trading hours to fetch live quotes"""
    global _running
    print("Real-time futures quote scheduler loop started.")

    while _running:
        try:
            if is_trading_hours() or is_stock_trading_hours():
                db = SessionLocal()
                try:
                    if is_trading_hours():
                        # print("Trading hours: updating real-time quotes...")
                        fetch_live_futures(db)
                    if is_stock_trading_hours():
                        # print("Stock trading hours: updating real-time stock quotes...")
                        fetch_live_stocks(db)
                finally:
                    db.close()
            # Sleep 15 seconds
            time.sleep(15)
        except Exception as e:
            print("Error in real-time scheduler loop:", e)
            time.sleep(30)

    print("Real-time futures quote scheduler loop stopped.")


def daily_scheduler_loop():
    """Task running every hour, checking if it is time (e.g. 16:30) to pull daily statistics"""
    global _running
    print("Daily macro statistics scheduler loop started.")

    last_update_date = None

    while _running:
        try:
            now = datetime.datetime.now()
            # Run update at 16:30 every day, or if it is a new day and we haven't updated yet
            if now.hour == 16 and now.date() != last_update_date:
                print(f"Time is 16:30 on {now.date()}: Starting daily macro updates...")
                db = SessionLocal()
                try:
                    # Fetch daily indicators
                    fetch_spot_prices(db)
                    fetch_pork_prices(db)
                    fetch_provincial_prices(db)
                    fetch_breeding_indicators(db)
                    fetch_swine_capacity(db)
                    fetch_sentiment_radar(db)

                    # Sync daily K-line closures
                    fetch_historical_kline("LH0", db)
                    for symbol in LH_CONTRACTS:
                        fetch_historical_kline(symbol, db)

                    # Sync stock and frozen pork storage
                    fetch_stock_klines(db)
                    fetch_live_stocks(db)
                    fetch_frozen_pork_storage(db)

                    # Sync epidemic reports and upstream alternative indicators
                    fetch_epidemic_reports(db)
                    fetch_biopharm_data(db)
                    fetch_consumables_data(db)
                    fetch_feed_breakdown(db)
                    fetch_logistics_safety(db)
                finally:
                    db.close()

                last_update_date = now.date()
                print("Daily macro updates completed.")

            # Check every 30 minutes
            time.sleep(1800)
        except Exception as e:
            print("Error in daily scheduler loop:", e)
            time.sleep(600)

    print("Daily macro statistics scheduler loop stopped.")


def random_sync_scheduler_loop():
    """Task running at a random interval of 1 to 10 minutes to sync all data"""
    import random

    global _running
    print("Random interval full synchronization scheduler loop started.")

    while _running:
        try:
            # Random interval between 1 and 10 minutes (60 to 600 seconds)
            interval = random.randint(60, 600)
            print(
                f"Next full synchronization scheduled in {interval} seconds ({round(interval/60, 1)} minutes)..."
            )

            # Sleep in small increments to respond quickly to shutdown events
            slept = 0
            while slept < interval and _running:
                time.sleep(2)
                slept += 2

            if not _running:
                break

            print(
                f"Triggering automatic background full synchronization at {datetime.datetime.now()}..."
            )
            db = SessionLocal()
            try:
                # 1. Real-time quotes
                fetch_live_futures(db)
                # 2. National spot prices
                fetch_spot_prices(db)
                # 2b. Wholesale pork prices
                fetch_pork_prices(db)
                # 3. Provincial price rankings
                fetch_provincial_prices(db)
                # 4. Breeding profit/cost indicators
                fetch_breeding_indicators(db)
                # 5. Swine capacity
                fetch_swine_capacity(db)
                # 6. Sentiment indexes
                fetch_sentiment_radar(db)
                # 7. K-line history
                fetch_historical_kline("LH0", db)
                for symbol in LH_CONTRACTS:
                    fetch_historical_kline(symbol, db)

                # 8. Stock & Frozen Pork
                fetch_stock_klines(db)
                fetch_live_stocks(db)
                fetch_frozen_pork_storage(db)

                # 9. Epidemic reports & upstream alternative indicators
                fetch_epidemic_reports(db)
                fetch_biopharm_data(db)
                fetch_consumables_data(db)
                fetch_feed_breakdown(db)
                fetch_logistics_safety(db)

                print(
                    "Automatic background full synchronization completed successfully."
                )
            except Exception as ex:
                print("Error during background full synchronization:", ex)
                traceback.print_exc()
            finally:
                db.close()

        except Exception as e:
            print("Error in random sync scheduler loop:", e)
            time.sleep(30)

    print("Random interval full synchronization scheduler loop stopped.")


def acquire_scheduler_lock(db: Session) -> bool:
    """Acquire a PostgreSQL advisory lock to ensure only one process runs the scheduler."""
    try:
        dialect = db.bind.dialect.name
        if dialect == "postgresql":
            # 7890123 is a unique 64-bit lock ID
            result = db.execute(text("SELECT pg_try_advisory_lock(7890123)")).scalar()
            return bool(result)
        else:
            # Fall back to True for SQLite (local testing)
            return True
    except Exception as e:
        logger.error(f"Failed to acquire PostgreSQL advisory lock: {e}")
        return True


def release_scheduler_lock(db: Session):
    """Release the PostgreSQL advisory lock."""
    try:
        dialect = db.bind.dialect.name
        if dialect == "postgresql":
            db.execute(text("SELECT pg_advisory_unlock(7890123)"))
    except Exception as e:
        logger.error(f"Failed to release PostgreSQL advisory lock: {e}")


def scheduler_coordinator():
    """Coordinator thread to acquire lock and run background scheduler loops."""
    global _running
    db = SessionLocal()
    try:
        if not acquire_scheduler_lock(db):
            logger.info(
                "Another process holds the scheduler lock. Skipping scheduler startup in this process."
            )
            _running = False
            return

        logger.info("Scheduler lock acquired. Starting background loops...")

        t1 = threading.Thread(target=realtime_scheduler_loop, daemon=True)
        t1.start()

        t2 = threading.Thread(target=daily_scheduler_loop, daemon=True)
        t2.start()

        t3 = threading.Thread(target=random_sync_scheduler_loop, daemon=True)
        t3.start()

        while _running:
            time.sleep(5)

    except Exception as e:
        logger.error(f"Error in scheduler coordinator: {e}", exc_info=True)
    finally:
        release_scheduler_lock(db)
        db.close()
        logger.info("Scheduler coordinator stopped and lock released.")


def start_scheduler():
    global _running
    if _running:
        return

    _running = True

    t = threading.Thread(target=scheduler_coordinator, daemon=True)
    t.start()
    logger.info("Background scheduler coordinator initialized.")


def stop_scheduler():
    global _running
    _running = False
    logger.info("Stopping background schedulers...")
