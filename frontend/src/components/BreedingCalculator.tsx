import React from 'react';

interface BreedingCalculatorProps {
  calcInputs: any;
  calcResults: any;
  handleInputChange: (field: string, val: number) => void;
  saveCalculatorConfig: () => void;
  exportCalculatorReport: () => void;
  resetCalculatorConfig: () => void;
}

const BreedingCalculator: React.FC<BreedingCalculatorProps> = ({
  calcInputs,
  calcResults,
  handleInputChange,
  saveCalculatorConfig,
  exportCalculatorReport,
  resetCalculatorConfig
}) => {
  return (
    <div className="calculator-grid">
      <div className="calc-inputs">
        <div className="calc-group">
          <label>出栏体重 (公斤)</label>
          <input
            type="number"
            className="custom-input mono"
            value={calcInputs.outWeight}
            onChange={(e) => handleInputChange('outWeight', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="calc-group">
          <label>仔猪进栏体重 (公斤)</label>
          <input
            type="number"
            className="custom-input mono"
            value={calcInputs.inWeight}
            onChange={(e) => handleInputChange('inWeight', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="calc-group">
          <label>仔猪购入成本 (元/头)</label>
          <input
            type="number"
            className="custom-input mono"
            value={calcInputs.pigletCost}
            onChange={(e) => handleInputChange('pigletCost', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="calc-group">
          <label>饲料料肉比 (FCR)</label>
          <input
            type="number"
            step="0.1"
            className="custom-input mono"
            value={calcInputs.fcr}
            onChange={(e) => handleInputChange('fcr', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="calc-group">
          <label>玉米价格 (元/吨)</label>
          <input
            type="number"
            className="custom-input mono"
            value={calcInputs.cornPrice}
            onChange={(e) => handleInputChange('cornPrice', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="calc-group">
          <label>豆粕价格 (元/吨)</label>
          <input
            type="number"
            className="custom-input mono"
            value={calcInputs.soyPrice}
            onChange={(e) => handleInputChange('soyPrice', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="calc-group">
          <label>水电防疫成本 (元/头)</label>
          <input
            type="number"
            className="custom-input mono"
            value={calcInputs.vaccine + calcInputs.utilities}
            onChange={(e) => handleInputChange('vaccine', Math.round((parseFloat(e.target.value) || 0) * 0.6))}
          />
        </div>
        <div className="calc-group">
          <label>人工与固定折旧 (元/头)</label>
          <input
            type="number"
            className="custom-input mono"
            value={calcInputs.labor + calcInputs.depreciation}
            onChange={(e) => handleInputChange('labor', Math.round((parseFloat(e.target.value) || 0) * 0.6))}
          />
        </div>
      </div>

      <div className="calc-results">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
            全维度养殖利润模拟结果
          </h3>
          <div className="calc-res-row">
            <span className="calc-res-label">育肥增重总量:</span>
            <span className="calc-res-val mono">{calcResults.weightGain} kg</span>
          </div>
          <div className="calc-res-row">
            <span className="calc-res-label">消耗饲料总量:</span>
            <span className="calc-res-val mono">{calcResults.feedConsumed} kg</span>
          </div>
          <div className="calc-res-row">
            <span className="calc-res-label">饲料折合均价:</span>
            <span className="calc-res-val mono">{calcResults.feedCostPerKg} 元/kg</span>
          </div>
          <div className="calc-res-row">
            <span className="calc-res-label">饲料总成本:</span>
            <span className="calc-res-val mono">{calcResults.totalFeedCost} 元</span>
          </div>
          <div className="calc-res-row">
            <span className="calc-res-label">每头总成本:</span>
            <span className="calc-res-val mono" style={{ color: 'var(--color-warn)' }}>{calcResults.totalCost} 元</span>
          </div>
          <div className="calc-res-row">
            <span className="calc-res-label">每头保本出栏价:</span>
            <span className="calc-res-val mono" style={{ color: 'var(--color-accent)' }}>{calcResults.breakEven} 元/kg</span>
          </div>
        </div>

        <div className="calc-res-total">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>测算净利润:</span>
            <span className={`calc-res-val mono ${calcResults.profit >= 0 ? 'profit-up' : 'profit-down'}`} style={{ fontSize: '1.4rem' }}>
              {calcResults.profit >= 0 ? '+' : ''}{calcResults.profit} 元
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
          <button onClick={saveCalculatorConfig} className="tab-btn active" style={{ fontSize: '0.75rem', padding: '6px 8px', flex: 1, cursor: 'pointer' }}>
            保存配置
          </button>
          <button onClick={exportCalculatorReport} className="tab-btn" style={{ fontSize: '0.75rem', padding: '6px 8px', flex: 1, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
            导出报告
          </button>
          <button onClick={resetCalculatorConfig} className="tab-btn" style={{ fontSize: '0.75rem', padding: '6px 8px', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            重置
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreedingCalculator;
