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

export interface CycleSignal {
  name: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  tag: string;
  color: 'up' | 'warn' | 'down';
  reason: string;
}

export interface TradeSetupPlan {
  target_contract: string;
  action: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  action_label: string;
  confidence_score: number;
  entry_range: string;
  take_profit: string;
  stop_loss: string;
  risk_reward_ratio: number;
  position_suggestion: string;
  safety_margin_level: string;
  one_sentence_rationale: string;
  cycles: CycleSignal[];
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
  trade_signal?: TradeSetupPlan;
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

export interface ContractTermInfo {
  symbol: string;
  name: string;
  last_price: number;
  settlement: number;
  change_pct: number;
  volume: number;
  open_interest: number;
  basis_to_spot: number;
  basis_rate_pct: number;
  days_to_delivery: number;
  is_main: boolean;
}

export interface CalendarSpreadInfo {
  pair_name: string;
  near_symbol: string;
  far_symbol: string;
  spread: number;
  annualized_spread_pct: number;
  structure: 'CONTANGO' | 'BACKWARDATION';
  percentile: number;
  trading_implication: string;
}

export interface TermStructureResponse {
  status: string;
  base_date: string;
  spot_price: number;
  structure_type: string;
  structure_label: string;
  contracts: ContractTermInfo[];
  spreads: CalendarSpreadInfo[];
  hedging_advice: string;
  arbitrage_window: string;
}

export interface FactorItem {
  factor_id: string;
  factor_name: string;
  category: 'supply' | 'cost' | 'demand' | 'futures' | 'policy';
  current_value_str: string;
  current_value_num: number;
  unit: string;
  benchmark_value: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  direction_label: string;
  impact_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  percentile: number;
  logic_summary: string;
  behavior_transmission: string;
}

export interface FactorDimensionGroup {
  dimension_id: string;
  dimension_name: string;
  dimension_score: number;
  overall_bias: string;
  weight_pct: number;
  factors: FactorItem[];
}

export interface FactorsMatrixResponse {
  status: string;
  updated_date: string;
  composite_market_score: number;
  market_sentiment_label: string;
  macro_regime: string;
  bearish_factors_count: number;
  bullish_factors_count: number;
  neutral_factors_count: number;
  core_downward_driver: string;
  core_support_anchor: string;
  dimensions: FactorDimensionGroup[];
  expert_trading_conclusions: string[];
}

export interface DeliveryArbitrageResponse {
  status: string;
  date: string;
  contract: string;
  futures_price: number;
  spot_price: number;
  raw_basis: number;
  location: string;
  location_premium: number;
  weight_discount: number;
  fees_total: number;
  breakeven_delivery_cost: number;
  arbitrage_profit_per_ton: number;
  is_window_open: boolean;
  arbitrage_advice: string;
}

export interface BrokerPositionItem {
  rank: number;
  broker_name: string;
  lots: number;
  change_lots: number;
  broker_type: string;
}

export interface BrokerPositionsResponse {
  status: string;
  date: string;
  symbol: string;
  total_long_top20: number;
  total_short_top20: number;
  net_bias: string;
  net_lots: number;
  cr5_short_concentration_pct: number;
  top_long_members: BrokerPositionItem[];
  top_short_members: BrokerPositionItem[];
  institutional_verdict: string;
}

export interface HedgingScenarioItem {
  scenario_name: string;
  spot_change_pct: number;
  simulated_spot_price: number;
  spot_pnl_wanyuan: number;
  futures_pnl_wanyuan: number;
  combined_net_pnl_wanyuan: number;
  risk_reduction_pct: number;
  verdict: string;
}

export interface HedgingSimulationResponse {
  status: string;
  date: string;
  farm_capacity_heads: number;
  annual_tonnage: number;
  current_cost_per_kg: number;
  spot_price_per_kg: number;
  futures_hedge_price: number;
  hedge_ratio_pct: number;
  unhedged_total_loss_wanyuan: number;
  hedged_total_loss_wanyuan: number;
  loss_saved_wanyuan: number;
  hedging_efficiency_pct: number;
  scenarios: HedgingScenarioItem[];
  expert_hedging_rule: string;
}

export interface StandardFatHistoryItem {
  day: string;
  standard: number;
  fat: number;
  spread: number;
}

export interface StandardFatSpreadResponse {
  status: string;
  date: string;
  standard_hog_price: number;
  fat_hog_price: number;
  spread: number;
  fat_standard_ratio: number;
  spread_status: string;
  average_weight_kg: number;
  weight_turning_signal: string;
  secondary_fattening_index: number;
  secondary_fattening_sentiment: string;
  history: StandardFatHistoryItem[];
  expert_analysis: string;
}

export interface CullSowLiquidationResponse {
  status: string;
  date: string;
  cull_sow_price: number;
  standard_hog_price: number;
  cull_to_standard_ratio: number;
  normal_benchmark_ratio: number;
  liquidation_stage: string;
  sow_slaughter_utilization_pct: number;
  parity_structure_insight: string;
  cycle_bottom_probability_pct: number;
  expert_verdict: string;
}

export interface RollYieldRiskResponse {
  status: string;
  date: string;
  active_contract: string;
  next_contract: string;
  price_diff: number;
  calendar_spread_pct: number;
  annualized_roll_yield_pct: number;
  structure_label: string;
  days_to_delivery_month: number;
  delivery_squeeze_risk_level: string;
  carboard_delivery_penalty_per_ton: number;
  roll_strategy_recommendation: string;
}

export interface GlobalRegionItem {
  region: string;
  benchmark_index: string;
  production_cost: string;
  herd_status: string;
  export_to_china_cny_ton: number;
  export_volume_trend: string;
  status: string;
}

export interface GlobalHogMarketResponse {
  status: string;
  date: string;
  us_cme_lean_hog_usd_cents_per_lb: number;
  us_cme_price_cny_per_ton: number;
  us_export_pork_cost_per_ton: number;
  eu_carcass_price_eur_per_100kg: number;
  eu_import_cost_cny_per_ton: number;
  brazil_live_hog_brl_per_kg: number;
  brazil_import_cost_cny_per_ton: number;
  china_domestic_frozen_price_per_ton: number;
  import_profit_margin_per_ton: number;
  import_window_status: string;
  global_supply_demand_summary: string;
  regional_breakdowns: GlobalRegionItem[];
}

export interface PillarDetail {
  name: string;
  category: string;
  status_label: string;
  traffic_light: 'red' | 'yellow' | 'green';
  primary_metric: string;
  sub_metric: string;
  takeaway: string;
}

export interface TimelineMonth {
  period: string;
  contract: string;
  supply: number;
  demand: number;
  gap_pct: number;
  status: string;
  bias: string;
}

export interface ContractGuidance {
  symbol: string;
  name: string;
  price: number;
  basis: number;
  verdict: string;
  color: string;
  comment: string;
}

export interface MasterVerdict {
  status: string;
  status_code: string;
  net_gap_pct: number;
  monthly_supply_tons: number;
  monthly_demand_tons: number;
  monthly_surplus_tons: number;
  trading_bias: string;
  core_conflict: string;
  action_level: string;
}

export interface SupplyDemandSummaryResponse {
  status: string;
  updated_at: string;
  verdict: MasterVerdict;
  pillars: PillarDetail[];
  timeline_6m: TimelineMonth[];
  contracts_guidance: ContractGuidance[];
}




