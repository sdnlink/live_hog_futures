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
import type {
  FuturesKline, SpotPrice, PorkPrice, SwineCapacity, BreedingIndicator, CompanyMonthlySales,
  SubstituteGoodsPrice, PorkImport, BreedingEfficiency, MacroEnvironmentalIndicator
} from '../types';

interface MainChartsProps {
  activeChartTab: string;
  spotBasisData: SpotPrice[];
  klineData: FuturesKline[];
  porkPriceData: PorkPrice[];
  costsData: BreedingIndicator[];
  capacityData: SwineCapacity[];
  weeklyCapacityData: SwineCapacity[];
  dailyCapacityData: SwineCapacity[];
  companySalesData: CompanyMonthlySales[];
  substitutePricesData: SubstituteGoodsPrice[];
  porkImportsData: PorkImport[];
  breedingEfficiencyData: BreedingEfficiency[];
  macroEnvironmentalData: MacroEnvironmentalIndicator[];
  selectedSymbol: string;
  filterByTimeRange: <T extends { date: string }>(data: T[]) => T[];
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{label}</span>
        </p>
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
  weeklyCapacityData,
  dailyCapacityData,
  companySalesData,
  substitutePricesData,
  porkImportsData,
  breedingEfficiencyData,
  macroEnvironmentalData,
  selectedSymbol,
  filterByTimeRange
}) => {
  const [granularity, setGranularity] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');

  // 1. Memoize spot-futures data combination
  const spotFuturesData = React.useMemo(() => {
    if (!spotBasisData || !spotBasisData.length) return [];
    
    // Create maps for quick O(1) lookup
    const klineMap = new Map<string, number>();
    klineData.forEach(kd => {
      if (kd.date && kd.close) {
        klineMap.set(kd.date, kd.close);
      }
    });

    const porkMap = new Map<string, number>();
    porkPriceData.forEach(pd => {
      if (pd.date && pd.price) {
        porkMap.set(pd.date, pd.price);
      }
    });

    const monthlyCompanyPrices = new Map<string, { muyuanPrice: number | null, wensPrice: number | null, newhopePrice: number | null }>();
    if (companySalesData && companySalesData.length) {
      companySalesData.forEach(s => {
        const yearMonth = s.date.substring(0, 7); // "YYYY-MM"
        if (!monthlyCompanyPrices.has(yearMonth)) {
          monthlyCompanyPrices.set(yearMonth, { muyuanPrice: null, wensPrice: null, newhopePrice: null });
        }
        const val = monthlyCompanyPrices.get(yearMonth)!;
        if (s.name === "牧原股份") val.muyuanPrice = s.sales_price;
        if (s.name === "温氏股份") val.wensPrice = s.sales_price;
        if (s.name === "新希望") val.newhopePrice = s.sales_price;
      });
    }

    const baseList = spotBasisData.map(item => {
      const futuresClose = klineMap.get(item.date);
      const porkPrice = porkMap.get(item.date);
      return {
        date: item.date,
        spotPrice: item.price,
        futuresPrice: futuresClose ? futuresClose / 1000 : null,
        porkPrice: porkPrice || null,
      };
    }).filter(d => d.futuresPrice !== null);

    const monthLastDatesInBase = new Map<string, string>();
    baseList.forEach(item => {
      const yearMonth = item.date.substring(0, 7);
      const currentMax = monthLastDatesInBase.get(yearMonth);
      if (!currentMax || item.date > currentMax) {
        monthLastDatesInBase.set(yearMonth, item.date);
      }
    });

    return baseList.map(item => {
      const yearMonth = item.date.substring(0, 7);
      const isMonthLastDate = monthLastDatesInBase.get(yearMonth) === item.date;
      const companyPrices = isMonthLastDate ? monthlyCompanyPrices.get(yearMonth) : null;
      return {
        ...item,
        muyuanPrice: companyPrices?.muyuanPrice || null,
        wensPrice: companyPrices?.wensPrice || null,
        newhopePrice: companyPrices?.newhopePrice || null,
      };
    });
  }, [spotBasisData, klineData, porkPriceData, companySalesData]);

  const filteredSpotFuturesData = React.useMemo(() => {
    return filterByTimeRange(spotFuturesData);
  }, [spotFuturesData, filterByTimeRange]);

  // 2. Memoize basis chart data
  const basisData = React.useMemo(() => {
    return spotBasisData.filter(d => d.basis !== null);
  }, [spotBasisData]);

  const filteredBasisData = React.useMemo(() => {
    return filterByTimeRange(basisData);
  }, [basisData, filterByTimeRange]);

  // 3. Memoize costs & profit chart data
  const filteredCostsData = React.useMemo(() => {
    return filterByTimeRange(costsData);
  }, [costsData, filterByTimeRange]);

  // 4. Memoize capacity data
  const filteredCapacityData = React.useMemo(() => {
    let activeData = granularity === 'daily' ? dailyCapacityData : granularity === 'weekly' ? weeklyCapacityData : capacityData;
    
    // Filter by time range
    activeData = filterByTimeRange(activeData);
    
    // Downsample if data is too dense (prevent rendering bottlenecks)
    if (activeData.length > 300) {
      const step = Math.ceil(activeData.length / 300);
      activeData = activeData.filter((_, idx) => idx % step === 0);
    }
    
    return activeData;
  }, [granularity, dailyCapacityData, weeklyCapacityData, capacityData, filterByTimeRange]);

  const weightData = React.useMemo(() => {
    return filteredCapacityData.filter(d => d.average_market_weight !== null && d.average_market_weight !== undefined);
  }, [filteredCapacityData]);

  const companyCrossValidationData = React.useMemo(() => {
    if (!companySalesData || !companySalesData.length) return [];
    
    // Group corporate sales by date
    const dateMap = new Map<string, { [key: string]: number }>();
    companySalesData.forEach(s => {
      const d = s.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, {});
      }
      const val = dateMap.get(d)!;
      if (s.name && s.sales_volume) {
        val[s.name] = s.sales_volume;
      }
    });
    
    // Combine with capacityData (national slaughterhouse_volume)
    const capacityMap = new Map<string, number>();
    capacityData.forEach(c => {
      if (c.date && c.slaughterhouse_volume) {
        capacityMap.set(c.date, c.slaughterhouse_volume);
      }
    });

    const combined: any[] = [];
    dateMap.forEach((companyVols, d) => {
      const nationalSlaughter = capacityMap.get(d) || null;
      combined.push({
        date: d,
        muyuan: companyVols["牧原股份"] || 0,
        wens: companyVols["温氏股份"] || 0,
        newhope: companyVols["新希望"] || 0,
        nationalSlaughter: nationalSlaughter,
      });
    });

    const sorted = combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return filterByTimeRange(sorted);
  }, [companySalesData, capacityData, filterByTimeRange]);

  const filteredSubstitute = React.useMemo(() => filterByTimeRange(substitutePricesData || []), [substitutePricesData, filterByTimeRange]);
  const filteredImports = React.useMemo(() => filterByTimeRange(porkImportsData || []), [porkImportsData, filterByTimeRange]);
  const filteredEfficiency = React.useMemo(() => filterByTimeRange(breedingEfficiencyData || []), [breedingEfficiencyData, filterByTimeRange]);
  const filteredMacro = React.useMemo(() => filterByTimeRange(macroEnvironmentalData || []), [macroEnvironmentalData, filterByTimeRange]);

  if (activeChartTab === 'spot-futures') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={filteredSpotFuturesData}
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
          <Line name="牧原股份出栏均价 (月度)" type="monotone" dataKey="muyuanPrice" stroke="var(--color-accent)" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="3 3" connectNulls />
          <Line name="温氏股份出栏均价 (月度)" type="monotone" dataKey="wensPrice" stroke="var(--color-up)" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="3 3" connectNulls />
          <Line name="新希望出栏均价 (月度)" type="monotone" dataKey="newhopePrice" stroke="var(--color-warn)" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="3 3" connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  if (activeChartTab === 'basis') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={filteredBasisData}
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
          data={filteredCostsData}
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
    const granularityText = granularity === 'daily' ? '(日度)' : granularity === 'weekly' ? '(周度)' : '(月度)';
    return (
      <div className="capacity-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 4px', marginBottom: '-8px' }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px'
          }}>
            {(['daily', 'weekly', 'monthly'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                style={{
                  padding: '4px 14px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  background: granularity === g ? 'var(--color-accent)' : 'transparent',
                  color: granularity === g ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {g === 'daily' ? '日度数据' : g === 'weekly' ? '周度数据' : '月度数据'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            生猪产能、存栏与定点屠宰场趋势 {granularityText}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={filteredCapacityData}
                margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" domain={['dataMin - 100', 'dataMax + 100']} fontSize={10} label={{ value: granularity === 'daily' ? '产能与定点屠宰量 (日度, 万头)' : granularity === 'weekly' ? '产能与定点屠宰量 (周度, 万头)' : '产能与定点屠宰量 (月度, 万头)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis yAxisId="right-inventory" orientation="right" stroke="var(--text-muted)" domain={['dataMin - 1000', 'dataMax + 1000']} fontSize={10} label={{ value: '生猪存栏 (万头)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis yAxisId="right-rate" orientation="right" stroke="var(--text-muted)" domain={[0, 100]} fontSize={10} hide={true} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Line yAxisId="left" name="能繁母猪存栏" type="monotone" dataKey="maternal_sow_inventory" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} connectNulls />
                <Line yAxisId="left" name={granularity === 'daily' ? "定点屠宰量 (日度)" : granularity === 'weekly' ? "定点屠宰量 (周度)" : "定点屠宰量 (月度)"} type="monotone" dataKey="slaughterhouse_volume" stroke="rgb(233, 30, 99)" strokeWidth={2.5} dot={false} connectNulls />
                <Line yAxisId="right-inventory" name="生猪存栏" type="monotone" dataKey="hog_inventory" stroke="rgb(103, 58, 183)" strokeWidth={2.5} dot={false} connectNulls />
                <Line yAxisId="right-rate" name="屠宰开工率" type="monotone" dataKey="slaughterhouse_operating_rate" stroke="var(--color-warn)" strokeWidth={2.5} dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            猪肉产量与消费端消费量对比 {granularityText}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredCapacityData}
                margin={{ top: 10, right: 50, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} label={{ value: granularity === 'daily' ? '日度猪肉量 (万吨)' : granularity === 'weekly' ? '周度猪肉量 (万吨)' : '月度猪肉量 (万吨)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} label={{ value: granularity === 'daily' ? '日度出栏量 (万头)' : granularity === 'weekly' ? '周度出栏量 (万头)' : '月度出栏量 (万头)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 9 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Line yAxisId="left" name={granularity === 'daily' ? "猪肉产量 (供给, 日度)" : granularity === 'weekly' ? "猪肉产量 (供给, 周度)" : "猪肉产量 (供给, 月度)"} type="monotone" dataKey="pork_production" stroke="var(--color-up)" strokeWidth={2.5} dot={false} connectNulls />
                <Line yAxisId="left" name={granularity === 'daily' ? "猪肉消费量 (消费, 日度)" : granularity === 'weekly' ? "猪肉消费量 (消费, 周度)" : "猪肉消费量 (消费, 月度)"} type="monotone" dataKey="pork_consumption" stroke="var(--color-warn)" strokeWidth={2.5} dot={false} connectNulls />
                <Line yAxisId="right" name={granularity === 'daily' ? "生猪出栏量 (日度)" : granularity === 'weekly' ? "生猪出栏量 (周度)" : "生猪出栏量 (月度)"} type="monotone" dataKey="hog_slaughter" stroke="rgb(0, 188, 212)" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            估算生猪出栏均重趋势 {granularityText}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weightData}
                margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" domain={['dataMin - 5', 'dataMax + 5']} fontSize={10} label={{ value: '估算出栏均重 (公斤/头)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Line name="出栏均重 (公斤/头)" type="monotone" dataKey="average_market_weight" stroke="var(--color-warn)" strokeWidth={2.5} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            上市猪企月度出栏量与全国定点屠宰量交叉验证
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={companyCrossValidationData}
                margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} label={{ value: '出栏量/屠宰量 (万头)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Bar name="牧原股份" dataKey="muyuan" stackId="listed" fill="var(--color-accent)" maxBarSize={20} />
                <Bar name="温氏股份" dataKey="wens" stackId="listed" fill="var(--color-up)" maxBarSize={20} />
                <Bar name="新希望" dataKey="newhope" stackId="listed" fill="var(--color-warn)" maxBarSize={20} />
                <Line name="全国定点屠宰量" type="monotone" dataKey="nationalSlaughter" stroke="rgb(233, 30, 99)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  if (activeChartTab === 'advanced-macro') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '16px', height: '100%', width: '100%' }}>
        {/* Chart 1: Substitute Goods Prices */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            替代蛋白现货均价走势 (元/公斤)
          </div>
          <div style={{ height: '320px', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredSubstitute} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Line name="牛肉价格" type="monotone" dataKey="beef_price" stroke="var(--color-warn)" strokeWidth={2} dot={false} connectNulls />
                <Line name="肉鸡价格" type="monotone" dataKey="chicken_price" stroke="var(--color-accent)" strokeWidth={2} dot={false} connectNulls />
                <Line name="鸡蛋价格" type="monotone" dataKey="egg_price" stroke="var(--color-up)" strokeWidth={1.5} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pork Imports */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            猪肉进口量及到岸价走势
          </div>
          <div style={{ height: '320px', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredImports} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} label={{ value: '进口量 (万吨)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} label={{ value: '到岸价 (元/公斤)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 9 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Bar yAxisId="left" name="进口量 (万吨)" dataKey="import_volume" fill="rgba(14, 165, 233, 0.4)" barSize={20} />
                <Line yAxisId="right" name="进口均价 (元/公斤)" type="monotone" dataKey="import_price" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Breeding Efficiency */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            PSY/MSY 繁育效率及规模化占比
          </div>
          <div style={{ height: '320px', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredEfficiency} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                <defs>
                  <linearGradient id="colorScale" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} domain={['dataMin - 1', 'dataMax + 1']} label={{ value: 'PSY / MSY (头/年)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} domain={[50, 100]} label={{ value: '规模养殖比重 (%)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 9 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Area yAxisId="right" name="规模养殖比重 (%)" type="monotone" dataKey="scale_farming_rate" fillOpacity={1} fill="url(#colorScale)" stroke="var(--color-accent)" strokeWidth={1} />
                <Line yAxisId="left" name="PSY (母猪年断奶)" type="monotone" dataKey="psy" stroke="var(--color-up)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line yAxisId="left" name="MSY (母猪年出栏)" type="monotone" dataKey="msy" stroke="var(--color-warn)" strokeWidth={1.5} dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Macro Indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
            宏观经济景气与环保限制指数
          </div>
          <div style={{ height: '320px', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredMacro} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} label={{ value: '指数/比例', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} domain={[0, 10]} label={{ value: 'GDP增速 (%)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 9 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                <Line yAxisId="left" name="消费者信心指数" type="monotone" dataKey="consumer_confidence" stroke="var(--color-up)" strokeWidth={2} dot={false} connectNulls />
                <Line yAxisId="left" name="环保管制强度指数" type="monotone" dataKey="environmental_regulation_index" stroke="var(--color-down)" strokeWidth={1.5} dot={false} connectNulls />
                <Line yAxisId="right" name="GDP同比增速 (%)" type="monotone" dataKey="gdp_growth" stroke="var(--color-warn)" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default MainCharts;
