import React from 'react';
import { TrendingUp, TrendingDown, Award, LineChart as ChartIcon, Layers, ShieldCheck, Calculator } from 'lucide-react';
import type { ExpertAdvice, FuturesQuote, SpotPrice } from '../types';

interface KpiDashboardProps {
  expertAdvice: ExpertAdvice | null;
  selectedSymbol: string;
  quotes?: FuturesQuote[];
  spotBasisData?: SpotPrice[];
}

const KpiDashboard: React.FC<KpiDashboardProps> = ({ expertAdvice, selectedSymbol, quotes, spotBasisData }) => {
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

  const futuresChangeInfo = React.useMemo(() => {
    if (!quotes || quotes.length === 0) return { changePct: 0, isUp: true };
    const activeQuote = quotes.find(q => q.symbol === selectedSymbol) || quotes.find(q => q.symbol === 'LH0');
    if (!activeQuote || activeQuote.yesterday_close <= 0) return { changePct: 0, isUp: true };
    const pct = ((activeQuote.last_price - activeQuote.yesterday_close) / activeQuote.yesterday_close) * 100;
    return { changePct: pct, isUp: pct >= 0 };
  }, [quotes, selectedSymbol]);

  const currentBasis = expertAdvice?.basis || 0;
  const isBasisPositive = currentBasis >= 0;

  return (
    <section className="kpi-container">
      {/* KPI 1: Spot Price */}
      <div className={`glass-panel kpi-card ${spotChangeInfo.isUp ? 'up' : 'down'}`}>
        <div className="kpi-header">
          <span>全国生猪现货均价</span>
          <Award className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: spotChangeInfo.isUp ? 'var(--color-up)' : 'var(--color-down)' }}>
          {expertAdvice?.spot_price ? `${expertAdvice.spot_price.toFixed(2)}` : '15.40'}
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

      {/* KPI 2: Futures Contract Price */}
      <div className={`glass-panel kpi-card ${futuresChangeInfo.isUp ? 'up' : 'down'}`}>
        <div className="kpi-header">
          <span>期货盘面 ({selectedSymbol})</span>
          <ChartIcon className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: futuresChangeInfo.isUp ? 'var(--color-up)' : 'var(--color-down)' }}>
          {expertAdvice?.futures_price ? `${Math.round(expertAdvice.futures_price)}` : '12080'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/吨</span>
        </div>
        <div className="kpi-footer">
          <span className={`trend-badge ${futuresChangeInfo.isUp ? 'up' : 'down'}`}>
            {futuresChangeInfo.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {futuresChangeInfo.isUp ? '+' : ''}{futuresChangeInfo.changePct.toFixed(2)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>24小时涨跌</span>
        </div>
      </div>

      {/* KPI 3: Basis (Spot - Futures) */}
      <div className={`glass-panel kpi-card ${isBasisPositive ? 'up' : 'warn'}`}>
        <div className="kpi-header">
          <span>即期生猪基差</span>
          <Layers className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: isBasisPositive ? 'var(--color-up)' : 'var(--color-down)' }}>
          {expertAdvice?.basis ? `${Math.round(expertAdvice.basis)}` : '-2640'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/吨</span>
        </div>
        <div className="kpi-footer">
          <span style={{ color: isBasisPositive ? 'var(--color-up)' : 'var(--text-muted)' }}>
            {isBasisPositive ? '现货升水 (+强现实)' : '现货贴水 (-预期升水)'}
          </span>
        </div>
      </div>

      {/* KPI 4: Pig-to-Grain Ratio */}
      <div className="glass-panel kpi-card accent">
        <div className="kpi-header">
          <span>猪粮比价</span>
          <ShieldCheck className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: 'var(--color-accent)' }}>
          {expertAdvice?.pig_to_grain ? `${expertAdvice.pig_to_grain.toFixed(2)}` : '3.90'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>: 1</span>
        </div>
        <div className="kpi-footer">
          <span style={{ color: 'var(--text-muted)' }}>发改委盈亏保本线: 6.0</span>
        </div>
      </div>

      {/* KPI 5: Self-Breeding Profit */}
      <div className="glass-panel kpi-card down">
        <div className="kpi-header">
          <span>自繁自养估算利润</span>
          <Calculator className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: expertAdvice?.self_breeding_profit && expertAdvice.self_breeding_profit >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
          {expertAdvice?.self_breeding_profit ? `${Math.round(expertAdvice.self_breeding_profit)}` : '-222'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/头</span>
        </div>
        <div className="kpi-footer">
          <span style={{ color: 'var(--text-muted)' }}>外购仔猪: {expertAdvice?.piglet_breeding_profit ? Math.round(expertAdvice.piglet_breeding_profit) : -372} 元/头</span>
        </div>
      </div>
    </section>
  );
};

export default KpiDashboard;
