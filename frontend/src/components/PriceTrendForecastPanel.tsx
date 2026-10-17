import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Layers,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Compass,
  BarChart3,
  CheckCircle2,
  Zap,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import type { PriceTrendForecast, HorizonDetail, SimulationParams } from '../types';

interface PriceTrendForecastPanelProps {
  forecastData: PriceTrendForecast | null;
  isLoading: boolean;
  onRefresh: (simParams?: Partial<SimulationParams>) => void;
  selectedSymbol: string;
}

const CustomForecastTooltip = ({ active, payload, label, unitMode }: any) => {
  if (active && payload && payload.length) {
    const multiplier = unitMode === 'ton' ? 1000 : 1;
    const unitLabel = unitMode === 'ton' ? '元/吨' : '元/公斤';
    return (
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        fontSize: '0.85rem'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px' }}>
          日期: {label}
        </div>
        {payload.map((entry: any, index: number) => {
          if (entry.dataKey === 'price_upper' || entry.dataKey === 'price_lower') return null;
          return (
            <div key={index} style={{ color: entry.color, margin: '3px 0', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {(entry.value * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)} {unitLabel}
              </span>
            </div>
          );
        })}
        {payload[0]?.payload && (
          <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            <span>置信区间: </span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {(payload[0].payload.price_lower * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)} ~ {(payload[0].payload.price_upper * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)} {unitLabel}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const PriceTrendForecastPanel: React.FC<PriceTrendForecastPanelProps> = ({
  forecastData,
  isLoading,
  onRefresh,
  selectedSymbol
}) => {
  const [unitMode, setUnitMode] = useState<'kg' | 'ton'>('kg');
  const [selectedHorizon, setSelectedHorizon] = useState<string>('30d');
  const [sowShock, setSowShock] = useState<number>(0);
  const [feedShock, setFeedShock] = useState<number>(0);
  const [weightShock, setWeightShock] = useState<number>(0);
  const [demandShock, setDemandShock] = useState<number>(0);
  const [activePreset, setActivePreset] = useState<'base' | 'bullish' | 'bearish' | 'cost_crisis' | 'custom'>('base');
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  const applyPreset = (preset: 'base' | 'bullish' | 'bearish' | 'cost_crisis') => {
    setActivePreset(preset);
    let s = 0, f = 0, w = 0, d = 0;
    if (preset === 'bullish') {
      s = -8; f = 10; w = -2; d = 4;
    } else if (preset === 'bearish') {
      s = 4; f = -5; w = 8; d = -6;
    } else if (preset === 'cost_crisis') {
      s = -3; f = 25; w = -3; d = 0;
    }
    setSowShock(s);
    setFeedShock(f);
    setWeightShock(w);
    setDemandShock(d);
    setIsSimulated(preset !== 'base');
    onRefresh({
      sow_shock_pct: s,
      feed_cost_shock_pct: f,
      weight_shock_kg: w,
      demand_shock_pct: d
    });
  };

  const handleRunSimulation = () => {
    setIsSimulated(sowShock !== 0 || feedShock !== 0 || weightShock !== 0 || demandShock !== 0);
    setActivePreset('custom');
    onRefresh({
      sow_shock_pct: sowShock,
      feed_cost_shock_pct: feedShock,
      weight_shock_kg: weightShock,
      demand_shock_pct: demandShock
    });
  };

  const handleReset = () => {
    setSowShock(0);
    setFeedShock(0);
    setWeightShock(0);
    setDemandShock(0);
    setActivePreset('base');
    setIsSimulated(false);
    onRefresh({
      sow_shock_pct: 0,
      feed_cost_shock_pct: 0,
      weight_shock_kg: 0,
      demand_shock_pct: 0
    });
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 0',
        color: 'var(--text-secondary)'
      }}>
        <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--color-accent)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>量化推演引擎计算中...</h3>
        <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
          正在执行 10 个月生物学群组推演、动态成本标定、季节性拟合与多周期走势投影
        </p>
      </div>
    );
  }

  if (!forecastData) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 0',
        textAlign: 'center'
      }}>
        <AlertTriangle size={48} style={{ color: 'var(--color-warn)', marginBottom: '16px' }} />
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>暂无价格走势预测数据</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '8px 0 20px' }}>
          请点击下方按钮重新触发量化推演引擎计算
        </p>
        <button className="tab-btn active" onClick={() => onRefresh()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} />
          <span>立即生成量化预测</span>
        </button>
      </div>
    );
  }

  const {
    spot_price,
    futures_price,
    basis,
    short_term_bias,
    mid_term_bias,
    long_term_bias,
    overall_confidence,
    horizons,
    trajectory_90d,
    cohort,
    cost,
    drivers,
    forecast_narrative,
    base_date
  } = forecastData;

  const multiplier = unitMode === 'ton' ? 1000 : 1;
  const unitLabel = unitMode === 'ton' ? '元/吨' : '元/公斤';

  // Chart data prepared with unit conversion
  const chartData = trajectory_90d.map(item => ({
    ...item,
    price_mid_val: item.price_mid * multiplier,
    price_upper_val: item.price_upper * multiplier,
    price_lower_val: item.price_lower * multiplier,
    cost_cash: cost.cash_cost_line * multiplier,
    cost_full: cost.full_cost_line * multiplier,
    spot_line: spot_price * multiplier
  }));

  const getBiasBadge = (bias: string) => {
    if (bias.includes('偏多') || bias.includes('看涨')) {
      return { bg: 'rgba(0, 230, 118, 0.15)', color: 'var(--color-up)', border: 'rgba(0, 230, 118, 0.3)' };
    }
    if (bias.includes('偏空') || bias.includes('看跌')) {
      return { bg: 'rgba(255, 23, 68, 0.15)', color: 'var(--color-down)', border: 'rgba(255, 23, 68, 0.3)' };
    }
    return { bg: 'rgba(255, 214, 0, 0.15)', color: 'var(--color-warn)', border: 'rgba(255, 214, 0, 0.3)' };
  };

  const getDirectionIcon = (dir: string) => {
    if (dir.includes('涨') || dir.includes('多')) return <TrendingUp size={16} style={{ color: 'var(--color-up)' }} />;
    if (dir.includes('跌') || dir.includes('空')) return <TrendingDown size={16} style={{ color: 'var(--color-down)' }} />;
    return <Activity size={16} style={{ color: 'var(--color-warn)' }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Intelligence Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 43, 0.8) 0%, rgba(20, 32, 60, 0.85) 100%)',
        border: '1px solid rgba(41, 121, 255, 0.25)',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Compass size={28} style={{ color: 'var(--color-accent)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  生猪价格多周期量化推演与走势预测
                </h2>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(41, 121, 255, 0.2)',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                  border: '1px solid rgba(41, 121, 255, 0.4)'
                }}>
                  {selectedSymbol} 合约
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  基准日期: {base_date}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                基于 10 个月母猪-仔猪生物学出栏传导链条、完全养殖成本锚定、日度高阶平滑季节性及期现基差收敛模型
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Unit Toggle */}
            <div style={{
              display: 'inline-flex',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                onClick={() => setUnitMode('kg')}
                style={{
                  border: 'none',
                  background: unitMode === 'kg' ? 'var(--color-accent)' : 'transparent',
                  color: unitMode === 'kg' ? '#ffffff' : 'var(--text-secondary)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                元/公斤
              </button>
              <button
                onClick={() => setUnitMode('ton')}
                style={{
                  border: 'none',
                  background: unitMode === 'ton' ? 'var(--color-accent)' : 'transparent',
                  color: unitMode === 'ton' ? '#ffffff' : 'var(--text-secondary)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                元/吨
              </button>
            </div>

            <button
              onClick={() => onRefresh()}
              className="tab-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>重新推演</span>
            </button>
          </div>
        </div>

        {/* Current Metrics Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>现货基准价格</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
              {(spot_price * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)} <span style={{ fontSize: '0.7rem' }}>{unitLabel}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>期货当前盘面</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
              {(futures_price / (unitMode === 'kg' ? 1000 : 1)).toFixed(unitMode === 'ton' ? 0 : 2)} <span style={{ fontSize: '0.7rem' }}>{unitLabel}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>当前期现基差</div>
            <div style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: basis > 0 ? 'var(--color-up)' : 'var(--color-down)'
            }}>
              {basis > 0 ? `+${basis.toFixed(0)}` : basis.toFixed(0)} <span style={{ fontSize: '0.7rem' }}>元/吨</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>短期取向 (1-10d)</div>
            <div style={{ marginTop: '2px' }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: getBiasBadge(short_term_bias).bg,
                color: getBiasBadge(short_term_bias).color,
                border: `1px solid ${getBiasBadge(short_term_bias).border}`
              }}>
                {short_term_bias}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>中期取向 (15-30d)</div>
            <div style={{ marginTop: '2px' }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: getBiasBadge(mid_term_bias).bg,
                color: getBiasBadge(mid_term_bias).color,
                border: `1px solid ${getBiasBadge(mid_term_bias).border}`
              }}>
                {mid_term_bias}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>长期取向 (60-180d)</div>
            <div style={{ marginTop: '2px' }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: getBiasBadge(long_term_bias).bg,
                color: getBiasBadge(long_term_bias).color,
                border: `1px solid ${getBiasBadge(long_term_bias).border}`
              }}>
                {long_term_bias}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>综合预测置信度</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-warn)' }}>
              {overall_confidence}%
            </div>
          </div>
        </div>

        {/* Forecast Narrative Box */}
        <div style={{
          background: 'rgba(41, 121, 255, 0.05)',
          borderLeft: '4px solid var(--color-accent)',
          padding: '10px 14px',
          borderRadius: '0 8px 8px 0',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: 'var(--text-primary)', marginRight: '6px' }}>推演结论简报:</strong>
          {forecast_narrative}
        </div>
      </div>

      {/* Scenario Stress Testing Simulator Panel */}
      <div className="glass-panel" style={{
        padding: '18px 20px',
        borderRadius: '12px',
        border: isSimulated ? '1px solid rgba(255, 214, 0, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
        background: isSimulated ? 'rgba(255, 214, 0, 0.03)' : 'var(--panel-bg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={20} style={{ color: isSimulated ? 'var(--color-warn)' : 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              宏观与产业情景压力测试模拟器 (Scenario Stress Testing Simulator)
            </h3>
            <span style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '10px',
              background: isSimulated ? 'rgba(255, 214, 0, 0.2)' : 'rgba(0, 230, 118, 0.15)',
              color: isSimulated ? 'var(--color-warn)' : 'var(--color-up)',
              border: `1px solid ${isSimulated ? 'rgba(255, 214, 0, 0.4)' : 'rgba(0, 230, 118, 0.3)'}`,
              fontWeight: 600
            }}>
              {isSimulated ? '● 压力情景模拟中' : '● 客观基准推演'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleRunSimulation}
              className="tab-btn active"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Zap size={14} />
              <span>运行压力测试</span>
            </button>
            <button
              onClick={handleReset}
              className="tab-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={14} />
              <span>重置基准</span>
            </button>
          </div>
        </div>

        {/* Quick Scenario Preset Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>快速典型情景预设:</span>
          {[
            { id: 'base', label: '基准常态 (Baseline)', color: 'var(--text-primary)' },
            { id: 'bullish', label: '去产能加速牛市 (De-Capacity Squeeze)', color: 'var(--color-up)' },
            { id: 'bearish', label: '二育压栏砸盘熊市 (Heavy Hog Panic)', color: 'var(--color-down)' },
            { id: 'cost_crisis', label: '饲料原料成本恶化危机 (Cost Squeeze)', color: 'var(--color-warn)' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id as any)}
              style={{
                background: activePreset === p.id ? 'rgba(41, 121, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: activePreset === p.id ? '1px solid var(--color-accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activePreset === p.id ? '#ffffff' : p.color,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: activePreset === p.id ? 600 : 400,
                transition: 'all 0.2s ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sliders Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          {/* Slider 1: Sow */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>能繁母猪产能冲击:</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: sowShock > 0 ? 'var(--color-down)' : sowShock < 0 ? 'var(--color-up)' : 'var(--text-primary)'
              }}>
                {sowShock > 0 ? `+${sowShock}%` : `${sowShock}%`}
              </span>
            </div>
            <input
              type="range"
              min={-15}
              max={15}
              step={1}
              value={sowShock}
              onChange={(e) => { setSowShock(Number(e.target.value)); setActivePreset('custom'); }}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              负值加速淘汰去化，锁定中远期供应收紧
            </div>
          </div>

          {/* Slider 2: Feed */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>饲料原料成本冲击:</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: feedShock > 0 ? 'var(--color-up)' : feedShock < 0 ? 'var(--color-down)' : 'var(--text-primary)'
              }}>
                {feedShock > 0 ? `+${feedShock}%` : `${feedShock}%`}
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={30}
              step={1}
              value={feedShock}
              onChange={(e) => { setFeedShock(Number(e.target.value)); setActivePreset('custom'); }}
              style={{ width: '100%', accentColor: 'var(--color-warn)' }}
            />
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              玉米/豆粕价格异动，抬升完全养殖成本底线
            </div>
          </div>

          {/* Slider 3: Weight */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>出栏均重博弈调整:</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: weightShock > 0 ? 'var(--color-down)' : weightShock < 0 ? 'var(--color-up)' : 'var(--text-primary)'
              }}>
                {weightShock > 0 ? `+${weightShock} kg` : `${weightShock} kg`}
              </span>
            </div>
            <input
              type="range"
              min={-10}
              max={15}
              step={1}
              value={weightShock}
              onChange={(e) => { setWeightShock(Number(e.target.value)); setActivePreset('custom'); }}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              压栏增重短期挺价，但增加远期吨肉供应
            </div>
          </div>

          {/* Slider 4: Demand */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>终端消费弹性冲击:</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: demandShock > 0 ? 'var(--color-up)' : demandShock < 0 ? 'var(--color-down)' : 'var(--text-primary)'
              }}>
                {demandShock > 0 ? `+${demandShock}%` : `${demandShock}%`}
              </span>
            </div>
            <input
              type="range"
              min={-15}
              max={15}
              step={1}
              value={demandShock}
              onChange={(e) => { setDemandShock(Number(e.target.value)); setActivePreset('custom'); }}
              style={{ width: '100%', accentColor: 'var(--color-up)' }}
            />
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              替代品分流、消费旺季与居民囤肉偏好
            </div>
          </div>
        </div>
      </div>

      {/* Main Trajectory Projection Chart */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
              90 天连续价格走势推演通道 (Monte Carlo & Biological Trend Channel)
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#00f0ff', borderRadius: '2px' }}></span>
              价格推演中枢
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: 'rgba(0, 240, 255, 0.25)', borderRadius: '2px' }}></span>
              置信喇叭区间 (80% CI)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '2px', background: '#ff5252', borderTop: '2px dashed #ff5252' }}></span>
              完全养殖成本线
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '2px', background: '#ffd600', borderTop: '2px dashed #ffd600' }}></span>
              现金流保本底线
            </span>
          </div>
        </div>

        <div style={{ height: '380px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 15, right: 25, left: 10, bottom: 25 }}>
              <defs>
                <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="var(--text-muted)"
                tick={{ fontSize: 11 }}
                interval={Math.ceil(chartData.length / 10)}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                stroke="var(--text-muted)"
                domain={['auto', 'auto']}
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `${val.toFixed(unitMode === 'ton' ? 0 : 1)}`}
                unit={unitMode === 'ton' ? '' : ' 元'}
              />
              <Tooltip content={<CustomForecastTooltip unitMode={unitMode} />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />

              {/* Confidence interval area */}
              <Area
                type="monotone"
                dataKey="price_upper_val"
                name="预测上限"
                stroke="none"
                fill="url(#forecastAreaGrad)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="price_lower_val"
                name="预测下限"
                stroke="none"
                fill="#0b0f19"
                isAnimationActive={false}
              />

              {/* Dynamic Cost Reference Lines */}
              <ReferenceLine
                y={cost.full_cost_line * multiplier}
                stroke="#ff5252"
                strokeDasharray="4 4"
                label={{
                  value: `行业完全成本: ${(cost.full_cost_line * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)}`,
                  fill: '#ff5252',
                  fontSize: 11,
                  position: 'insideTopLeft'
                }}
              />
              <ReferenceLine
                y={cost.cash_cost_line * multiplier}
                stroke="#ffd600"
                strokeDasharray="4 4"
                label={{
                  value: `现金流底线: ${(cost.cash_cost_line * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)}`,
                  fill: '#ffd600',
                  fontSize: 11,
                  position: 'insideBottomLeft'
                }}
              />
              <ReferenceLine
                y={spot_price * multiplier}
                stroke="#00e676"
                strokeDasharray="3 3"
                label={{
                  value: `当前现货: ${(spot_price * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)}`,
                  fill: '#00e676',
                  fontSize: 11,
                  position: 'insideTopRight'
                }}
              />

              {/* Projected mid price */}
              <Line
                type="monotone"
                dataKey="price_mid_val"
                name="价格推演中枢"
                stroke="#00f0ff"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#00f0ff', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Horizon Projection Cards Carousel / Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              多时间窗口预测矩阵 (Multi-Horizon Projections)
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            覆盖超短期(1-7d)、中期(10-30d)到跨季长期(60-180d)
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px'
        }}>
          {horizons.map((h: HorizonDetail) => {
            const isSelected = selectedHorizon === h.horizon;
            const cardBg = isSelected
              ? 'rgba(41, 121, 255, 0.12)'
              : 'rgba(17, 24, 43, 0.65)';
            const borderColor = isSelected
              ? 'rgba(41, 121, 255, 0.6)'
              : 'rgba(255, 255, 255, 0.08)';

            return (
              <div
                key={h.horizon}
                onClick={() => setSelectedHorizon(h.horizon)}
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 16px rgba(41, 121, 255, 0.2)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                    {h.horizon.toUpperCase()} 窗口 ({h.days}天)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getDirectionIcon(h.direction)}
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: h.direction.includes('涨') ? 'var(--color-up)' : h.direction.includes('跌') ? 'var(--color-down)' : 'var(--color-warn)'
                    }}>
                      {h.direction}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 0' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {(h.mid * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{unitLabel}</span>
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: h.expected_change_pct >= 0 ? 'var(--color-up)' : 'var(--color-down)'
                  }}>
                    {h.expected_change_pct >= 0 ? `+${h.expected_change_pct.toFixed(1)}%` : `${h.expected_change_pct.toFixed(1)}%`}
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  区间: {(h.low * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)} ~ {(h.high * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)}
                </div>

                {/* Confidence Bar */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                    <span>置信度</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{h.confidence}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${h.confidence}%`,
                      height: '100%',
                      background: h.confidence > 70 ? 'var(--color-accent)' : 'var(--color-warn)',
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>

                <div style={{
                  fontSize: '0.7rem',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Compass size={11} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    驱动: {h.primary_driver}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Cohort Biological Supply & Dynamic Costs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '16px' }}>
        {/* Card 1: 10-Month Biological Cohort Pipeline */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Layers size={18} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              10 个月生物学生猪出栏传导链条 (Cohort Pipeline)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Flow Step 1: Sow */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>T-10月 能繁母猪存栏基数</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>母猪存栏产能传导</div>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                {cohort.sow_t_minus_10.toFixed(1)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>万头</span>
              </div>
            </div>

            {/* Flow Step 2: Piglet */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>T-6月 仔猪供应体量 (MSY传导)</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>育肥起点有效供给</div>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                {cohort.piglets_t_minus_6.toFixed(1)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>万头</span>
              </div>
            </div>

            {/* Flow Step 3: Slaughter Heads & Avg Weight */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>推演月度出栏头数</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-warn)' }}>
                  {cohort.projected_slaughter_heads.toFixed(1)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>万头</span>
                </div>
              </div>
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>推演出栏均重</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {cohort.projected_avg_weight.toFixed(1)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kg/头</span>
                </div>
              </div>
            </div>

            {/* Flow Step 4: Supply vs Demand & Gap */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(41, 121, 255, 0.08)',
              border: '1px solid rgba(41, 121, 255, 0.2)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>猪肉推演供给 / 常态消费</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {cohort.projected_pork_supply.toFixed(1)} 万吨 / {cohort.normal_demand.toFixed(1)} 万吨
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>供需差额缺口率</div>
                <div style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: cohort.supply_demand_gap_pct > 0 ? 'var(--color-down)' : 'var(--color-up)'
                }}>
                  {cohort.supply_demand_gap_pct > 0 ? `+${cohort.supply_demand_gap_pct.toFixed(1)}% (供过于求)` : `${cohort.supply_demand_gap_pct.toFixed(1)}% (供求紧俏)`}
                </div>
              </div>
            </div>

            {/* Assessment Label */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <CheckCircle2 size={14} style={{ color: 'var(--color-up)' }} />
              <span>当前产能周期判定: <strong style={{ color: 'var(--text-primary)' }}>{cohort.phase_assessment}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 2: Dynamic Breeding Cost Benchmarks */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <DollarSign size={18} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              动态完全养殖成本与安全边际 (Dynamic Cost Benchmarks)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>玉米原料基准</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {cost.corn_price > 100 ? cost.corn_price.toFixed(0) : (cost.corn_price * 1000).toFixed(0)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>元/吨</span>
                </div>
              </div>
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>豆粕原料基准</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {cost.soybean_price > 100 ? cost.soybean_price.toFixed(0) : (cost.soybean_price * 1000).toFixed(0)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>元/吨</span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>综合饲料单价 / 增重公斤饲料成本</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>FCR 料肉比标定 (2.80)</div>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                {cost.feed_price_per_kg.toFixed(2)} / {cost.feed_cost_per_kg_gain.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>元/kg</span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 82, 82, 0.08)',
                border: '1px solid rgba(255, 82, 82, 0.25)'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#ff8a80' }}>行业完全养殖成本线</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ff5252' }}>
                  {(cost.full_cost_line * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)} <span style={{ fontSize: '0.75rem' }}>{unitLabel}</span>
                </div>
              </div>
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 214, 0, 0.08)',
                border: '1px solid rgba(255, 214, 0, 0.25)'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#ffe57f' }}>现金流保本底线</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffd600' }}>
                  {(cost.cash_cost_line * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)} <span style={{ fontSize: '0.75rem' }}>{unitLabel}</span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>当前养殖毛利 (现货 - 完全成本)</div>
                <div style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: cost.current_margin >= 0 ? 'var(--color-up)' : 'var(--color-down)'
                }}>
                  {cost.current_margin >= 0 ? `+${(cost.current_margin * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)}` : `${(cost.current_margin * multiplier).toFixed(unitMode === 'ton' ? 0 : 2)}`} {unitLabel}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>安全边际率 (Safety Margin)</div>
                <div style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: cost.safety_margin_pct >= 0 ? 'var(--color-up)' : 'var(--color-down)'
                }}>
                  {cost.safety_margin_pct >= 0 ? `+${cost.safety_margin_pct.toFixed(1)}%` : `${cost.safety_margin_pct.toFixed(1)}%`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Decomposition (Attribution Analysis) */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Sliders size={18} style={{ color: 'var(--color-accent)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
            量化驱动因子归因分解 (Drivers Decomposition)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Driver 1 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>供需基本面缺口影响</div>
            <div style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: drivers.supply_gap_impact >= 0 ? 'var(--color-up)' : 'var(--color-down)'
            }}>
              {drivers.supply_gap_impact >= 0 ? `+${drivers.supply_gap_impact.toFixed(1)}%` : `${drivers.supply_gap_impact.toFixed(1)}%`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              出栏量与需求缺口弹性系数传导
            </div>
          </div>

          {/* Driver 2 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>成本刚性支撑驱动</div>
            <div style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: drivers.cost_support_impact >= 0 ? 'var(--color-up)' : 'var(--color-down)'
            }}>
              {drivers.cost_support_impact >= 0 ? `+${drivers.cost_support_impact.toFixed(1)}%` : `${drivers.cost_support_impact.toFixed(1)}%`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              低于行业完全成本时抗跌反弹拉力
            </div>
          </div>

          {/* Driver 3 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>季节性日度样条因子</div>
            <div style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: drivers.seasonality_impact >= 0 ? 'var(--color-up)' : 'var(--color-down)'
            }}>
              {drivers.seasonality_impact >= 0 ? `+${drivers.seasonality_impact.toFixed(1)}%` : `${drivers.seasonality_impact.toFixed(1)}%`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              夏季淡季低谷 vs 冬季腌腊节日旺季
            </div>
          </div>

          {/* Driver 4 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>期现基差收敛速度</div>
            <div style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: drivers.basis_convergence_impact >= 0 ? 'var(--color-up)' : 'var(--color-down)'
            }}>
              {drivers.basis_convergence_impact >= 0 ? `+${drivers.basis_convergence_impact.toFixed(1)}%` : `${drivers.basis_convergence_impact.toFixed(1)}%`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              临近交割月期货向现货收敛衰减率
            </div>
          </div>

          {/* Driver 5 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>二育压栏投机情绪</div>
            <div style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: drivers.speculation_weight_impact >= 0 ? 'var(--color-up)' : 'var(--color-down)'
            }}>
              {drivers.speculation_weight_impact >= 0 ? `+${drivers.speculation_weight_impact.toFixed(1)}%` : `${drivers.speculation_weight_impact.toFixed(1)}%`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              均重超标反噬风险与投机入场博弈
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceTrendForecastPanel;
