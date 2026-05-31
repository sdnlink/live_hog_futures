import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from .database import engine, Base, get_db
from .models import (
    FuturesQuote, FuturesKline, SpotPrice, ProvincialPrice,
    BreedingIndicator, SwineCapacity, EpidemicReport, SentimentIndex, PorkPrice,
    StockKline, StockQuote, FrozenPorkStorage,
    BiopharmaceuticalProcurement, BreedingConsumableConsumption,
    FeedSalesBreakdown, HogLogisticsAndSafety, YijingForecastRecord
)
from .scraper import (
    fetch_live_futures, LH_CONTRACTS, fetch_spot_prices,
    fetch_provincial_prices, fetch_breeding_indicators,
    fetch_swine_capacity, fetch_sentiment_radar, fetch_historical_kline,
    fetch_pork_prices, fetch_live_stocks, fetch_stock_klines, fetch_frozen_pork_storage,
    fetch_biopharm_data, fetch_consumables_data, fetch_feed_breakdown, fetch_logistics_safety
)
from .scheduler import start_scheduler, stop_scheduler
from .yijing import generate_yijing_forecast
from . import schemas

app = FastAPI(title="生猪期货基本面数据监控与决策系统 API", version="1.0.0")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Ensure database tables exist
    from .database import engine, Base
    Base.metadata.create_all(bind=engine)
    
    # Run seeding if database is empty
    from .database import SessionLocal
    from .models import FuturesQuote
    db = SessionLocal()
    try:
        if db.query(FuturesQuote).count() == 0:
            print("Database is empty. Running initial data seeding...")
            from .seed_data import run_seeding
            run_seeding()
        else:
            print("Database already contains data, skipping initial seeding.")
    except Exception as e:
        print("Error during database startup checks:", e)
    finally:
        db.close()

    # Automatically start background data scheduler
    start_scheduler()

@app.on_event("shutdown")
def shutdown_event():
    # Stop background data scheduler
    stop_scheduler()

# ==================== Endpoints ====================

