import React from 'react';
import { Award, AlertTriangle, ShieldAlert, BarChart3, TrendingDown } from 'lucide-react';
import type { ExpertAdvice } from '../types';

interface ExpertPanelProps {
  expertAdvice: ExpertAdvice | null;
  activeAdviceTab: 'farmers' | 'middle' | 'traders';
  setActiveAdviceTab: (tab: 'farmers' | 'middle' | 'traders') => void;
}

const ExpertPanel: React.FC<ExpertPanelProps> = ({ expertAdvice, activeAdviceTab, setActiveAdviceTab }) => {
  const spotPrice = expertAdvice?.spot_price || 15.4;
  const futuresPrice = expertAdvice?.futures_price || 12080;
  const spotTonPrice = Math.round(spotPrice * 1000);
  const basis = expertAdvice?.basis || (spotTonPrice - futuresPrice);

  return (
    <article className="glass-panel" style={{ padding: '16px' }}>
      <div className="panel-title-bar">
        <div className="panel-title">
          <Award size={18} />
          <span>基本面综合研判与风险雷达</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Market Regime</span>
      </div>

      <div className="advisor-card">
        {/* Warning Alert Banner */}
        {expertAdvice?.conclusion && (
          <div className={`alert-banner ${expertAdvice.warning_level || 'normal'}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: expertAdvice.warning_level === 'danger' ? 'var(--color-down)' : 'var(--color-warn)' }} />
                <span className="alert-title">{expertAdvice.conclusion.title || '市场状态研判中'}</span>
              </div>
              <span className="signal-action-badge warn" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingDown size={12} />
                下行承压监控
              </span>
            </div>
            <p className="alert-desc">{expertAdvice.conclusion.description || '当前盘面处于下行承压阶段，请高度关注现货踩踏与供给释放风险。'}</p>
          </div>
        )}

        {/* Objective Market Anchors - 市场客观核心锚点 (代替武断的买入计划卡) */}
        <div className="trade-setup-card" style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <div className="trade-setup-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={14} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                期现客观基准锚点对照
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              单位: 元/吨
            </span>
          </div>

          <div className="trade-setup-grid">
            <div className="trade-setup-cell">
              <span className="trade-cell-label">现货折算价</span>
              <span className="trade-cell-val mono" style={{ color: 'var(--text-primary)' }}>
                {spotTonPrice.toLocaleString()}
              </span>
            </div>
            <div className="trade-setup-cell">
              <span className="trade-cell-label">盘面最新价</span>
              <span className="trade-cell-val mono" style={{ color: 'var(--color-down)' }}>
                {Math.round(futuresPrice).toLocaleString()}
              </span>
            </div>
            <div className="trade-setup-cell">
              <span className="trade-cell-label">即期基差差额</span>
              <span className="trade-cell-val mono" style={{ color: basis >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
                {basis > 0 ? `+${Math.round(basis)}` : Math.round(basis)}
              </span>
            </div>
          </div>

          <div className="trade-setup-footer">
            <span>行业完全成本线: <strong style={{ color: 'var(--color-warn)' }}>14,500 ~ 15,000 元/吨</strong></span>
            <span>当前盘面态势: <strong style={{ color: 'var(--color-down)' }}>弱势寻底 / 顺势风控为主</strong></span>
          </div>
        </div>

        {/* 盘面下行风险与预警要点 */}
        <div className="cycle-signals-container">
          <div className="cycle-signals-header">
            <ShieldAlert size={13} style={{ color: 'var(--color-down)' }} />
            <span>核心下行驱动与风险监测维度</span>
          </div>
          <div className="cycle-signals-list">
            <div className="cycle-item">
              <div className="cycle-item-top">
                <span className="cycle-item-name">定点屠宰压价意愿</span>
                <span className="cycle-item-badge down">供给释放偏强</span>
              </div>
              <div className="cycle-item-desc">
                全国屠宰量居高不下，二次育肥出栏节奏加快，市场流通端承压。
              </div>
            </div>
            <div className="cycle-item">
              <div className="cycle-item-top">
                <span className="cycle-item-name">母猪产能与结转供应</span>
                <span className="cycle-item-badge warn">产能去化滞后</span>
              </div>
              <div className="cycle-item-desc">
                能繁母猪存栏去化斜率较缓，供给端对中远期盘面预期形成实质性压制。
              </div>
            </div>
          </div>
        </div>

        {/* 风险雷达权重条 */}
        {expertAdvice?.conclusion?.radar && (
          <div className="risk-radar-section">
            <div className="risk-list">
              <div className="risk-item">
                <span className="risk-item-label">供给压力 (Supply)</span>
                <div className="risk-item-bar-bg">
                  <div className="risk-item-bar-fill" style={{ width: `${expertAdvice.conclusion.radar.supply || 0}%`, background: 'var(--color-accent)' }}></div>
                </div>
                <span className="risk-item-val mono">{expertAdvice.conclusion.radar.supply || 0}</span>
              </div>
              <div className="risk-item">
                <span className="risk-item-label">终端需求 (Demand)</span>
                <div className="risk-item-bar-bg">
                  <div className="risk-item-bar-fill" style={{ width: `${expertAdvice.conclusion.radar.demand || 0}%`, background: 'var(--color-up)' }}></div>
                </div>
                <span className="risk-item-val mono">{expertAdvice.conclusion.radar.demand || 0}</span>
              </div>
              <div className="risk-item">
                <span className="risk-item-label">成本挤压 (Cost)</span>
                <div className="risk-item-bar-bg">
                  <div className="risk-item-bar-fill" style={{ width: `${expertAdvice.conclusion.radar.cost || 0}%`, background: 'var(--color-warn)' }}></div>
                </div>
                <span className="risk-item-val mono">{expertAdvice.conclusion.radar.cost || 0}</span>
              </div>
              <div className="risk-item">
                <span className="risk-item-label">政策限额 (Policy)</span>
                <div className="risk-item-bar-bg">
                  <div className="risk-item-bar-fill" style={{ width: `${expertAdvice.conclusion.radar.policy || 0}%`, background: '#a855f7' }}></div>
                </div>
                <span className="risk-item-val mono">{expertAdvice.conclusion.radar.policy || 0}</span>
              </div>
              <div className="risk-item">
                <span className="risk-item-label">疫病舆情 (Disease)</span>
                <div className="risk-item-bar-bg">
                  <div className="risk-item-bar-fill" style={{ width: `${expertAdvice.conclusion.radar.disease || 0}%`, background: 'var(--color-down)' }}></div>
                </div>
                <span className="risk-item-val mono">{expertAdvice.conclusion.radar.disease || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Advice Tabs */}
        <div className="advice-tabs">
          {(['traders', 'farmers', 'middle'] as const).map(tab => (
            <button
              key={tab}
              className={`advice-tab-btn ${activeAdviceTab === tab ? 'active' : ''}`}
              onClick={() => setActiveAdviceTab(tab)}
            >
              {tab === 'traders' ? '🎯 套保交易员' : tab === 'farmers' ? '养殖户' : '屠宰厂'}
            </button>
          ))}
        </div>

        <div className="advice-content">
          {expertAdvice?.advice?.[activeAdviceTab] ? (
            <>
              <div className="advice-action-header">
                产业主体建议: {expertAdvice.advice[activeAdviceTab].action || '严控敞口'}
              </div>
              <ul className="advice-bullets">
                {(expertAdvice.advice[activeAdviceTab].bullets || []).map((bullet, idx) => (
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
  );
};

export default ExpertPanel;
