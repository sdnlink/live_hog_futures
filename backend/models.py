from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, Index
from sqlalchemy.sql import func
from .database import Base

class FuturesQuote(Base):
    __tablename__ = "futures_quotes"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True)  # e.g., LH2609
    name = Column(String(50))                              # e.g., 生猪2609
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    last_price = Column(Float)
    yesterday_close = Column(Float)
    yesterday_settle = Column(Float)
    bid = Column(Float)
    ask = Column(Float)
    volume = Column(Float)
    open_interest = Column(Float)
    settlement = Column(Float)
    date = Column(Date, index=True)
    time = Column(String(10))                              # e.g., 15:01:00
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class FuturesKline(Base):
    __tablename__ = "futures_klines"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True)                # e.g., LH2609 or LH0
    date = Column(Date, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)
    open_interest = Column(Float)
    settlement = Column(Float)

    __table_args__ = (
        Index('idx_symbol_date', 'symbol', 'date', unique=True),
    )

class SpotPrice(Base):
    __tablename__ = "spot_prices"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    price = Column(Float)                                  # 全国瘦肉型肉猪出栏均价 (元/公斤)
    basis = Column(Float, nullable=True)                   # 基差 = 现货 - 主力期货 (折合元/公斤)

class ProvincialPrice(Base):
    __tablename__ = "provincial_prices"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    province = Column(String(50), index=True)             # e.g., 四川, 河南
    price = Column(Float)                                  # 价格 (元/公斤)
    change = Column(Float)                                 # 涨跌幅 (元/公斤)

    __table_args__ = (
        Index('idx_province_date', 'province', 'date', unique=True),
    )

class BreedingIndicator(Base):
    __tablename__ = "breeding_indicators"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    corn_price = Column(Float)                             # 玉米价格 (元/吨)
    soybean_price = Column(Float)                          # 豆粕价格 (元/吨)
    pig_to_grain_ratio = Column(Float)                     # 猪粮比价
    self_breeding_profit = Column(Float)                   # 自繁自养利润 (元/头)
    piglet_breeding_profit = Column(Float)                 # 外购仔猪利润 (元/头)

class SwineCapacity(Base):
    __tablename__ = "swine_capacity"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    maternal_sow_inventory = Column(Float, nullable=True)  # 能繁母猪存栏量 (万头)
    pork_production = Column(Float, nullable=True)         # 猪肉产量 (万吨)
    hog_slaughter = Column(Float, nullable=True)           # 生猪出栏量 (万头)
    hog_inventory = Column(Float, nullable=True)           # 生猪存栏量 (万头)

class EpidemicReport(Base):
    __tablename__ = "epidemic_reports"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    title = Column(String(200))
    content = Column(Text)
    source = Column(String(100))                           # e.g., 农业农村部
    level = Column(String(20))                             # info, warning, danger
    url = Column(String(500), nullable=True)

class SentimentIndex(Base):
    __tablename__ = "sentiment_indices"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    keyword = Column(String(50))                           # e.g., 非瘟, 抛售, 腹泻
    frequency = Column(Integer)                            # 舆情频次
    sentiment_score = Column(Float)                        # 舆情警告指数 (0-100)

    __table_args__ = (
        Index('idx_keyword_date', 'keyword', 'date', unique=True),
    )
