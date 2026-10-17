from pydantic import BaseModel, ConfigDict
from datetime import date, datetime, date as dt_date
from typing import List, Optional, Dict, Any


class OrmBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class FuturesQuoteOut(OrmBaseModel):
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


class FuturesKlineOut(OrmBaseModel):
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


class SpotPriceOut(OrmBaseModel):
    id: int
    date: date
    price: float
    basis: Optional[float] = None


class ProvincialPriceOut(OrmBaseModel):
    id: int
    date: date
    province: str
    price: float
    change: float


class BreedingIndicatorOut(OrmBaseModel):
    id: int
    date: date
    corn_price: Optional[float] = None
    soybean_price: Optional[float] = None
    pig_to_grain_ratio: Optional[float] = None
    self_breeding_profit: Optional[float] = None
    piglet_breeding_profit: Optional[float] = None


class SwineCapacityOut(OrmBaseModel):
    id: int
    date: date
    maternal_sow_inventory: Optional[float] = None
    pork_production: Optional[float] = None
    hog_slaughter: Optional[float] = None
    hog_inventory: Optional[float] = None
    pork_consumption: Optional[float] = None
    slaughterhouse_volume: Optional[float] = None
    slaughterhouse_operating_rate: Optional[float] = None


class PorkPriceOut(OrmBaseModel):
    id: int
    date: date
    price: float


class EpidemicReportOut(OrmBaseModel):
    id: int
    date: date
    title: str
    content: str
    source: str
    level: str
    url: Optional[str] = None


class SentimentIndexOut(OrmBaseModel):
    id: int
    date: date
    keyword: str
    frequency: int
    sentiment_score: float


class StockKlineOut(OrmBaseModel):
    id: int
    symbol: str
    name: str
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: float


class StockQuoteOut(OrmBaseModel):
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


class FrozenPorkStorageOut(OrmBaseModel):
    id: int
    date: date
    reserve_volume: Optional[float] = None
    commercial_inventory: Optional[float] = None
    storage_rate: Optional[float] = None


class BiopharmaceuticalProcurementOut(OrmBaseModel):
    id: int
    date: date
    swine_fever_vaccine: Optional[float] = None
    prrs_vaccine: Optional[float] = None
    fmd_vaccine: Optional[float] = None
    diarrhea_vaccine: Optional[float] = None
    altrenogest_sales: Optional[float] = None
    oxytocin_sales: Optional[float] = None
    vaccine_index: Optional[float] = None


class BreedingConsumableConsumptionOut(OrmBaseModel):
    id: int
    date: date
    insemination_catheters: Optional[float] = None
    semen_extender: Optional[float] = None
    farrowing_dry_powder: Optional[float] = None
    iron_injection: Optional[float] = None
    ear_tags: Optional[float] = None


class FeedSalesBreakdownOut(OrmBaseModel):
    id: int
    date: date
    sow_feed: Optional[float] = None
    piglet_feed: Optional[float] = None
    grower_feed: Optional[float] = None
    finisher_feed: Optional[float] = None
    overall_feed_volume: Optional[float] = None


class HogLogisticsAndSafetyOut(OrmBaseModel):
    id: int
    date: date
    quarantine_certificates: Optional[int] = None
    transport_freight_index: Optional[float] = None
    mortality_waste_disposal: Optional[float] = None


class CompanyMonthlySalesOut(OrmBaseModel):
    id: int
    symbol: str
    name: str
    date: date
    sales_volume: Optional[float] = None
    sales_price: Optional[float] = None
    sales_revenue: Optional[float] = None


class PorkDownstreamDemandOut(OrmBaseModel):
    id: int
    date: date
    pork_production: Optional[float] = None
    pork_consumption: Optional[float] = None
    feed_supply: Optional[float] = None
    processed_pork_demand: Optional[float] = None
    catering_pork_demand: Optional[float] = None


class SubstituteGoodsPriceOut(OrmBaseModel):
    id: int
    date: date
    beef_price: Optional[float] = None
    chicken_price: Optional[float] = None
    egg_price: Optional[float] = None


class PorkImportOut(OrmBaseModel):
    id: int
    date: date
    import_volume: Optional[float] = None
    import_price: Optional[float] = None


class BreedingEfficiencyOut(OrmBaseModel):
    id: int
    date: date
    psy: Optional[float] = None
    msy: Optional[float] = None
    scale_farming_rate: Optional[float] = None


class MacroEnvironmentalIndicatorOut(OrmBaseModel):
    id: int
    date: date
    consumer_confidence: Optional[float] = None
    environmental_regulation_index: Optional[float] = None
    gdp_growth: Optional[float] = None


# Advice and analysis models
class GroupAdvice(BaseModel):
    title: str
    action: str
    bullets: List[str] = []
    logic: Optional[str] = None
    tips: Optional[List[str]] = None


class RadarScores(BaseModel):
    supply: int
    demand: int
    cost: int
    policy: int
    disease: int


class ConclusionOut(BaseModel):
    title: str
    description: str
    radar: RadarScores


