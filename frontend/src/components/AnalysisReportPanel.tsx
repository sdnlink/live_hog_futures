import React from 'react';
import { 
  FileText, Shield, AlertTriangle, TrendingUp, Zap, 
  Activity, Calendar, ShieldCheck, DollarSign, 
  Eye, RefreshCw, Award
} from 'lucide-react';
import type { AnalysisReportResponse, DimensionDetail } from '../types';

interface AnalysisReportPanelProps {
  reportData: AnalysisReportResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const AnalysisReportPanel: React.FC<AnalysisReportPanelProps> = ({ reportData, isLoading, onRefresh }) => {
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>正在生成深度基本面综合决策报告...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={styles.emptyContainer}>
        <AlertTriangle size={48} style={{ color: 'var(--color-warn)', marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>未获取到决策报告数据</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px', marginBottom: '20px' }}>
          可能由于后台接口尚未完成初始化或数据抓取中，请尝试手动刷新。
        </p>
        <button className="tab-btn active" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} />
          <span>立即获取数据</span>
        </button>
      </div>
    );
  }

  const { summary, dimensions, swot, narrative } = reportData;

  // Gauge details
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (summary.composite_index || 0)) / 100;

  // Helper for status classes
  const getStatusColor = (score: number, isInverse: boolean = false) => {
    // isInverse = true means lower score is better (supply and disease are better when low/controlled)
    const normalizedVal = isInverse ? 100 - score : score;
    if (normalizedVal >= 60) return 'var(--color-up)';
    if (normalizedVal >= 40) return 'var(--color-warn)';
    return 'var(--color-down)';
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'var(--color-down)';
      case 'medium': return 'var(--color-warn)';
      default: return 'var(--color-up)';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return '高风险警告';
      case 'medium': return '中度预警';
      default: return '低风险安全';
    }
  };

  return (
    <div style={styles.container}>
      {/* Premium Header Summary Card */}
      <div className="glass-panel" style={styles.headerCard}>
        <div style={styles.headerLayout}>
          <div style={styles.headerLeft}>
            <div style={styles.titleRow}>
              <Award size={24} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }} className="title-gradient">
                生猪基本面综合决策研判报告
              </h2>
              <span style={styles.dateTag}>
                <Calendar size={12} />
                <span>{summary.update_date} 发布</span>
              </span>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <div style={styles.phaseLabel}>当前周期所处阶段</div>
              <div style={styles.phaseValue}>{summary.market_phase}</div>
            </div>

            <div style={styles.metaRow}>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>偏多权重占比</span>
                <span style={{ ...styles.metaVal, color: getStatusColor(summary.composite_index) }}>
                  {summary.composite_index}%
                </span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>综合风险评定</span>
                <span style={{ ...styles.metaVal, color: getRiskColor(summary.risk_level) }}>
                  {getRiskLabel(summary.risk_level)}
                </span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>期货入手研判</span>
                <span style={{
                  ...styles.metaVal,
                  color: summary.composite_index >= 60 ? 'var(--color-up)' : summary.composite_index <= 40 ? 'var(--color-down)' : 'var(--color-warn)',
                  fontWeight: 700
                }}>
                  {summary.composite_index >= 65 ? '🟢 强烈看多·逢低买' :
                   summary.composite_index >= 50 ? '🟢 偏多配置·顺势吸' :
                   summary.composite_index <= 35 ? '🔴 强烈看空·逢高套' :
                   '🟡 中性观望·等待收敛'}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            {/* SVG Circular Gauge */}
            <div style={styles.gaugeWrapper}>
              <svg width="150" height="150" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={strokeWidth}
                />
                {/* Active Colored Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="url(#gauge-gradient)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
                <defs>
                  <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-accent)" />
                    <stop offset="50%" stopColor="var(--color-up)" />
                    <stop offset="100%" stopColor="var(--color-warn)" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={styles.gaugeTextContainer}>
                <span style={styles.gaugeNumber}>{summary.composite_index}</span>
                <span style={styles.gaugeSub}>多空得分</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of SWOT Analysis Matrix & Core Dimensions */}
      <div style={styles.gridContainer}>
        {/* SWOT Card Matrix (Left Block) */}
        <div className="glass-panel" style={styles.swotCard}>
          <div className="panel-title-bar" style={{ marginBottom: '16px' }}>
            <div className="panel-title">
              <FileText size={18} />
              <span>多维验证 SWOT 决策矩阵</span>
            </div>
          </div>
          
          <div style={styles.swotGrid}>
            {/* STRENGTHS */}
            <div style={{ ...styles.swotQuadrant, borderLeft: '3px solid var(--color-up)' }}>
              <div style={styles.swotQuadrantTitle}>
                <Shield size={16} style={{ color: 'var(--color-up)' }} />
                <span style={{ color: 'var(--color-up)' }}>优势 (Strengths)</span>
              </div>
              <ul style={styles.swotList}>
                {swot.strengths.map((s, idx) => (
                  <li key={idx} style={styles.swotListItem}>{s}</li>
                ))}
              </ul>
            </div>

            {/* WEAKNESSES */}
            <div style={{ ...styles.swotQuadrant, borderLeft: '3px solid var(--color-down)' }}>
              <div style={styles.swotQuadrantTitle}>
                <AlertTriangle size={16} style={{ color: 'var(--color-down)' }} />
                <span style={{ color: 'var(--color-down)' }}>劣势 (Weaknesses)</span>
              </div>
              <ul style={styles.swotList}>
                {swot.weaknesses.map((w, idx) => (
                  <li key={idx} style={styles.swotListItem}>{w}</li>
                ))}
              </ul>
            </div>

            {/* OPPORTUNITIES */}
            <div style={{ ...styles.swotQuadrant, borderLeft: '3px solid var(--color-accent)' }}>
              <div style={styles.swotQuadrantTitle}>
                <TrendingUp size={16} style={{ color: 'var(--color-accent)' }} />
                <span style={{ color: 'var(--color-accent)' }}>机遇 (Opportunities)</span>
              </div>
              <ul style={styles.swotList}>
                {swot.opportunities.map((o, idx) => (
                  <li key={idx} style={styles.swotListItem}>{o}</li>
                ))}
              </ul>
            </div>

            {/* THREATS */}
            <div style={{ ...styles.swotQuadrant, borderLeft: '3px solid #a855f7' }}>
              <div style={styles.swotQuadrantTitle}>
                <Zap size={16} style={{ color: '#a855f7' }} />
                <span style={{ color: '#a855f7' }}>威胁 (Threats)</span>
              </div>
              <ul style={styles.swotList}>
                {swot.threats.map((t, idx) => (
                  <li key={idx} style={styles.swotListItem}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Core Fundamental Dimensions (Right Block) */}
        <div className="glass-panel" style={styles.dimensionsCard}>
          <div className="panel-title-bar" style={{ marginBottom: '16px' }}>
            <div className="panel-title">
              <Activity size={18} />
              <span>六大基本面核心维度指标</span>
            </div>
          </div>

          <div style={styles.dimensionsList}>
            {(Object.entries(dimensions) as [string, DimensionDetail][]).map(([key, dim]) => {
              // Custom config for colors & translation
              let cnName = '';
              let barColor = 'var(--color-accent)';
              let isInverse = false; // higher is better by default

              switch (key) {
                case 'supply':
                  cnName = '能繁与后备供给';
                  barColor = 'var(--color-accent)';
                  isInverse = true; // lower inventory is bullish (upward trend)
                  break;
                case 'demand':
                  cnName = '白条与屠宰需求';
                  barColor = 'var(--color-up)';
                  break;
                case 'profit':
                  cnName = '养殖头均利润';
                  barColor = 'var(--color-warn)';
                  break;
                case 'speculation':
                  cnName = '出栏均重与压栏';
                  barColor = '#f43f5e'; // rose/pink
                  isInverse = true; // lower speculation/weight is healthier
                  break;
                case 'sentiment':
                  cnName = '社交与舆情挺价';
                  barColor = '#06b6d4'; // cyan
                  break;
                case 'disease':
                  cnName = '动物疫病与死亡率';
                  barColor = 'var(--color-down)';
                  isInverse = true; // lower disease index is healthier/bullish
                  break;
                default:
                  cnName = key;
              }

              const statusColor = getStatusColor(dim.score, isInverse);

              return (
                <div key={key} style={styles.dimensionRow}>
                  <div style={styles.dimensionMeta}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={styles.dimensionName}>{cnName}</span>
                      <span style={{ ...styles.dimensionStatus, border: `1px solid ${statusColor}`, color: statusColor }}>
                        {dim.status}
                      </span>
                    </div>
                    <span style={{ ...styles.dimensionScore, color: statusColor }}>{dim.score}分</span>
                  </div>

                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${dim.score}%`, backgroundColor: barColor }}></div>
                  </div>

                  <p style={styles.dimensionDesc}>{dim.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Terminal Monospace Narrative Section */}
      <div className="glass-panel" style={styles.narrativePanel}>
        <div style={styles.terminalHeader}>
          <div style={styles.terminalDots}>
            <span style={{ ...styles.dot, backgroundColor: '#ff5f56' }}></span>
            <span style={{ ...styles.dot, backgroundColor: '#ffbd2e' }}></span>
            <span style={{ ...styles.dot, backgroundColor: '#27c93f' }}></span>
          </div>
          <span style={styles.terminalTitle}>EXECUTIVE SUMMARY REPORT - RAW TERMINAL DATA</span>
        </div>
        <div style={styles.terminalContent}>
          {narrative.split('\n\n').map((para, idx) => (
            <p key={idx} style={{ marginBottom: '14px', lineHeight: '1.6' }}>{para}</p>
          ))}
        </div>
      </div>

      {/* Participant Practical Guides */}
      <div style={styles.guideContainer}>
        {/* Farmers */}
        <div className="glass-panel" style={styles.guideCard}>
          <div style={styles.guideHeader}>
            <ShieldCheck size={20} style={{ color: 'var(--color-up)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>上游养殖户操作指南</h3>
          </div>
          <div style={styles.guideActionRow}>
            <span style={styles.actionLabel}>当前推荐：</span>
            <span style={{ ...styles.actionVal, color: 'var(--color-up)' }}>顺势出栏，控制体重</span>
          </div>
          <ul style={styles.guideList}>
            <li>避免盲目跟风压栏或二次育肥，保持合理出栏体重在 120-125kg 之间。</li>
            <li>分批有序淘汰胎龄高、产仔率低的低效能繁母猪，优化核心基础群结构。</li>
            <li>加强栏舍消杀与防暑防病管理，提前做好夏秋交替期病毒性腹泻免疫工作。</li>
          </ul>
        </div>

        {/* Middle Traders */}
        <div className="glass-panel" style={styles.guideCard}>
          <div style={styles.guideHeader}>
            <Eye size={20} style={{ color: 'var(--color-warn)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>中游贸易与屠宰厂指南</h3>
          </div>
          <div style={styles.guideActionRow}>
            <span style={styles.actionLabel}>当前推荐：</span>
            <span style={{ ...styles.actionVal, color: 'var(--color-warn)' }}>低库存运转，防范跌价</span>
          </div>
          <ul style={styles.guideList}>
            <li>屠宰毛利受到压制，建议维持‘随杀随销’模式，成品库存控制在 3 天以内。</li>
            <li>关注产销价差，当川豫价差超过 0.8 元/公斤时，可加大北猪南运跨省调配力度。</li>
            <li>在周期拐点明确前，切勿盲目进行大规模冻猪肉分割入库建仓。</li>
          </ul>
        </div>

        {/* Futures Traders */}
        <div className="glass-panel" style={styles.guideCard}>
          <div style={styles.guideHeader}>
            <DollarSign size={20} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>期货套保与策略交易员</h3>
          </div>
          <div style={styles.guideActionRow}>
            <span style={styles.actionLabel}>当前推荐：</span>
            <span style={{ ...styles.actionVal, color: 'var(--color-accent)' }}>基差交易，逢高卖保</span>
          </div>
          <ul style={styles.guideList}>
            <li>盘面受现货持续下探拖累，处于单边寻底通道，严禁左侧盲目逆势接飞刀，切忌在现货止跌前盲目抄底。</li>
            <li>基差处于升水承压结构，养殖企业宜把握盘面反弹窗口建立卖出套保头寸，锁定出栏亏损敞口。</li>
            <li>短线关注期现货价差收敛进程，交割月前基差将快速向现货靠拢，重点防范惯性下杀与交割贴水风险。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    padding: '2px 0 20px 0',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    background: 'var(--panel-bg)',
    borderRadius: '16px',
    border: '1px solid var(--panel-border)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.06)',
    borderTop: '3px solid var(--color-accent)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    background: 'var(--panel-bg)',
    borderRadius: '16px',
    border: '1px solid var(--panel-border)',
    textAlign: 'center' as const,
  },
  headerCard: {
    background: 'linear-gradient(135deg, rgba(21, 30, 54, 0.75) 0%, rgba(11, 15, 25, 0.85) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
  },
  headerLayout: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '24px',
  },
  headerLeft: {
    flex: '1 1 500px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  dateTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  phaseLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  phaseValue: {
    fontSize: '1.4rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginTop: '4px',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  metaRow: {
    display: 'flex',
    gap: '32px',
    marginTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '16px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  metaLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  metaVal: {
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  headerRight: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '180px',
  },
  gaugeWrapper: {
    position: 'relative' as const,
    width: '150px',
    height: '150px',
  },
  gaugeTextContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeNumber: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#ffffff',
    lineHeight: '1',
  },
  gaugeSub: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  swotCard: {
    padding: '20px',
  },
  swotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginTop: '8px',
  },
  swotQuadrant: {
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    transition: 'transform 0.2s ease',
  },
  swotQuadrantTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '10px',
  },
  swotList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  swotListItem: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '8px',
    paddingLeft: '10px',
    position: 'relative' as const,
    ':before': {
      content: '"•"',
      position: 'absolute' as const,
      left: 0,
      color: 'var(--text-muted)',
    }
  },
  dimensionsCard: {
    padding: '20px',
  },
  dimensionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginTop: '8px',
  },
  dimensionRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '10px',
  },
  dimensionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimensionName: {
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  dimensionStatus: {
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  dimensionScore: {
    fontSize: '0.9rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.8s ease-in-out',
  },
  dimensionDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
    marginTop: '2px',
  },
  narrativePanel: {
    padding: '0px',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  terminalHeader: {
    background: 'rgba(15, 23, 42, 0.6)',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  terminalDots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  terminalTitle: {
    fontSize: '0.7rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    letterSpacing: '1px',
  },
  terminalContent: {
    background: 'rgba(5, 8, 16, 0.65)',
    padding: '20px 24px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    color: '#38bdf8', // terminal light blue/cyan
    maxHeight: '400px',
    overflowY: 'auto' as const,
  },
  guideContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  guideCard: {
    padding: '20px',
    transition: 'transform 0.3s ease',
  },
  guideHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '12px',
  },
  guideActionRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.85rem',
    margin: '12px 0',
  },
  actionLabel: {
    color: 'var(--text-muted)',
  },
  actionVal: {
    fontWeight: 600,
  },
  guideList: {
    paddingLeft: '16px',
    margin: 0,
  },
  guideListItem: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '8px',
  }
};

export default AnalysisReportPanel;
