import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Layers, Activity, ShieldAlert } from 'lucide-react';
import './App.css';

// Custom Hooks & Components
import { useAppData } from './hooks/useAppData';
import KpiDashboard from './components/KpiDashboard';
import FuturesTable from './components/FuturesTable';
import ExpertPanel from './components/ExpertPanel';
import MainCharts from './components/MainCharts';
import BreedingCalculator from './components/BreedingCalculator';
import YijingPanel from './components/YijingPanel';
import BottomDashboard from './components/BottomDashboard';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('LH0');
  const {
    quotes,
    klineData,
    spotBasisData,
    porkPriceData,
    provPrices,
    capacityData,
    costsData,
    epidemicReports,
    sentimentIndex,
    expertAdvice,
    yijingForecast,
    stockData,
    stockQuotes,
    frozenPorkData,
    isLoading,
    isManualSyncing,
    isYijingLoading,
    lastSyncTime,
    fetchKline,
    fetchRealtimeQuotes,
    fetchYijingForecast,
    handleManualSync
  } = useAppData(selectedSymbol);

  // UI Interactive States
  const [activePage, setActivePage] = useState<'terminal' | 'macro-stocks'>('terminal');
  const [activeChartTab, setActiveChartTab] = useState<string>('spot-futures');
  const [activeAdviceTab, setActiveAdviceTab] = useState<'farmers' | 'middle' | 'traders'>('farmers');
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '180d' | 'all'>('all');

  // Breeding Calculator Local States
  const [calcInputs, setCalcInputs] = useState({
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

  useEffect(() => {
    if (costsData && costsData.length > 0) {
      const latest = costsData[costsData.length - 1];
      setCalcInputs(prev => ({
        ...prev,
        cornPrice: latest.corn_price || prev.cornPrice,
        soyPrice: latest.soybean_price || prev.soyPrice,
      }));
    }
  }, [costsData]);

  useEffect(() => {
    if (expertAdvice?.spot_price) {
      setCalcInputs(prev => ({
        ...prev,
        pigletCost: prev.pigletCost === 500 ? Math.round(expertAdvice.spot_price * 15 * 2) : prev.pigletCost
      }));
    }
  }, [expertAdvice]);

  const filterByTimeRange = useCallback(<T extends { date: string }>(data: T[]): T[] => {
    if (timeRange === 'all' || !data || !data.length) return data || [];
    const daysMap = { '30d': 30, '90d': 90, '180d': 180 };
    const limitDays = daysMap[timeRange];
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latestDate = new Date(sortedData[sortedData.length - 1].date);
    const cutoffDate = new Date(latestDate);
    cutoffDate.setDate(cutoffDate.getDate() - limitDays);
    return sortedData.filter(item => new Date(item.date) >= cutoffDate);
  }, [timeRange]);

  const runCalculator = useCallback(() => {
    const { outWeight, inWeight, pigletCost, cornPrice, soyPrice, wheatPrice, addPrice, fcr, labor, vaccine, utilities, depreciation, finance } = calcInputs;
    const currentSpotPrice = expertAdvice?.spot_price || 15.0;
    const weightGain = Math.max(0, outWeight - inWeight);
    const feedConsumed = weightGain * fcr;
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

  useEffect(() => { runCalculator(); }, [calcInputs, runCalculator]);

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    fetchKline(symbol);
    setTimeout(() => {
      fetchRealtimeQuotes();
      if (activeChartTab === 'yijing') fetchYijingForecast();
    }, 0);
  };

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

  if (isLoading) {
    return (
      <div className="chart-loading" style={{ height: '100vh', position: 'fixed', background: '#0b0f19' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="logo-icon animate-spin" size={48} style={{ marginBottom: '16px', margin: '0 auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>生猪基本面决策大屏加载中...</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>正在加载并对接实时 AkShare 数据库，请稍候</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="terminal-header">
        <div className="header-left">
          <Layers className="logo-icon" size={28} />
          <div>
            <h1 className="terminal-title">生猪期货基本面数据监控与决策系统</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>DCE Live Hog Futures Terminal</p>
          </div>
        </div>
        <div className="header-right">
          <div className={`ndrc-badge ${ndrcState.level}`}><ShieldAlert size={16} /><span>发改委预警：{ndrcState.text}</span></div>
          <div className="status-badge"><span className="status-dot green"></span><span>服务器联机</span></div>
          <div className="sync-badge"><Activity size={14} /><span>最近同步: {lastSyncTime || 'N/A'}</span></div>
          <button className="sync-btn" onClick={handleManualSync} disabled={isManualSyncing}>
            <RefreshCw size={14} className={isManualSyncing ? "animate-spin" : ""} />
            <span>立即同步</span>
          </button>
        </div>
      </header>

      {/* Main Page Navigation Selector */}
      <div className="chart-tabs-bar" style={{ display: 'inline-flex', marginTop: '16px', gap: '8px', padding: '4px' }}>
        <button 
          className={`tab-btn ${activePage === 'terminal' ? 'active' : ''}`} 
          onClick={() => setActivePage('terminal')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Activity size={16} />
          <span>期现决策终端</span>
        </button>
        <button 
          className={`tab-btn ${activePage === 'macro-stocks' ? 'active' : ''}`} 
          onClick={() => setActivePage('macro-stocks')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Layers size={16} />
          <span>宏观与上市公司股票看板</span>
        </button>
      </div>

      {activePage === 'terminal' ? (
        <>
          <KpiDashboard expertAdvice={expertAdvice} selectedSymbol={selectedSymbol} />

          <section className="main-dashboard-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FuturesTable quotes={quotes} selectedSymbol={selectedSymbol} onSymbolSelect={handleSymbolSelect} />
            </div>

            <article className="glass-panel" style={{ minWidth: 0 }}>
              <div className="panel-title-bar" style={{ marginBottom: '8px' }}>
                <div className="chart-tabs-bar">
                  {['spot-futures', 'basis', 'cost-profits', 'capacity', 'frozen-pork', 'calculator', 'yijing'].map(tab => (
                    <button key={tab} className={`tab-btn ${activeChartTab === tab ? 'active' : ''} ${tab === 'yijing' ? 'yijing-tab' : ''}`} onClick={() => { setActiveChartTab(tab); if (tab === 'yijing') fetchYijingForecast(); }}>
                      {tab === 'spot-futures' ? '期现收敛' : tab === 'basis' ? '历史基差' : tab === 'cost-profits' ? '养殖成本利润' : tab === 'capacity' ? '生猪产能' : tab === 'frozen-pork' ? '冻品仓储' : tab === 'calculator' ? '成本计算器' : '☯ 易卦决策'}
                    </button>
                  ))}
                </div>
                {activeChartTab !== 'calculator' && (
                  <div className="time-range-selector">
                    {(['30d', '90d', '180d', 'all'] as const).map(range => (
                      <button key={range} onClick={() => setTimeRange(range)} className={timeRange === range ? 'active' : ''}>{range === 'all' ? '全部' : `${range.slice(0, -1)}天`}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="chart-viewport" style={
                activeChartTab === 'capacity' || activeChartTab === 'frozen-pork' ? { height: '820px' } : 
                activeChartTab === 'yijing' ? { height: 'auto', minHeight: '1000px' } : 
                activeChartTab === 'calculator' ? { height: 'auto', minHeight: '480px' } : 
                undefined
              }>
                <MainCharts 
                  activeChartTab={activeChartTab} spotBasisData={spotBasisData} klineData={klineData}
                  porkPriceData={porkPriceData} costsData={costsData} capacityData={capacityData}
                  frozenPorkData={frozenPorkData}
                  selectedSymbol={selectedSymbol} filterByTimeRange={filterByTimeRange}
                />
                {activeChartTab === 'calculator' && (
                  <BreedingCalculator 
                    calcInputs={calcInputs} calcResults={calcResults} 
                    handleInputChange={(f,v)=>setCalcInputs(p=>({...p,[f]:v}))}
                    saveCalculatorConfig={() => {}} exportCalculatorReport={() => {}} resetCalculatorConfig={() => {}}
                  />
                )}
                {activeChartTab === 'yijing' && (
                  <YijingPanel yijingForecast={yijingForecast} isYijingLoading={isYijingLoading} fetchYijingForecast={fetchYijingForecast} />
                )}
              </div>
            </article>

            <ExpertPanel expertAdvice={expertAdvice} activeAdviceTab={activeAdviceTab} setActiveAdviceTab={setActiveAdviceTab} />
          </section>
        </>
      ) : (
        <div style={{ marginTop: '16px' }}>
          <BottomDashboard provPrices={provPrices} epidemicReports={epidemicReports} sentimentIndex={sentimentIndex} stockData={stockData} stockQuotes={stockQuotes} isFullPage={true} />
        </div>
      )}
    </div>
  );
}

export default App;
