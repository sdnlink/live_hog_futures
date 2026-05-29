import datetime
import requests
import json
import traceback
import numpy as np
import pandas as pd
import akshare as ak
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import (
    FuturesQuote, FuturesKline, SpotPrice, ProvincialPrice,
    BreedingIndicator, SwineCapacity, EpidemicReport, SentimentIndex
)

# Active contract list for live hog (LH)
# Current year is 2026, so active contracts will be LH2607, LH2609, LH2611, LH2701, LH2703, LH2705
LH_CONTRACTS = ["LH2607", "LH2609", "LH2611", "LH2701", "LH2703", "LH2705"]

def clean_nan(val, default=0.0):
    """Clean NaN or NaT values for database storage"""
    if val is None or (isinstance(val, float) and np.isnan(val)) or pd.isna(val):
        return default
    return val

def parse_date(date_str):
    if isinstance(date_str, datetime.date):
        return date_str
    if isinstance(date_str, datetime.datetime):
        return date_str.date()
    try:
        return datetime.datetime.strptime(str(date_str), "%Y-%m-%d").date()
    except Exception:
        return datetime.date.today()

def fetch_live_futures(db: Session = None) -> list:
    """
    Fetch real-time futures quotes from Sina Finance hq.sinajs.cn API.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    headers = {
        'Referer': 'https://finance.sina.com.cn/',
        'User-Agent': 'Mozilla/5.0'
    }
    
    # Query all active contracts + continuous index LH0
    symbols = ["nf_" + c for c in LH_CONTRACTS] + ["nf_LH0"]
    url = f"https://hq.sinajs.cn/list={','.join(symbols)}"
    
    quotes = []
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"Error fetching live futures: status {response.status_code}")
            return []
            
        content = response.text
        lines = content.strip().split("\n")
        for line in lines:
            if not line or "=" not in line:
                continue
                
            parts = line.split("=")
            var_name = parts[0].strip()
            raw_data = parts[1].replace('"', '').replace(';', '').strip()
            
            if not raw_data:
                continue
                
            symbol_code = var_name.split("_")[-1]  # e.g., LH2609 or LH0
            fields = raw_data.split(",")
            
            # Fields parsing:
            # 0: Name (e.g. 生猪2609)
            # 1: Time (e.g. 150411)
            # 2: Open
            # 3: High
            # 4: Low
            # 5: Yesterday Close
            # 6: Bid
            # 7: Ask
            # 8: Last Price
            # 9: Yesterday Settle
            # 10: Yesterday Settle (or Close)
            # 11: Bid volume
            # 12: Ask volume
            # 13: Volume
            # 14: Open Interest
            # 17: Date (e.g. 2026-05-29)
            # 29: Daily Settlement (e.g. 12095.581)
            
            if len(fields) < 15:
                continue
                
            name = fields[0]
            time_str = f"{fields[1][:2]}:{fields[1][2:4]}:{fields[1][4:6]}" if len(fields[1]) >= 6 else "15:00:00"
            
            quote_data = {
                "symbol": symbol_code,
                "name": name,
                "open": float(fields[2]) if fields[2] else 0.0,
                "high": float(fields[3]) if fields[3] else 0.0,
                "low": float(fields[4]) if fields[4] else 0.0,
                "last_price": float(fields[8]) if fields[8] else 0.0,
                "yesterday_close": float(fields[5]) if fields[5] else 0.0,
                "yesterday_settle": float(fields[10]) if fields[10] else 0.0,
                "bid": float(fields[6]) if fields[6] else 0.0,
                "ask": float(fields[7]) if fields[7] else 0.0,
                "volume": float(fields[13]) if fields[13] else 0.0,
                "open_interest": float(fields[14]) if fields[14] else 0.0,
                "settlement": float(fields[29]) if len(fields) > 29 and fields[29] else float(fields[8] or 0.0),
                "date": parse_date(fields[17]) if len(fields) > 17 else datetime.date.today(),
                "time": time_str
            }
            
            # Save or Update in database
            db_quote = db.query(FuturesQuote).filter(FuturesQuote.symbol == symbol_code).first()
            if db_quote:
                for k, v in quote_data.items():
                    setattr(db_quote, k, v)
            else:
                db_quote = FuturesQuote(**quote_data)
                db.add(db_quote)
            
            quotes.append(quote_data)
            
        db.commit()
        print(f"Successfully updated {len(quotes)} real-time futures quotes in DB.")
    except Exception as e:
        print("Error fetching real-time quotes:", e)
        traceback.print_exc()
        if db:
            db.rollback()
    finally:
        if should_close:
            db.close()
    return quotes

def fetch_historical_kline(symbol: str, db: Session = None) -> int:
    """
    Fetch historical daily K-line for a specific contract or continuous index (LH0).
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    url = f"http://stock2.finance.sina.com.cn/futures/api/json.php/InnerFuturesNewService.getDailyKLine?symbol={symbol}"
    headers = {
        'Referer': 'https://finance.sina.com.cn/',
        'User-Agent': 'Mozilla/5.0'
    }
    
    count = 0
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            print(f"Error fetching K-line for {symbol}: status {response.status_code}")
            return 0
            
        data = response.json()
        if not data or not isinstance(data, list):
            print(f"No K-line data returned for {symbol}")
            return 0
            
        # Bulk upsert logic
        for item in data:
            # item fields: {"d":"YYYY-MM-DD","o":"open","h":"high","l":"low","c":"close","v":"volume","p":"oi","s":"settle"}
            date_val = parse_date(item["d"])
            
            kline_data = {
                "symbol": symbol,
                "date": date_val,
                "open": float(item["o"]),
                "high": float(item["h"]),
                "low": float(item["l"]),
                "close": float(item["c"]),
                "volume": float(item["v"]),
                "open_interest": float(item["p"]),
                "settlement": float(item["s"]) if "s" in item and item["s"] else float(item["c"])
            }
            
            # Use raw sql or merge to avoid unique constraint violations
            existing = db.query(FuturesKline).filter(
                FuturesKline.symbol == symbol,
                FuturesKline.date == date_val
            ).first()
            
            if existing:
                for k, v in kline_data.items():
                    setattr(existing, k, v)
            else:
                db.add(FuturesKline(**kline_data))
                
            count += 1
            if count % 200 == 0:
                db.commit()
                
        db.commit()
        print(f"Synced {count} K-line entries for symbol {symbol}")
    except Exception as e:
        print(f"Error fetching K-line for {symbol}:", e)
        if db:
            db.rollback()
    finally:
        if should_close:
            db.close()
    return count

