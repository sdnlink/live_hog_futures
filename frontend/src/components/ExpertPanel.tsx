import React from 'react';
import { Award, AlertTriangle } from 'lucide-react';
import type { ExpertAdvice } from '../types';

interface ExpertPanelProps {
  expertAdvice: ExpertAdvice | null;
  activeAdviceTab: 'farmers' | 'middle' | 'traders';
  setActiveAdviceTab: (tab: 'farmers' | 'middle' | 'traders') => void;
}

const ExpertPanel: React.FC<ExpertPanelProps> = ({ expertAdvice, activeAdviceTab, setActiveAdviceTab }) => {
  return (
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
        {expertAdvice?.conclusion && (
          <div className={`alert-banner ${expertAdvice.warning_level || 'normal'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: expertAdvice.warning_level === 'danger' ? 'var(--color-down)' : 'var(--color-warn)' }} />
              <span className="alert-title">{expertAdvice.conclusion.title || '市场状态研判中'}</span>
            </div>
            <p className="alert-desc">{expertAdvice.conclusion.description || '正在整合多维基本面数据...'}</p>
          </div>
        )}

        {/* Risk radar weight bar graphs */}
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
          {(['farmers', 'middle', 'traders'] as const).map(tab => (
            <button
              key={tab}
              className={`advice-tab-btn ${activeAdviceTab === tab ? 'active' : ''}`}
              onClick={() => setActiveAdviceTab(tab)}
            >
              {tab === 'farmers' ? '养殖户' : tab === 'middle' ? '屠宰厂' : '套保交易员'}
            </button>
          ))}
        </div>

        <div className="advice-content">
          {expertAdvice?.advice?.[activeAdviceTab] ? (
            <>
              <div className="advice-action-header">
                推荐策略: {expertAdvice.advice[activeAdviceTab].action || '观望'}
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
