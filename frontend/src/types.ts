// TypeScript Interfaces for Live Hog Terminal

export interface FuturesQuote {
  id: number;
  symbol: string;
  name: string;
  open: number;
  high: number;
  low: number;
  last_price: number;
  yesterday_close: number;
  yesterday_settle: number;
  bid: number;
  ask: number;
  volume: number;
  open_interest: number;
  settlement: number;
  date: string;
  time: string;
  updated_at: string;
}

export interface FuturesKline {
  id: number;
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  open_interest: number;
  settlement: number;
}

export interface SpotPrice {
  id: number;
  date: string;
  price: number;
  basis: number | null;
}

export interface PorkPrice {
  id: number;
  date: string;
  price: number;
}

export interface ProvincialPrice {
  id: number;
  date: string;
  province: string;
  price: number;
  change: number;
}

export interface SwineCapacity {
  id: number;
  date: string;
  maternal_sow_inventory: number | null;
  pork_production: number | null;
  hog_slaughter: number | null;
  hog_inventory: number | null;
  pork_consumption: number | null;
  slaughterhouse_volume: number | null;
  slaughterhouse_operating_rate: number | null;
  average_market_weight?: number | null;
}

export interface BreedingIndicator {
  id: number;
  date: string;
  corn_price: number;
  soybean_price: number;
  pig_to_grain_ratio: number;
  self_breeding_profit: number;
  piglet_breeding_profit: number;
}

export interface EpidemicReport {
  id: number;
  date: string;
  title: string;
  content: string;
  source: string;
  level: string;
  url: string | null;
}

export interface SentimentIndex {
  id: number;
  date: string;
  keyword: string;
  frequency: number;
  sentiment_score: number;
}

export interface StockKline {
  id: number;
  symbol: string;
  name: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  id: number;
  symbol: string;
  name: string;
  open: number;
  high: number;
  low: number;
  last_price: number;
  yesterday_close: number;
  volume: number;
  amount: number;
  date: string;
  time: string;
  updated_at: string;
}

export interface FrozenPorkStorage {
  id: number;
  date: string;
  reserve_volume: number | null;
  commercial_inventory: number | null;
  storage_rate: number | null;
}

// ─── 易经交叉决策系统类型 ───
export interface YijingGua {
  ben_gua: string;
  bian_gua: string;
  upper: string;
  lower: string;
  upper_idx: number;
  lower_idx: number;
  bian_upper_idx: number;
  bian_lower_idx: number;
  score: number;
}

export interface YijingMeihua extends YijingGua {
  hu_gua: string;
  hu_upper_idx: number;
  hu_lower_idx: number;
  dong_yao: number;
  ti_gua: string;
  yong_gua: string;
  ti_element: string;
  yong_element: string;
  sheng_ke: number;
}

export interface YaoRender {
  pos: number;
  label: string;
  yang: boolean;
  dong: boolean;
}

export interface YijingLiuyao extends YijingGua {
  yao_vals: number[];
  ben_lines: number[];
  dong_yao_list: number[];
  shi_yao: number;
  ying_yao: number;
  yao_render: YaoRender[];
}

export interface YijingForecastSlot {
  direction: string;
  direction_class: string;
  confidence: number;
  price?: number;
  mid?: number;
  high?: number;
  low?: number;
}

export interface YijingForecast {
  timestamp: string;
  spot_price: number;
  futures_price: number;
  meihua: YijingMeihua;
  liuyao: YijingLiuyao;
  quant_score: number;
  total_score: number;
  direction: string;
  direction_class: string;
  confidence: number;
  forecast: {
    realtime: YijingForecastSlot;
    day1: YijingForecastSlot;
    day5: YijingForecastSlot;
    day10: YijingForecastSlot;
  };
  interpretation: {
    meihua_summary: string;
    liuyao_summary: string;
    quant_bridge: string;
    conclusion: string;
  };
}

export interface ExpertAdvice {
  status: string;
  date: string;
  spot_price: number;
  futures_price: number;
  basis: number;
  pig_to_grain: number;
  self_breeding_profit: number;
  piglet_breeding_profit: number;
  average_weight: number;
  warning_level: string;
  conclusion: {
    title: string;
    description: string;
    radar: {
      supply: number;
      demand: number;
      cost: number;
      policy: number;
      disease: number;
    };
  };
  advice: {
    farmers: { title: string; action: string; bullets: string[] };
    middle: { title: string; action: string; bullets: string[] };
    traders: { title: string; action: string; bullets: string[] };
  };
}

