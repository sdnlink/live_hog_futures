from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional, Dict, Any

class FuturesQuoteOut(BaseModel):
    id: int
    symbol: str
    name: str
    open: float
    high: float
    low: float
    last_price: float
    yesterday_close: float
    yesterday_settle: float
    bid: float
    ask: float
    volume: float
    open_interest: float
    settlement: float
    date: date
    time: str
    updated_at: datetime

    class Config:
        from_attributes = True

class FuturesKlineOut(BaseModel):
    id: int
    symbol: str
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: float
    open_interest: float
    settlement: float

    class Config:
        from_attributes = True

class SpotPriceOut(BaseModel):
    id: int
    date: date
    price: float
    basis: Optional[float] = None

    class Config:
        from_attributes = True

class ProvincialPriceOut(BaseModel):
    id: int
    date: date
    province: str
    price: float
    change: float

    class Config:
        from_attributes = True

class BreedingIndicatorOut(BaseModel):
    id: int
    date: date
    corn_price: float
    soybean_price: float
    pig_to_grain_ratio: float
    self_breeding_profit: float
    piglet_breeding_profit: float

    class Config:
        from_attributes = True

class SwineCapacityOut(BaseModel):
    id: int
    date: date
    maternal_sow_inventory: Optional[float] = None
    pork_production: Optional[float] = None
    hog_slaughter: Optional[float] = None
    hog_inventory: Optional[float] = None
    pork_consumption: Optional[float] = None
    slaughterhouse_volume: Optional[float] = None
    slaughterhouse_operating_rate: Optional[float] = None
    average_market_weight: Optional[float] = None

    class Config:
        from_attributes = True

class PorkPriceOut(BaseModel):
    id: int
    date: date
    price: float

    class Config:
        from_attributes = True

class EpidemicReportOut(BaseModel):
    id: int
    date: date
    title: str
    content: str
    source: str
    level: str
    url: Optional[str] = None

    class Config:
        from_attributes = True

class SentimentIndexOut(BaseModel):
    id: int
    date: date
    keyword: str
    frequency: int
    sentiment_score: float

    class Config:
        from_attributes = True

class ExpertAdviceOut(BaseModel):
    status: str
    date: date
    spot_price: float
    futures_price: float
    basis: float
    pig_to_grain: float
    self_breeding_profit: float
    piglet_breeding_profit: float
    average_weight: float
    warning_level: str
    conclusion: Dict[str, Any]
    advice: Dict[str, Any]

class StockKlineOut(BaseModel):
    id: int
    symbol: str
    name: str
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: float

    class Config:
        from_attributes = True

class StockQuoteOut(BaseModel):
    id: int
    symbol: str
    name: str
    open: float
    high: float
    low: float
    last_price: float
    yesterday_close: float
    volume: float
    amount: float
    date: date
    time: str
    updated_at: datetime

    class Config:
        from_attributes = True

class FrozenPorkStorageOut(BaseModel):
    id: int
    date: date
    reserve_volume: Optional[float] = None
    commercial_inventory: Optional[float] = None
    storage_rate: Optional[float] = None

    class Config:
        from_attributes = True

class BiopharmaceuticalProcurementOut(BaseModel):
    id: int
    date: date
    swine_fever_vaccine: Optional[float] = None
    prrs_vaccine: Optional[float] = None
    fmd_vaccine: Optional[float] = None
    diarrhea_vaccine: Optional[float] = None
    altrenogest_sales: Optional[float] = None
    oxytocin_sales: Optional[float] = None
    vaccine_index: Optional[float] = None

    class Config:
        from_attributes = True

class BreedingConsumableConsumptionOut(BaseModel):
    id: int
    date: date
    insemination_catheters: Optional[float] = None
    semen_extender: Optional[float] = None
    farrowing_dry_powder: Optional[float] = None
    iron_injection: Optional[float] = None
    ear_tags: Optional[float] = None

    class Config:
        from_attributes = True

class FeedSalesBreakdownOut(BaseModel):
    id: int
    date: date
    sow_feed: Optional[float] = None
    piglet_feed: Optional[float] = None
    grower_feed: Optional[float] = None
    finisher_feed: Optional[float] = None
    overall_feed_volume: Optional[float] = None

    class Config:
        from_attributes = True

class HogLogisticsAndSafetyOut(BaseModel):
    id: int
    date: date
    quarantine_certificates: Optional[int] = None
    transport_freight_index: Optional[float] = None
    mortality_waste_disposal: Optional[float] = None

    class Config:
        from_attributes = True


