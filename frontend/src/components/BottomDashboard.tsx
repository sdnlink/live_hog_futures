import React from 'react';
import { Map, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import type { ProvincialPrice, EpidemicReport, SentimentIndex } from '../types';

interface BottomDashboardProps {
  provPrices: ProvincialPrice[];
  epidemicReports: EpidemicReport[];
  sentimentIndex: SentimentIndex[];
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem' }}>{label}</p>
        {payload.map((item: any, idx: number) => (
          <p key={idx} style={{ color: item.color || item.stroke, fontSize: '0.8rem', margin: '2px 0' }}>
            {item.name}: {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BottomDashboard: React.FC<BottomDashboardProps> = ({ provPrices, epidemicReports, sentimentIndex }) => {
  const sortedProvPrices = [...provPrices].sort((a, b) => b.price - a.price);

  return (
    <section className="dashboard-bottom-grid">
      {/* Left Column: Provincial Hog Prices Ranking */}
      <article className="glass-panel" style={{ padding: '16px' }}>
        <div className="panel-title-bar">
          <div className="panel-title">
            <Map size={18} />
            <span>全国重点省份现货排名 (CNY/kg)</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Regional Spreads</span>
        </div>

        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedProvPrices.slice(0, 12)}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={10} domain={[10, 20]} />
              <YAxis type="category" dataKey="province" stroke="var(--text-primary)" fontSize={10} width={40} />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar
                name="出栏价"
                dataKey="price"
                fill="var(--color-accent)"
                radius={[0, 4, 4, 0]}
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      {/* Right Column: Epidemic Alerts & Sentiment Index */}
      <article className="glass-panel" style={{ padding: '16px' }}>
        <div className="panel-title-bar">
          <div className="panel-title">
            <FileText size={18} />
            <span>官方疫情通报与舆情监控</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disease alerts</span>
        </div>

        <div className="epidemic-feed">
          {epidemicReports.map((report, idx) => (
            <div key={idx} className="epidemic-item">
              <div className="epidemic-item-header">
                <span className="epidemic-title">{report.title}</span>
                <span className="epidemic-date mono">{report.date}</span>
              </div>
              <p className="epidemic-body">{report.content}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>来源: {report.source}</span>
                <span style={{ color: report.level === 'warning' ? 'var(--color-warn)' : 'var(--color-accent)' }}>
                  级别: {report.level.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="sentiment-grid">
          {sentimentIndex.map((item, idx) => {
            const isHigh = item.sentiment_score > 50;
            const isMedium = item.sentiment_score > 25 && item.sentiment_score <= 50;
            const scoreClass = isHigh ? 'high' : isMedium ? 'medium' : 'low';

            return (
              <div key={idx} className="sentiment-badge">
                <span className="sentiment-kw">{item.keyword}</span>
                <div style={{ textAlign: 'right' }}>
                  <span className={`sentiment-score ${scoreClass} mono`}>{item.sentiment_score}%</span>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>热度频次: {item.frequency}</div>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
};

export default BottomDashboard;
