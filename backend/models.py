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
    pork_consumption = Column(Float, nullable=True)         # 猪肉消费量 (万吨)
    slaughterhouse_volume = Column(Float, nullable=True)          # 屠宰场定点屠宰量 (万头)
    slaughterhouse_operating_rate = Column(Float, nullable=True)  # 屠宰场开工率 (%)

class PorkPrice(Base):
    __tablename__ = "pork_prices"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    price = Column(Float)                                  # 猪肉批发均价 (元/公斤)

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

class StockKline(Base):
    __tablename__ = "stock_klines"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True)                # e.g., 002714
    name = Column(String(50))                              # e.g., 牧原股份
    date = Column(Date, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)

    __table_args__ = (
        Index('idx_stock_symbol_date', 'symbol', 'date', unique=True),
    )

class StockQuote(Base):
    __tablename__ = "stock_quotes"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True)   # e.g., 002714
    name = Column(String(50))                              # e.g., 牧原股份
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    last_price = Column(Float)
    yesterday_close = Column(Float)
    volume = Column(Float)
    amount = Column(Float)
    date = Column(Date, index=True)
    time = Column(String(10))                              # e.g., 15:00:00
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class FrozenPorkStorage(Base):
    __tablename__ = "frozen_pork_storage"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    reserve_volume = Column(Float, nullable=True)          # 储备冻猪肉投放/收储量 (万吨)
    commercial_inventory = Column(Float, nullable=True)    # 商业冻品库存估算量 (万吨)
    storage_rate = Column(Float, nullable=True)            # 冻品库容率 (%)

class BiopharmaceuticalProcurement(Base):
    """生物医药及动保用品采购监控表"""
    __tablename__ = "biopharmaceutical_procurements"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    swine_fever_vaccine = Column(Float, nullable=True)         # 猪瘟疫苗采购量 (万支)
    prrs_vaccine = Column(Float, nullable=True)                # 蓝耳疫苗采购量 (万支)
    fmd_vaccine = Column(Float, nullable=True)                 # 口蹄疫疫苗采购量 (万支)
    diarrhea_vaccine = Column(Float, nullable=True)            # 流行性腹泻疫苗 (万支)
    altrenogest_sales = Column(Float, nullable=True)           # 烯丙孕素销售量 (万支)
    oxytocin_sales = Column(Float, nullable=True)              # 缩宫素销售量 (万支)
    vaccine_index = Column(Float, nullable=True)               # 动保景气度综合指数

class BreedingConsumableConsumption(Base):
    """母猪繁育及产房辅助用品消耗监控表"""
    __tablename__ = "breeding_consumable_consumptions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    insemination_catheters = Column(Float, nullable=True)      # 输精管领用消耗量 (万支)
    semen_extender = Column(Float, nullable=True)              # 精液稀释剂消耗量 (万袋)
    farrowing_dry_powder = Column(Float, nullable=True)        # 接生粉干燥粉消耗量 (万包)
    iron_injection = Column(Float, nullable=True)              # 补铁针剂消耗量 (万支)
    ear_tags = Column(Float, nullable=True)                    # 耳标领用/消耗量 (万枚)

class FeedSalesBreakdown(Base):
    """饲料细分产品销量表"""
    __tablename__ = "feed_sales_breakdowns"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    sow_feed = Column(Float, nullable=True)                    # 母猪配合料销量 (万吨)
    piglet_feed = Column(Float, nullable=True)                 # 教槽/乳猪料销量 (万吨)
    grower_feed = Column(Float, nullable=True)                 # 保育/中猪料销量 (万吨)
    finisher_feed = Column(Float, nullable=True)               # 肥猪配合料销量 (万吨)
    overall_feed_volume = Column(Float, nullable=True)         # 饲料总销量 (万吨)

class HogLogisticsAndSafety(Base):
    """生猪物流调运与安全监控表"""
    __tablename__ = "hog_logistics_and_safety"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    quarantine_certificates = Column(Integer, nullable=True)   # 生猪调运跨省检疫票发放数 (张)
    transport_freight_index = Column(Float, nullable=True)     # 跨省运猪车运费指数 (基期1000)
    mortality_waste_disposal = Column(Float, nullable=True)    # 病死猪无害化处理量 (吨)


