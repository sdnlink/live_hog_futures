import React, { useState, useEffect } from 'react';
import { 
  Compass, TrendingDown, Scale, BarChart2, 
  CheckCircle2, AlertTriangle, Users, Shield, 
  RefreshCw, Sliders, ChevronDown, ChevronRight, Zap,
  Globe, Activity, Layers
} from 'lucide-react';
import type { 
  FactorsMatrixResponse, TermStructureResponse, DeliveryArbitrageResponse, 
  FactorItem, BrokerPositionsResponse, HedgingSimulationResponse,
  StandardFatSpreadResponse, CullSowLiquidationResponse, 
  RollYieldRiskResponse, GlobalHogMarketResponse
} from '../types';

interface TradingFactorsPanelProps {
  onRefresh?: () => void;
}

export const TradingFactorsPanel: React.FC<TradingFactorsPanelProps> = () => {
  const [subTab, setSubTab] = useState<
    'factors' | 'micro-spreads' | 'cull-sow' | 'roll-yield' | 'global-market' | 'term-structure' | 'positions' | 'delivery' | 'hedging'
  >('factors');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  // Data states
  const [factorsData, setFactorsData] = useState<FactorsMatrixResponse | null>(null);
  const [termData, setTermData] = useState<TermStructureResponse | null>(null);
  const [deliveryData, setDeliveryData] = useState<DeliveryArbitrageResponse | null>(null);
  const [brokerData, setBrokerData] = useState<BrokerPositionsResponse | null>(null);
  const [hedgingData, setHedgingData] = useState<HedgingSimulationResponse | null>(null);
  const [microData, setMicroData] = useState<StandardFatSpreadResponse | null>(null);
  const [cullData, setCullData] = useState<CullSowLiquidationResponse | null>(null);
  const [rollData, setRollData] = useState<RollYieldRiskResponse | null>(null);
  const [globalData, setGlobalData] = useState<GlobalHogMarketResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Delivery Calculator inputs
  const [calcContract, setCalcContract] = useState<string>('LH2701');
  const [calcLocation, setCalcLocation] = useState<string>('henan');
  const [calcWeightGrade, setCalcWeightGrade] = useState<string>('standard');
  const [calcSpotPrice, setCalcSpotPrice] = useState<number>(9400);

  // Hedging Simulator inputs
  const [hedgeHeads, setHedgeHeads] = useState<number>(10000);
  const [hedgeCost, setHedgeCost] = useState<number>(14.5);
  const [hedgeRatio, setHedgeRatio] = useState<number>(70);

  const BASE_URL = typeof window !== 'undefined' && window.location.pathname.startsWith('/sys1') ? '/sys1' : '';

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [fRes, tRes, dRes, bRes, hRes, mRes, cRes, rRes, gRes] = await Promise.all([
        fetch(`${BASE_URL}/api/analysis/factors_matrix`).then(r => r.json()),
        fetch(`${BASE_URL}/api/futures/term_structure`).then(r => r.json()),
        fetch(`${BASE_URL}/api/arbitrage/delivery_calculator?contract=${calcContract}&location=${calcLocation}&weight_grade=${calcWeightGrade}&spot_price=${calcSpotPrice}`).then(r => r.json()),
        fetch(`${BASE_URL}/api/futures/broker_positions?contract=LH2701`).then(r => r.json()),
        fetch(`${BASE_URL}/api/arbitrage/hedging_simulation?annual_heads=${hedgeHeads}&hedge_ratio=${hedgeRatio / 100}`).then(r => r.json()),
        fetch(`${BASE_URL}/api/analysis/micro_spreads`).then(r => r.json()),
        fetch(`${BASE_URL}/api/analysis/cull_sow_clearing`).then(r => r.json()),
        fetch(`${BASE_URL}/api/futures/roll_yield_monitor?active_contract=LH2701&next_contract=LH2703`).then(r => r.json()),
        fetch(`${BASE_URL}/api/global/hog_market`).then(r => r.json()),
      ]);
      setFactorsData(fRes);
      setTermData(tRes);
      setDeliveryData(dRes);
      setBrokerData(bRes);
      setHedgingData(hRes);
      setMicroData(mRes);
      setCullData(cRes);
      setRollData(rRes);
      setGlobalData(gRes);
      if (dRes && dRes.spot_price) {
        setCalcSpotPrice(dRes.spot_price);
      }
    } catch (e) {
      console.error('Failed to load trading factor data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const recalculateDelivery = async (contract: string, loc: string, wt: string, spot: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/arbitrage/delivery_calculator?contract=${contract}&location=${loc}&weight_grade=${wt}&spot_price=${spot}`).then(r => r.json());
      setDeliveryData(res);
    } catch (e) {
      console.error('Failed to recalc delivery arbitrage', e);
    }
  };

  const recalculateHedging = async (heads: number, _cost: number, ratio: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/arbitrage/hedging_simulation?annual_heads=${heads}&hedge_ratio=${ratio / 100}`).then(r => r.json());
      setHedgingData(res);
    } catch (e) {
      console.error('Failed to recalc hedging simulation', e);
    }
  };

  if (isLoading && !factorsData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
        <RefreshCw size={28} className="spin" style={{ color: 'var(--color-accent)', marginBottom: '12px' }} />
        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>正在加载生猪全要素驱动矩阵与宏微观指标体系...</span>
      </div>
    );
  }

  // Flattened factors for display
  const allFactors: FactorItem[] = factorsData ? factorsData.dimensions.flatMap(d => d.factors) : [];
  const filteredFactors = selectedCategory === 'all' 
    ? allFactors 
    : allFactors.filter(f => f.category === selectedCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0 16px 0' }}>
      
      {/* Sub Tabs Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', overflowX: 'auto', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button 
            className={`tab-btn ${subTab === 'factors' ? 'active' : ''}`}
            onClick={() => setSubTab('factors')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <Compass size={13} />
            <span>全要素驱动 ({allFactors.length})</span>
          </button>
          <button 
            className={`tab-btn ${subTab === 'micro-spreads' ? 'active' : ''}`}
            onClick={() => setSubTab('micro-spreads')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <Scale size={13} />
            <span>标肥微观与二育</span>
          </button>
          <button 
            className={`tab-btn ${subTab === 'cull-sow' ? 'active' : ''}`}
            onClick={() => setSubTab('cull-sow')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <Activity size={13} />
            <span>淘母折价与大底出清</span>
          </button>
          <button 
            className={`tab-btn ${subTab === 'roll-yield' ? 'active' : ''}`}
            onClick={() => setSubTab('roll-yield')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <Layers size={13} />
            <span>展期收益与交割风险</span>
          </button>
          <button 
            className={`tab-btn ${subTab === 'global-market' ? 'active' : ''}`}
            onClick={() => setSubTab('global-market')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <Globe size={13} />
            <span>国际主产区与进口平价</span>
          </button>
          <button 
            className={`tab-btn ${subTab === 'term-structure' ? 'active' : ''}`}
            onClick={() => setSubTab('term-structure')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <BarChart2 size={13} />
            <span>期限结构与月差</span>
          </button>
          <button 
            className={`tab-btn ${subTab === 'positions' ? 'active' : ''}`}
            onClick={() => setSubTab('positions')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <Users size={13} />
            <span>主力龙虎榜</span>
          </button>
          <button 
            className={`tab-btn ${subTab === 'hedging' ? 'active' : ''}`}
            onClick={() => setSubTab('hedging')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <Shield size={13} />
            <span>套保沙盘</span>
          </button>
          <button 
            className={`tab-btn ${subTab === 'delivery' ? 'active' : ''}`}
            onClick={() => setSubTab('delivery')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <Zap size={13} />
            <span>交割套利</span>
          </button>
        </div>

        <button 
          onClick={fetchAllData} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', flexShrink: 0 }}
        >
          <RefreshCw size={12} />
          <span>刷新</span>
        </button>
      </div>

      {/* VIEW 1: FACTORS MATRIX */}
      {subTab === 'factors' && factorsData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Macro & Sentiment Ribbon */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-down)'
              }}>
                <TrendingDown size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    全要素综合得分: {factorsData.composite_market_score} 分
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.25)', color: 'var(--color-down)', fontWeight: 600 }}>
                    {factorsData.market_sentiment_label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    宏观周期: {factorsData.macro_regime}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  驱动核心: <strong style={{ color: 'var(--color-down)' }}>{factorsData.core_downward_driver}</strong> | 支撑锚点: <strong style={{ color: 'var(--color-up)' }}>{factorsData.core_support_anchor}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>利空因子</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-down)' }}>{factorsData.bearish_factors_count}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>中性因子</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-warn)' }}>{factorsData.neutral_factors_count}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>利多托底</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-up)' }}>{factorsData.bullish_factors_count}</div>
              </div>
            </div>
          </div>

          {/* Expert Trading Conclusions */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} />
              <span>交易专家定性备忘与产业行为前瞻</span>
            </div>
            {factorsData.expert_trading_conclusions.map((conc, idx) => (
              <p key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0', lineHeight: 1.5 }}>
                {conc}
              </p>
            ))}
          </div>

          {/* Dimension Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button 
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
              style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
            >
              全部影响因素 ({allFactors.length})
            </button>
            {factorsData.dimensions.map(dim => (
              <button
                key={dim.dimension_id}
                className={`filter-btn ${selectedCategory === dim.dimension_id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(dim.dimension_id)}
                style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
              >
                {dim.dimension_name} ({dim.factors.length})
              </button>
            ))}
          </div>

          {/* Factors Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
            {filteredFactors.map(factor => {
              const isExpanded = expandedFactor === factor.factor_id;
              const isBearish = factor.direction === 'BEARISH';
              const isBullish = factor.direction === 'BULLISH';
              const badgeColor = isBearish ? 'var(--color-down)' : isBullish ? 'var(--color-up)' : 'var(--color-warn)';
              const badgeBg = isBearish ? 'rgba(239,68,68,0.12)' : isBullish ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)';

              return (
                <div 
                  key={factor.factor_id}
                  onClick={() => setExpandedFactor(isExpanded ? null : factor.factor_id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: isExpanded ? '1px solid var(--color-accent)' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {factor.factor_name}
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '2px' }} className="mono">
                        {factor.current_value_str}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: badgeBg, color: badgeColor }}>
                        {factor.direction_label}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        权重得分: {factor.score > 0 ? `+${factor.score}` : factor.score}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '4px 0', lineHeight: 1.45 }}>
                    {factor.logic_summary}
                  </p>

                  {isExpanded && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-warn)', fontWeight: 600, marginBottom: '4px' }}>
                        🏭 产业链主体行为与盘面传导机制：
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {factor.behavior_transmission}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        <span>历史参考基准: {factor.benchmark_value} {factor.unit}</span>
                        <span>历史分位数: {factor.percentile}%</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {isExpanded ? '收起详情' : '展开传导机制'}
                      {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: MICRO SPREADS & SECONDARY FATTENING */}
      {subTab === 'micro-spreads' && microData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Banner */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  微观现货生死罗盘：标肥价差与二育情绪温度计
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.25)', color: 'var(--color-down)', fontWeight: 600 }}>
                  {microData.spread_status}
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59,130,246,0.2)', color: 'var(--color-accent)', fontWeight: 600 }}>
                  肥标比: {microData.fat_standard_ratio}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                标肥价差: <strong style={{ color: 'var(--color-down)', fontSize: '0.95rem' }} className="mono">{microData.spread} 元/kg</strong> (大肥较标猪折价 0.65 元/kg)
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-warn)', background: 'rgba(234, 179, 8, 0.12)', padding: '6px 12px', borderRadius: '6px' }}>
              💡 核心逻辑：大猪未彻底出清前，盘面反弹均为假象！
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>115kg 标准商品猪价格</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }} className="mono">
                {microData.standard_hog_price.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>元/kg</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>屠宰场基础收购标准标猪</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>150kg+ 超重肥猪价格</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-down)', marginTop: '4px' }} className="mono">
                {microData.fat_hog_price.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>元/kg</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-down)' }}>贴水幅度高达 {microData.spread} 元/kg</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>规模场出栏均重</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-warn)', marginTop: '4px' }} className="mono">
                {microData.average_weight_kg} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kg/头</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-warn)' }}>{microData.weight_turning_signal}</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>二次育肥情绪温度计</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '4px' }} className="mono">
                {microData.secondary_fattening_index} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ 100</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{microData.secondary_fattening_sentiment}</span>
            </div>
          </div>

          {/* 7-Day Spread History Table */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>标肥价差近期演化走势 (T-6 至 今日)</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>单位: 元/公斤</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 14px' }}>监测周期</th>
                    <th style={{ padding: '8px 14px' }}>标猪价格 (115kg)</th>
                    <th style={{ padding: '8px 14px' }}>肥猪价格 (150kg+)</th>
                    <th style={{ padding: '8px 14px' }}>标肥价差 (肥 - 标)</th>
                    <th style={{ padding: '8px 14px' }}>微观市场状态</th>
                  </tr>
                </thead>
                <tbody>
                  {microData.history.map((h, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx === microData.history.length - 1 ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                      <td style={{ padding: '8px 14px', fontWeight: idx === microData.history.length - 1 ? 700 : 400 }}>{h.day}</td>
                      <td style={{ padding: '8px 14px' }} className="mono">{h.standard.toFixed(2)}</td>
                      <td style={{ padding: '8px 14px' }} className="mono">{h.fat.toFixed(2)}</td>
                      <td style={{ padding: '8px 14px', color: h.spread < 0 ? 'var(--color-down)' : 'var(--color-up)', fontWeight: 600 }} className="mono">
                        {h.spread > 0 ? `+${h.spread.toFixed(2)}` : h.spread.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: 'var(--color-down)' }}>
                          {h.spread <= -0.5 ? '大猪踩踏折价' : '小幅倒挂'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expert Takeaway Card */}
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <TrendingDown size={18} style={{ color: 'var(--color-down)' }} />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>资深交易员微观剖析</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {microData.expert_analysis}
            </p>
          </div>
        </div>
      )}

      {/* VIEW: CULL SOW CLEARING & TURNING POINT */}
      {subTab === 'cull-sow' && cullData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Banner */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  周期大底测谎仪：淘汰母猪折价率与产能真实出清
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.25)', color: 'var(--color-down)', fontWeight: 600 }}>
                  {cullData.liquidation_stage}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                淘标比价: <strong style={{ color: 'var(--color-down)', fontSize: '0.95rem' }} className="mono">{cullData.cull_to_standard_ratio}</strong> (正常年份基准 0.720，偏离 -27.6%)
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>周期大底探明概率</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent)' }} className="mono">
                {cullData.cycle_bottom_probability_pct}%
              </div>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>淘汰母猪均价</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-down)', marginTop: '4px' }} className="mono">
                {cullData.cull_sow_price.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>元/kg</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-down)' }}>跌破 5.0 元心理防线，论头贱卖</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>商品三元标猪</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }} className="mono">
                {cullData.standard_hog_price.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>元/kg</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>现货基准比价锚点</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>母猪定点屠宰负荷率</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-warn)', marginTop: '4px' }} className="mono">
                {cullData.sow_slaughter_utilization_pct}%
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-warn)' }}>屠宰线满负荷被动出清</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>年轻母猪淘汰占比</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '4px' }} className="mono">
                28.5%
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>2~3胎中坚母猪被动清仓</span>
            </div>
          </div>

          {/* 4 Stages Progress Ladder */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              生猪下行周期产能去化四大演进阶段对比
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>阶段 1 (高盈利)</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>惜售压栏阶段</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>淘标比 &gt; 0.75，压栏增重</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>阶段 2 (微亏)</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>理性优化淘汰</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>淘标比 0.65~0.75，淘汰老残</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>阶段 3 (深度亏损)</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>被动死扛微调</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>淘标比 0.55~0.65，现金流承压</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-down)', fontWeight: 600 }}>阶段 4 (当前激活状态)</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-down)', marginTop: '2px' }}>恐慌甩卖断臂出清</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>淘标比 0.521，年轻母猪清栏</div>
              </div>
            </div>
          </div>

          {/* Micro Parity Insight Box */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-warn)', marginBottom: '4px' }}>
              🔬 调研微观结构印证：
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {cullData.parity_structure_insight}
            </p>
          </div>

          {/* Expert Verdict */}
          <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <AlertTriangle size={18} style={{ color: 'var(--color-down)' }} />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>大底研判结论</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {cullData.expert_verdict}
            </p>
          </div>
        </div>
      )}

      {/* VIEW: ROLL YIELD & DELIVERY SQUEEZE RISK */}
      {subTab === 'roll-yield' && rollData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Banner */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  期限结构展期损益与交割制度风险
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.25)', color: 'var(--color-accent)', fontWeight: 600 }}>
                  {rollData.structure_label}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                主力与次主力月差: <strong style={{ color: 'var(--color-warn)', fontSize: '0.95rem' }} className="mono">+{rollData.price_diff} 元/吨</strong> ({rollData.active_contract} vs {rollData.next_contract})
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>多头年化展期拖累</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-down)' }} className="mono">
                {rollData.annualized_roll_yield_pct}%
              </div>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>主力跨期月差</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-warn)', marginTop: '4px' }} className="mono">
                +{rollData.price_diff} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>元/吨</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>跨期升水 {rollData.calendar_spread_pct}%</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>距交割月倒计时</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '4px' }} className="mono">
                {rollData.days_to_delivery_month} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>天</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-warn)' }}>个人限仓归零 / 法人断崖</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>车板交割多头折损</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-down)', marginTop: '4px' }} className="mono">
                +{rollData.carboard_delivery_penalty_per_ton} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>元/吨</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>检验+3%~5%掉秤+运费</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>交割挤仓风险评级</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-down)', marginTop: '4px' }}>
                {rollData.delivery_squeeze_risk_level}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-down)' }}>逼多头被动平仓砍单</span>
            </div>
          </div>

          {/* Squeeze Traps Box */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-warn)', marginBottom: '8px' }}>
              ⚠️ 大商所生猪“车板交割”对多头的三大天然制度杀：
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>1. 严苛非瘟复检与运力调配</span>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  买方接货必须自行派驻合规生物安全专用车，若复检不过关或对接屠宰场资质不足，将面临高昂现场处置费。
                </p>
              </div>
              <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>2. 活体运输 3%~5% 天然掉秤</span>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  活体长途运输不可避免发生热损与掉秤，折合每吨直接损失 300~500 元，完全由接货方承担。
                </p>
              </div>
              <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>3. 滞留押车费与死亡风险</span>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  生猪不可久储，每滞留一天产生高昂压车与饲料费。投机多头绝不敢进入交割月接货，空头临近交割月优势显著。
                </p>
              </div>
            </div>
          </div>

          {/* Roll Strategy Recommendation */}
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Layers size={18} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>交易风控与展期指令</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {rollData.roll_strategy_recommendation}
            </p>
          </div>
        </div>
      )}

      {/* VIEW: GLOBAL HOG MARKET & IMPORT PARITY */}
      {subTab === 'global-market' && globalData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Banner */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  国外重点产区生猪供需与中国进口完税平价窗口
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', color: 'var(--color-down)', fontWeight: 600 }}>
                  {globalData.import_window_status}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                进口冻肉理论利润: <strong style={{ color: 'var(--color-down)', fontSize: '0.95rem' }} className="mono">{globalData.import_profit_margin_per_ton} 元/吨</strong> (较巴西最低到岸成本深幅倒挂)
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', background: 'rgba(59, 130, 246, 0.12)', padding: '6px 12px', borderRadius: '6px' }}>
              🌍 结论：海外成本高企，进口无低价倾销威胁！
            </div>
          </div>

          {/* 4 Global Benchmark Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>美国 (CME 瘦肉猪期货)</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }} className="mono">
                {globalData.us_cme_lean_hog_usd_cents_per_lb} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>美分/磅</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>折合 {globalData.us_cme_price_cny_per_ton.toLocaleString()} 元/吨 | 完税 {globalData.us_export_pork_cost_per_ton.toLocaleString()}</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>欧盟 (E级白猪胴体基准)</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }} className="mono">
                {globalData.eu_carcass_price_eur_per_100kg} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>欧元/100kg</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>到岸完税成本 {globalData.eu_import_cost_cny_per_ton.toLocaleString()} 元/吨</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>巴西 (主产区活猪出栏)</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '4px' }} className="mono">
                {globalData.brazil_live_hog_brl_per_kg} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>雷亚尔/kg</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-accent)' }}>全球成本最低 | 完税 {globalData.brazil_import_cost_cny_per_ton.toLocaleString()} 元/吨</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>中国国内 2#/4# 分割冻肉</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-down)', marginTop: '4px' }} className="mono">
                {globalData.china_domestic_frozen_price_per_ton.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>元/吨</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-down)' }}>较巴西还便宜 1,400 元/吨</span>
            </div>
          </div>

          {/* Regional Table */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: '0.82rem' }}>
              全球三大主产区供需与对华出口深度透视
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 14px' }}>国家 / 产区</th>
                    <th style={{ padding: '8px 14px' }}>价格基准指标</th>
                    <th style={{ padding: '8px 14px' }}>完全养殖成本</th>
                    <th style={{ padding: '8px 14px' }}>存栏与产能现状</th>
                    <th style={{ padding: '8px 14px' }}>到岸完税成本</th>
                    <th style={{ padding: '8px 14px' }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {globalData.regional_breakdowns.map((reg, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{reg.region}</td>
                      <td style={{ padding: '10px 14px' }} className="mono">{reg.benchmark_index}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-warn)' }} className="mono">{reg.production_cost}</td>
                      <td style={{ padding: '10px 14px', maxWidth: '280px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{reg.herd_status}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }} className="mono">{reg.export_to_china_cny_ton.toLocaleString()} 元/吨</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: 'var(--color-down)' }}>
                          {reg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Summary Box */}
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Globe size={18} style={{ color: 'var(--color-up)' }} />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>全球进出口宏观格局定论</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {globalData.global_supply_demand_summary}
            </p>
          </div>
        </div>
      )}

      {/* VIEW 2: TERM STRUCTURE */}
      {subTab === 'term-structure' && termData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {termData.structure_label}
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--color-accent)', fontWeight: 600 }}>
                  即期现货锚点: {termData.spot_price.toLocaleString()} 元/吨
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {termData.hedging_advice}
              </p>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-warn)', background: 'rgba(234, 179, 8, 0.12)', padding: '6px 12px', borderRadius: '6px' }}>
              💡 {termData.arbitrage_window}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>生猪各主力合约价格阶梯与即期基差</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>单位: 元/吨</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '8px 12px' }}>合约代码</th>
                    <th style={{ padding: '8px 12px' }}>合约名称</th>
                    <th style={{ padding: '8px 12px' }}>最新价</th>
                    <th style={{ padding: '8px 12px' }}>涨跌幅</th>
                    <th style={{ padding: '8px 12px' }}>对即期现货基差</th>
                    <th style={{ padding: '8px 12px' }}>基差率</th>
                    <th style={{ padding: '8px 12px' }}>距交割</th>
                    <th style={{ padding: '8px 12px' }}>持仓量</th>
                  </tr>
                </thead>
                <tbody>
                  {termData.contracts.map(c => {
                    const isPositiveBasis = c.basis_to_spot >= 0;
                    return (
                      <tr key={c.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: c.is_main ? 'rgba(59,130,246,0.05)' : 'transparent' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }} className="mono">
                          {c.symbol} {c.is_main && <span style={{ fontSize: '0.62rem', background: 'var(--color-accent)', color: '#000', padding: '1px 4px', borderRadius: '2px', marginLeft: '4px' }}>主力</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>{c.name}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }} className="mono">{c.last_price.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', color: c.change_pct >= 0 ? 'var(--color-up)' : 'var(--color-down)' }} className="mono">
                          {c.change_pct >= 0 ? `+${c.change_pct}%` : `${c.change_pct}%`}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: isPositiveBasis ? 'var(--color-up)' : 'var(--color-down)' }} className="mono">
                          {isPositiveBasis ? `+${c.basis_to_spot}` : c.basis_to_spot}
                        </td>
                        <td style={{ padding: '10px 12px' }} className="mono">{c.basis_rate_pct}%</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>约 {c.days_to_delivery} 天</td>
                        <td style={{ padding: '10px 12px' }} className="mono">{c.open_interest.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              跨期合约月差矩阵与套利解析 (Calendar Spreads)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
              {termData.spreads.map(spread => (
                <div key={spread.pair_name} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }} className="mono">{spread.pair_name}</span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: spread.structure === 'CONTANGO' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)', color: spread.structure === 'CONTANGO' ? 'var(--color-accent)' : 'var(--color-down)', fontWeight: 600 }}>
                      {spread.structure === 'CONTANGO' ? '正向升水 (Contango)' : '反向贴水 (Backwardation)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: spread.spread >= 0 ? 'var(--color-accent)' : 'var(--color-down)' }} className="mono">
                      {spread.spread >= 0 ? `+${spread.spread}` : spread.spread} 元/吨
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      年化价差率: {spread.annualized_spread_pct}%
                    </span>
                  </div>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    {spread.trading_implication}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TOP 20 BROKER POSITIONS */}
      {subTab === 'positions' && brokerData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Institutional Verdict Ribbon */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: 'var(--color-down)' }} />
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  大商所生猪主力 ({brokerData.symbol}) 会员席位多空持仓透视
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.25)', color: 'var(--color-down)', fontWeight: 600 }}>
                  {brokerData.net_bias} ({brokerData.net_lots > 0 ? `+${brokerData.net_lots}` : brokerData.net_lots} 手)
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                {brokerData.institutional_verdict}
              </p>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.25)', padding: '8px 16px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>前5大空头集中度 (CR5)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-down)' }} className="mono">
                {brokerData.cr5_short_concentration_pct}%
              </div>
            </div>
          </div>

          {/* Dual Tables: Long vs Short */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
            {/* Top 20 Short (Bearish Hegemony) */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-down)' }}>
                  🐻 空头持仓前 20 席位 (总计 {brokerData.total_short_top20.toLocaleString()} 手)
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>产业套保卖盘聚集</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '8px 10px' }}>排名</th>
                    <th style={{ padding: '8px 10px' }}>会员简称</th>
                    <th style={{ padding: '8px 10px' }}>空单持仓 (手)</th>
                    <th style={{ padding: '8px 10px' }}>日增减</th>
                    <th style={{ padding: '8px 10px' }}>席位属性</th>
                  </tr>
                </thead>
                <tbody>
                  {brokerData.top_short_members.map(m => (
                    <tr key={m.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                      <td style={{ padding: '6px 10px', color: m.rank <= 3 ? 'var(--color-down)' : 'var(--text-muted)', fontWeight: 600 }}>{m.rank}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{m.broker_name}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700 }} className="mono">{m.lots.toLocaleString()}</td>
                      <td style={{ padding: '6px 10px', color: m.change_lots >= 0 ? 'var(--color-down)' : 'var(--color-up)' }} className="mono">
                        {m.change_lots >= 0 ? `+${m.change_lots}` : m.change_lots}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', background: m.broker_type.includes('产业') ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', color: m.broker_type.includes('产业') ? 'var(--color-down)' : 'var(--text-secondary)' }}>
                          {m.broker_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top 20 Long */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-accent)' }}>
                  🐂 多头持仓前 20 席位 (总计 {brokerData.total_long_top20.toLocaleString()} 手)
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>投机与量化多单</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '8px 10px' }}>排名</th>
                    <th style={{ padding: '8px 10px' }}>会员简称</th>
                    <th style={{ padding: '8px 10px' }}>多单持仓 (手)</th>
                    <th style={{ padding: '8px 10px' }}>日增减</th>
                    <th style={{ padding: '8px 10px' }}>席位属性</th>
                  </tr>
                </thead>
                <tbody>
                  {brokerData.top_long_members.map(m => (
                    <tr key={m.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                      <td style={{ padding: '6px 10px', color: m.rank <= 3 ? 'var(--color-accent)' : 'var(--text-muted)', fontWeight: 600 }}>{m.rank}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{m.broker_name}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700 }} className="mono">{m.lots.toLocaleString()}</td>
                      <td style={{ padding: '6px 10px', color: m.change_lots >= 0 ? 'var(--color-up)' : 'var(--color-down)' }} className="mono">
                        {m.change_lots >= 0 ? `+${m.change_lots}` : m.change_lots}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                          {m.broker_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: HEDGING SIMULATION SANDBOX */}
      {subTab === 'hedging' && hedgingData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Controls */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Shield size={16} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>养殖企业套期保值盈亏对冲沙盘（压力测试模拟器）</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  年出栏生猪规模 (头)
                </label>
                <input 
                  type="number"
                  value={hedgeHeads}
                  onChange={e => { const val = Number(e.target.value); setHedgeHeads(val); recalculateHedging(val, hedgeCost, hedgeRatio); }}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '6px 8px', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  企业完全养殖成本 (元/kg)
                </label>
                <input 
                  type="number"
                  step="0.1"
                  value={hedgeCost}
                  onChange={e => { const val = Number(e.target.value); setHedgeCost(val); recalculateHedging(hedgeHeads, val, hedgeRatio); }}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '6px 8px', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  期货套期保值比例 (%) · 当前: {hedgeRatio}%
                </label>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={hedgeRatio}
                  onChange={e => { const val = Number(e.target.value); setHedgeRatio(val); recalculateHedging(hedgeHeads, hedgeCost, val); }}
                  style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                />
              </div>
            </div>
          </div>

          {/* Golden Rule Alert */}
          <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '8px', padding: '12px 14px', fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {hedgingData.expert_hedging_rule}
          </div>

          {/* Stress-Test Scenario Table */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>现货不同涨跌情景下 · 现货裸奔 VS {hedgeRatio}% 套保对冲效果对照</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>单位: 万元 (以年出栏 {hedgingData.annual_tonnage} 吨活猪测算)</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '8px 12px' }}>模拟情景</th>
                    <th style={{ padding: '8px 12px' }}>模拟现货价</th>
                    <th style={{ padding: '8px 12px' }}>纯现货裸奔盈亏</th>
                    <th style={{ padding: '8px 12px' }}>期货套保端盈亏</th>
                    <th style={{ padding: '8px 12px' }}>期现对冲综合盈亏</th>
                    <th style={{ padding: '8px 12px' }}>下行减亏保护率</th>
                    <th style={{ padding: '8px 12px' }}>专家结论</th>
                  </tr>
                </thead>
                <tbody>
                  {hedgingData.scenarios.map(sc => (
                    <tr key={sc.scenario_name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{sc.scenario_name}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }} className="mono">{sc.simulated_spot_price.toFixed(2)} 元/kg</td>
                      <td style={{ padding: '10px 12px', color: sc.spot_pnl_wanyuan >= 0 ? 'var(--color-up)' : 'var(--color-down)', fontWeight: 600 }} className="mono">
                        {sc.spot_pnl_wanyuan >= 0 ? `+${sc.spot_pnl_wanyuan}` : sc.spot_pnl_wanyuan} 万元
                      </td>
                      <td style={{ padding: '10px 12px', color: sc.futures_pnl_wanyuan >= 0 ? 'var(--color-up)' : 'var(--color-down)', fontWeight: 600 }} className="mono">
                        {sc.futures_pnl_wanyuan >= 0 ? `+${sc.futures_pnl_wanyuan}` : sc.futures_pnl_wanyuan} 万元
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: sc.combined_net_pnl_wanyuan >= 0 ? 'var(--color-up)' : 'var(--color-down)' }} className="mono">
                        {sc.combined_net_pnl_wanyuan >= 0 ? `+${sc.combined_net_pnl_wanyuan}` : sc.combined_net_pnl_wanyuan} 万元
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-accent)' }}>
                        {sc.risk_reduction_pct > 0 ? `${sc.risk_reduction_pct}%` : '-'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                        {sc.verdict}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: DCE DELIVERY ARBITRAGE CALCULATOR */}
      {subTab === 'delivery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sliders size={16} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>大商所生猪交割成本与套利模拟器</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>交割合约选择</label>
                <select 
                  value={calcContract} 
                  onChange={e => { setCalcContract(e.target.value); recalculateDelivery(e.target.value, calcLocation, calcWeightGrade, calcSpotPrice); }}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '6px 8px', fontSize: '0.78rem' }}
                >
                  <option value="LH2701">生猪连续 (LH2701 主力)</option>
                  <option value="LH2611">生猪2611 (临近交割)</option>
                  <option value="LH2703">生猪2703 (淡季合约)</option>
                  <option value="LH2705">生猪2705 (远期合约)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>交割指定地区</label>
                <select 
                  value={calcLocation} 
                  onChange={e => { setCalcLocation(e.target.value); recalculateDelivery(calcContract, e.target.value, calcWeightGrade, calcSpotPrice); }}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '6px 8px', fontSize: '0.78rem' }}
                >
                  <option value="henan">河南 (大商所基准地 · 贴水 0)</option>
                  <option value="sichuan">四川 (产区贴水 -200 元/吨)</option>
                  <option value="guangdong">广东 (销区升水 +400 元/吨)</option>
                  <option value="liaoning">辽宁 (东北产区贴水 -600 元/吨)</option>
                  <option value="shandong">山东 (华东贴水 -100 元/吨)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>活猪出栏均重扣罚</label>
                <select 
                  value={calcWeightGrade} 
                  onChange={e => { setCalcWeightGrade(e.target.value); recalculateDelivery(calcContract, calcLocation, e.target.value, calcSpotPrice); }}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '6px 8px', fontSize: '0.78rem' }}
                >
                  <option value="standard">标准品 100~120kg (贴水 0)</option>
                  <option value="overweight_120_130">偏重大猪 120~130kg (扣罚 -400 元/吨)</option>
                  <option value="heavy_130_140">特大猪 130~140kg (扣罚 -800 元/吨)</option>
                  <option value="underweight_90_100">欠重小猪 90~100kg (扣罚 -500 元/吨)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>现货采购成本 (元/吨)</label>
                <input 
                  type="number"
                  value={calcSpotPrice}
                  onChange={e => { const val = Number(e.target.value); setCalcSpotPrice(val); recalculateDelivery(calcContract, calcLocation, calcWeightGrade, val); }}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '6px 8px', fontSize: '0.78rem' }}
                />
              </div>
            </div>
          </div>

          {deliveryData && (
            <div style={{
              background: deliveryData.is_window_open ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: deliveryData.is_window_open ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {deliveryData.is_window_open ? (
                    <CheckCircle2 size={20} style={{ color: 'var(--color-up)' }} />
                  ) : (
                    <AlertTriangle size={20} style={{ color: 'var(--color-down)' }} />
                  )}
                  <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                    {deliveryData.is_window_open ? '🚀 期现卖出套保/交割套利窗口开启' : '⚠️ 交割套利窗口关闭 / 贴水不足以覆盖交割成本'}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: deliveryData.arbitrage_profit_per_ton >= 0 ? 'var(--color-up)' : 'var(--color-down)'
                }} className="mono">
                  交割净利润: {deliveryData.arbitrage_profit_per_ton >= 0 ? `+${deliveryData.arbitrage_profit_per_ton}` : deliveryData.arbitrage_profit_per_ton} 元/吨
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>期货盘面价格</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-accent)' }} className="mono">
                    {deliveryData.futures_price.toLocaleString()} 元/吨
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>现货裸价采购成本</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }} className="mono">
                    {deliveryData.spot_price.toLocaleString()} 元/吨
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>交割固定规费杂费</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-muted)' }} className="mono">
                    +{deliveryData.fees_total} 元/吨
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>交割卖方保本线</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-warn)' }} className="mono">
                    {deliveryData.breakeven_delivery_cost.toLocaleString()} 元/吨
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {deliveryData.arbitrage_advice}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default TradingFactorsPanel;
