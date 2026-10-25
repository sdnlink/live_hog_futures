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


class CycleSignal(BaseModel):
    name: str
    direction: str  # "BUY", "SELL", "HOLD"
    tag: str
    color: str  # "up", "warn", "down"
    reason: str


class TradeSetupPlan(BaseModel):
    target_contract: str
    action: str  # "STRONG_BUY", "BUY", "NEUTRAL", "SELL", "STRONG_SELL"
    action_label: str
    confidence_score: int
    entry_range: str
    take_profit: str
    stop_loss: str
    risk_reward_ratio: float
    position_suggestion: str
    safety_margin_level: str
    one_sentence_rationale: str
    cycles: List[CycleSignal]


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
    trade_signal: Optional[TradeSetupPlan] = None


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
    status: str = "success"
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


# ==============================================================================
# 专家与深度交易系统全要素扩展模型 (Term Structure, Factor Matrix, Delivery)
# ==============================================================================

class ContractTermInfo(BaseModel):
    symbol: str
    name: str
    last_price: float
    settlement: float
    change_pct: float
    volume: float
    open_interest: float
    basis_to_spot: float  # 现货 - 期货 (元/吨)
    basis_rate_pct: float  # 基差率 (%)
    days_to_delivery: int
    is_main: bool


class CalendarSpreadInfo(BaseModel):
    pair_name: str  # e.g., "LH2701 - LH2611"
    near_symbol: str
    far_symbol: str
    spread: float  # far - near (元/吨)
    annualized_spread_pct: float  # 年化月差收益率 (%)
    structure: str  # "CONTANGO" or "BACKWARDATION"
    percentile: float  # 历史分位 (%)
    trading_implication: str  # 套利策略含义


class TermStructureResponse(BaseModel):
    status: str
    base_date: str
    spot_price: float  # 现货元/吨
    structure_type: str  # CONTANGO / BACKWARDATION / FLAT
    structure_label: str
    contracts: List[ContractTermInfo]
    spreads: List[CalendarSpreadInfo]
    hedging_advice: str
    arbitrage_window: str


class FactorItemOut(BaseModel):
    factor_id: str
    factor_name: str
    category: str  # supply, cost, demand, futures, policy
    current_value_str: str
    current_value_num: float
    unit: str
    benchmark_value: float
    direction: str  # BULLISH / BEARISH / NEUTRAL
    direction_label: str
    impact_level: str  # CRITICAL / HIGH / MEDIUM / LOW
    score: float  # -100 (极度利空) ~ +100 (极度利多)
    percentile: float  # 0 - 100%
    logic_summary: str
    behavior_transmission: str


class FactorDimensionGroupOut(BaseModel):
    dimension_id: str
    dimension_name: str
    dimension_score: float  # -100 ~ +100
    overall_bias: str  # 偏多 / 偏空 / 中性
    weight_pct: float
    factors: List[FactorItemOut]


class FactorsMatrixResponse(BaseModel):
    status: str
    updated_date: str
    composite_market_score: float  # -100 (极限极空) ~ +100 (极限极多)
    market_sentiment_label: str
    macro_regime: str
    bearish_factors_count: int
    bullish_factors_count: int
    neutral_factors_count: int
    core_downward_driver: str
    core_support_anchor: str
    dimensions: List[FactorDimensionGroupOut]
    expert_trading_conclusions: List[str]


class DeliveryArbitrageResponse(BaseModel):
    status: str
    date: str
    contract: str
    futures_price: float  # 元/吨
    spot_price: float  # 元/吨
    raw_basis: float  # 元/吨
    location: str  # 河南基准 / 四川 / 广东 / 辽宁
    location_premium: float  # 地区交割升贴水 (元/吨)
    weight_discount: float  # 体重扣罚贴水 (元/吨)
    fees_total: float  # 检验、过磅、押车损耗、过户费 (元/吨)
    breakeven_delivery_cost: float  # 交割保本成本 (元/吨)
    arbitrage_profit_per_ton: float  # 无风险期现卖保交割利润 (元/吨)
    is_window_open: bool  # 是否开启无风险卖保套利窗口
    arbitrage_advice: str


class BrokerPositionItem(BaseModel):
    rank: int
    broker_name: str
    lots: int
    change_lots: int
    broker_type: str  # "产业套保席位" | "量化基金席位" | "综合券商席位"


class BrokerPositionsResponse(BaseModel):
    status: str
    date: str
    symbol: str
    total_long_top20: int
    total_short_top20: int
    net_bias: str  # "净空头优势" | "净多头优势" | "多空相持"
    net_lots: int  # long - short
    cr5_short_concentration_pct: float  # 前5大空头集中度 %
    top_long_members: List[BrokerPositionItem]
    top_short_members: List[BrokerPositionItem]
    institutional_verdict: str


class HedgingScenarioItem(BaseModel):
    scenario_name: str
    spot_change_pct: float
    simulated_spot_price: float
    spot_pnl_wanyuan: float
    futures_pnl_wanyuan: float
    combined_net_pnl_wanyuan: float
    risk_reduction_pct: float
    verdict: str


