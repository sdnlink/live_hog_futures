import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Layers, Activity, ShieldAlert, Compass } from 'lucide-react';
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
import AnalysisReportPanel from './components/AnalysisReportPanel';
import SentimentValidationPanel from './components/SentimentValidationPanel';
import PriceTrendForecastPanel from './components/PriceTrendForecastPanel';
import MiniSpotStockMonitor from './components/MiniSpotStockMonitor';
import TradingFactorsPanel from './components/TradingFactorsPanel';
import SupplyDemandCockpit from './components/SupplyDemandCockpit';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('LH0');
  const {
    quotes,
    klineData,
    spotBasisData,
    porkPriceData,
    provPrices,
    capacityData,
    weeklyCapacityData,
    dailyCapacityData,
    costsData,
    epidemicReports,
    expertAdvice,
    yijingForecast,
    priceTrendForecast,
    stockData,
    stockQuotes,
    companySalesData,
    analysisReportData,
    biopharmData,
    consumablesData,
    feedBreakdownData,
    logisticsSafetyData,
    downstreamDemandData,
    sentimentIndex,
    substitutePricesData,
    porkImportsData,
    breedingEfficiencyData,
    macroEnvironmentalData,
    isLoading,
    isReportLoading,
    isForecastLoading,
    isManualSyncing,
    isYijingLoading,
    lastSyncTime,
    fetchKline,
    fetchRealtimeQuotes,
    fetchYijingForecast,
    fetchAnalysisReport,
    fetchPriceTrendForecast,
    handleManualSync
  } = useAppData(selectedSymbol);

  // UI Interactive States
  const [activePage, setActivePage] = useState<'cockpit' | 'terminal' | 'macro-stocks'>('cockpit');
  const [activeChartTab, setActiveChartTab] = useState<string>('analysis-report');
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hog_calculator_inputs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setCalcInputs(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {
      console.warn('Failed to load saved calculator inputs:', e);
    }
  }, []);

  const saveCalculatorConfig = useCallback(() => {
    try {
      localStorage.setItem('hog_calculator_inputs', JSON.stringify(calcInputs));
      alert('测算参数配置已成功保存到本地存储！');
    } catch (e) {
      alert('保存失败：' + e);
    }
  }, [calcInputs]);

  const resetCalculatorConfig = useCallback(() => {
    localStorage.removeItem('hog_calculator_inputs');
    const latestCorn = (costsData && costsData.length > 0) ? costsData[costsData.length - 1].corn_price || 2420 : 2420;
    const latestSoy = (costsData && costsData.length > 0) ? costsData[costsData.length - 1].soybean_price || 3500 : 3500;
    const spot = expertAdvice?.spot_price || 15.0;
    setCalcInputs({
      outWeight: 120,
      inWeight: 15,
      pigletCost: Math.round(spot * 15 * 2),
      cornPrice: latestCorn > 100 ? latestCorn : Math.round(latestCorn * 1000),
      soyPrice: latestSoy > 100 ? latestSoy : Math.round(latestSoy * 1000),
      wheatPrice: 2000,
      addPrice: 6000,
      fcr: 2.8,
      labor: 80,
      vaccine: 40,
      utilities: 30,
      depreciation: 50,
      finance: 20,
    });
    alert('已恢复为标准行业基准测算参数！');
  }, [costsData, expertAdvice]);

  const exportCalculatorReport = useCallback(() => {
    const reportText = [
      '====================================================',
      '        生猪养殖成本与头均利润测算报告 (DCE Terminal)',
      '====================================================',
      `测算时间: ${new Date().toLocaleString()}`,
      `现货参考价: ${expertAdvice?.spot_price || 15.0} 元/公斤`,
      '---------------- [ 生产与原材料输入 ] ----------------',
      `出栏体重: ${calcInputs.outWeight} kg`,
      `进栏体重: ${calcInputs.inWeight} kg`,
      `增重总量: ${calcResults.weightGain} kg`,
      `仔猪成本: ${calcInputs.pigletCost} 元/头`,
      `料肉比(FCR): ${calcInputs.fcr}`,
      `玉米价格: ${calcInputs.cornPrice} 元/吨`,
      `豆粕价格: ${calcInputs.soyPrice} 元/吨`,
      `其它成本(人工/防疫/折旧/财务): ${calcResults.otherCosts} 元/头`,
      '---------------- [ 测算核心结论 ] ----------------',
      `饲料折合单价: ${calcResults.feedCostPerKg} 元/kg`,
      `总饲料成本: ${calcResults.totalFeedCost} 元/头`,
      `养殖总成本: ${calcResults.totalCost} 元/头`,
      `保本出栏价: ${calcResults.breakEven} 元/kg`,
      `猪粮比价: ${calcResults.pigToGrain} : 1`,
      `销售收入: ${calcResults.revenue} 元/头`,
      `头均净利润: ${calcResults.profit >= 0 ? '+' : ''}${calcResults.profit} 元/头`,
      '====================================================',
    ].join('\n');

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `生猪养殖成本利润测算报告_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [calcInputs, calcResults, expertAdvice]);

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    fetchKline(symbol);
    setTimeout(() => {
      fetchRealtimeQuotes();
      if (activeChartTab === 'yijing') fetchYijingForecast();
      if (activeChartTab === 'price-forecast') fetchPriceTrendForecast();
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
          className={`tab-btn ${activePage === 'cockpit' ? 'active' : ''}`} 
          onClick={() => setActivePage('cockpit')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: activePage === 'cockpit' ? 700 : 500 }}
        >
          <Compass size={16} style={{ color: activePage === 'cockpit' ? '#fff' : 'var(--color-accent)' }} />
          <span>🎯 供需一览决策总舱 (极简直观)</span>
        </button>
        <button 
          className={`tab-btn ${activePage === 'terminal' ? 'active' : ''}`} 
          onClick={() => setActivePage('terminal')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Activity size={16} />
          <span>🔬 产业全要素穿透终端</span>
        </button>
        <button 
          className={`tab-btn ${activePage === 'macro-stocks' ? 'active' : ''}`} 
          onClick={() => setActivePage('macro-stocks')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Layers size={16} />
          <span>📈 宏观与上市公司股票看板</span>
        </button>
      </div>

      {activePage === 'cockpit' && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <KpiDashboard expertAdvice={expertAdvice} selectedSymbol={selectedSymbol} quotes={quotes} spotBasisData={spotBasisData} />
          <SupplyDemandCockpit onSwitchToProDetail={(tab) => {
            setActivePage('terminal');
            if (tab) setActiveChartTab(tab);
          }} />
        </div>
      )}

      {activePage === 'terminal' && (
        <>
          <KpiDashboard expertAdvice={expertAdvice} selectedSymbol={selectedSymbol} quotes={quotes} spotBasisData={spotBasisData} />

          <section className="main-dashboard-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <FuturesTable quotes={quotes} selectedSymbol={selectedSymbol} onSymbolSelect={handleSymbolSelect} spotPrice={expertAdvice?.spot_price} />
              <MiniSpotStockMonitor provPrices={provPrices} stockQuotes={stockQuotes} benchmarkSpot={expertAdvice?.spot_price} />
            </div>

            <article className="glass-panel" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="panel-title-bar" style={{ marginBottom: '8px' }}>
                <div className="chart-tabs-bar">
                  {['factors-matrix', 'analysis-report', 'price-forecast', 'sentiment-validation', 'spot-futures', 'basis', 'cost-profits', 'capacity', 'advanced-macro', 'calculator', 'yijing'].map(tab => (
                    <button key={tab} className={`tab-btn ${activeChartTab === tab ? 'active' : ''} ${tab === 'factors-matrix' ? 'yijing-tab' : ''} ${tab === 'yijing' ? 'yijing-tab' : ''} ${tab === 'price-forecast' ? 'yijing-tab' : ''} ${tab === 'analysis-report' ? 'yijing-tab' : ''} ${tab === 'sentiment-validation' ? 'yijing-tab' : ''} ${tab === 'advanced-macro' ? 'yijing-tab' : ''}`} onClick={() => { setActiveChartTab(tab); if (tab === 'yijing') fetchYijingForecast(); if (tab === 'analysis-report') fetchAnalysisReport(); if (tab === 'price-forecast') fetchPriceTrendForecast(); }}>
                      <span>
                        {tab === 'factors-matrix' ? '全要素驱动' :
                         tab === 'analysis-report' ? '综合决策报告' :
                         tab === 'price-forecast' ? '未来价格预测' :
                         tab === 'sentiment-validation' ? '舆情交叉印证' :
                         tab === 'spot-futures' ? '期现收敛' : 
                         tab === 'basis' ? '历史基差' : 
                         tab === 'cost-profits' ? '养殖成本利润' : 
                         tab === 'capacity' ? '生猪产能' : 
                         tab === 'advanced-macro' ? '另类与宏观指标' :
                         tab === 'calculator' ? '成本计算器' : 
                         '易卦决策'}
                      </span>
                      {tab === 'factors-matrix' && (
                        <span className="predict-badge yijing-badge">专家体系</span>
                      )}
                      {tab === 'yijing' && (
                        <span className="predict-badge yijing-badge">全预测</span>
                      )}
                      {tab === 'price-forecast' && (
                        <span className="predict-badge yijing-badge">量化推演</span>
                      )}
                      {tab === 'analysis-report' && (
                        <span className="predict-badge yijing-badge">多维交叉</span>
                      )}
                      {tab === 'sentiment-validation' && (
                        <span className="predict-badge yijing-badge">前瞻舆情</span>
                      )}
                      {tab === 'advanced-macro' && (
                        <span className="predict-badge yijing-badge">高级分析</span>
                      )}
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

              <div className="chart-viewport">
                {activeChartTab !== 'analysis-report' && activeChartTab !== 'price-forecast' && activeChartTab !== 'factors-matrix' && (
                  <MainCharts 
                    activeChartTab={activeChartTab} spotBasisData={spotBasisData} klineData={klineData}
                    porkPriceData={porkPriceData} costsData={costsData} capacityData={capacityData}
                    weeklyCapacityData={weeklyCapacityData} dailyCapacityData={dailyCapacityData}
                    companySalesData={companySalesData}
                    substitutePricesData={substitutePricesData} porkImportsData={porkImportsData}
                    breedingEfficiencyData={breedingEfficiencyData} macroEnvironmentalData={macroEnvironmentalData}
                    biopharmData={biopharmData} consumablesData={consumablesData}
                    feedBreakdownData={feedBreakdownData} logisticsSafetyData={logisticsSafetyData}
                    downstreamDemandData={downstreamDemandData}
                    selectedSymbol={selectedSymbol} filterByTimeRange={filterByTimeRange}
                    expertAdvice={expertAdvice}
                  />
                )}
                {activeChartTab === 'factors-matrix' && (
                  <TradingFactorsPanel />
                )}
                {activeChartTab === 'analysis-report' && (
                  <AnalysisReportPanel 
                    reportData={analysisReportData}
                    isLoading={isReportLoading}
                    onRefresh={fetchAnalysisReport}
                  />
                )}
                {activeChartTab === 'price-forecast' && (
                  <PriceTrendForecastPanel
                    forecastData={priceTrendForecast}
                    isLoading={isForecastLoading}
                    onRefresh={fetchPriceTrendForecast}
                    selectedSymbol={selectedSymbol}
                  />
                )}
                {activeChartTab === 'calculator' && (
                  <BreedingCalculator 
                    calcInputs={calcInputs} calcResults={calcResults} 
                    handleInputChange={(f,v)=>setCalcInputs(p=>({...p,[f]:v}))}
                    saveCalculatorConfig={saveCalculatorConfig} 
                    exportCalculatorReport={exportCalculatorReport} 
                    resetCalculatorConfig={resetCalculatorConfig}
                    futuresPrice={expertAdvice?.futures_price}
                  />
                )}
                {activeChartTab === 'yijing' && (
                  <YijingPanel yijingForecast={yijingForecast} isYijingLoading={isYijingLoading} fetchYijingForecast={fetchYijingForecast} />
                )}
                {activeChartTab === 'sentiment-validation' && (
                  <SentimentValidationPanel
                    sentimentIndex={sentimentIndex}
                    biopharmData={biopharmData}
                    consumablesData={consumablesData}
                    feedBreakdownData={feedBreakdownData}
                    logisticsSafetyData={logisticsSafetyData}
                    downstreamDemandData={downstreamDemandData}
                    filterByTimeRange={filterByTimeRange}
                  />
                )}
              </div>
            </article>

            <ExpertPanel expertAdvice={expertAdvice} activeAdviceTab={activeAdviceTab} setActiveAdviceTab={setActiveAdviceTab} />
          </section>
        </>
      )}

      {activePage === 'macro-stocks' && (
        <div style={{ marginTop: '16px' }}>
          <BottomDashboard provPrices={provPrices} epidemicReports={epidemicReports} stockData={stockData} stockQuotes={stockQuotes} isFullPage={true} />
        </div>
      )}
    </div>
  );
}

export default App;
