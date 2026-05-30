import React, { useState, useMemo } from 'react';
import { Map, FileText, TrendingUp as StockIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line, Legend } from 'recharts';
import type { ProvincialPrice, EpidemicReport, SentimentIndex, StockKline, StockQuote } from '../types';
import StockTable from './StockTable';

interface BottomDashboardProps {
  provPrices: ProvincialPrice[];
  epidemicReports: EpidemicReport[];
  sentimentIndex: SentimentIndex[];
  stockData: StockKline[];
  stockQuotes: StockQuote[];
  isFullPage?: boolean;
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

const BottomDashboard: React.FC<BottomDashboardProps> = ({ provPrices, epidemicReports, sentimentIndex, stockData, stockQuotes, isFullPage = false }) => {
  const [stockTimeRange, setStockTimeRange] = useState<'30d' | '90d' | '180d' | '365d' | 'all'>('365d');
  const sortedProvPrices = [...provPrices].sort((a, b) => b.price - a.price);

  // Calculate historical highest price and date for each company
  const historicalHighs = useMemo(() => {
    const highs: { [name: string]: { price: number; date: string } } = {};
    stockData.forEach(item => {
      const currentHigh = highs[item.name];
      if (item.high && (!currentHigh || item.high > currentHigh.price)) {
        highs[item.name] = { price: item.high, date: item.date };
      }
    });
    return highs;
  }, [stockData]);

  // Group and sort stock data by date for plotting (Memoized for performance)
  const transformedStockData = useMemo(() => {
    const dateMap: { [date: string]: any } = {};
    stockData.forEach(item => {
      if (!dateMap[item.date]) {
        dateMap[item.date] = { date: item.date };
      }
      dateMap[item.date][item.name] = item.close;
    });
    return Object.values(dateMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [stockData]);
  
  // Filter stock data based on selected time range (Memoized for performance)
  const filteredStockData = useMemo(() => {
    if (stockTimeRange === 'all' || !transformedStockData || !transformedStockData.length) return transformedStockData;
    const daysMap = { '30d': 30, '90d': 90, '180d': 180, '365d': 365 };
    const limitDays = daysMap[stockTimeRange as keyof typeof daysMap] || 365;
    const latestDate = new Date(transformedStockData[transformedStockData.length - 1].date);
    const cutoffDate = new Date(latestDate);
    cutoffDate.setDate(cutoffDate.getDate() - limitDays);
    return transformedStockData.filter(item => new Date(item.date) >= cutoffDate);
  }, [transformedStockData, stockTimeRange]);

  // Memoize stock names to avoid array mapping on every render
  const stockNames = useMemo(() => {
    return Array.from(new Set(stockData.map(s => s.name)));
  }, [stockData]);
  
  const stockColors: { [name: string]: string } = {
    '牧原股份': 'var(--color-up)',
    '温氏股份': 'var(--color-accent)',
    '新希望': 'var(--color-warn)',
    '正邦科技': '#e91e63',
    '天邦食品': '#9c27b0',
    '唐人神': '#00bcd4',
    '巨星农牧': '#ff9800'
  };

  if (isFullPage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top: Hog Listed Companies Stock Price Trends (Full Width) */}
        <article className="glass-panel" style={{ padding: '16px' }}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <StockIcon size={18} style={{ color: 'var(--color-accent)' }} />
              <span>上市公司股票走势对比 (日K·前复权)</span>
            </div>
            <div className="time-range-selector">
              {(['30d', '90d', '180d', '365d', 'all'] as const).map(range => (
                <button key={range} onClick={() => setStockTimeRange(range)} className={stockTimeRange === range ? 'active' : ''}>
                  {range === 'all' ? '全部' : range === '365d' ? '最近一年' : `${range.slice(0, -1)}天`}
                </button>
              ))}
            </div>
          </div>

          {/* Historical Highs Summary Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', padding: '10px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '14px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>历史最高价(前复权)：</span>
            {stockNames.map(name => {
              const highInfo = historicalHighs[name];
              if (!highInfo) return null;
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '4px 10px', borderRadius: '4px', borderLeft: `3px solid ${stockColors[name] || '#ffffff'}` }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>{name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-up)', fontFamily: 'monospace' }}>{highInfo.price.toFixed(2)}元</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({highInfo.date})</span>
                </div>
              );
            })}
          </div>

          <div style={{ height: '400px', marginTop: '12px' }}>
            {filteredStockData.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                暂无股票走势数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredStockData}
                  margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={9} />
                  <YAxis stroke="var(--text-muted)" domain={['dataMin - 1', 'dataMax + 1']} fontSize={9} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '0.65rem' }} />
                  {stockNames.map(name => (
                    <Line
                      key={name}
                      name={name}
                      type="monotone"
                      dataKey={name}
                      stroke={stockColors[name] || '#ffffff'}
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        {/* Bottom: 3-column layout */}
        <section className="dashboard-bottom-grid">
          {/* Column 1: Provincial Hog Prices Ranking */}
          <article className="glass-panel" style={{ padding: '16px' }}>
            <div className="panel-title-bar">
              <div className="panel-title">
                <Map size={18} />
                <span>全国重点省份现货排名 (CNY/kg)</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Regional Spreads</span>
            </div>

            <div style={{ height: '360px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedProvPrices.slice(0, 15)}
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

          {/* Column 2: Epidemic Alerts & Sentiment Index */}
          <article className="glass-panel" style={{ padding: '16px' }}>
            <div className="panel-title-bar">
              <div className="panel-title">
                <FileText size={18} />
                <span>官方疫情通报与舆情监控</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disease alerts</span>
            </div>

            <div className="epidemic-feed" style={{ maxHeight: '220px' }}>
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

          {/* Column 3: Listed Hog Breeding Companies (StockTable) */}
          <StockTable stockQuotes={stockQuotes} style={{ marginTop: 0 }} />
        </section>
      </div>
    );
  }

  // Original fallback render (for bottom dashboard if isFullPage is false)
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
              data={sortedProvPrices.slice(0, 15)}
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

      {/* Middle Column: Epidemic Alerts & Sentiment Index */}
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

      {/* Right Column: Hog Listed Companies Stock Price Trends */}
      <article className="glass-panel" style={{ padding: '16px' }}>
        <div className="panel-title-bar">
          <div className="panel-title">
            <StockIcon size={18} style={{ color: 'var(--color-accent)' }} />
            <span>上市公司股票走势对比 (日K·前复权)</span>
          </div>
          <div className="time-range-selector">
            {(['30d', '90d', '180d', '365d', 'all'] as const).map(range => (
              <button key={range} onClick={() => setStockTimeRange(range)} className={stockTimeRange === range ? 'active' : ''}>
                {range === 'all' ? '全部' : range === '365d' ? '最近一年' : `${range.slice(0, -1)}天`}
              </button>
            ))}
          </div>
        </div>

        {/* Historical Highs Summary Row (Mini) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>历史最高：</span>
          {stockNames.map(name => {
            const highInfo = historicalHighs[name];
            if (!highInfo) return null;
            return (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.01)', padding: '2px 6px', borderRadius: '3px', borderLeft: `2px solid ${stockColors[name] || '#ffffff'}` }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>{name}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-up)', fontFamily: 'monospace' }}>{highInfo.price.toFixed(2)}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>({highInfo.date.slice(2)})</span>
              </div>
            );
          })}
        </div>

        <div style={{ height: '240px' }}>
          {filteredStockData.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              暂无股票走势数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredStockData}
                margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={9} />
                <YAxis stroke="var(--text-muted)" domain={['dataMin - 1', 'dataMax + 1']} fontSize={9} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '0.65rem' }} />
                {stockNames.map(name => (
                  <Line
                    key={name}
                    name={name}
                    type="monotone"
                    dataKey={name}
                    stroke={stockColors[name] || '#ffffff'}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>
    </section>
  );
};

export default BottomDashboard;
