import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, LineChart as ChartIcon, Layers, ShieldCheck, Calculator, Scale, Activity } from 'lucide-react';
import type { ExpertAdvice, FuturesQuote, SpotPrice } from '../types';

interface KpiDashboardProps {
  expertAdvice: ExpertAdvice | null;
  selectedSymbol: string;
  quotes?: FuturesQuote[];
  spotBasisData?: SpotPrice[];
}

const KpiDashboard: React.FC<KpiDashboardProps> = ({ expertAdvice, selectedSymbol, quotes, spotBasisData }) => {
  const BASE_URL = typeof window !== 'undefined' && window.location.pathname.startsWith('/sys1') ? '/sys1' : '';

  const [microSpread, setMicroSpread] = useState<{ spread: number; ratio: number; status: string } | null>(null);
  const [cullSow, setCullSow] = useState<{ cullPrice: number; ratio: number; bottomProb: number; stage: string } | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/analysis/micro_spreads`)
      .then(r => r.json())
      .then(data => {
        if (data && typeof data.spread === 'number') {
          setMicroSpread({
            spread: data.spread,
            ratio: data.fat_standard_ratio,
            status: data.spread_status,
          });
        }
      })
      .catch(() => {});

    fetch(`${BASE_URL}/api/analysis/cull_sow_clearing`)
      .then(r => r.json())
      .then(data => {
        if (data && typeof data.cull_to_standard_ratio === 'number') {
          setCullSow({
            cullPrice: data.cull_sow_price,
            ratio: data.cull_to_standard_ratio,
            bottomProb: data.cycle_bottom_probability_pct,
            stage: data.liquidation_stage,
          });
        }
      })
      .catch(() => {});
  }, [BASE_URL]);

  // 现货日度涨跌计算
  const spotChangeInfo = React.useMemo(() => {
    if (!spotBasisData || spotBasisData.length < 2) {
      return { changePct: 0, isUp: true };
    }
    const sorted = [...spotBasisData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sorted[sorted.length - 1]?.price || 0;
    const prev = sorted[sorted.length - 2]?.price || 0;
    if (prev <= 0) return { changePct: 0, isUp: true };
    const pct = ((latest - prev) / prev) * 100;
    return { changePct: pct, isUp: pct >= 0 };
  }, [spotBasisData]);

  // 期货日度涨跌计算
  const futuresChangeInfo = React.useMemo(() => {
    if (!quotes || quotes.length === 0) return { changePct: 0, isUp: true };
    const activeQuote = quotes.find(q => q.symbol === selectedSymbol) || quotes.find(q => q.symbol === 'LH0');
    if (!activeQuote || activeQuote.yesterday_close <= 0) return { changePct: 0, isUp: true };
    const pct = ((activeQuote.last_price - activeQuote.yesterday_close) / activeQuote.yesterday_close) * 100;
    return { changePct: pct, isUp: pct >= 0 };
  }, [quotes, selectedSymbol]);

  const currentBasis = expertAdvice?.basis || 0;
  const isBasisPositive = currentBasis >= 0;

  // 客观基差结构评定（不给出任何买入/卖出指示）
  const basisStructure = React.useMemo(() => {
    if (currentBasis > 1200) {
      return { label: '现货大幅升水 (深度贴水)', color: 'var(--color-up)', note: '现货高于期货1200元以上' };
    } else if (currentBasis > 0) {
      return { label: '现货升水结构 (小幅贴水)', color: 'var(--color-up)', note: '现货略高于期货' };
    } else if (currentBasis < -2000) {
      return { label: '期货大幅升水结构', color: 'var(--color-down)', note: '盘面较现货升水超2000元' };
    } else if (currentBasis < -800) {
      return { label: '期货中度升水结构', color: 'var(--color-warn)', note: '盘面升水800~2000元' };
    }
    return { label: '平水收敛震荡区间', color: 'var(--text-secondary)', note: '基差在正负800元窄幅波动' };
  }, [currentBasis]);

  return (
    <section className="kpi-container">
      {/* KPI 1: 全国生猪现货均价 */}
      <div className={`glass-panel kpi-card ${spotChangeInfo.isUp ? 'up' : 'down'}`}>
        <div className="kpi-header">
          <span>全国生猪现货均价</span>
          <Award className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: spotChangeInfo.isUp ? 'var(--color-up)' : 'var(--color-down)' }}>
          {expertAdvice?.spot_price ? `${expertAdvice.spot_price.toFixed(2)}` : '9.40'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/公斤</span>
        </div>
        <div className="kpi-footer">
          <span className={`trend-badge ${spotChangeInfo.isUp ? 'up' : 'down'}`}>
            {spotChangeInfo.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {spotChangeInfo.isUp ? '+' : ''}{spotChangeInfo.changePct.toFixed(2)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>较前一日均价</span>
        </div>
      </div>

      {/* KPI 2: 期货盘面价格 */}
      <div className={`glass-panel kpi-card ${futuresChangeInfo.isUp ? 'up' : 'down'}`}>
        <div className="kpi-header">
          <span>期货盘面 ({selectedSymbol})</span>
          <ChartIcon className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: futuresChangeInfo.isUp ? 'var(--color-up)' : 'var(--color-down)' }}>
          {expertAdvice?.futures_price ? `${Math.round(expertAdvice.futures_price)}` : '9825'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/吨</span>
        </div>
        <div className="kpi-footer">
          <span className={`trend-badge ${futuresChangeInfo.isUp ? 'up' : 'down'}`}>
            {futuresChangeInfo.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {futuresChangeInfo.isUp ? '+' : ''}{futuresChangeInfo.changePct.toFixed(2)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>24小时走势</span>
        </div>
      </div>

      {/* KPI 3: 即期基差 (现货 - 期货) */}
      <div className={`glass-panel kpi-card ${isBasisPositive ? 'up' : 'warn'}`}>
        <div className="kpi-header">
          <span>即期生猪基差</span>
          <Layers className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: isBasisPositive ? 'var(--color-up)' : 'var(--color-down)' }}>
          {expertAdvice?.basis ? `${Math.round(expertAdvice.basis)}` : '-425'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/吨</span>
        </div>
        <div className="kpi-footer">
          <span style={{ color: basisStructure.color, fontWeight: 600, fontSize: '0.74rem' }}>
            {basisStructure.label}
          </span>
        </div>
      </div>

      {/* KPI 4: 猪粮比价 */}
      <div className="glass-panel kpi-card accent">
        <div className="kpi-header">
          <span>猪粮比价</span>
          <ShieldCheck className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: 'var(--color-accent)' }}>
          {expertAdvice?.pig_to_grain ? `${expertAdvice.pig_to_grain.toFixed(2)}` : '4.39'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>: 1</span>
        </div>
        <div className="kpi-footer">
          <span style={{ color: (expertAdvice?.pig_to_grain || 0) < 5.0 ? 'var(--color-down)' : 'var(--text-muted)' }}>
            {(expertAdvice?.pig_to_grain || 0) < 5.0 ? '🚨 发改委一级预警 (收储区间)' : '发改委盈亏保本线: 6.0'}
          </span>
        </div>
      </div>

      {/* KPI 5: 标肥微观价差 (NEW) */}
      <div className="glass-panel kpi-card down">
        <div className="kpi-header">
          <span>标肥微观价差</span>
          <Scale className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: 'var(--color-down)' }}>
          {microSpread ? `${microSpread.spread.toFixed(2)}` : '-0.65'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/kg</span>
        </div>
        <div className="kpi-footer">
          <span style={{ color: 'var(--color-down)', fontWeight: 600 }}>
            肥标比 {microSpread ? microSpread.ratio : '0.931'} (大肥倒挂踩踏)
          </span>
        </div>
      </div>

      {/* KPI 6: 淘母折价与大底出清 (NEW) */}
      <div className="glass-panel kpi-card warn">
        <div className="kpi-header">
          <span>淘母/标猪折价率</span>
          <Activity className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: 'var(--color-warn)' }}>
          {cullSow ? `${cullSow.ratio.toFixed(3)}` : '0.521'}
        </div>
        <div className="kpi-footer">
          <span style={{ color: 'var(--color-warn)', fontWeight: 600 }}>
            破5元断臂出清 (大底概率 {cullSow ? cullSow.bottomProb : 68}%)
          </span>
        </div>
      </div>

      {/* KPI 7: 自繁自养估算利润 */}
      <div className="glass-panel kpi-card down">
        <div className="kpi-header">
          <span>自繁自养估算盈亏</span>
          <Calculator className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: expertAdvice?.self_breeding_profit && expertAdvice.self_breeding_profit >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
          {expertAdvice?.self_breeding_profit ? `${Math.round(expertAdvice.self_breeding_profit)}` : '-540'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/头</span>
        </div>
        <div className="kpi-footer">
          <span style={{ color: 'var(--text-muted)' }}>
            外购仔猪: {expertAdvice?.piglet_breeding_profit ? Math.round(expertAdvice.piglet_breeding_profit) : -372} 元/头
          </span>
        </div>
      </div>
    </section>
  );
};

export default KpiDashboard;