export interface BiopharmaceuticalProcurement {
  id: number;
  date: string;
  swine_fever_vaccine: number | null;
  prrs_vaccine: number | null;
  fmd_vaccine: number | null;
  diarrhea_vaccine: number | null;
  altrenogest_sales: number | null;
  oxytocin_sales: number | null;
  vaccine_index: number | null;
}

export interface BreedingConsumable {
  id: number;
  date: string;
  insemination_catheters: number | null;
  semen_extender: number | null;
  farrowing_dry_powder: number | null;
  iron_injection: number | null;
  ear_tags: number | null;
}

export interface FeedSalesBreakdown {
  id: number;
  date: string;
  sow_feed: number | null;
  piglet_feed: number | null;
  grower_feed: number | null;
  finisher_feed: number | null;
  overall_feed_volume: number | null;
}

export interface HogLogisticsSafety {
  id: number;
  date: string;
  quarantine_certificates: number | null;
  transport_freight_index: number | null;
  mortality_waste_disposal: number | null;
}

export interface CompanyMonthlySales {
  id: number;
  symbol: string;
  name: string;
  date: string;
  sales_volume: number | null;
  sales_price: number | null;
  sales_revenue: number | null;
}

export interface AnalysisSummary {
  market_phase: string;
  composite_index: number;
  composite_status: string;
  risk_level: string;
  update_date: string;
}

export interface DimensionDetail {
  score: number;
  status: string;
  desc: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface AnalysisReportResponse {
  summary: AnalysisSummary;
  dimensions: Record<string, DimensionDetail>;
  swot: SwotAnalysis;
  narrative: string;
}

export interface PorkDownstreamDemand {
  id: number;
  date: string;
  pork_production: number | null;
  pork_consumption: number | null;
  feed_supply: number | null;
  processed_pork_demand: number | null;
  catering_pork_demand: number | null;
}

export interface SubstituteGoodsPrice {
  id: number;
  date: string;
  beef_price: number | null;
  chicken_price: number | null;
  egg_price: number | null;
}

export interface PorkImport {
  id: number;
  date: string;
  import_volume: number | null;
  import_price: number | null;
}

export interface BreedingEfficiency {
  id: number;
  date: string;
  psy: number | null;
  msy: number | null;
  scale_farming_rate: number | null;
}

export interface MacroEnvironmentalIndicator {
  id: number;
  date: string;
  consumer_confidence: number | null;
  environmental_regulation_index: number | null;
  gdp_growth: number | null;
}

export interface TrajectoryPoint {
  date: string;
  days_ahead: number;
  price_mid: number;
  price_upper: number;
  price_lower: number;
  projected_basis: number;
}

export interface HorizonDetail {
  horizon: string;
  target_date: string;
  days: number;
  mid: number;
  high: number;
  low: number;
  direction: string;
  direction_class: string;
  confidence: number;
  expected_change_pct: number;
  primary_driver: string;
}

export interface BiologicalCohortSupply {
  reference_date: string;
  sow_t_minus_10: number;
  piglets_t_minus_6: number;
  projected_slaughter_heads: number;
  projected_avg_weight: number;
  projected_pork_supply: number;
  normal_demand: number;
  supply_demand_gap_pct: number;
  phase_assessment: string;
}

export interface CostAnalysisSummary {
  corn_price: number;
  soybean_price: number;
  feed_price_per_kg: number;
  feed_cost_per_kg_gain: number;
  piglet_cost_share: number;
  cash_cost_line: number;
  full_cost_line: number;
  current_margin: number;
  safety_margin_pct: number;
}

export interface DriversDecomposition {
  supply_gap_impact: number;
  cost_support_impact: number;
  seasonality_impact: number;
  basis_convergence_impact: number;
  speculation_weight_impact: number;
}

export interface PriceTrendForecast {
  status: string;
  symbol: string;
  base_date: string;
  spot_price: number;
  futures_price: number;
  basis: number;
  short_term_bias: string;
  mid_term_bias: string;
  long_term_bias: string;
  overall_confidence: number;
  horizons: HorizonDetail[];
  trajectory_90d: TrajectoryPoint[];
  cohort: BiologicalCohortSupply;
  cost: CostAnalysisSummary;
  drivers: DriversDecomposition;
  forecast_narrative: string;
}

export interface SimulationParams {
  sow_shock_pct: number;
  feed_cost_shock_pct: number;
  weight_shock_kg: number;
  demand_shock_pct: number;
}
