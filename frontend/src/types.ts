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