class ExpertAdviceOut(BaseModel):
    status: str
    date: Optional[dt_date] = None
    spot_price: float
    futures_price: float
    basis: float
    pig_to_grain: Optional[float] = None
    self_breeding_profit: Optional[float] = None
    piglet_breeding_profit: Optional[float] = None
    average_weight: Optional[float] = None
    warning_level: str
    conclusion: ConclusionOut
    advice: Dict[str, GroupAdvice]


class EpidemicStatusOut(BaseModel):
    reports: List[EpidemicReportOut]
    sentiment: List[SentimentIndexOut]


class MeihuaForecastOut(BaseModel):
    ben_gua: str
    bian_gua: str
    hu_gua: str
    upper: str
    lower: str
    upper_idx: int
    lower_idx: int
    bian_upper_idx: int
    bian_lower_idx: int
    hu_upper_idx: int
    hu_lower_idx: int
    dong_yao: int
    ti_gua: str
    yong_gua: str
    ti_element: str
    yong_element: str
    sheng_ke: float
    score: float


class LiuyaoYaoRender(BaseModel):
    pos: int
    label: str
    yang: bool
    dong: bool


class LiuyaoForecastOut(BaseModel):
    ben_gua: str
    bian_gua: str
    upper: str
    lower: str
    upper_idx: int
    lower_idx: int
    bian_upper_idx: int
    bian_lower_idx: int
    yao_vals: List[int]
    ben_lines: List[int]
    dong_yao_list: List[int]
    shi_yao: int
    ying_yao: int
    score: float
    yao_render: List[LiuyaoYaoRender]


class ForecastPointOut(BaseModel):
    direction: str
    direction_class: str
    confidence: float
    price: Optional[float] = None
    mid: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None


class ForecastTimelineOut(BaseModel):
    realtime: ForecastPointOut
    day1: ForecastPointOut
    day5: ForecastPointOut
    day10: ForecastPointOut


class InterpretationOut(BaseModel):
    meihua_summary: str
    liuyao_summary: str
    quant_bridge: str
    conclusion: str


class YijingForecastOut(BaseModel):
    timestamp: str
    spot_price: float
    futures_price: float
    meihua: MeihuaForecastOut
    liuyao: LiuyaoForecastOut
    quant_score: float
    total_score: float
    direction: str
    direction_class: str
    confidence: float
    forecast: ForecastTimelineOut
    interpretation: InterpretationOut


class AnalysisSummaryOut(BaseModel):
    market_phase: str
    composite_index: float
    composite_status: str
    risk_level: str
    update_date: str


class DimensionDetailOut(BaseModel):
    score: float
    status: str
    desc: str


class SwotAnalysisOut(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]


class AnalysisReportResponse(BaseModel):
    summary: AnalysisSummaryOut
    dimensions: Dict[str, DimensionDetailOut]
    swot: SwotAnalysisOut
    narrative: str


# --- Quantitative Price Forecasting Schemas (New) ---

class TrajectoryPointOut(BaseModel):
    date: str
    days_ahead: int
    price_mid: float
    price_upper: float
    price_lower: float
    projected_basis: float


class HorizonDetailOut(BaseModel):
    horizon: str  # e.g. "1d", "3d", "5d", "7d", "10d", "15d", "30d", "60d", "90d", "180d"
    target_date: str
    days: int
    mid: float
    high: float
    low: float
    direction: str
    direction_class: str
    confidence: float
    expected_change_pct: float
    primary_driver: str


class BiologicalCohortSupplyOut(BaseModel):
    reference_date: str
    sow_t_minus_10: float  # 万头
    piglets_t_minus_6: float  # 万头
    projected_slaughter_heads: float  # 万头
    projected_avg_weight: float  # 公斤
    projected_pork_supply: float  # 万吨
    normal_demand: float  # 万吨
    supply_demand_gap_pct: float  # % (正值代表过剩，负值代表短缺)
    phase_assessment: str


class CostAnalysisSummaryOut(BaseModel):
    corn_price: float  # 元/吨
    soybean_price: float  # 元/吨
    feed_price_per_kg: float  # 元/公斤
    feed_cost_per_kg_gain: float  # 元/公斤增重成本
    piglet_cost_share: float  # 元/公斤仔猪分摊
    cash_cost_line: float  # 现金保本线 (元/公斤)
    full_cost_line: float  # 完全保本线 (元/公斤)
    current_margin: float  # 当前毛利 (元/公斤)
    safety_margin_pct: float  # 相对完全成本的安全溢价/折价 (%)


class DriversDecompositionOut(BaseModel):
    supply_gap_impact: float  # 供需缺口对价格的影响贡献分
    cost_support_impact: float  # 成本中枢对价格的支撑/压制贡献分
    seasonality_impact: float  # 消费季节性系数影响分
    basis_convergence_impact: float  # 基差回归驱动分
    speculation_weight_impact: float  # 二育与压栏行为影响分


class PriceTrendForecastResponse(BaseModel):
    status: str
    symbol: str
    base_date: str
    spot_price: float
    futures_price: float
    basis: float
    short_term_bias: str
    mid_term_bias: str
    long_term_bias: str
    overall_confidence: float
    horizons: List[HorizonDetailOut]
    trajectory_90d: List[TrajectoryPointOut]
    cohort: BiologicalCohortSupplyOut
    cost: CostAnalysisSummaryOut
    drivers: DriversDecompositionOut
    forecast_narrative: str
