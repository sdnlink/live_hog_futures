import React, { useState } from 'react';
import { TrendingUp as StockIcon } from 'lucide-react';
import type { StockQuote } from '../types';

interface StockTableProps {
  stockQuotes: StockQuote[];
  style?: React.CSSProperties;
}

const StockTable: React.FC<StockTableProps> = ({ stockQuotes, style }) => {
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('002714'); // Default to Muyuan

  const activeStock = stockQuotes.find(s => s.symbol === selectedStockSymbol) || stockQuotes[0];

  return (
    <article className="glass-panel" style={{ padding: '16px', marginTop: '16px', ...style }}>
      <div className="panel-title-bar">
        <div className="panel-title">
          <StockIcon size={18} style={{ color: 'var(--color-accent)' }} />
          <span>生猪板块上市公司</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>A-Share Stocks</span>
      </div>

      <div className="contract-list" style={{ maxHeight: '350px' }}>
        {stockQuotes.map((s) => {
          const priceChange = s.last_price - s.yesterday_close;
          const priceChangePct = s.yesterday_close > 0 ? (priceChange / s.yesterday_close) * 100 : 0;
          const isUp = priceChange >= 0;

          return (
            <div
              key={s.symbol}
              className={`contract-row ${selectedStockSymbol === s.symbol ? 'selected' : ''}`}
              onClick={() => setSelectedStockSymbol(s.symbol)}
              style={selectedStockSymbol === s.symbol ? { borderColor: 'rgba(74, 222, 128, 0.4)', background: 'rgba(74, 222, 128, 0.06)' } : undefined}
            >
              <div className="contract-symbol-box">
                <span className="contract-symbol mono">{s.symbol}</span>
                <span className="contract-name">{s.name}</span>
              </div>
              <div className="contract-price-box">
                <span className="contract-price mono" style={{ color: isUp ? 'var(--color-up)' : 'var(--color-down)' }}>
                  {s.last_price.toFixed(2)}
                </span>
                <span className={`contract-change mono ${isUp ? 'up' : 'down'}`} style={!isUp ? { background: 'rgba(255, 23, 68, 0.1)', color: 'var(--color-down)' } : undefined}>
                  {isUp ? '+' : ''}{priceChangePct.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {activeStock && (
        <div style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '10px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>最高价 / 最低价:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{activeStock.high.toFixed(2)} / {activeStock.low.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>今开盘 / 昨收盘:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{activeStock.open.toFixed(2)} / {activeStock.yesterday_close.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>成交量 / 成交额:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{(activeStock.volume / 10000).toFixed(1)}万股 / {(activeStock.amount / 100000000).toFixed(2)}亿元</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>更新时刻:</span>
            <span className="mono" style={{ color: 'var(--text-secondary)' }}>{activeStock.time}</span>
          </div>
        </div>
      )}
    </article>
  );
};

export default StockTable;
