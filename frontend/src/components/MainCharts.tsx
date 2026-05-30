import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  LineChart
} from 'recharts';
import type { FuturesKline, SpotPrice, PorkPrice, SwineCapacity, BreedingIndicator, FrozenPorkStorage } from '../types';

interface MainChartsProps {
  activeChartTab: string;
  spotBasisData: SpotPrice[];
  klineData: FuturesKline[];
  porkPriceData: PorkPrice[];
  costsData: BreedingIndicator[];
  capacityData: SwineCapacity[];
  frozenPorkData: FrozenPorkStorage[];
  selectedSymbol: string;
  filterByTimeRange: <T extends { date: string }>(data: T[]) => T[];
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

const MainCharts: React.FC<MainChartsProps> = ({
  activeChartTab,
  spotBasisData,
  klineData,
  porkPriceData,
  costsData,
  capacityData,
  frozenPorkData,
  selectedSymbol,
  filterByTimeRange
}) => {
  if (activeChartTab === 'spot-futures') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={filterByTimeRange(spotBasisData.map(item => {
            const k = klineData.find(kd => kd.date === item.date);
            const p = porkPriceData.find(pd => pd.date === item.date);
            return {
              date: item.date,
              spotPrice: item.price,
              futuresPrice: k && k.close ? k.close / 1000 : null,
              porkPrice: p ? p.price : null,
            };
          }).filter(d => d.futuresPrice !== null))}
          margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" domain={['dataMin - 1', 'dataMax + 1']} fontSize={11} unit="元" />
          <Tooltip content={<CustomChartTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Line name="现货均价 (全国)" type="monotone" dataKey="spotPrice" stroke="var(--color-up)" strokeWidth={2.5} dot={false} connectNulls />
          <Line name={`期货价 (${selectedSymbol} 折合)`} type="monotone" dataKey="futuresPrice" stroke="var(--color-accent)" strokeWidth={2} dot={false} strokeDasharray="4 4" connectNulls />
          <Line name="猪肉批发价 (消费端)" type="monotone" dataKey="porkPrice" stroke="var(--color-warn)" strokeWidth={2.5} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  if (activeChartTab === 'basis') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={filterByTimeRange(spotBasisData.filter(d => d.basis !== null))}
          margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
        >
          <defs>
            <linearGradient id="colorBasis" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-warn)" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="var(--color-warn)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} unit="元" />
          <Tooltip content={<CustomChartTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
          <Area name="基差水平 (现货-期货)" type="monotone" dataKey="basis" stroke="var(--color-warn)" fillOpacity={1} fill="url(#colorBasis)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (activeChartTab === 'cost-profits') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={filterByTimeRange(costsData)}
          margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
          <YAxis yAxisId="left" stroke="var(--text-muted)" label={{ value: '养殖利润 (元/头)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }} fontSize={11} />
          <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" label={{ value: '猪粮比价', angle: 90, position: 'insideRight', fill: 'var(--text-muted)' }} fontSize={11} />
          <Tooltip content={<CustomChartTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Line yAxisId="left" name="自繁自养利润" type="monotone" dataKey="self_breeding_profit" stroke="var(--color-up)" strokeWidth={2} dot={false} />
          <Line yAxisId="left" name="外购仔猪利润" type="monotone" dataKey="piglet_breeding_profit" stroke="var(--color-accent)" strokeWidth={1.5} dot={false} />
          <Line yAxisId="right" name="猪粮比价" type="monotone" dataKey="pig_to_grain_ratio" stroke="var(--color-warn)" strokeWidth={2} dot={false} />
          <ReferenceLine yAxisId="right" y={6.0} stroke="red" strokeDasharray="3 3" label={{ value: '盈亏线: 6.0', fill: 'red', fontSize: 10 }} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  if (activeChartTab === 'capacity') {
    return (
      <div className="capacity-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            生猪产能、存栏与定点屠宰场趋势
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={filterByTimeRange(capacityData)}
                margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" domain={['dataMin - 100', 'dataMax + 100']} fontSize={10} label={{ value: '产能与屠宰量 (万头)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis yAxisId="right-inventory" orientation="right" stroke="var(--text-muted)" domain={['dataMin - 1000', 'dataMax + 1000']} fontSize={10} label={{ value: '生猪存栏 (万头)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis yAxisId="right-rate" orientation="right" stroke="var(--text-muted)" domain={[0, 100]} fontSize={10} hide={true} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Line yAxisId="left" name="能繁母猪存栏" type="monotone" dataKey="maternal_sow_inventory" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} connectNulls />
                <Line yAxisId="left" name="定点屠宰量" type="monotone" dataKey="slaughterhouse_volume" stroke="rgb(233, 30, 99)" strokeWidth={2.5} dot={false} connectNulls />
                <Line yAxisId="right-inventory" name="生猪存栏" type="monotone" dataKey="hog_inventory" stroke="rgb(103, 58, 183)" strokeWidth={2.5} dot={false} connectNulls />
                <Line yAxisId="right-rate" name="屠宰开工率" type="monotone" dataKey="slaughterhouse_operating_rate" stroke="var(--color-warn)" strokeWidth={2.5} dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            猪肉产量与消费端消费量对比
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filterByTimeRange(capacityData)}
                margin={{ top: 10, right: 50, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} label={{ value: '猪肉量 (万吨)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} label={{ value: '出栏量 (万头)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 9 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Line yAxisId="left" name="猪肉产量 (供给)" type="monotone" dataKey="pork_production" stroke="var(--color-up)" strokeWidth={2.5} dot={false} connectNulls />
                <Line yAxisId="left" name="猪肉消费量 (消费)" type="monotone" dataKey="pork_consumption" stroke="var(--color-warn)" strokeWidth={2.5} dot={false} connectNulls />
                <Line yAxisId="right" name="生猪出栏量" type="monotone" dataKey="hog_slaughter" stroke="rgb(0, 188, 212)" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  if (activeChartTab === 'frozen-pork') {
    return (
      <div className="capacity-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            中央储备冻品投放与商业库存走势
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={filterByTimeRange(frozenPorkData)}
                margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} label={{ value: '冻品数量 (万吨)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Line name="商业冻猪肉库存" type="monotone" dataKey="commercial_inventory" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} connectNulls />
                <Bar name="储备冻肉投放/收储量" dataKey="reserve_volume" fill="var(--color-down)" radius={[4, 4, 0, 0]} maxBarSize={15} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            全国商业冻品库容率趋势
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filterByTimeRange(frozenPorkData)}
                margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
              >
                <defs>
                  <linearGradient id="colorStorageRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-warn)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-warn)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" domain={[0, 100]} fontSize={10} label={{ value: '库容率 (%)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Area name="商业冻品库容率" type="monotone" dataKey="storage_rate" stroke="var(--color-warn)" fillOpacity={1} fill="url(#colorStorageRate)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MainCharts;
