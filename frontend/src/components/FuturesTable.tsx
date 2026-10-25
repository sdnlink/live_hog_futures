import React from 'react';
import { LineChart as ChartIcon, Flame } from 'lucide-react';
import type { FuturesQuote } from '../types';

interface FuturesTableProps {
  quotes: FuturesQuote[];
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
  spotPrice?: number;
}

const FuturesTable: React.FC<FuturesTableProps> = ({ quotes, selectedSymbol, onSymbolSelect, spotPrice = 15.4 }) => {
  const activeQuote = quotes.find(q => q.symbol === selectedSymbol) || quotes.find(q => q.symbol === 'LH0');

  // Find max open interest to identify primary contract
  const maxOI = React.useMemo(() => {
    return Math.max(...quotes.map(q => q.open_interest || 0), 1);
  }, [quotes]);

  return (
    <article className="glass-panel" style={{ padding: '16px' }}>
      <div className="panel-title-bar">
        <div className="panel-title">
          <ChartIcon size={18} />
          <span>大商所生猪合约</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DCE LH Quotes</span>
      </div>

      <div className="contract-list">
        {quotes.map((q) => {
          const priceChange = q.last_price - q.yesterday_close;
          const priceChangePct = q.yesterday_close > 0 ? (priceChange / q.yesterday_close) * 100 : 0;
          const isUp = priceChange >= 0;
          
          const basisVal = Math.round(spotPrice * 1000 - q.last_price);
          const isPrimary = q.symbol === 'LH0' || q.open_interest === maxOI;

          // Objective basis structure description
          let tendTag = { label: '基差平水', color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.06)' };
          if (basisVal > 1200) {
            tendTag = { label: '深度贴水', color: 'var(--color-up)', bg: 'rgba(34, 197, 94, 0.12)' };
          } else if (basisVal > 0) {
            tendTag = { label: '小幅贴水', color: 'var(--color-up)', bg: 'rgba(34, 197, 94, 0.08)' };
          } else if (basisVal < -1800) {
            tendTag = { label: '高升水结构', color: 'var(--color-down)', bg: 'rgba(239, 68, 68, 0.12)' };
          } else if (basisVal < -600) {
            tendTag = { label: '小幅升水', color: 'var(--color-warn)', bg: 'rgba(234, 179, 8, 0.12)' };
          }

          return (
            <div
              key={q.symbol}
              className={`contract-row ${selectedSymbol === q.symbol ? 'selected' : ''}`}
              onClick={() => onSymbolSelect(q.symbol)}
            >
              <div className="contract-symbol-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="contract-symbol mono">{q.symbol}</span>
                  {isPrimary && (
                    <span className="primary-contract-tag">
                      <Flame size={10} /> 主力
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span className="contract-name">{q.name}</span>
                  <span 
                    className="contract-tendency-pill" 
                    style={{ color: tendTag.color, backgroundColor: tendTag.bg }}
                  >
                    {tendTag.label}
                  </span>
                </div>
              </div>

              <div className="contract-price-box">
                <span className="contract-price mono" style={{ color: isUp ? 'var(--color-up)' : 'var(--color-down)' }}>
                  {Math.round(q.last_price)}
                </span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                  <span className={`contract-change mono ${isUp ? 'up' : 'down'}`}>
                    {isUp ? '+' : ''}{priceChangePct.toFixed(2)}%
                  </span>
                  <span className="contract-basis-text mono" title="相对现货基差 (现货-期货)">
                    基差 {basisVal > 0 ? `+${basisVal}` : basisVal}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeQuote && (
        <div style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '10px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>最高价 / 最低价:</span>
            <span className="mono">{Math.round(activeQuote.high)} / {Math.round(activeQuote.low)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>今开盘 / 昨结算:</span>
            <span className="mono">{Math.round(activeQuote.open)} / {Math.round(activeQuote.yesterday_settle)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>成交量 / 持仓量:</span>
            <span className="mono">{activeQuote.volume.toLocaleString()} / {activeQuote.open_interest.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>更新时刻:</span>
            <span className="mono">{activeQuote.time}</span>
          </div>
        </div>
      )}
    </article>
  );
};

export default FuturesTable;