@app.post("/api/sync/all")
def trigger_data_sync(db: Session = Depends(get_db)):
    """Manually trigger a full sync of all live and macro fundamental data from external APIs"""
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
            
        # 8. Stocks & Frozen Pork
        fetch_stock_klines(db)
        fetch_live_stocks(db)
        fetch_frozen_pork_storage(db)
        
        # 9. Upstream supplies & alternative indicators
        fetch_biopharm_data(db)
        fetch_consumables_data(db)
        fetch_feed_breakdown(db)
        fetch_logistics_safety(db)
            
        return {"status": "success", "message": "All data synchronized successfully!"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/futures/realtime", response_model=List[schemas.FuturesQuoteOut])
def get_realtime_futures(db: Session = Depends(get_db)):
    """Get real-time quotes of all active contracts"""
    quotes = db.query(FuturesQuote).order_by(FuturesQuote.symbol).all()
    # If database is empty, trigger a quick fetch
    if not quotes:
        fetch_live_futures(db)
        quotes = db.query(FuturesQuote).order_by(FuturesQuote.symbol).all()
    return quotes

@app.get("/api/futures/kline/{symbol}", response_model=List[schemas.FuturesKlineOut])
def get_futures_kline(symbol: str, db: Session = Depends(get_db)):
    """Get historical daily K-line for a specific contract or LH0"""
    klines = db.query(FuturesKline).filter(
        FuturesKline.symbol == symbol.upper()
    ).order_by(FuturesKline.date.asc()).all()
    
    if not klines:
        raise HTTPException(status_code=404, detail=f"No K-line data found for contract {symbol}")
    return klines

@app.get("/api/spot/basis", response_model=List[schemas.SpotPriceOut])
def get_spot_and_basis(db: Session = Depends(get_db)):
    """Get historical spot prices and computed basis values"""
    spots = db.query(SpotPrice).order_by(SpotPrice.date.asc()).all()
    return spots

@app.get("/api/spot/pork", response_model=List[schemas.PorkPriceOut])
def get_pork_prices(db: Session = Depends(get_db)):
    """Get historical wholesale pork prices"""
    prices = db.query(PorkPrice).order_by(PorkPrice.date.asc()).all()
    return prices

@app.get("/api/spot/provincial", response_model=List[schemas.ProvincialPriceOut])
def get_provincial_prices(db: Session = Depends(get_db)):
    """Get current provincial hog price rankings"""
    # Get the latest date we have provincial data for
    latest_record = db.query(ProvincialPrice).order_by(ProvincialPrice.date.desc()).first()
    if not latest_record:
        return []
    
    prices = db.query(ProvincialPrice).filter(
        ProvincialPrice.date == latest_record.date
    ).order_by(ProvincialPrice.price.desc()).all()
    return prices

def interpolate_swine_capacity(records: List[SwineCapacity], granularity: str = "monthly") -> List[Dict[str, Any]]:
    if granularity == "monthly" or len(records) < 2:
        return [
            {
                "id": r.id,
                "date": r.date,
                "maternal_sow_inventory": r.maternal_sow_inventory,
                "pork_production": r.pork_production,
                "hog_slaughter": r.hog_slaughter,
                "hog_inventory": r.hog_inventory,
                "pork_consumption": r.pork_consumption,
                "slaughterhouse_volume": r.slaughterhouse_volume,
                "slaughterhouse_operating_rate": r.slaughterhouse_operating_rate,
                "average_market_weight": round((r.pork_production * 1000.0 / r.hog_slaughter) / 0.75, 2) if r.pork_production and r.hog_slaughter and r.hog_slaughter > 0 else None
            }
            for r in records
        ]

    start_date = records[0].date
    end_date = records[-1].date

    # Determine step size and date alignment
    if granularity == "weekly":
        days_to_friday = (4 - start_date.weekday()) % 7
        current_date = start_date + datetime.timedelta(days=days_to_friday)
        step_days = 7
        flow_scale = 7.0 / 30.4
    else:  # daily
        current_date = start_date
        step_days = 1
        flow_scale = 1.0 / 30.4

    interp_records = []
    idx = 1
    
    while current_date <= end_date:
        rec_before = None
        rec_after = None
        for i in range(len(records)):
            if records[i].date <= current_date:
                rec_before = records[i]
            if records[i].date >= current_date:
                rec_after = records[i]
                break

        if not rec_before or not rec_after:
            current_date += datetime.timedelta(days=step_days)
            continue

        if rec_before.date == rec_after.date:
            t = 0.0
        else:
            total_days = (rec_after.date - rec_before.date).days
            passed_days = (current_date - rec_before.date).days
            t = float(passed_days) / float(total_days)

        def interp(val_b, val_a, is_flow=False):
            if val_b is None or val_a is None:
                val = val_b if val_b is not None else val_a
            else:
                val = val_b + t * (val_a - val_b)
            
            if val is not None:
                if is_flow:
                    val = val * flow_scale
                return round(val, 2)
            return None

        p_prod = interp(rec_before.pork_production, rec_after.pork_production, True)
        h_slaughter = interp(rec_before.hog_slaughter, rec_after.hog_slaughter, True)
        avg_w = None
        if p_prod and h_slaughter and h_slaughter > 0:
            avg_w = round((p_prod * 1000.0 / h_slaughter) / 0.75, 2)

        rec = {
            "id": idx,
            "date": current_date,
            "maternal_sow_inventory": interp(rec_before.maternal_sow_inventory, rec_after.maternal_sow_inventory, False),
            "pork_production": p_prod,
            "hog_slaughter": h_slaughter,
            "hog_inventory": interp(rec_before.hog_inventory, rec_after.hog_inventory, False),
            "pork_consumption": interp(rec_before.pork_consumption, rec_after.pork_consumption, True),
            "slaughterhouse_volume": interp(rec_before.slaughterhouse_volume, rec_after.slaughterhouse_volume, True),
            "slaughterhouse_operating_rate": interp(rec_before.slaughterhouse_operating_rate, rec_after.slaughterhouse_operating_rate, False),
            "average_market_weight": avg_w
        }
        interp_records.append(rec)
        idx += 1
        current_date += datetime.timedelta(days=step_days)

    return interp_records

@app.get("/api/fundamentals/capacity", response_model=List[schemas.SwineCapacityOut])
def get_swine_capacity(granularity: str = "monthly", db: Session = Depends(get_db)):
    """Get monthly, weekly or daily swine inventory and production capacity indicators"""
    capacity = db.query(SwineCapacity).order_by(SwineCapacity.date.asc()).all()
    if granularity in ("weekly", "daily"):
        return interpolate_swine_capacity(capacity, granularity)
        
    # Format monthly records as well to populate average_market_weight
    result = []
    for r in capacity:
        avg_weight = None
        if r.pork_production and r.hog_slaughter and r.hog_slaughter > 0:
            avg_weight = round((r.pork_production * 1000.0 / r.hog_slaughter) / 0.75, 2)
        result.append({
            "id": r.id,
            "date": r.date,
            "maternal_sow_inventory": r.maternal_sow_inventory,
            "pork_production": r.pork_production,
            "hog_slaughter": r.hog_slaughter,
            "hog_inventory": r.hog_inventory,
            "pork_consumption": r.pork_consumption,
            "slaughterhouse_volume": r.slaughterhouse_volume,
            "slaughterhouse_operating_rate": r.slaughterhouse_operating_rate,
            "average_market_weight": avg_weight
        })
    return result



@app.get("/api/fundamentals/costs", response_model=List[schemas.BreedingIndicatorOut])
def get_breeding_costs_and_profits(db: Session = Depends(get_db)):
    """Get feed ingredient prices, pig-to-grain ratio, and profits"""
    indicators = db.query(BreedingIndicator).order_by(BreedingIndicator.date.asc()).all()
    return indicators

@app.get("/api/epidemic/status")
def get_epidemic_status(db: Session = Depends(get_db)):
    """Get latest animal disease reports and news sentiment indices"""
    reports = db.query(EpidemicReport).order_by(EpidemicReport.date.desc()).all()
    
    # Get the latest date we have sentiment data for
    latest_sentiment = db.query(SentimentIndex).order_by(SentimentIndex.date.desc()).first()
    sentiment = []
    if latest_sentiment:
        sentiment = db.query(SentimentIndex).filter(
            SentimentIndex.date == latest_sentiment.date
        ).all()
        
    return {
        "reports": reports,
        "sentiment": sentiment
    }

@app.get("/api/stocks/trends", response_model=List[schemas.StockKlineOut])
def get_stock_trends(db: Session = Depends(get_db)):
    """Get historical stock prices for listed hog companies"""
    trends = db.query(StockKline).order_by(StockKline.date.asc()).all()
    return trends

@app.get("/api/stocks/realtime", response_model=List[schemas.StockQuoteOut])
def get_realtime_stocks(db: Session = Depends(get_db)):
    """Get real-time quotes of listed hog companies"""
    quotes = db.query(StockQuote).order_by(StockQuote.symbol).all()
    # If empty, do a quick sync
    if not quotes:
        fetch_live_stocks(db)
        quotes = db.query(StockQuote).order_by(StockQuote.symbol).all()
    return quotes

@app.get("/api/fundamentals/frozen_pork", response_model=List[schemas.FrozenPorkStorageOut])
def get_frozen_pork_storage(db: Session = Depends(get_db)):
    """Get historical frozen pork storage and reserve levels"""
    storage = db.query(FrozenPorkStorage).order_by(FrozenPorkStorage.date.asc()).all()
    return storage

@app.get("/api/fundamentals/biopharm", response_model=List[schemas.BiopharmaceuticalProcurementOut])
def get_biopharm_procurement(db: Session = Depends(get_db)):
    """获取历史生物动保医药采购数据"""
    records = db.query(BiopharmaceuticalProcurement).order_by(BiopharmaceuticalProcurement.date.asc()).all()
    return records

@app.get("/api/fundamentals/consumables", response_model=List[schemas.BreedingConsumableConsumptionOut])
def get_breeding_consumables(db: Session = Depends(get_db)):
    """获取母猪配种及产房耗材消耗数据"""
    records = db.query(BreedingConsumableConsumption).order_by(BreedingConsumableConsumption.date.asc()).all()
    return records

@app.get("/api/fundamentals/feed_breakdown", response_model=List[schemas.FeedSalesBreakdownOut])
def get_feed_breakdown(db: Session = Depends(get_db)):
    """获取饲料细分销量数据"""
    records = db.query(FeedSalesBreakdown).order_by(FeedSalesBreakdown.date.asc()).all()
    return records

@app.get("/api/fundamentals/logistics_safety", response_model=List[schemas.HogLogisticsAndSafetyOut])
def get_logistics_safety(db: Session = Depends(get_db)):
    """获取物流调运、运能与病死处理数据"""
    records = db.query(HogLogisticsAndSafety).order_by(HogLogisticsAndSafety.date.asc()).all()
    return records


@app.get("/api/expert/advice", response_model=schemas.ExpertAdviceOut)
def get_expert_advice(symbol: str = "LH0", db: Session = Depends(get_db)):
    """
    智能交叉校验与阶段性专家建议系统 API。
    通过整合当前的价格、体重、利润、产能、和舆情数据，生成市场判断结论与专业建议。
    """
    # 1. Fetch latest spot price and trend
    spot_records = db.query(SpotPrice).order_by(SpotPrice.date.desc()).limit(15).all()
    if not spot_records:
        return {"status": "error", "message": "No spot price records found."}
        
    latest_spot = spot_records[0].price
    prev_spot = spot_records[1].price if len(spot_records) > 1 else latest_spot
    spot_trend = "up" if latest_spot >= prev_spot else "down"
    spot_change_pct = round(((latest_spot - prev_spot) / prev_spot) * 100, 2) if prev_spot > 0 else 0.0
    
    # 2. Fetch latest futures price (use provided symbol)
    target_quote = db.query(FuturesQuote).filter(FuturesQuote.symbol == symbol.upper()).first()
    if not target_quote:
        # Fallback to LH0 if requested symbol not found
        target_quote = db.query(FuturesQuote).filter(FuturesQuote.symbol == "LH0").first()
        
    futures_price = target_quote.last_price if target_quote else 12080.0
    basis = round(latest_spot * 1000.0 - futures_price, 2)
    
    # 3. Fetch latest breeding indicators
    latest_indicator = db.query(BreedingIndicator).order_by(BreedingIndicator.date.desc()).first()
    pig_to_grain = latest_indicator.pig_to_grain_ratio if latest_indicator else 5.8
    self_profit = latest_indicator.self_breeding_profit if latest_indicator else -100.0
    purch_profit = latest_indicator.piglet_breeding_profit if latest_indicator else -200.0
    
    # 4. Fetch latest average weight from SwineCapacity
    latest_capacity = db.query(SwineCapacity).order_by(SwineCapacity.date.desc()).first()
    avg_weight = 124.5  # default/fallback
    if latest_capacity and latest_capacity.pork_production and latest_capacity.hog_slaughter and latest_capacity.hog_slaughter > 0:
        avg_weight = round((latest_capacity.pork_production * 1000.0 / latest_capacity.hog_slaughter) / 0.75, 1)
        
    weight_trend = "up" if avg_weight >= 123.0 else "down"
    
    # 5. Fetch epidemic warnings
    sentiment_records = db.query(SentimentIndex).order_by(SentimentIndex.date.desc()).limit(10).all()
    asf_score = 0.0
    ped_score = 0.0
    for s in sentiment_records:
        if s.keyword in ["非洲猪瘟", "非瘟", "小飞"]:
            asf_score = max(asf_score, s.sentiment_score)
        elif s.keyword in ["流行性腹泻", "腹泻"]:
            ped_score = max(ped_score, s.sentiment_score)
            
    # 5b. Fetch latest alternative data indicators
    latest_biopharm = db.query(BiopharmaceuticalProcurement).order_by(BiopharmaceuticalProcurement.date.desc()).first()
    latest_consumables = db.query(BreedingConsumableConsumption).order_by(BreedingConsumableConsumption.date.desc()).first()
    latest_feed = db.query(FeedSalesBreakdown).order_by(FeedSalesBreakdown.date.desc()).first()
    latest_logistics = db.query(HogLogisticsAndSafety).order_by(HogLogisticsAndSafety.date.desc()).first()
    
    # Evaluate alternative data signals
    from sqlalchemy import func
    is_altren_depressed = False
    if latest_biopharm and latest_biopharm.altrenogest_sales:
        avg_altren = db.query(func.avg(BiopharmaceuticalProcurement.altrenogest_sales)).scalar() or 80.0
        if latest_biopharm.altrenogest_sales < avg_altren * 0.85:
            is_altren_depressed = True
            
    is_catheter_depressed = False
    if latest_consumables and latest_consumables.insemination_catheters:
        avg_catheter = db.query(func.avg(BreedingConsumableConsumption.insemination_catheters)).scalar() or 250.0
        if latest_consumables.insemination_catheters < avg_catheter * 0.85:
            is_catheter_depressed = True

    is_finisher_ratio_high = False
    if latest_feed and latest_feed.finisher_feed and latest_feed.overall_feed_volume:
        finisher_ratio = latest_feed.finisher_feed / latest_feed.overall_feed_volume
        if finisher_ratio > 0.52:
            is_finisher_ratio_high = True

    is_mortality_high = False
    if latest_logistics and latest_logistics.mortality_waste_disposal:
        avg_mortality = db.query(func.avg(HogLogisticsAndSafety.mortality_waste_disposal)).scalar() or 500.0
        if latest_logistics.mortality_waste_disposal > avg_mortality * 1.3:
            is_mortality_high = True

    # 6. Evaluation Logic & Verification Conclusions
    conclusion_title = "供需处于拉锯整理阶段"
    conclusion_desc = "当前生猪现货价格窄幅振荡，期现折合处于正常基差范围。市场补栏情绪一般，供需整体相持。"
    radar_scores = {"supply": 50, "demand": 50, "cost": 50, "policy": 50, "disease": 20}
    warning_level = "info"  # info, warning, danger
    
    # Priority Rule 1: Epidemic disease verified by mortality disposal
    if is_mortality_high and (asf_score > 25.0 or ped_score > 30.0):
        conclusion_title = "疫情变动确认，产能加速出清"
        conclusion_desc = "病死猪无害化处理量偏高均值30%以上，交叉验证了近期疫病多发舆情。虽然短期抛售冲击现货，但将锁定6个月后的生猪供给收紧，中远期期价具有强底部支撑。"
        radar_scores = {"supply": 10, "demand": 55, "cost": 45, "policy": 60, "disease": 85}
        warning_level = "danger"
        
    # Priority Rule 2: Finisher feed ratio warning (heavy hogs piling up)
    elif spot_trend == "up" and is_finisher_ratio_high and avg_weight > 124.0:
        conclusion_title = "大猪饲料占比过高，警惕压栏风险"
        conclusion_desc = "大猪配合料销量占比突破52%，出栏体重偏重，显示压栏与二次育肥投机严重。终端肉类消费无明显增长，后期集中降体重出栏时，极易引发期现货供给性踩踏。"
        radar_scores = {"supply": 30, "demand": 25, "cost": 70, "policy": 50, "disease": 10}
        warning_level = "danger"
        
    # Priority Rule 3: Sow breeding intent collapse
    elif is_altren_depressed and is_catheter_depressed and self_profit < 100.0:
        conclusion_title = "繁育耗材收缩，补栏情绪冰冻"
        conclusion_desc = "虽然现货价格尚稳，但上游烯丙孕素与配种输精管销量偏低均值15%以上，反映母猪实际补栏配种积极性低迷。这从上游锁定了8-10个月后的生猪供给收缩。"
        radar_scores = {"supply": 25, "demand": 40, "cost": 80, "policy": 70, "disease": 15}
        warning_level = "warning"
        
    # Rule 1: Supply-Demand Divergence (虚火/虚假繁荣)
    elif spot_trend == "up" and avg_weight > 123.0 and pig_to_grain > 6.0:
        conclusion_title = "虚火上涨，需求疲软"
        conclusion_desc = "当前价格上涨主要由养殖端压栏惜售、二次育肥进场等投机供应收紧驱动，屠宰厂开工率与下游猪肉批发量未见实质配合。后期大猪出栏体重压降，将面临集中踩踏风险。"
        radar_scores = {"supply": 35, "demand": 30, "cost": 75, "policy": 50, "disease": 15}
        warning_level = "warning"
        
    # Rule 2: De-capacity bottoming out (产能出清，筑底)
    elif pig_to_grain < 5.8 and self_profit < -150.0:
        conclusion_title = "产能加速出清，见底信号明确"
        conclusion_desc = "猪粮比价长期处于二级预警区间以下，全行业面临深度亏损。规模场与散户主动淘汰低效能繁母猪，去产能速度加快。当前处于猪周期磨底中后期，中远期供应缺口正在积聚。"
        radar_scores = {"supply": 20, "demand": 45, "cost": 85, "policy": 80, "disease": 25}
        warning_level = "danger"
        
    # Rule 3: Epidemic Panic Selling (恐慌抛售)
    elif spot_trend == "down" and avg_weight < 120.0 and (asf_score > 30.0 or ped_score > 40.0):
        conclusion_title = "疫病恐慌性抛售，砸出周期黄金坑"
        conclusion_desc = "局部地区生猪疫病抬头导致养殖户避险抛售，出栏均重快速走低，屠宰企业开工率被动暴增。短期供给过剩砸出底位深坑，但造成后期可出栏生猪断档，中远期猪价上行概率极大。"
        radar_scores = {"supply": 15, "demand": 60, "cost": 40, "policy": 60, "disease": 75}
        warning_level = "danger"
        
    # Rule 4: Cost Squeeze (高饲料成本挤压)
    elif latest_indicator and latest_indicator.corn_price > 2600.0 and self_profit < 0.0:
        conclusion_title = "高成本挤压，利润面临倒挂"
        conclusion_desc = "受饲料原材料玉米、豆粕价格高企影响，养殖保本线上升至 16.5 元/公斤以上。即使现货价持平，高成本仍对利润造成严重侵蚀，中小散户被迫淘汰母猪。"
        radar_scores = {"supply": 45, "demand": 40, "cost": 90, "policy": 55, "disease": 10}
        warning_level = "warning"


    # 7. Actionable Advice generation
    advice = {
        "farmers": {
            "title": "养殖场户操作建议",
            "action": "顺势出栏，控制均重",
            "bullets": [
                "避免盲目跟风压栏或二次育肥，保持合理出栏体重在 120-125kg 之间。",
                "分批有序淘汰胎龄高、产仔率低的低效能繁母猪，优化核心基础群结构。",
                "加强栏舍消杀与防暑防病管理，提前做好夏秋交替期病毒性腹泻免疫工作。"
            ]
        },
        "middle": {
            "title": "中游贸易与屠宰加工企业建议",
            "action": "低库存运转，防范跌价",
            "bullets": [
                "屠宰毛利受到压制，建议维持‘随杀随销’模式，成品库存控制在 3 天以内。",
                "关注产销价差，当川豫价差超过 0.8 元/公斤时，可加大北猪南运跨省调配力度。",
                "在周期拐点明确前，切勿盲目进行大规模冻猪肉分割入库建仓。"
            ]
        },
        "traders": {
            "title": "期货套保与投资策略建议",
            "action": "基差交易，逢高卖保",
            "bullets": [
                "基差处于历史高分位数时，现货升水严重，建议养殖企业在主力合约卖出套保，锁定利润。",
                "长线投资者可趁疫情抛售导致的盘面砸坑机会，分批建仓远期合约（如 LH2701）多单。",
                "短线关注期现货价差收敛进程，交割月前基差将快速向现货靠拢，可做基差收窄套利。"
            ]
        }
    }
    
    return {
        "status": "success",
        "date": datetime.date.today(),
        "spot_price": latest_spot,
        "futures_price": futures_price,
        "basis": basis,
        "pig_to_grain": pig_to_grain,
        "self_breeding_profit": self_profit,
        "piglet_breeding_profit": purch_profit,
        "average_weight": avg_weight,
        "warning_level": warning_level,
        "conclusion": {
            "title": conclusion_title,
            "description": conclusion_desc,
            "radar": radar_scores
        },
        "advice": advice
    }

@app.get("/api/yijing/forecast")
def get_yijing_forecast(symbol: str = "LH0", db: Session = Depends(get_db)):
    """
    六爻 × 梅花易数 交叉决策系统。
    基于当前时刻、实时价格与量化基本面数据，推演卦象并生成实时及1/5/10日期货价格预测走势图。
    """
    import json
    
    # 1. 检查今日是否已存在该合约的卦象推演记录
    today_date = datetime.date.today()
    existing_record = db.query(YijingForecastRecord).filter(
        YijingForecastRecord.date == today_date,
        YijingForecastRecord.symbol == symbol.upper()
    ).first()

    if existing_record:
        try:
            return json.loads(existing_record.forecast_data)
        except Exception:
            pass  # 如果解析失败，则重新生成

    # 获取最新现货价格
    latest_spot = db.query(SpotPrice).order_by(SpotPrice.date.desc()).first()
    spot_price = latest_spot.price if latest_spot else 15.4

    # 获取指定合约或主力合约价格
    target_quote = db.query(FuturesQuote).filter(FuturesQuote.symbol == symbol.upper()).first()
    if not target_quote:
        target_quote = db.query(FuturesQuote).filter(FuturesQuote.symbol == "LH0").first()
        
    futures_price = target_quote.last_price if target_quote else 13500.0

    # 获取基本面指标
    latest_indicator = db.query(BreedingIndicator).order_by(BreedingIndicator.date.desc()).first()
    pig_to_grain = latest_indicator.pig_to_grain_ratio if latest_indicator else 5.8
    self_profit = latest_indicator.self_breeding_profit if latest_indicator else -100.0
    corn_price = latest_indicator.corn_price if latest_indicator else 2420.0

    try:
        result = generate_yijing_forecast(
            spot_price=spot_price,
            futures_price=futures_price,
            pig_to_grain=pig_to_grain,
            self_profit=self_profit,
            corn_price=corn_price,
        )
        
        # 2. 保存新生成的卦象数据到数据库
        new_record = YijingForecastRecord(
            date=today_date,
            symbol=symbol.upper(),
            forecast_data=json.dumps(result)
        )
        db.add(new_record)
        db.commit()
        
        return result
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"卦象推演失败: {str(e)}")
