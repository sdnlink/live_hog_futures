import sys
import os
import datetime

# Add parent directory to path so we can import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.scraper import (
    fetch_historical_kline,
    fetch_spot_prices,
    fetch_provincial_prices,
    fetch_breeding_indicators,
    fetch_swine_capacity,
    fetch_epidemic_reports,
    fetch_sentiment_radar,
    LH_CONTRACTS,
    fetch_pork_prices,
    fetch_stock_klines,
    fetch_live_stocks,
    fetch_frozen_pork_storage,
    fetch_biopharm_data,
    fetch_consumables_data,
    fetch_feed_breakdown,
    fetch_logistics_safety,
    fetch_company_monthly_sales,
    fetch_downstream_demand,
    fetch_substitute_prices,
    fetch_pork_imports,
    fetch_swine_efficiency,
    fetch_macro_environmental_indicators,
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

    # 3b. Wholesale Pork Prices
    print("\n3b. Fetching wholesale pork prices from AkShare...")
    fetch_pork_prices(db)

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

    # 8. Sentiment Indices (Disabled - no real API)
    # print("\n8. Seeding news sentiment radar...")
    # fetch_sentiment_radar(db)

    # 9. Stock historical trends
    print("\n9. Fetching historical A-share stock prices for listed hog companies...")
    fetch_stock_klines(db)

    # 10. Stock real-time quotes
    print("\n10. Fetching real-time stock quotes...")
    fetch_live_stocks(db)

    # 10b. Fetching listed companies monthly sales data...
    print("\n10b. Fetching listed companies monthly sales data...")
    fetch_company_monthly_sales(db)

    # 11. Frozen pork storage data
    print("\n11. Fetching frozen pork reserves and storage capacity...")
    fetch_frozen_pork_storage(db)

    # 12. Upstream supplies & alternative indicators
    print("\n12. Seeding biopharmaceutical procurement data...")
    fetch_biopharm_data(db)
    print("\n13. Seeding breeding consumables data...")
    fetch_consumables_data(db)
    print("\n14. Seeding feed sales breakdown data...")
    fetch_feed_breakdown(db)
    print("\n15. Seeding logistics & health safety data...")
    fetch_logistics_safety(db)
    print("\n16. Seeding pork downstream demand monitoring data...")
    fetch_downstream_demand(db)

    # 17. New factors
    print("\n17. Seeding substitute goods prices...")
    fetch_substitute_prices(db)
    print("\n18. Seeding pork imports...")
    fetch_pork_imports(db)
    print("\n19. Seeding breeding efficiency...")
    fetch_swine_efficiency(db)
    print("\n20. Seeding macro environmental indicators...")
    fetch_macro_environmental_indicators(db)

    print("\n=================== Seeding Completed Successfully! ===================")
    db.close()


if __name__ == "__main__":
    run_seeding()