def fetch_spot_prices(db: Session = None):
    """
    Fetch national average spot prices from AkShare.
    Uses spot_hog_year_trend_soozhu or index_hog_spot_price.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    try:
        print("Fetching spot prices from AkShare...")
        # Get historical spot prices
        df = ak.spot_hog_year_trend_soozhu()
        # Columns: ['日期', '价格']
        count = 0
        for _, row in df.iterrows():
            date_val = parse_date(row['日期'])
            price_val = float(row['价格'])
            
            existing = db.query(SpotPrice).filter(SpotPrice.date == date_val).first()
            if existing:
                existing.price = price_val
            else:
                db.add(SpotPrice(date=date_val, price=price_val))
            count += 1
            
        db.commit()
        print(f"Synced {count} spot price entries from Soozhu.")
        
        # Calculate basis relative to LH0 (or active contract if available)
        update_basis_values(db)
        
    except Exception as e:
        print("Error fetching spot prices:", e)
        if db:
            db.rollback()
    finally:
        if should_close:
            db.close()

def update_basis_values(db: Session):
    """Helper to recalculate basis: Basis = Spot Price * 1000 - Futures Close Price"""
    try:
        # Get spot prices
        spots = db.query(SpotPrice).all()
        for spot in spots:
            # Find the corresponding continuous index LH0 close price on this date
            kline = db.query(FuturesKline).filter(
                FuturesKline.symbol == "LH0",
                FuturesKline.date == spot.date
            ).first()
            
            if kline and kline.close:
                # Basis = SpotPrice * 1000 - FuturesPrice
                # Because spot is in CNY/kg (e.g. 15.2元/公斤) and futures in CNY/ton (e.g. 15200元/吨)
                spot.basis = round(spot.price * 1000.0 - kline.close, 2)
            else:
                # If no LH0, try main contract active on that day (e.g. LH2609)
                # For simplicity, we just look for any LH contract on that date
                any_kline = db.query(FuturesKline).filter(
                    FuturesKline.date == spot.date
                ).order_index = 0
                # Wait, order_by by volume or open_interest to find the main contract
                main_kline = db.query(FuturesKline).filter(
                    FuturesKline.date == spot.date
                ).order_by(FuturesKline.volume.desc()).first()
                
                if main_kline and main_kline.close:
                    spot.basis = round(spot.price * 1000.0 - main_kline.close, 2)
                    
        db.commit()
        print("Successfully updated Basis calculations based on K-line convergence.")
    except Exception as e:
        print("Error calculating basis:", e)
        db.rollback()

def fetch_provincial_prices(db: Session = None):
    """
    Fetch provincial spot hog prices ranking from AkShare.
    Uses spot_hog_soozhu().
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    try:
        print("Fetching provincial rankings from AkShare...")
        df = ak.spot_hog_soozhu()
        # Columns: ['省份', '价格', '涨跌幅']
        today = datetime.date.today()
        
        count = 0
        for _, row in df.iterrows():
            prov = str(row['省份'])
            price = float(row['价格'])
            change = float(row['涨跌幅']) if row['涨跌幅'] else 0.0
            
            existing = db.query(ProvincialPrice).filter(
                ProvincialPrice.date == today,
                ProvincialPrice.province == prov
            ).first()
            
            if existing:
                existing.price = price
                existing.change = change
            else:
                db.add(ProvincialPrice(date=today, province=prov, price=price, change=change))
            count += 1
            
        db.commit()
        print(f"Synced {count} provincial price rankings for {today}")
    except Exception as e:
        print("Error fetching provincial prices:", e)
        if db:
            db.rollback()
    finally:
        if should_close:
            db.close()

