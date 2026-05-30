import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, Cell, ReferenceLine
} from 'recharts';
import type { YijingForecast } from '../types';

interface YijingPanelProps {
  yijingForecast: YijingForecast | null;
  isYijingLoading: boolean;
  fetchYijingForecast: () => void;
}

const TRIGRAM_LINES: Record<number, boolean[]> = {
  0: [true,  true,  true],
  1: [false, true,  true],
  2: [true,  false, true],
  3: [true,  true,  false],
  4: [false, false, true],
  5: [false, true,  false],
  6: [true,  false, false],
  7: [false, false, false],
};

const MiniGuaSymbol: React.FC<{ upperIdx: number; lowerIdx: number }> = ({ upperIdx, lowerIdx }) => {
  const renderTrigram = (idx: number) => {
    const lines = TRIGRAM_LINES[idx] || [false, false, false];
    return (
      <div className="mini-trigram">
        {[...lines].reverse().map((yang, i) => (
          <div key={i} className={`mini-line ${yang ? 'yang' : 'yin'}`}>
            {yang ? (
              <div className="mini-yang-bar" />
            ) : (
              <>
                <div className="mini-yin-bar" />
                <div className="mini-yin-gap" />
                <div className="mini-yin-bar" />
              </>
            )}
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className="mini-gua-symbol">
      {renderTrigram(upperIdx)}
      <div className="mini-gua-divider" />
      {renderTrigram(lowerIdx)}
    </div>
  );
};

const YijingPanel: React.FC<YijingPanelProps> = ({ yijingForecast, isYijingLoading, fetchYijingForecast }) => {
  // 五行能量对比计算
  const getWuxingData = () => {
    if (!yijingForecast) return [];
    const elements = ['金', '木', '水', '火', '土'];
    const elementLabels: Record<string, string> = {
      '金': '金 (收敛)',
      '木': '木 (生长)',
      '水': '水 (流通)',
      '火': '火 (热烈)',
      '土': '土 (整固)',
    };
    const baguaElements = ['金', '金', '火', '木', '木', '水', '土', '土']; // 乾1兑2离3震4巽5坎6艮7坤8
    const counts: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
    const addCount = (idx: number | undefined) => {
      if (idx !== undefined && idx >= 0 && idx < 8) {
        const elem = baguaElements[idx];
        counts[elem] = (counts[elem] || 0) + 1;
      }
    };
    addCount(yijingForecast.meihua?.upper_idx);
    addCount(yijingForecast.meihua?.lower_idx);
    addCount(yijingForecast.meihua?.hu_upper_idx);
    addCount(yijingForecast.meihua?.hu_lower_idx);
    addCount(yijingForecast.meihua?.bian_upper_idx);
    addCount(yijingForecast.meihua?.bian_lower_idx);

    return elements.map(elem => {
      let score = 20 + counts[elem] * 20;
      if (elem === yijingForecast.meihua?.ti_element) score += 25;
      if (elem === yijingForecast.meihua?.yong_element) score += 15;
      return {
        subject: elementLabels[elem],
        '能量': score,
      };
    });
  };

  // 六爻卦气动能计算
  const getLiuyaoChartData = () => {
    if (!yijingForecast || !yijingForecast.liuyao?.yao_render) return [];
    const yaoRender = [...yijingForecast.liuyao.yao_render].reverse();
    const shiYao = yijingForecast.liuyao.shi_yao;
    const yingYao = yijingForecast.liuyao.ying_yao;

    return yaoRender.map(yao => {
      const pos = yao.pos;
      let energy = yao.yang ? 3.0 : -3.0;
      if (yao.dong) {
        energy = yao.yang ? 5.0 : -5.0;
      }
      let role = '';
      if (pos === shiYao) {
        role = ' (世)';
        energy += yao.yang ? 1.5 : -1.5;
      }
      if (pos === yingYao) {
        role = ' (应)';
        energy += yao.yang ? 1.0 : -1.0;
      }
      return {
        name: yao.label + '爻' + role,
        '卦气动能': parseFloat(energy.toFixed(1)),
        isDong: yao.dong,
        isYang: yao.yang,
      };
    });
  };
  return (
    <div className="yijing-panel">
      {isYijingLoading ? (
        <div className="yijing-loading">
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--color-jade)' }} />
          <p>天机推演中，请稍候…</p>
        </div>
      ) : yijingForecast ? (
        <>
          {/* 顶部综合判断栏 */}
          <div className="yijing-header-bar">
            <div className="yijing-title-block">
              <Sparkles size={16} style={{ color: 'var(--color-jade)' }} />
              <span className="yijing-main-title">六爻 · 梅花易数 交叉决策</span>
              <span className="yijing-timestamp mono">{yijingForecast.timestamp}</span>
            </div>
            <div className={`yijing-direction-badge ${yijingForecast.direction_class || 'neutral'}`}>
              {yijingForecast.direction}
              <span className="yijing-confidence">置信度 {(yijingForecast.confidence || 0).toFixed(0)}%</span>
            </div>
          </div>

          {/* 布局重构: 第一行 (梅花 | 六爻) | 第二行 (全宽折线图) */}
          <div className="yijing-layout-container">
            <div className="yijing-top-row">
              {/* ── 左：梅花易数 ── */}
              <div className="yijing-section meihua-box">
                <div className="yijing-section-title">☰ 梅花易数</div>
                {/* 卦图三合 */}
                <div className="meihua-trio">
                  {[{
                      label: '本卦', gua: yijingForecast.meihua?.ben_gua,
                      upper: yijingForecast.meihua?.upper_idx,
                      lower: yijingForecast.meihua?.lower_idx,
                      highlight: true,
                  }, {
                      label: '互卦', gua: yijingForecast.meihua?.hu_gua,
                      upper: yijingForecast.meihua?.hu_upper_idx,
                      lower: yijingForecast.meihua?.hu_lower_idx,
                      highlight: false,
                  }, {
                      label: '变卦', gua: yijingForecast.meihua?.bian_gua,
                      upper: yijingForecast.meihua?.bian_upper_idx,
                      lower: yijingForecast.meihua?.bian_lower_idx,
                      highlight: false,
                  }].map(item => (
                    <div key={item.label} className={`meihua-gua-card ${item.highlight ? 'highlight' : ''}`}>
                      <div className="meihua-gua-label">{item.label}</div>
                      <MiniGuaSymbol upperIdx={item.upper ?? 0} lowerIdx={item.lower ?? 0} />
                      <div className="meihua-gua-name">{item.gua}</div>
                    </div>
                  ))}
                </div>

                {/* 体用五行 */}
                <div className="meihua-tiyong">
                  <div className="tiyong-item">
                    <span className="tiyong-label">体卦</span>
                    <span className="tiyong-val">{yijingForecast.meihua?.ti_gua}</span>
                    <span className="tiyong-elem">{yijingForecast.meihua?.ti_element}</span>
                  </div>
                  <div className="tiyong-arrow">{(yijingForecast.meihua?.sheng_ke || 0) >= 0 ? '生↑' : '克↓'}</div>
                  <div className="tiyong-item">
                    <span className="tiyong-label">用卦</span>
                    <span className="tiyong-val">{yijingForecast.meihua?.yong_gua}</span>
                    <span className="tiyong-elem">{yijingForecast.meihua?.yong_element}</span>
                  </div>
                </div>
                <div className="meihua-shengke-bar">
                  <div
                    className={`meihua-shengke-fill ${(yijingForecast.meihua?.sheng_ke || 0) >= 0 ? 'positive' : 'negative'}`}
                    style={{ width: `${Math.min(100, Math.abs(yijingForecast.meihua?.sheng_ke || 0) / 3 * 100)}%` }}
                  />
                </div>
                
                {/* 五行气场能量对比雷达图 */}
                <div style={{ height: '160px', marginTop: '8px', marginBottom: '8px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getWuxingData()}>
                      <PolarGrid stroke="rgba(74, 222, 128, 0.15)" />
                      <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={9} />
                      <Radar name="五行气场" dataKey="能量" stroke="var(--color-jade)" fill="var(--color-jade)" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <p className="yijing-interp-text">{yijingForecast.interpretation?.meihua_summary}</p>
              </div>

              {/* ── 右：六爻纳甲 ── */}
              <div className="yijing-section liuyao-box">
                <div className="yijing-section-title">☵ 六爻纳甲</div>
                <div className="liuyao-gua-header">
                  <span className="liuyao-gua-name">{yijingForecast.liuyao?.ben_gua}</span>
                  <span className="liuyao-arrow">→</span>
                  <span className="liuyao-gua-name bian">{yijingForecast.liuyao?.bian_gua}</span>
                </div>
                {/* 爻线图 */}
                <div className="liuyao-lines">
                  {(yijingForecast.liuyao?.yao_render || []).map(yao => (
                    <div key={yao.pos} className={`liuyao-line-row ${yao.dong ? 'dong' : ''}`}>
                      <span className="liuyao-pos">{yao.label}爻</span>
                      <div className="liuyao-line-symbol">
                        {yao.yang ? (
                          <div className="yao-yang"><div className="yao-yang-bar" /></div>
                        ) : (
                          <div className="yao-yin">
                            <div className="yao-yin-bar" />
                            <div className="yao-yin-gap" />
                            <div className="yao-yin-bar" />
                          </div>
                        )}
                        {yao.dong && <span className="yao-dong-mark">●</span>}
                      </div>
                      <span className={`liuyao-nature ${yao.yang ? 'yang' : 'yin'}`}>
                        {yao.yang ? '阳' : '阴'}{yao.dong ? '动' : '静'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="liuyao-shi-ying">
                  <div className="shi-ying-item">
                    <span className="shi-ying-dot shi">世</span>
                    <span>{['初','二','三','四','五','上'][(yijingForecast.liuyao?.shi_yao || 1) - 1]}爻</span>
                  </div>
                  <div className="shi-ying-item">
                    <span className="shi-ying-dot ying">应</span>
                    <span>{['初','二','三','四','五','上'][Math.min((yijingForecast.liuyao?.ying_yao || 1) - 1, 5)]}爻</span>
                  </div>
                </div>

                {/* 六爻爻位能量与世应多空分布图 */}
                <div style={{ height: '160px', marginTop: '8px', marginBottom: '8px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getLiuyaoChartData()}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={9} domain={[-8, 8]} />
                      <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" fontSize={9} width={50} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                        itemStyle={{ fontSize: '10px' }}
                      />
                      <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                      <Bar dataKey="卦气动能" radius={[0, 3, 3, 0]} barSize={10}>
                        {getLiuyaoChartData().map((entry, index) => {
                          let fill = 'rgba(255,255,255,0.3)';
                          if (entry.isYang) {
                            fill = entry.isDong ? 'var(--color-gold)' : 'var(--color-jade)';
                          } else {
                            fill = entry.isDong ? 'var(--color-down)' : 'rgba(41, 121, 255, 0.6)';
                          }
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="yijing-interp-text">{yijingForecast.interpretation?.liuyao_summary}</p>
              </div>
            </div>

            {/* ── 下：期货价格预测走势图 ── */}
            <div className="yijing-bottom-row">
              <div className="yijing-section forecast-chart-box">
                <div className="yijing-section-title">📈 期货价格预测走势图</div>
                
                <div className="forecast-chart-container" style={{ height: '240px', marginTop: '10px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { name: '当前', price: yijingForecast.spot_price, hi: yijingForecast.spot_price, lo: yijingForecast.spot_price },
                        { name: '1日后', price: yijingForecast.forecast?.day1?.mid, hi: yijingForecast.forecast?.day1?.high, lo: yijingForecast.forecast?.day1?.low },
                        { name: '5日后', price: yijingForecast.forecast?.day5?.mid, hi: yijingForecast.forecast?.day5?.high, lo: yijingForecast.forecast?.day5?.low },
                        { name: '10日后', price: yijingForecast.forecast?.day10?.mid, hi: yijingForecast.forecast?.day10?.high, lo: yijingForecast.forecast?.day10?.low },
                      ]}
                      margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" domain={['auto', 'auto']} fontSize={11} unit="元" />
                      <Tooltip
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Line type="monotone" name="预测中值" dataKey="price" stroke="var(--color-jade)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-jade)' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="上限" dataKey="hi" stroke="var(--color-up)" strokeDasharray="5 5" strokeWidth={1} dot={false} />
                      <Line type="monotone" name="下限" dataKey="lo" stroke="var(--color-down)" strokeDasharray="5 5" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="forecast-summary-footer">
                  <div className="yijing-quant-bridge-inline">
                    <div className="quant-score-tag">
                      <span>梅花得分:</span>
                      <span className="mono">{(yijingForecast.meihua?.score || 0).toFixed(1)}</span>
                    </div>
                    <div className="quant-score-tag">
                      <span>六爻得分:</span>
                      <span className="mono">{(yijingForecast.liuyao?.score || 0).toFixed(1)}</span>
                    </div>
                    <div className="quant-score-tag">
                      <span>量化修正:</span>
                      <span className="mono">{(yijingForecast.quant_score || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="yijing-interp-text conclusion-inline">{yijingForecast.interpretation?.conclusion}</p>
                  <button
                    className="yijing-refresh-btn-small"
                    onClick={fetchYijingForecast}
                    disabled={isYijingLoading}
                  >
                    <RefreshCw size={12} className={isYijingLoading ? 'animate-spin' : ''} />
                    重新起卦
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="yijing-loading">
          <p style={{ color: 'var(--text-muted)' }}>暂无卦象数据，点击「重新起卦」</p>
          <button className="yijing-refresh-btn" onClick={fetchYijingForecast}>起 卦</button>
        </div>
      )}
    </div>
  );
};

export default YijingPanel;
