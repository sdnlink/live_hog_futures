import React from 'react';
import { TrendingUp, TrendingDown, Award, LineChart as ChartIcon, Layers, ShieldCheck, Calculator } from 'lucide-react';
import type { ExpertAdvice } from '../types';

interface KpiDashboardProps {
  expertAdvice: ExpertAdvice | null;
  selectedSymbol: string;
}

const KpiDashboard: React.FC<KpiDashboardProps> = ({ expertAdvice, selectedSymbol }) => {
  return (
    <section className="kpi-container">
      {/* KPI 1: Spot Price */}
      <div className="glass-panel kpi-card up">
        <div className="kpi-header">
          <span>全国生猪现货均价</span>
          <Award className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: 'var(--color-up)' }}>
          {expertAdvice?.spot_price ? `${expertAdvice.spot_price.toFixed(2)}` : '15.40'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/公斤</span>
        </div>
        <div className="kpi-footer">
          <span className="trend-badge up">
            <TrendingUp size={11} />
            +2.15%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>较昨日均价</span>
        </div>
      </div>

      {/* KPI 2: Futures Contract Price */}
      <div className="glass-panel kpi-card down">
        <div className="kpi-header">
          <span>期货价格 ({selectedSymbol})</span>
          <ChartIcon className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: 'var(--color-down)' }}>
          {expertAdvice?.futures_price ? `${Math.round(expertAdvice.futures_price)}` : '12080'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/吨</span>
        </div>
        <div className="kpi-footer">
          <span className="trend-badge down">
            <TrendingDown size={11} />
            -0.58%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>24小时涨跌</span>
        </div>
      </div>

      {/* KPI 3: Basis (Spot - Futures) */}
      <div className="glass-panel kpi-card warn">
        <div className="kpi-header">
          <span>即期生猪基差</span>
          <Layers className="kpi-icon" size={14} />
        </div>
        <div className="kpi-value mono" style={{ color: 'var(--color-warn)' }}>
          {expertAdvice?.basis ? `${Math.round(expertAdvice.basis)}` : '-2640'}
          <span style={{ fontSize: '0.8rem', marginLeft: '4px', fontWeight: 500 }}>元/吨</span>
        </div>
        <div className="kpi-footer">
          <span style={{ color: 'var(--text-muted)' }}>期现折算价架收敛度</span>
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