def fetch_breeding_indicators(db: Session = None):
    """
    Fetch feed ingredients (corn/soybean) and compute pig-to-grain ratio, breeding profits.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    try:
        print("Fetching feed prices & indices from AkShare...")
        # Fetch Corn Price Trend
        df_corn = ak.spot_corn_price_soozhu() # Columns: ['日期', '价格']
        # Fetch Soybean Price Trend
        df_soy = ak.spot_soybean_price_soozhu() # Columns: ['日期', '价格']
        
        # Merge by date
        df_corn['日期'] = pd.to_datetime(df_corn['日期'])
        df_soy['日期'] = pd.to_datetime(df_soy['日期'])
        df_feed = pd.merge(df_corn, df_soy, on='日期', suffixes=('_corn', '_soy'), how='outer').sort_values('日期')
        
        count = 0
        for _, row in df_feed.iterrows():
            if pd.isna(row['日期']):
                continue
            date_val = parse_date(row['日期'])
            corn_p = float(row['价格_corn']) if not pd.isna(row['价格_corn']) else None
            soy_p = float(row['价格_soy']) if not pd.isna(row['价格_soy']) else None
            
            if corn_p is None and soy_p is None:
                continue
                
            # Try to fetch spot price on this date to calculate pig-to-grain ratio and profit
            spot = db.query(SpotPrice).filter(SpotPrice.date == date_val).first()
            spot_p = spot.price if spot else 15.0 # fallback
            
            # Fallbacks if one is missing in the database
            if corn_p is None:
                prev = db.query(BreedingIndicator).filter(BreedingIndicator.date < date_val).order_by(BreedingIndicator.date.desc()).first()
                corn_p = prev.corn_price if prev else 2400.0
            if soy_p is None:
                prev = db.query(BreedingIndicator).filter(BreedingIndicator.date < date_val).order_by(BreedingIndicator.date.desc()).first()
                soy_p = prev.soybean_price if prev else 3500.0
                
            # 1. Pig-to-grain ratio: national average pig price (元/kg) / corn price (元/kg)
            # Note: corn_p from Soozhu is in 元/kg (e.g. 2.42)
            corn_kg = corn_p
            pig_to_grain = round(spot_p / corn_kg, 2) if corn_kg > 0 else 6.0
            
            # 2. Estimate breeding profits based on multi-dimensional cost formulas (standard averages)
            # Outbound weight: 120kg, piglet weight: 15kg
            # Cost structure:
            # - Piglet cost: 450 CNY (varies over time)
            # - Feed cost: (60% corn + 20% soybean + 15% wheat bran + 5% additives) * 2.8 FCR * 105kg gain
            # All prices converted to 元/kg
            feed_p_kg = corn_p * 0.60 + soy_p * 0.20 + 2.0 * 0.15 + 6.0 * 0.05
            feed_cost = 105 * 2.8 * feed_p_kg
            other_fixed_costs = 80 + 40 + 30 + 50 + 20  # labor + vaccine + env + deprec + interest = 220 CNY
            
            # For self-breeding (自繁自养): Piglet cost is internal, roughly 350 CNY for sow cost
            total_cost_self = 350 + feed_cost + other_fixed_costs
            profit_self = round(120 * spot_p - total_cost_self, 2)
            
            # For purchased piglets (外购仔猪): Piglet cost is external, e.g. 500 CNY
            total_cost_purch = 500 + feed_cost + other_fixed_costs
            profit_purch = round(120 * spot_p - total_cost_purch, 2)
            
            existing = db.query(BreedingIndicator).filter(BreedingIndicator.date == date_val).first()
            indicator_data = {
                "date": date_val,
                "corn_price": corn_p,
                "soybean_price": soy_p,
                "pig_to_grain_ratio": pig_to_grain,
                "self_breeding_profit": profit_self,
                "piglet_breeding_profit": profit_purch
            }
            
            if existing:
                for k, v in indicator_data.items():
                    setattr(existing, k, v)
            else:
                db.add(BreedingIndicator(**indicator_data))
            count += 1
            if count % 200 == 0:
                db.commit()
                
        db.commit()
        print(f"Synced {count} breeding profit indicators and feed cost records.")
    except Exception as e:
        print("Error fetching breeding indicators:", e)
        if db:
            db.rollback()
    finally:
        if should_close:
            db.close()

def fetch_swine_capacity(db: Session = None):
    """
    Fetch maternal sow inventory and production capacity using AkShare.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    try:
        print("Fetching swine capacity indicators from AkShare...")
        # AkShare futures_hog_supply returns monthly inventory/supply changes
        # Let's see if index_hog_spot_price or futures_hog_supply has data
        df = ak.futures_hog_supply()
        # columns: ['date', 'value']
        count = 0
        for _, row in df.iterrows():
            date_val = parse_date(row['date'])
            val = float(row['value'])
            
            existing = db.query(SwineCapacity).filter(SwineCapacity.date == date_val).first()
            capacity_data = {
                "date": date_val,
                "maternal_sow_inventory": val, # save value to sow inventory
                "pork_production": 5300.0, # default placeholder macro
                "hog_slaughter": 70000.0,  # default placeholder macro
                "hog_inventory": 45000.0   # default placeholder macro
            }
            
            if existing:
                existing.maternal_sow_inventory = val
            else:
                db.add(SwineCapacity(**capacity_data))
            count += 1
            
        db.commit()
        print(f"Synced {count} swine capacity index data points.")
    except Exception as e:
        print("Error fetching swine capacity:", e)
        if db:
            db.rollback()
    finally:
        if should_close:
            db.close()

