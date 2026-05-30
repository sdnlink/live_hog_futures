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
