import React from 'react';
import { LineChart as ChartIcon } from 'lucide-react';
import type { FuturesQuote } from '../types';

interface FuturesTableProps {
  quotes: FuturesQuote[];
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
}

const FuturesTable: React.FC<FuturesTableProps> = ({ quotes, selectedSymbol, onSymbolSelect }) => {
  const activeQuote = quotes.find(q => q.symbol === selectedSymbol) || quotes.find(q => q.symbol === 'LH0');

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

          return (
            <div
              key={q.symbol}
              className={`contract-row ${selectedSymbol === q.symbol ? 'selected' : ''}`}
              onClick={() => onSymbolSelect(q.symbol)}
            >
              <div className="contract-symbol-box">
                <span className="contract-symbol mono">{q.symbol}</span>
                <span className="contract-name">{q.name}</span>
              </div>
              <div className="contract-price-box">
                <span className="contract-price mono" style={{ color: isUp ? 'var(--color-up)' : 'var(--color-down)' }}>
                  {Math.round(q.last_price)}
                </span>
                <span className={`contract-change mono ${isUp ? 'up' : 'down'}`}>
                  {isUp ? '+' : ''}{priceChangePct.toFixed(2)}%
                </span>
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