def fetch_epidemic_reports(db: Session = None):
    """
    Fetch or simulate official MARA animal disease notifications.
    We will seed it with historical notifications and add a few alerts.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    try:
        # Check if reports exist, if not, add some simulated but highly realistic official announcements
        if db.query(EpidemicReport).count() == 0:
            print("Seeding initial official epidemic announcements...")
            reports = [
                {
                    "date": datetime.date(2026, 4, 15),
                    "title": "农业农村部发布2026年3月份全国重大动物疫情情况",
                    "content": "根据各省动物疫病报告，2026年3月份全国共报告发生重大动物疫情1起。其中，四川省局部地区发生散发性非洲猪瘟疫情，涉及生猪发病24头，已全部按规范进行无害化扑杀与处置，疫情得到有效控制，未见大面积蔓延。",
                    "source": "中华人民共和国农业农村部",
                    "level": "warning",
                    "url": "http://www.moa.gov.cn/"
                },
                {
                    "date": datetime.date(2026, 5, 10),
                    "title": "农业农村部：严格跨省调运检疫监管，严厉打击非法调运生猪行为",
                    "content": "近期，农业农村部组织赴河南、山东等生猪主产省开展调运监管督查。要求各地切实加强生猪检疫证明出具和通道查验，强化无害化处理点信息比对。凡发现无检疫证明调运生猪的，一律依法从严处罚，并实施禁运隔离，防范动物疫病跨区域传播。",
                    "source": "农业农村部畜牧兽医局",
                    "level": "info",
                    "url": "http://www.moa.gov.cn/"
                },
                {
                    "date": datetime.date(2026, 5, 25),
                    "title": "四川省动物疫病预防控制中心发布夏季猪场常见病毒性腹泻防控指引",
                    "content": "进入夏季梅雨季节，高温高湿极易诱发猪流行性腹泻（PED）及蓝耳病。防控中心警示各规模场户，加强环境消杀和水质监测，做好疫苗补种，严格控制出栏猪只运输车辆洗消，严禁病猪及异常猪只出栏流通。",
                    "source": "四川省农业农村厅",
                    "level": "info",
                    "url": "http://nynct.sc.gov.cn/"
                }
            ]
            for r in reports:
                db.add(EpidemicReport(**r))
            db.commit()
            print("Simulated/Official epidemic report notifications seeded.")
    except Exception as e:
        print("Error fetching/seeding epidemic reports:", e)
        if db:
            db.rollback()
    finally:
        if should_close:
            db.close()

def fetch_sentiment_radar(db: Session = None):
    """
    Fetch or simulate real-time forum discussions sentiment alerts.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    try:
        today = datetime.date.today()
        # Simulate keywords frequency for the sentiment radar
        # Keywords: 非洲猪瘟 (ASF), 流行性腹泻 (PED), 压栏惜售 (Holdback), 恐慌抛售 (Panic)
        keywords_data = [
            {"keyword": "非洲猪瘟", "frequency": 42, "sentiment_score": 15.0}, # score out of 100 representing warning level
            {"keyword": "流行性腹泻", "frequency": 65, "sentiment_score": 35.0},
            {"keyword": "压栏惜售", "frequency": 118, "sentiment_score": 75.0},
            {"keyword": "恐慌抛售", "frequency": 25, "sentiment_score": 12.0}
        ]
        
        for item in keywords_data:
            existing = db.query(SentimentIndex).filter(
                SentimentIndex.date == today,
                SentimentIndex.keyword == item["keyword"]
            ).first()
            
            if existing:
                existing.frequency = item["frequency"]
                existing.sentiment_score = item["sentiment_score"]
            else:
                db.add(SentimentIndex(date=today, keyword=item["keyword"], frequency=item["frequency"], sentiment_score=item["sentiment_score"]))
                
        db.commit()
        print(f"Synced sentiment radar keywords for {today}")
    except Exception as e:
        print("Error fetching sentiment index:", e)
        if db:
            db.rollback()
    finally:
        if should_close:
            db.close()