class HedgingSimulationResponse(BaseModel):
    status: str
    date: str
    farm_capacity_heads: int
    annual_tonnage: float
    current_cost_per_kg: float
    spot_price_per_kg: float
    futures_hedge_price: float
    hedge_ratio_pct: float
    unhedged_total_loss_wanyuan: float
    hedged_total_loss_wanyuan: float
    loss_saved_wanyuan: float
    hedging_efficiency_pct: float
    scenarios: List[HedgingScenarioItem]
    expert_hedging_rule: str


class StandardFatSpreadResponse(BaseModel):
    status: str
    date: str
    standard_hog_price: float  # 标准猪 110-120kg (元/kg)
    fat_hog_price: float  # 大肥猪 150kg+ (元/kg)
    spread: float  # fat - standard (元/kg)
    fat_standard_ratio: float  # 肥标比
    spread_status: str  # "深度倒挂(大猪踩踏)" | "小幅倒挂" | "平水" | "标肥溢价(大猪抢手)"
    average_weight_kg: float  # 规模场出栏均重
    weight_turning_signal: str  # "高位拐头出清" | "持续攀升压栏" | "低位良性"
    secondary_fattening_index: float  # 0-100 二育情绪指数
    secondary_fattening_sentiment: str  # "极度低迷离场" | "观望等待" | "开始抄底截流" | "过热抢猪"
    history: List[dict]  # 近期标肥价差历史走势
    expert_analysis: str


class CullSowLiquidationResponse(BaseModel):
    status: str
    date: str
    cull_sow_price: float  # 淘汰母猪价格 (元/kg)
    standard_hog_price: float  # 商品三元标猪 (元/kg)
    cull_to_standard_ratio: float  # 淘母/标猪比值
    normal_benchmark_ratio: float  # 平衡年份基准比 (0.72)
    liquidation_stage: str  # "恐慌甩卖与主动出清阶段" | "被动死扛微亏阶段" | "理性替换阶段" | "惜售压栏阶段"
    sow_slaughter_utilization_pct: float  # 淘母定点屠宰场开工负荷率 %
    parity_structure_insight: str  # 胎次结构剖析
    cycle_bottom_probability_pct: float  # 周期大底探明概率 %
    expert_verdict: str


class RollYieldRiskResponse(BaseModel):
    status: str
    date: str
    active_contract: str  # LH2701
    next_contract: str  # LH2703
    price_diff: float  # next - active (元/吨)
    calendar_spread_pct: float
    annualized_roll_yield_pct: float  # 年化移仓展期收益率 (多头负收益，空头正收益)
    structure_label: str  # "Super Contango (强升水)" | "Contango" | "Flat" | "Backwardation"
    days_to_delivery_month: int
    delivery_squeeze_risk_level: str  # "极高风险(逼多平仓)" | "中等" | "低"
    carboard_delivery_penalty_per_ton: float  # 车板交割买方综合折损 (检验+掉秤+运费)
    roll_strategy_recommendation: str


class GlobalHogMarketResponse(BaseModel):
    status: str
    date: str
    us_cme_lean_hog_usd_cents_per_lb: float  # 美分/磅
    us_cme_price_cny_per_ton: float  # 折合人民币现价 (元/吨)
    us_export_pork_cost_per_ton: float  # 美猪冷冻猪肉到岸完税成本 (元/吨)
    eu_carcass_price_eur_per_100kg: float  # 欧盟胴体基准价 (欧元/100kg)
    eu_import_cost_cny_per_ton: float  # 欧猪到岸完税成本 (元/吨)
    brazil_live_hog_brl_per_kg: float  # 巴西出栏价 (雷亚尔/kg)
    brazil_import_cost_cny_per_ton: float  # 巴西极低成本猪肉到岸完税成本 (元/吨)
    china_domestic_frozen_price_per_ton: float  # 国内2号/4号冻肉均价 (元/吨)
    import_profit_margin_per_ton: float  # 进口利润 = 国内冻肉 - 最低完税成本 (元/吨)
    import_window_status: str  # "进口窗口严重关闭(深幅倒挂)" | "微利窗口" | "进口套利暴利开启"
    global_supply_demand_summary: str
    regional_breakdowns: List[dict]


class PillarDetail(BaseModel):
    name: str
    category: str
    status_label: str
    traffic_light: str  # "red" | "yellow" | "green"
    primary_metric: str
    sub_metric: str
    takeaway: str


class TimelineMonth(BaseModel):
    period: str
    contract: str
    supply: float
    demand: float
    gap_pct: float
    status: str
    bias: str


class ContractGuidance(BaseModel):
    symbol: str
    name: str
    price: float
    basis: float
    verdict: str
    color: str
    comment: str


class MasterVerdict(BaseModel):
    status: str
    status_code: str  # "SURPLUS_SEVERE" | "SURPLUS_MILD" | "BALANCED" | "SHORTAGE"
    net_gap_pct: float
    monthly_supply_tons: float
    monthly_demand_tons: float
    monthly_surplus_tons: float
    trading_bias: str
    core_conflict: str
    action_level: str  # "STRONG_SELL" | "SELL" | "NEUTRAL" | "BUY"


class SupplyDemandSummaryResponse(BaseModel):
    status: str
    updated_at: str
    verdict: MasterVerdict
    pillars: List[PillarDetail]
    timeline_6m: List[TimelineMonth]
    contracts_guidance: List[ContractGuidance]


