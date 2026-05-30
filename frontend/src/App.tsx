import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  LineChart as ChartIcon,
  Calculator,
  Award,
  ShieldCheck,
  Map,
  RefreshCw,
  Layers,
  Activity,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart
} from 'recharts';
import './App.css';

// TypeScript Interfaces
interface FuturesQuote {
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
}

interface FuturesKline {
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

interface SpotPrice {
  date: string;
  price: number;
  basis: number | null;
}

interface ProvincialPrice {
  date: string;
  province: string;
  price: number;
  change: number;
}

interface SwineCapacity {
  date: string;
  maternal_sow_inventory: number;
  pork_production: number;
  hog_slaughter: number;
  hog_inventory: number;
}

interface BreedingIndicator {
  date: string;
  corn_price: number;
  soybean_price: number;
  pig_to_grain_ratio: number;
  self_breeding_profit: number;
  piglet_breeding_profit: number;
}

interface EpidemicReport {
  date: string;
  title: string;
  content: string;
  source: string;
  level: string;
  url: string | null;
}

interface SentimentIndex {
  date: string;
  keyword: string;
  frequency: number;
  sentiment_score: number;
}

interface ExpertAdvice {
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

const BASE_URL = 'http://localhost:8000';

function App() {
  // Global App States
  const [quotes, setQuotes] = useState<FuturesQuote[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('LH0');
  const [klineData, setKlineData] = useState<FuturesKline[]>([]);
  const [spotBasisData, setSpotBasisData] = useState<SpotPrice[]>([]);
  const [provPrices, setProvPrices] = useState<ProvincialPrice[]>([]);
  const [capacityData, setCapacityData] = useState<SwineCapacity[]>([]);
  const [costsData, setCostsData] = useState<BreedingIndicator[]>([]);
  const [epidemicReports, setEpidemicReports] = useState<EpidemicReport[]>([]);
  const [sentimentIndex, setSentimentIndex] = useState<SentimentIndex[]>([]);
  const [expertAdvice, setExpertAdvice] = useState<ExpertAdvice | null>(null);

  // Status States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealtimePolling, setIsRealtimePolling] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // UI Interactive States
  const [activeChartTab, setActiveChartTab] = useState<string>('spot-futures');
  const [activeAdviceTab, setActiveAdviceTab] = useState<'farmers' | 'middle' | 'traders'>('farmers');

  // Breeding Calculator States (Interactive Inputs)
  const [calcInputs, setCalcInputs] = useState({
    outWeight: 120,
    inWeight: 15,
    pigletCost: 500,
    cornPrice: 2420, // 元/吨
    soyPrice: 3500,  // 元/吨
    wheatPrice: 2000, // 元/吨
    addPrice: 6000,   // 元/吨
    fcr: 2.8,
    labor: 80,
    vaccine: 40,
    utilities: 30,
    depreciation: 50,
    finance: 20,
  });

  const [calcResults, setCalcResults] = useState({
    weightGain: 105,
    feedConsumed: 294,
    feedCostPerKg: 2.76,
    totalFeedCost: 811.44,
    otherCosts: 220,
    totalCost: 1531.44,
    revenue: 1800,
    profit: 268.56,
    breakEven: 12.76,
    pigToGrain: 6.2,
  });

  // 1. Fetch Static / Historical Data on Mount
  const fetchStaticData = useCallback(async () => {
    try {
      setErrorMsg('');
      
      const [spotRes, provRes, capRes, costRes, epiRes] = await Promise.all([
        fetch(`${BASE_URL}/api/spot/basis`),
        fetch(`${BASE_URL}/api/spot/provincial`),
        fetch(`${BASE_URL}/api/fundamentals/capacity`),
        fetch(`${BASE_URL}/api/fundamentals/costs`),
        fetch(`${BASE_URL}/api/epidemic/status`),
      ]);

      if (!spotRes.ok || !provRes.ok || !capRes.ok || !costRes.ok || !epiRes.ok) {
        throw new Error('Failed to retrieve macro fundamental data from backend.');
      }

      const spotData: SpotPrice[] = await spotRes.json();
      const provincialData: ProvincialPrice[] = await provRes.json();
      const swineCapData: SwineCapacity[] = await capRes.json();
      const breedingCosts: BreedingIndicator[] = await costRes.json();
      const epidemicStatus = await epiRes.json();

      setSpotBasisData(spotData);
      setProvPrices(provincialData);
      setCapacityData(swineCapData);
      setCostsData(breedingCosts);
      setEpidemicReports(epidemicStatus.reports);
      setSentimentIndex(epidemicStatus.sentiment);

      // Prepopulate calculator corn/soy prices with latest DB data if available
      if (breedingCosts.length > 0) {
        const latest = breedingCosts[breedingCosts.length - 1];
        setCalcInputs(prev => ({
          ...prev,
          cornPrice: latest.corn_price || prev.cornPrice,
          soyPrice: latest.soybean_price || prev.soyPrice,
        }));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '网络连接异常，未能获取基本面数据');
    }
  }, []);

  // 2. Fetch Selected Contract K-Line Data
  const fetchKline = useCallback(async (symbol: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/futures/kline/${symbol}`);
      if (!res.ok) {
        throw new Error(`Failed to load historical charts for contract ${symbol}`);
      }
      const data: FuturesKline[] = await res.json();
      setKlineData(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 3. Fetch Real-time Quotes & Expert Advice (Polled)
  const fetchRealtimeQuotes = useCallback(async () => {
    try {
      setIsRealtimePolling(true);
      const [quotesRes, adviceRes] = await Promise.all([
        fetch(`${BASE_URL}/api/futures/realtime`),
        fetch(`${BASE_URL}/api/expert/advice`),
      ]);

      if (!quotesRes.ok || !adviceRes.ok) {
        throw new Error('Failed to synchronize real-time futures quotes.');
      }

      const quotesData: FuturesQuote[] = await quotesRes.json();
      const adviceData: ExpertAdvice = await adviceRes.json();

      setQuotes(quotesData);
      setExpertAdvice(adviceData);
      setLastSyncTime(new Date().toLocaleTimeString());
      
      // Seed initial calculator piglet cost with default matching spot price
      if (adviceData.spot_price) {
        setCalcInputs(prev => ({
          ...prev,
          pigletCost: prev.pigletCost === 500 ? Math.round(adviceData.spot_price * 15 * 2) : prev.pigletCost
        }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRealtimePolling(false);
    }
  }, []);

  // Initialize and Setup Polling
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      await fetchStaticData();
      await fetchRealtimeQuotes();
      await fetchKline(selectedSymbol);
      setIsLoading(false);
    };
    initApp();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetchRealtimeQuotes();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchStaticData, fetchRealtimeQuotes, fetchKline, selectedSymbol]);

  // Handle symbol change
  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    fetchKline(symbol);
  };

  // 4. Calculate Breeding Calculator outputs in real-time
  const runCalculator = useCallback(() => {
    const {
      outWeight,
      inWeight,
      pigletCost,
      cornPrice,
      soyPrice,
      wheatPrice,
      addPrice,
      fcr,
      labor,
      vaccine,
      utilities,
      depreciation,
      finance,
    } = calcInputs;

    const currentSpotPrice = expertAdvice?.spot_price || 15.0; // 元/公斤

    const weightGain = Math.max(0, outWeight - inWeight);
    const feedConsumed = weightGain * fcr;
    
    // Convert ton prices to kg prices and calculate blend feed price
    const cornKg = cornPrice / 1000;
    const soyKg = soyPrice / 1000;
    const wheatKg = wheatPrice / 1000;
    const addKg = addPrice / 1000;
    
    const feedCostPerKg = cornKg * 0.60 + soyKg * 0.20 + wheatKg * 0.15 + addKg * 0.05;
    const totalFeedCost = feedConsumed * feedCostPerKg;
    const otherCosts = labor + vaccine + utilities + depreciation + finance;
    const totalCost = pigletCost + totalFeedCost + otherCosts;
    const revenue = outWeight * currentSpotPrice;
    const profit = revenue - totalCost;
    const breakEven = totalCost / outWeight;
    const pigToGrain = currentSpotPrice / (cornPrice / 1000);

    setCalcResults({
      weightGain: parseFloat(weightGain.toFixed(1)),
      feedConsumed: parseFloat(feedConsumed.toFixed(1)),
      feedCostPerKg: parseFloat(feedCostPerKg.toFixed(2)),
      totalFeedCost: parseFloat(totalFeedCost.toFixed(2)),
      otherCosts: parseFloat(otherCosts.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      revenue: parseFloat(revenue.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      breakEven: parseFloat(breakEven.toFixed(2)),
      pigToGrain: parseFloat(pigToGrain.toFixed(2)),
    });
  }, [calcInputs, expertAdvice]);

  // Run calculator when inputs or spot price changes
  useEffect(() => {
    runCalculator();
  }, [calcInputs, runCalculator]);

  // Load saved calculator inputs on mount
  useEffect(() => {
    const saved = localStorage.getItem('pig_calc_inputs');
    if (saved) {
      try {
        setCalcInputs(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveCalculatorConfig = () => {
    localStorage.setItem('pig_calc_inputs', JSON.stringify(calcInputs));
    alert('配置已成功保存到本地浏览器缓存！');
  };

  const resetCalculatorConfig = () => {
    const defaults = {
      outWeight: 120,
      inWeight: 15,
      pigletCost: 500,
      cornPrice: 2420,
      soyPrice: 3500,
      wheatPrice: 2000,
      addPrice: 6000,
      fcr: 2.8,
      labor: 80,
      vaccine: 40,
      utilities: 30,
      depreciation: 50,
      finance: 20,
    };
    setCalcInputs(defaults);
    localStorage.removeItem('pig_calc_inputs');
    alert('配置已重置为默认值！');
  };

  const exportCalculatorReport = () => {
    const reportText = `生猪养殖成本利润模拟报告
生成时间: ${new Date().toLocaleString()}
------------------------------------------
【基本输入参数】
- 出栏体重: ${calcInputs.outWeight} 公斤
- 仔猪进栏体重: ${calcInputs.inWeight} 公斤
- 仔猪购入成本: ${calcInputs.pigletCost} 元/头
- 饲料料肉比 (FCR): ${calcInputs.fcr}
- 玉米价格: ${calcInputs.cornPrice} 元/吨
- 豆粕价格: ${calcInputs.soyPrice} 元/吨
- 麦麸价格: ${calcInputs.wheatPrice} 元/吨
- 添加剂价格: ${calcInputs.addPrice} 元/吨
- 人工工资分摊: ${calcInputs.labor} 元/头
- 疫苗防疫药费: ${calcInputs.vaccine} 元/头
- 水电及环保费: ${calcInputs.utilities} 元/头
- 固定折旧成本: ${calcInputs.depreciation} 元/头
- 资金财务成本: ${calcInputs.finance} 元/头

【测算分析结果】
- 育肥增重总量: ${calcResults.weightGain} 公斤
- 消耗饲料总量: ${calcResults.feedConsumed} 公斤
- 综合饲料均价: ${calcResults.feedCostPerKg} 元/公斤
- 饲料总成本: ${calcResults.totalFeedCost} 元/头
- 其他固定成本: ${calcResults.otherCosts} 元/头
- 每头总养殖成本: ${calcResults.totalCost} 元/头
- 估算保本出栏价: ${calcResults.breakEven} 元/公斤
- 当前现货均价: ${expertAdvice?.spot_price || 15.0} 元/公斤
- 预计销售收入: ${calcResults.revenue} 元/头
- 预计每头净利润: ${calcResults.profit} 元/头
- 理论模拟猪粮比: ${calcResults.pigToGrain}
------------------------------------------
报告由《生猪期货基本面数据监控与决策系统》自动生成。
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `生猪养殖利润模拟报告_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle calculator input changes
  const handleInputChange = (field: keyof typeof calcInputs, val: number) => {
    setCalcInputs(prev => ({
      ...prev,
      [field]: val,
    }));
  };

  //发改委 Warning States logic
  const getNDRCState = (ratio: number) => {
    if (!ratio) return { text: '数据载入中', level: 'normal' };
    if (ratio < 5.0) return { text: '过度下跌一级预警 (触发收储)', level: 'danger' };
    if (ratio < 5.5) return { text: '过度下跌二级预警 (限产去化)', level: 'warning' };
    if (ratio < 6.0) return { text: '过度下跌三级预警 (深度亏损)', level: 'warning' };
    if (ratio > 9.5) return { text: '过度上涨一级预警 (触发放储)', level: 'danger' };
    if (ratio > 9.0) return { text: '过度上涨二级预警 (调控区间)', level: 'warning' };
    return { text: '价格常态绿色区间 (运行平稳)', level: 'normal' };
  };

  const ndrcState = getNDRCState(expertAdvice?.pig_to_grain || 0);

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem' }}>{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} style={{ color: item.color || item.stroke, fontSize: '0.8rem', margin: '2px 0' }}>
              {item.name}: {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="chart-loading" style={{ height: '100vh', position: 'fixed' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="logo-icon animate-spin" size={48} style={{ marginBottom: '16px', margin: '0 auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>生猪基本面决策大屏加载中...</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>正在加载并对接实时 AkShare 数据库，请稍候</p>
        </div>
      </div>
    );
  }

  // Find active selected contract details
  const activeQuote = quotes.find(q => q.symbol === selectedSymbol) || quotes.find(q => q.symbol === 'LH0');

  // Compute provincial price sorting
  const sortedProvPrices = [...provPrices].sort((a, b) => b.price - a.price);

  return (
    <div className="app-container">
      {/* 1. Header Area */}
      <header className="terminal-header">
        <div className="header-left">
          <Layers className="logo-icon" size={28} />
          <div>
            <h1 className="terminal-title">生猪期货基本面数据监控与决策系统</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              DCE Live Hog Futures Terminal - Sleek Dark Mode V1.0
            </p>
          </div>
        </div>
        
        <div className="header-right">
          {/* NDRC policy regulatory status */}
          <div className={`ndrc-badge ${ndrcState.level}`}>
            <ShieldAlert size={16} />
            <span>发改委预警：{ndrcState.text}</span>
          </div>

          <div className="status-badge">
            <span className={`status-dot green`}></span>
            <span>服务器联机</span>
            {isRealtimePolling && <RefreshCw size={12} className="animate-spin" />}
          </div>
          
          <div className="sync-badge">
            <Activity size={14} />
            <span>最近同步: {lastSyncTime || 'N/A'}</span>
          </div>
        </div>
      </header>

      {errorMsg && (
        <div className="alert-banner danger" style={{ margin: '0 0 8px 0' }}>
          <div className="alert-title">数据加载异常</div>
          <div className="alert-desc">{errorMsg}</div>
        </div>
      )}

      {/* 2. Key KPI Metric Cards (5 Column Grid) */}
      <section className="kpi-container">
        {/* KPI 1: Spot Price */}
        <div className="glass-panel kpi-card up">
          <div className="kpi-header">
            <span>全国生猪现货均价</span>
            <Award className="kpi-icon" size={16} />
          </div>
          <div className="kpi-value mono" style={{ color: 'var(--color-up)' }}>
            {expertAdvice?.spot_price ? `${expertAdvice.spot_price.toFixed(2)}` : '15.40'}
            <span style={{ fontSize: '1rem', marginLeft: '4px', fontWeight: 500 }}>元/公斤</span>
          </div>
          <div className="kpi-footer">
            <span className="trend-badge up">
              <TrendingUp size={12} />
              +2.15%
            </span>
            <span style={{ color: 'var(--text-muted)' }}>较昨日均价</span>
          </div>
        </div>

        {/* KPI 2: Futures Main Contract Price */}
        <div className="glass-panel kpi-card down">
          <div className="kpi-header">
            <span>主力期货收盘价 (LH0)</span>
            <ChartIcon className="kpi-icon" size={16} />
          </div>
          <div className="kpi-value mono" style={{ color: 'var(--color-down)' }}>
            {expertAdvice?.futures_price ? `${Math.round(expertAdvice.futures_price)}` : '12080'}
            <span style={{ fontSize: '1rem', marginLeft: '4px', fontWeight: 500 }}>元/吨</span>
          </div>
          <div className="kpi-footer">
            <span className="trend-badge down">
              <TrendingDown size={12} />
              -0.58%
            </span>
            <span style={{ color: 'var(--text-muted)' }}>24小时涨跌</span>
          </div>
        </div>

        {/* KPI 3: Basis (Spot - Futures) */}
        <div className="glass-panel kpi-card warn">
          <div className="kpi-header">
            <span>即期生猪基差</span>
            <Layers className="kpi-icon" size={16} />
          </div>
          <div className="kpi-value mono" style={{ color: 'var(--color-warn)' }}>
            {expertAdvice?.basis ? `${Math.round(expertAdvice.basis)}` : '-2640'}
            <span style={{ fontSize: '1rem', marginLeft: '4px', fontWeight: 500 }}>元/吨</span>
          </div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--text-muted)' }}>期现折算价差收敛度</span>
          </div>
        </div>

        {/* KPI 4: Pig-to-Grain Ratio */}
        <div className="glass-panel kpi-card accent">
          <div className="kpi-header">
            <span>猪粮比价</span>
            <ShieldCheck className="kpi-icon" size={16} />
          </div>
          <div className="kpi-value mono" style={{ color: 'var(--color-accent)' }}>
            {expertAdvice?.pig_to_grain ? `${expertAdvice.pig_to_grain.toFixed(2)}` : '3.90'}
            <span style={{ fontSize: '1rem', marginLeft: '4px', fontWeight: 500 }}>: 1</span>
          </div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--text-muted)' }}>发改委盈亏保本线: 6.0</span>
          </div>
        </div>

        {/* KPI 5: Self-Breeding Profit */}
        <div className="glass-panel kpi-card down">
          <div className="kpi-header">
            <span>自繁自养估算利润</span>
            <Calculator className="kpi-icon" size={16} />
          </div>
          <div className="kpi-value mono" style={{ color: expertAdvice?.self_breeding_profit && expertAdvice.self_breeding_profit >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
            {expertAdvice?.self_breeding_profit ? `${Math.round(expertAdvice.self_breeding_profit)}` : '-222'}
            <span style={{ fontSize: '1rem', marginLeft: '4px', fontWeight: 500 }}>元/头</span>
          </div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--text-muted)' }}>外购仔猪: {expertAdvice?.piglet_breeding_profit ? Math.round(expertAdvice.piglet_breeding_profit) : -372} 元/头</span>
          </div>
        </div>
      </section>

      {/* 3. Main Dashboard Split Layout */}
      <section className="main-dashboard-grid">
        {/* Left Columns: Futures Quotes Table */}
        <article className="glass-panel" style={{ padding: '16px' }}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <ChartIcon size={18} />
              <span>大商所生猪合约</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DCE LH Quotes</span>
          </div>

          <div className="contract-list">
            {quotes.map((q) => {
              const priceChange = q.last_price - q.yesterday_close;
              const priceChangePct = q.yesterday_close > 0 ? (priceChange / q.yesterday_close) * 100 : 0;
              const isUp = priceChange >= 0;

              return (
                <div
                  key={q.symbol}
                  className={`contract-row ${selectedSymbol === q.symbol ? 'selected' : ''}`}
                  onClick={() => handleSymbolSelect(q.symbol)}
                >
                  <div className="contract-symbol-box">
                    <span className="contract-symbol mono">{q.symbol}</span>
                    <span className="contract-name">{q.name}</span>
                  </div>
                  <div className="contract-price-box">
                    <span className="contract-price mono" style={{ color: isUp ? 'var(--color-up)' : 'var(--color-down)' }}>
                      {Math.round(q.last_price)}
                    </span>
                    <span className={`contract-change mono ${isUp ? 'up' : 'down'}`}>
                      {isUp ? '+' : ''}{priceChangePct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {activeQuote && (
            <div style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '10px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>最高价 / 最低价:</span>
                <span className="mono">{Math.round(activeQuote.high)} / {Math.round(activeQuote.low)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>今开盘 / 昨结算:</span>
                <span className="mono">{Math.round(activeQuote.open)} / {Math.round(activeQuote.yesterday_settle)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>成交量 / 持仓量:</span>
                <span className="mono">{activeQuote.volume.toLocaleString()} / {activeQuote.open_interest.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>更新时刻:</span>
                <span className="mono">{activeQuote.time}</span>
              </div>
            </div>
          )}
        </article>

        {/* Center Columns: Charts & Calculator Visualizer */}
        <article className="glass-panel" style={{ minWidth: 0 }}>
          <div className="panel-title-bar" style={{ marginBottom: '8px' }}>
            <div className="chart-tabs-bar">
              <button
                className={`tab-btn ${activeChartTab === 'spot-futures' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('spot-futures')}
              >
                期现收敛
              </button>
              <button
                className={`tab-btn ${activeChartTab === 'basis' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('basis')}
              >
                历史基差
              </button>
              <button
                className={`tab-btn ${activeChartTab === 'cost-profits' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('cost-profits')}
              >
                养殖成本利润
              </button>
              <button
                className={`tab-btn ${activeChartTab === 'capacity' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('capacity')}
              >
                生猪产能
              </button>
              <button
                className={`tab-btn ${activeChartTab === 'calculator' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('calculator')}
              >
                成本计算器
              </button>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              当前选定合约: <strong className="mono" style={{ color: 'var(--color-accent)' }}>{selectedSymbol}</strong>
            </span>
          </div>

          <div className="chart-viewport">
            {/* Chart 1: Spot vs Futures Convergence */}
            {activeChartTab === 'spot-futures' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={spotBasisData.map(item => {
                    // Match corresponding selected futures price on this date
                    const k = klineData.find(kd => kd.date === item.date);
                    return {
                      date: item.date,
                      spotPrice: item.price,
                      futuresPrice: k && k.close ? k.close / 1000 : null, // Convert ton to kg
                    };
                  }).filter(d => d.futuresPrice !== null)}
                  margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" domain={['dataMin - 1', 'dataMax + 1']} fontSize={11} unit="元" />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line name="现货均价 (全国)" type="monotone" dataKey="spotPrice" stroke="var(--color-up)" strokeWidth={2.5} dot={false} />
                  <Line name={`期货价 (${selectedSymbol} 折合)`} type="monotone" dataKey="futuresPrice" stroke="var(--color-accent)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {/* Chart 2: Basis Trend */}
            {activeChartTab === 'basis' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={spotBasisData.filter(d => d.basis !== null)}
                  margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                >
                  <defs>
                    <linearGradient id="colorBasis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-warn)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-warn)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} unit="元" />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                  <Area name="基差水平 (现货-期货)" type="monotone" dataKey="basis" stroke="var(--color-warn)" fillOpacity={1} fill="url(#colorBasis)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* Chart 3: Cost & Profit */}
            {activeChartTab === 'cost-profits' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={costsData}
                  margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis yAxisId="left" stroke="var(--text-muted)" label={{ value: '养殖利润 (元/头)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }} fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" label={{ value: '猪粮比价', angle: 90, position: 'insideRight', fill: 'var(--text-muted)' }} fontSize={11} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line yAxisId="left" name="自繁自养利润" type="monotone" dataKey="self_breeding_profit" stroke="var(--color-up)" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" name="外购仔猪利润" type="monotone" dataKey="piglet_breeding_profit" stroke="var(--color-accent)" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="right" name="猪粮比价" type="monotone" dataKey="pig_to_grain_ratio" stroke="var(--color-warn)" strokeWidth={2} dot={false} />
                  <ReferenceLine yAxisId="right" y={6.0} stroke="red" strokeDasharray="3 3" label={{ value: '盈亏线: 6.0', fill: 'red', fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {/* Chart 4: Capacity */}
            {activeChartTab === 'capacity' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={capacityData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                >
                  <defs>
                    <linearGradient id="colorCap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" domain={['dataMin - 50', 'dataMax + 50']} fontSize={11} unit="万头" />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Area name="能繁母猪存栏量 (万头)" type="monotone" dataKey="maternal_sow_inventory" stroke="var(--color-accent)" fillOpacity={1} fill="url(#colorCap)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* Interactive Calculator Tab */}
            {activeChartTab === 'calculator' && (
              <div className="calculator-grid">
                <div className="calc-inputs">
                  <div className="calc-group">
                    <label>出栏体重 (公斤)</label>
                    <input
                      type="number"
                      className="custom-input mono"
                      value={calcInputs.outWeight}
                      onChange={(e) => handleInputChange('outWeight', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="calc-group">
                    <label>仔猪进栏体重 (公斤)</label>
                    <input
                      type="number"
                      className="custom-input mono"
                      value={calcInputs.inWeight}
                      onChange={(e) => handleInputChange('inWeight', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="calc-group">
                    <label>仔猪购入成本 (元/头)</label>
                    <input
                      type="number"
                      className="custom-input mono"
                      value={calcInputs.pigletCost}
                      onChange={(e) => handleInputChange('pigletCost', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="calc-group">
                    <label>饲料料肉比 (FCR)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="custom-input mono"
                      value={calcInputs.fcr}
                      onChange={(e) => handleInputChange('fcr', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="calc-group">
                    <label>玉米价格 (元/吨)</label>
                    <input
                      type="number"
                      className="custom-input mono"
                      value={calcInputs.cornPrice}
                      onChange={(e) => handleInputChange('cornPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="calc-group">
                    <label>豆粕价格 (元/吨)</label>
                    <input
                      type="number"
                      className="custom-input mono"
                      value={calcInputs.soyPrice}
                      onChange={(e) => handleInputChange('soyPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="calc-group">
                    <label>水电防疫成本 (元/头)</label>
                    <input
                      type="number"
                      className="custom-input mono"
                      value={calcInputs.vaccine + calcInputs.utilities}
                      onChange={(e) => handleInputChange('vaccine', Math.round((parseFloat(e.target.value) || 0) * 0.6))}
                    />
                  </div>
                  <div className="calc-group">
                    <label>人工与固定折旧 (元/头)</label>
                    <input
                      type="number"
                      className="custom-input mono"
                      value={calcInputs.labor + calcInputs.depreciation}
                      onChange={(e) => handleInputChange('labor', Math.round((parseFloat(e.target.value) || 0) * 0.6))}
                    />
                  </div>
                </div>

                <div className="calc-results">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      全维度养殖利润模拟结果
                    </h3>
                    <div className="calc-res-row">
                      <span className="calc-res-label">育肥增重总量:</span>
                      <span className="calc-res-val mono">{calcResults.weightGain} kg</span>
                    </div>
                    <div className="calc-res-row">
                      <span className="calc-res-label">消耗饲料总量:</span>
                      <span className="calc-res-val mono">{calcResults.feedConsumed} kg</span>
                    </div>
                    <div className="calc-res-row">
                      <span className="calc-res-label">饲料折合均价:</span>
                      <span className="calc-res-val mono">{calcResults.feedCostPerKg} 元/kg</span>
                    </div>
                    <div className="calc-res-row">
                      <span className="calc-res-label">饲料总成本:</span>
                      <span className="calc-res-val mono">{calcResults.totalFeedCost} 元</span>
                    </div>
                    <div className="calc-res-row">
                      <span className="calc-res-label">每头总成本:</span>
                      <span className="calc-res-val mono" style={{ color: 'var(--color-warn)' }}>{calcResults.totalCost} 元</span>
                    </div>
                    <div className="calc-res-row">
                      <span className="calc-res-label">每头保本出栏价:</span>
                      <span className="calc-res-val mono" style={{ color: 'var(--color-accent)' }}>{calcResults.breakEven} 元/kg</span>
                    </div>
                  </div>

                  <div className="calc-res-total">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>测算净利润:</span>
                      <span className={`calc-res-val mono ${calcResults.profit >= 0 ? 'profit-up' : 'profit-down'}`} style={{ fontSize: '1.4rem' }}>
                        {calcResults.profit >= 0 ? '+' : ''}{calcResults.profit} 元
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                    <button onClick={saveCalculatorConfig} className="tab-btn active" style={{ fontSize: '0.75rem', padding: '6px 8px', flex: 1, cursor: 'pointer' }}>
                      保存配置
                    </button>
                    <button onClick={exportCalculatorReport} className="tab-btn" style={{ fontSize: '0.75rem', padding: '6px 8px', flex: 1, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                      导出报告
                    </button>
                    <button onClick={resetCalculatorConfig} className="tab-btn" style={{ fontSize: '0.75rem', padding: '6px 8px', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      重置
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Right Columns: Expert Advisor & Radar */}
        <article className="glass-panel" style={{ padding: '16px' }}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <Award size={18} />
              <span>决策雷达与专家建议</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expert Panel</span>
          </div>

          <div className="advisor-card">
            {/* Warning Alert Banner */}
            {expertAdvice && (
              <div className={`alert-banner ${expertAdvice.warning_level}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} style={{ color: expertAdvice.warning_level === 'danger' ? 'var(--color-down)' : 'var(--color-warn)' }} />
                  <span className="alert-title">{expertAdvice.conclusion?.title}</span>
                </div>
                <p className="alert-desc">{expertAdvice.conclusion?.description}</p>
              </div>
            )}

            {/* Risk radar weight bar graphs */}
            {expertAdvice && (
              <div className="risk-radar-section">
                <div className="risk-list">
                  <div className="risk-item">
                    <span className="risk-item-label">供给压力 (Supply)</span>
                    <div className="risk-item-bar-bg">
                      <div className="risk-item-bar-fill" style={{ width: `${expertAdvice.conclusion.radar.supply}%`, background: 'var(--color-accent)' }}></div>
                    </div>
                    <span className="risk-item-val mono">{expertAdvice.conclusion.radar.supply}</span>
                  </div>
                  <div className="risk-item">
                    <span className="risk-item-label">终端需求 (Demand)</span>
                    <div className="risk-item-bar-bg">
                      <div className="risk-item-bar-fill" style={{ width: `${expertAdvice.conclusion.radar.demand}%`, background: 'var(--color-up)' }}></div>
                    </div>
                    <span className="risk-item-val mono">{expertAdvice.conclusion.radar.demand}</span>
                  </div>
                  <div className="risk-item">
                    <span className="risk-item-label">成本挤压 (Cost)</span>
                    <div className="risk-item-bar-bg">
                      <div className="risk-item-bar-fill" style={{ width: `${expertAdvice.conclusion.radar.cost}%`, background: 'var(--color-warn)' }}></div>
                    </div>
                    <span className="risk-item-val mono">{expertAdvice.conclusion.radar.cost}</span>
                  </div>
                  <div className="risk-item">
                    <span className="risk-item-label">政策限额 (Policy)</span>
                    <div className="risk-item-bar-bg">
                      <div className="risk-item-bar-fill" style={{ width: `${expertAdvice.conclusion.radar.policy}%`, background: '#a855f7' }}></div>
                    </div>
                    <span className="risk-item-val mono">{expertAdvice.conclusion.radar.policy}</span>
                  </div>
                  <div className="risk-item">
                    <span className="risk-item-label">疫病舆情 (Disease)</span>
                    <div className="risk-item-bar-bg">
                      <div className="risk-item-bar-fill" style={{ width: `${expertAdvice.conclusion.radar.disease}%`, background: 'var(--color-down)' }}></div>
                    </div>
                    <span className="risk-item-val mono">{expertAdvice.conclusion.radar.disease}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Advice Tabs */}
            <div className="advice-tabs">
              <button
                className={`advice-tab-btn ${activeAdviceTab === 'farmers' ? 'active' : ''}`}
                onClick={() => setActiveAdviceTab('farmers')}
              >
                养殖户
              </button>
              <button
                className={`advice-tab-btn ${activeAdviceTab === 'middle' ? 'active' : ''}`}
                onClick={() => setActiveAdviceTab('middle')}
              >
                屠宰厂
              </button>
              <button
                className={`advice-tab-btn ${activeAdviceTab === 'traders' ? 'active' : ''}`}
                onClick={() => setActiveAdviceTab('traders')}
              >
                套保交易员
              </button>
            </div>

            <div className="advice-content">
              {expertAdvice?.advice[activeAdviceTab] ? (
                <>
                  <div className="advice-action-header">
                    推荐策略: {expertAdvice.advice[activeAdviceTab].action}
                  </div>
                  <ul className="advice-bullets">
                    {expertAdvice.advice[activeAdviceTab].bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', paddingTop: '40px' }}>
                  未获取到相关策略建议
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      {/* 4. Bottom Grid: Provincial prices & Disease sentiment feeds */}
      <section className="dashboard-bottom-grid">
        {/* Left Column: Provincial Hog Prices Ranking */}
        <article className="glass-panel" style={{ padding: '16px' }}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <Map size={18} />
              <span>全国重点省份现货排名 (CNY/kg)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Regional Spreads</span>
          </div>

          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedProvPrices.slice(0, 12)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={10} domain={[10, 20]} />
                <YAxis type="category" dataKey="province" stroke="var(--text-primary)" fontSize={10} width={40} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar
                  name="出栏价"
                  dataKey="price"
                  fill="var(--color-accent)"
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Right Column: Epidemic Alerts & Sentiment Index */}
        <article className="glass-panel" style={{ padding: '16px' }}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <FileText size={18} />
              <span>官方疫情通报与舆情监控</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disease alerts</span>
          </div>

          <div className="epidemic-feed">
            {epidemicReports.map((report, idx) => (
              <div key={idx} className="epidemic-item">
                <div className="epidemic-item-header">
                  <span className="epidemic-title">{report.title}</span>
                  <span className="epidemic-date mono">{report.date}</span>
                </div>
                <p className="epidemic-body">{report.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>来源: {report.source}</span>
                  <span style={{ color: report.level === 'warning' ? 'var(--color-warn)' : 'var(--color-accent)' }}>
                    级别: {report.level.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="sentiment-grid">
            {sentimentIndex.map((item, idx) => {
              const isHigh = item.sentiment_score > 50;
              const isMedium = item.sentiment_score > 25 && item.sentiment_score <= 50;
              const scoreClass = isHigh ? 'high' : isMedium ? 'medium' : 'low';

              return (
                <div key={idx} className="sentiment-badge">
                  <span className="sentiment-kw">{item.keyword}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`sentiment-score ${scoreClass} mono`}>{item.sentiment_score}%</span>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>热度频次: {item.frequency}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}

export default App;
