import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ShieldAlert, Activity, RefreshCw, Compass, Target
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';
import type { SupplyDemandSummaryResponse } from '../types';

interface SupplyDemandCockpitProps {
  onSwitchToProDetail?: (tabName?: string) => void;
}

const BASE_URL = typeof window !== 'undefined' && window.location.pathname.startsWith('/sys1') ? '/sys1' : '';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        fontSize: '0.8rem'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{label}</div>
        {payload.map((item: any, idx: number) => (
          <div key={idx} style={{ color: item.color || item.stroke, margin: '3px 0', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>{item.name}:</span>
            <span style={{ fontWeight: 600 }} className="mono">
              {typeof item.value === 'number' ? (item.unit === '%' ? `${item.value.toFixed(1)}%` : `${item.value.toFixed(1)} 万吨`) : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SupplyDemandCockpit: React.FC<SupplyDemandCockpitProps> = ({ onSwitchToProDetail }) => {
  const [data, setData] = useState<SupplyDemandSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/analysis/supply_demand_summary`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch supply demand summary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--color-accent)' }} />
        <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>正在生成生猪全市场供需核心一览...</div>
        <div style={{ fontSize: '0.8rem', marginTop: '6px' }}>统筹全国生猪出栏、出栏均重、二育蓄水与终端消费平衡</div>
      </div>
    );
  }

  if (!data) return null;

  const { verdict, pillars, timeline_6m, contracts_guidance } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. HERO MASTER VERDICT: 供需一锤定音总控台 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={24} style={{ color: 'var(--color-accent)' }} />
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                全国生猪供需全景决策驾驶舱 (S&D Executive Cockpit)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '12px' }}>
                更新基准：{data.updated_at} | 3秒一览市场全貌
              </span>
            </div>
          </div>
          <button 
            onClick={fetchSummary}
            className="sync-btn"
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>实时重算</span>
          </button>
        </div>

        {/* 3-Column Core Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginTop: '16px' }}>
          
          {/* Col 1: Verdict & Gap */}
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>供需状态核心裁决</span>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', color: 'var(--color-down)', fontWeight: 700 }}>
                {verdict.status_code === 'SURPLUS_SEVERE' ? '🚨 严重供过于求' : '供求平衡'}
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-down)', marginBottom: '8px' }}>
              {verdict.status}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>当月供需缺口率:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-down)' }} className="mono">
                {verdict.net_gap_pct}%
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(负值代表供给显著过剩)</span>
            </div>
          </div>

          {/* Col 2: Balance Sheet */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>当月生猪与猪肉产销平衡表 (全国)</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>全月预估供应肉量</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }} className="mono">
                  {verdict.monthly_supply_tons} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>万吨</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>全月预估终端消费</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '2px' }} className="mono">
                  {verdict.monthly_demand_tons} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>万吨</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>净过剩供给肉量:</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-down)' }} className="mono">
                +{verdict.monthly_surplus_tons} 万吨
              </span>
            </div>
          </div>

          {/* Col 3: Trading Action & Rationale */}
          <div style={{ background: 'rgba(234, 179, 8, 0.06)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Target size={16} style={{ color: 'var(--color-warn)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-warn)', fontWeight: 700 }}>首席操盘定调</span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {verdict.trading_bias}
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45, background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px' }}>
              💡 <strong>核心矛盾：</strong>{verdict.core_conflict}
            </div>
          </div>

        </div>
      </div>

      {/* 2. THE 4 S&D BALANCE PILLARS (四大天平红绿灯) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              供需链条四大支柱诊断 (从母猪底数到即期大肥)
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            红灯: 极度压制 | 黄灯: 整理偏弱 | 绿灯: 强劲支撑
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
          {pillars.map((p, idx) => (
            <div 
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${p.traffic_light === 'red' ? 'rgba(239, 68, 68, 0.35)' : p.traffic_light === 'yellow' ? 'rgba(234, 179, 8, 0.35)' : 'rgba(34, 197, 94, 0.35)'}`,
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: p.traffic_light === 'red' ? 'var(--color-down)' : p.traffic_light === 'yellow' ? 'var(--color-warn)' : 'var(--color-up)',
                      boxShadow: `0 0 8px ${p.traffic_light === 'red' ? 'rgba(239,68,68,0.8)' : p.traffic_light === 'yellow' ? 'rgba(234,179,8,0.8)' : 'rgba(34,197,94,0.8)'}`
                    }} />
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: p.traffic_light === 'red' ? 'var(--color-down)' : p.traffic_light === 'yellow' ? 'var(--color-warn)' : 'var(--color-up)'
                    }}>
                      {p.status_label}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }} className="mono">
                  {p.primary_metric}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {p.sub_metric}
                </div>
              </div>

              <div style={{
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '8px 10px',
                borderRadius: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.04)'
              }}>
                {p.takeaway}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FORWARD 6-MONTH SUPPLY vs DEMAND & GAP TIMELINE (未来6个月供需缺口推演) */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              未来 6 个月供需缺口推演轨迹 (S&D Supply-Demand Forward Curve)
            </span>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              结合母猪受胎生产流水线、大猪去库节奏与季节性消费脉冲；缺口由负转正处即为周期反转大底。
            </p>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-accent)', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '4px' }}>
            反转拐点预判：明年一季度末 (1月~3月) 供需平衡收敛
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: '280px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeline_6m} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} />
              <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={11} label={{ value: '供应 vs 需求 (万吨)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={11} domain={[-10, 8]} label={{ value: '供需缺口 (%)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={32} iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
              <ReferenceLine yAxisId="right" y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
              <Bar yAxisId="left" name="供应预测量" dataKey="supply" fill="rgba(239, 68, 68, 0.6)" barSize={24} />
              <Bar yAxisId="left" name="需求预测量" dataKey="demand" fill="rgba(59, 130, 246, 0.6)" barSize={24} />
              <Line yAxisId="right" name="供需缺口率 (%)" type="monotone" dataKey="gap_pct" stroke="#eab308" strokeWidth={2.5} dot={{ r: 4, fill: '#eab308' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Strategy Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '12px' }}>
          {timeline_6m.map((t, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '6px',
              padding: '8px 10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.period}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: t.gap_pct < 0 ? 'var(--color-down)' : 'var(--color-up)', marginTop: '2px' }} className="mono">
                {t.gap_pct > 0 ? `+${t.gap_pct}%` : `${t.gap_pct}%`}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {t.status}
              </div>
              <span style={{
                fontSize: '0.64rem',
                display: 'inline-block',
                marginTop: '4px',
                padding: '1px 6px',
                borderRadius: '3px',
                background: t.bias.includes('多') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: t.bias.includes('多') ? 'var(--color-up)' : 'var(--color-down)',
                fontWeight: 600
              }}>
                {t.bias}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. FUTURES CONTRACTS TRADING MATRIX (各主力合约供需多空映射) */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Activity size={18} style={{ color: 'var(--color-accent)' }} />
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            生猪期货各期限合约供需定调与操作策略
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {contracts_guidance.map((c, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${c.color === 'down' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: c.color === 'down' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    color: c.color === 'down' ? 'var(--color-down)' : 'var(--color-up)'
                  }}>
                    {c.verdict}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', margin: '8px 0' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>盘面价格:</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }} className="mono">
                      {c.price.toLocaleString()} <span style={{ fontSize: '0.75rem' }}>元/吨</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>即期基差:</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: c.basis < 0 ? 'var(--color-down)' : 'var(--color-up)' }} className="mono">
                      {c.basis > 0 ? `+${c.basis}` : c.basis} <span style={{ fontSize: '0.75rem' }}>元/吨</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.45, background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}>
                {c.comment}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. DEEP DIVE BUTTONS (一键穿透下钻至专业明细) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '12px 18px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          🔍 <strong>需要验证底层逻辑？</strong>点击下方快捷入口一键直达对应深度分析：
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => onSwitchToProDetail && onSwitchToProDetail('factors-matrix')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: 'var(--color-accent)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔬 穿透 18 项全要素驱动</span>
            <ArrowRight size={14} />
          </button>
          <button 
            onClick={() => onSwitchToProDetail && onSwitchToProDetail('spot-futures')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📊 查看期现基差收敛</span>
            <ArrowRight size={14} />
          </button>
          <button 
            onClick={() => onSwitchToProDetail && onSwitchToProDetail('price-forecast')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              color: 'var(--color-warn)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📈 90天价格置信推演</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplyDemandCockpit;
