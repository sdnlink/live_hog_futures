import React, { useState, useMemo } from 'react';
import { MapPin, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import type { ProvincialPrice, StockQuote } from '../types';

interface MiniSpotStockMonitorProps {
  provPrices: ProvincialPrice[];
  stockQuotes: StockQuote[];
  benchmarkSpot?: number;
}

export const MiniSpotStockMonitor: React.FC<MiniSpotStockMonitorProps> = ({
  provPrices,
  stockQuotes,
  benchmarkSpot = 9.40,
}) => {
  const [activeTab, setActiveTab] = useState<'spot' | 'stocks'>('spot');

  // 排序省份数据：按价格从高到低
  const sortedProvPrices = useMemo(() => {
    return [...provPrices].sort((a, b) => b.price - a.price);
  }, [provPrices]);

  // 计算股票涨跌幅
  const formattedStocks = useMemo(() => {
    return stockQuotes.map(s => {
      const change = s.last_price - s.yesterday_close;
      const changePct = s.yesterday_close > 0 ? (change / s.yesterday_close) * 100 : 0;
      return {
        ...s,
        change,
        changePct,
      };
    });
  }, [stockQuotes]);

  return (
    <article className="glass-panel mini-monitor-panel">
      {/* 选项卡切换头 */}
      <div className="mini-monitor-header">
        <div className="mini-tabs">
          <button
            className={`mini-tab-btn ${activeTab === 'spot' ? 'active' : ''}`}
            onClick={() => setActiveTab('spot')}
          >
            <MapPin size={13} />
            <span>省份现货 ({provPrices.length})</span>
          </button>
          <button
            className={`mini-tab-btn ${activeTab === 'stocks' ? 'active' : ''}`}
            onClick={() => setActiveTab('stocks')}
          >
            <TrendingUp size={13} />
            <span>养殖龙头股 ({stockQuotes.length})</span>
          </button>
        </div>
        <span className="mini-sub-tag">
          {activeTab === 'spot' ? '区域基准价' : 'A股期股联动'}
        </span>
      </div>

      {/* 内容区域 */}
      <div className="mini-monitor-body">
        {activeTab === 'spot' ? (
          <div className="mini-list">
            <div className="mini-list-head">
              <span>区域省份</span>
              <span style={{ textAlign: 'right' }}>现货单价</span>
              <span style={{ textAlign: 'right' }}>相对全国差价</span>
            </div>
            {sortedProvPrices.length === 0 ? (
              <div className="mini-empty">暂无省份现货报价</div>
            ) : (
              sortedProvPrices.map((item, idx) => {
                const spread = item.price - benchmarkSpot;
                const isPremium = spread >= 0;
                return (
                  <div key={item.id || idx} className="mini-list-row">
                    <div className="mini-cell-name">
                      <span className={`rank-badge ${idx < 3 ? `top-${idx + 1}` : ''}`}>{idx + 1}</span>
                      <span className="prov-name">{item.province}</span>
                    </div>
                    <div className="mini-cell-price">
                      <span className="mono bold">{item.price.toFixed(2)}</span>
                      <span className="unit">元/kg</span>
                    </div>
                    <div className="mini-cell-spread">
                      <span className={`spread-pill ${isPremium ? 'up' : 'down'}`}>
                        {isPremium ? `+${spread.toFixed(2)}` : spread.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="mini-list">
            <div className="mini-list-head">
              <span>代码/简称</span>
              <span style={{ textAlign: 'right' }}>现价</span>
              <span style={{ textAlign: 'right' }}>涨跌幅</span>
            </div>
            {formattedStocks.length === 0 ? (
              <div className="mini-empty">暂无股票行情</div>
            ) : (
              formattedStocks.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <div key={stock.symbol} className="mini-list-row">
                    <div className="mini-cell-name">
                      <span className="stock-sym mono">{stock.symbol}</span>
                      <span className="prov-name bold">{stock.name}</span>
                    </div>
                    <div className="mini-cell-price">
                      <span className={`mono bold ${isUp ? 'price-up' : 'price-down'}`}>
                        {stock.last_price.toFixed(2)}
                      </span>
                    </div>
                    <div className="mini-cell-spread">
                      <span className={`spread-pill ${isUp ? 'up' : 'down'}`}>
                        {isUp ? <TrendingUp size={11} style={{ marginRight: '2px' }} /> : <TrendingDown size={11} style={{ marginRight: '2px' }} />}
                        {isUp ? `+${stock.changePct.toFixed(2)}%` : `${stock.changePct.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 底部微注 */}
      <div className="mini-monitor-footer">
        <ArrowUpDown size={12} className="footer-icon" />
        <span>
          {activeTab === 'spot' 
            ? `基准全国均价: ${benchmarkSpot.toFixed(2)} 元/kg (河南/大连基准交割池)`
            : '生猪期现联动指标：期现共振时股票弹性通常为期货的1.2~1.5倍'}
        </span>
      </div>
    </article>
  );
};

export default MiniSpotStockMonitor;
