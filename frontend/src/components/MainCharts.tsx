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
  LineChart,
  BarChart
} from 'recharts';
import type {
  FuturesKline, SpotPrice, PorkPrice, SwineCapacity, BreedingIndicator, CompanyMonthlySales,
  SubstituteGoodsPrice, PorkImport, BreedingEfficiency, MacroEnvironmentalIndicator, ExpertAdvice,
  BiopharmaceuticalProcurement, BreedingConsumable, FeedSalesBreakdown, HogLogisticsSafety, PorkDownstreamDemand
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
  biopharmData?: BiopharmaceuticalProcurement[];
  consumablesData?: BreedingConsumable[];
  feedBreakdownData?: FeedSalesBreakdown[];
  logisticsSafetyData?: HogLogisticsSafety[];
  downstreamDemandData?: PorkDownstreamDemand[];
  selectedSymbol: string;
  filterByTimeRange: <T extends { date: string }>(data: T[]) => T[];
  expertAdvice?: ExpertAdvice | null;
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
  biopharmData,
  consumablesData,
  feedBreakdownData,
  logisticsSafetyData,
  downstreamDemandData,
  selectedSymbol,
  filterByTimeRange,
  expertAdvice
}) => {
  const [granularity, setGranularity] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [capacitySubView, setCapacitySubView] = React.useState<'inventory' | 'supply_demand' | 'weight' | 'listed' | 'grid'>('inventory');
  const [advancedMacroSubView, setAdvancedMacroSubView] = React.useState<'macro' | 'upstream' | 'downstream'>('macro');

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
  const filteredBiopharm = React.useMemo(() => filterByTimeRange(biopharmData || []), [biopharmData, filterByTimeRange]);
  const filteredConsumables = React.useMemo(() => filterByTimeRange(consumablesData || []), [consumablesData, filterByTimeRange]);
  const filteredFeed = React.useMemo(() => filterByTimeRange(feedBreakdownData || []), [feedBreakdownData, filterByTimeRange]);
  const filteredLogistics = React.useMemo(() => filterByTimeRange(logisticsSafetyData || []), [logisticsSafetyData, filterByTimeRange]);
  const filteredDemand = React.useMemo(() => filterByTimeRange(downstreamDemandData || []), [downstreamDemandData, filterByTimeRange]);

  if (activeChartTab === 'spot-futures') {
    const basisVal = expertAdvice?.basis || 0;
    const isPremium = basisVal < 0;
    const diffTon = Math.abs(basisVal);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span>当前期现状态: <strong style={{ color: isPremium ? 'var(--color-down)' : 'var(--color-up)' }}>
              {isPremium ? `期货升水 (+${diffTon.toLocaleString()} 元/吨)` : `现货升水 (+${diffTon.toLocaleString()} 元/吨)`}
            </strong></span>
            <span>即期价差折合: <strong className="mono" style={{ color: 'var(--color-accent)' }}>{Math.round(basisVal)} 元/吨</strong></span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>大商所合约交割期现联动特征</span>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredSpotFuturesData}
              margin={{ top: 15, right: 20, bottom: 20, left: 10 }}
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
        </div>
      </div>
    );
  }

  if (activeChartTab === 'basis') {
    const currentBasis = expertAdvice?.basis || 0;
    let basisStatusText = "期现平水震荡区间";
    let basisStatusColor = "var(--text-secondary)";
    let basisActionAdvice = "基差处于历史常态波动区间，市场未出现极端偏离。";

    if (currentBasis > 1200) {
      basisStatusText = "现货大幅升水 (盘面深度贴水)";
      basisStatusColor = "var(--color-up)";
      basisActionAdvice = "现货较期货大幅升水，反映现货与盘面预期存在阶段性显著价差。";
    } else if (currentBasis < -2000) {
      basisStatusText = "期货高升水结构";
      basisStatusColor = "var(--color-down)";
      basisActionAdvice = "期货升水超 2000 元/吨，盘面溢价处于极高历史分位。";
    } else if (currentBasis < -800) {
      basisStatusText = "期货温和升水结构";
      basisStatusColor = "var(--color-warn)";
      basisActionAdvice = "期货价格高于现货 800~2000 元/吨，盘面带有一定远期溢价。";
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>基差状态研判:</span>
            <span style={{ fontWeight: 700, color: basisStatusColor }}>{basisStatusText}</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>{basisActionAdvice}</span>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredBasisData}
              margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
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
              <ReferenceLine y={1200} stroke="var(--color-up)" strokeDasharray="4 4" label={{ value: '历史高位基差线 (+1200)', fill: 'var(--color-up)', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" label={{ value: '期现平水 (0)', fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <ReferenceLine y={-2000} stroke="var(--color-down)" strokeDasharray="4 4" label={{ value: '历史极值升水线 (-2000)', fill: 'var(--color-down)', fontSize: 10, position: 'insideBottomRight' }} />
              <Area name="基差水平 (现货-期货)" type="monotone" dataKey="basis" stroke="var(--color-warn)" fillOpacity={1} fill="url(#colorBasis)" strokeWidth={1.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
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

    const renderChart1 = (height: string = '100%') => (
      <div style={{ flex: 1, minHeight: 0, height, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '10px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textAlign: 'center' }}>
          能繁母猪存栏与定点屠宰量 {granularityText}
        </div>
        <div style={{ flex: 1, minHeight: 0, height: 'calc(100% - 24px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredCapacityData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
              <YAxis yAxisId="left" stroke="var(--text-muted)" domain={['dataMin - 100', 'dataMax + 100']} fontSize={10} label={{ value: '能繁/屠宰 (万头)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
              <YAxis yAxisId="right-inventory" orientation="right" stroke="var(--text-muted)" domain={['dataMin - 1000', 'dataMax + 1000']} fontSize={10} label={{ value: '生猪存栏 (万头)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 9 }} />
              <YAxis yAxisId="right-rate" orientation="right" stroke="var(--text-muted)" domain={[0, 100]} fontSize={10} hide={true} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend verticalAlign="top" height={26} iconSize={10} style={{ fontSize: '0.72rem' }} />
              <Line yAxisId="left" name="能繁母猪存栏" type="monotone" dataKey="maternal_sow_inventory" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} connectNulls />
              <Line yAxisId="left" name={granularity === 'daily' ? "定点屠宰量(日)" : granularity === 'weekly' ? "定点屠宰量(周)" : "定点屠宰量(月)"} type="monotone" dataKey="slaughterhouse_volume" stroke="rgb(233, 30, 99)" strokeWidth={2.2} dot={false} connectNulls />
              <Line yAxisId="right-inventory" name="生猪存栏" type="monotone" dataKey="hog_inventory" stroke="rgb(103, 58, 183)" strokeWidth={2.2} dot={false} connectNulls />
              <Line yAxisId="right-rate" name="屠宰开工率" type="monotone" dataKey="slaughterhouse_operating_rate" stroke="var(--color-warn)" strokeWidth={2} dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

    const renderChart2 = (height: string = '100%') => (
      <div style={{ flex: 1, minHeight: 0, height, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '10px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textAlign: 'center' }}>
          猪肉产量与消费端消费量对比 {granularityText}
        </div>
        <div style={{ flex: 1, minHeight: 0, height: 'calc(100% - 24px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredCapacityData} margin={{ top: 10, right: 35, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
              <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} label={{ value: '猪肉量 (万吨)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} label={{ value: '出栏量 (万头)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 9 }} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend verticalAlign="top" height={26} iconSize={10} style={{ fontSize: '0.72rem' }} />
              <Line yAxisId="left" name="猪肉产量(供给)" type="monotone" dataKey="pork_production" stroke="var(--color-up)" strokeWidth={2.2} dot={false} connectNulls />
              <Line yAxisId="left" name="猪肉消费量(需求)" type="monotone" dataKey="pork_consumption" stroke="var(--color-warn)" strokeWidth={2.2} dot={false} connectNulls />
              <Line yAxisId="right" name="生猪出栏量" type="monotone" dataKey="hog_slaughter" stroke="rgb(0, 188, 212)" strokeWidth={2} dot={false} strokeDasharray="4 3" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

    const renderChart3 = (height: string = '100%') => (
      <div style={{ flex: 1, minHeight: 0, height, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '10px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textAlign: 'center' }}>
          估算生猪出栏均重趋势 {granularityText}
        </div>
        <div style={{ flex: 1, minHeight: 0, height: 'calc(100% - 24px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" domain={['dataMin - 5', 'dataMax + 5']} fontSize={10} label={{ value: '均重 (kg/头)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend verticalAlign="top" height={26} iconSize={10} style={{ fontSize: '0.72rem' }} />
              <Line name="出栏均重 (公斤/头)" type="monotone" dataKey="average_market_weight" stroke="var(--color-warn)" strokeWidth={2.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

    const renderChart4 = (height: string = '100%') => (
      <div style={{ flex: 1, minHeight: 0, height, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '10px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textAlign: 'center' }}>
          上市猪企月度出栏量与全国定点屠宰量交叉验证
        </div>
        <div style={{ flex: 1, minHeight: 0, height: 'calc(100% - 24px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={companyCrossValidationData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} label={{ value: '万头', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend verticalAlign="top" height={26} iconSize={10} style={{ fontSize: '0.72rem' }} />
              <Bar name="牧原股份" dataKey="muyuan" stackId="listed" fill="var(--color-accent)" maxBarSize={18} />
              <Bar name="温氏股份" dataKey="wens" stackId="listed" fill="var(--color-up)" maxBarSize={18} />
              <Bar name="新希望" dataKey="newhope" stackId="listed" fill="var(--color-warn)" maxBarSize={18} />
              <Line name="全国定点屠宰量" type="monotone" dataKey="nationalSlaughter" stroke="rgb(233, 30, 99)" strokeWidth={2.2} dot={{ r: 2.5 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

    return (
      <div className="capacity-grid" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', minHeight: '520px' }}>
        {/* Sub-tabs header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingBottom: '4px' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '6px', padding: '2px', gap: '2px' }}>
            {[
              { id: 'inventory', label: '能繁与屠宰' },
              { id: 'supply_demand', label: '猪肉供需平衡' },
              { id: 'weight', label: '出栏均重' },
              { id: 'listed', label: '上市猪企出栏' },
              { id: 'grid', label: '四图全景 ⊞' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCapacitySubView(item.id as any)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: capacitySubView === item.id ? 'var(--color-accent)' : 'transparent',
                  color: capacitySubView === item.id ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '6px', padding: '2px', gap: '2px' }}>
            {(['daily', 'weekly', 'monthly'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: granularity === g ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: granularity === g ? '#fff' : 'var(--text-muted)',
                }}
              >
                {g === 'daily' ? '日度' : g === 'weekly' ? '周度' : '月度'}
              </button>
            ))}
          </div>
        </div>

        {/* View body */}
        {capacitySubView === 'inventory' && renderChart1('500px')}
        {capacitySubView === 'supply_demand' && renderChart2('500px')}
        {capacitySubView === 'weight' && renderChart3('500px')}
        {capacitySubView === 'listed' && renderChart4('500px')}
        {capacitySubView === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', height: '520px' }}>
            {renderChart1('250px')}
            {renderChart2('250px')}
            {renderChart3('250px')}
            {renderChart4('250px')}
          </div>
        )}
      </div>
    );
  }

  if (activeChartTab === 'advanced-macro') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', width: '100%' }}>
        {/* Sub-view navigation bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'inline-flex', gap: '6px' }}>
            <button
              onClick={() => setAdvancedMacroSubView('macro')}
              style={{
                padding: '4px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: advancedMacroSubView === 'macro' ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.05)',
                color: advancedMacroSubView === 'macro' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              📊 替代蛋白与宏观经济指标
            </button>
            <button
              onClick={() => setAdvancedMacroSubView('upstream')}
              style={{
                padding: '4px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: advancedMacroSubView === 'upstream' ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.05)',
                color: advancedMacroSubView === 'upstream' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              🔬 产业上游耗材与实物前瞻
            </button>
            <button
              onClick={() => setAdvancedMacroSubView('downstream')}
              style={{
                padding: '4px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: advancedMacroSubView === 'downstream' ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.05)',
                color: advancedMacroSubView === 'downstream' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              🥩 下游猪肉消费与深加工需求
            </button>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {advancedMacroSubView === 'macro' ? '多蛋白替代比价 & 进口边际冲击' : advancedMacroSubView === 'upstream' ? '母猪配种耗材 / 动保疫苗 / 饲料结构 / 跨区调运' : '肉品产销平衡 / 深加工与餐饮需求实测'}
          </span>
        </div>

        {advancedMacroSubView === 'macro' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '16px', flex: 1 }}>
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
        ) : advancedMacroSubView === 'upstream' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '16px', flex: 1 }}>
            {/* Chart 1: Breeding Consumables */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
                母猪配种与产房耗材消耗走势 (领先商品猪出栏 6~10 个月)
              </div>
              <div style={{ height: '320px', minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredConsumables} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                    <Line name="人工授精管 (万支)" type="monotone" dataKey="insemination_catheters" stroke="var(--color-accent)" strokeWidth={2} dot={false} connectNulls />
                    <Line name="精液稀释粉 (万包)" type="monotone" dataKey="semen_extender" stroke="var(--color-up)" strokeWidth={2} dot={false} connectNulls />
                    <Line name="护舍干燥粉 (吨)" type="monotone" dataKey="farrowing_dry_powder" stroke="var(--color-warn)" strokeWidth={2} dot={false} connectNulls />
                    <Line name="仔猪补铁针 (万支)" type="monotone" dataKey="iron_injection" stroke="#ec4899" strokeWidth={1.5} dot={false} connectNulls />
                    <Line name="防疫耳标 (万套)" type="monotone" dataKey="ear_tags" stroke="#a855f7" strokeWidth={1.5} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Biopharmaceutical Procurement */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
                生物医药动保采购走势 (烯丙孕素/催产素/综合疫苗指数)
              </div>
              <div style={{ height: '320px', minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredBiopharm} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                    <Line name="烯丙孕素销量 (吨)" type="monotone" dataKey="altrenogest_sales" stroke="var(--color-up)" strokeWidth={2} dot={false} connectNulls />
                    <Line name="催产素销量 (万支)" type="monotone" dataKey="oxytocin_sales" stroke="var(--color-warn)" strokeWidth={2} dot={false} connectNulls />
                    <Line name="综合疫苗采购指数" type="monotone" dataKey="vaccine_index" stroke="var(--color-accent)" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Feed Sales Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
                饲料细分阶段销量走势 (母猪料/乳猪料/中猪料/肥猪料)
              </div>
              <div style={{ height: '320px', minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredFeed} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                    <Bar name="母猪料 (万吨)" dataKey="sow_feed" stackId="feed" fill="rgba(14, 165, 233, 0.7)" />
                    <Bar name="教槽/乳猪料 (万吨)" dataKey="piglet_feed" stackId="feed" fill="rgba(236, 72, 153, 0.7)" />
                    <Bar name="保育/中猪料 (万吨)" dataKey="grower_feed" stackId="feed" fill="rgba(245, 158, 11, 0.7)" />
                    <Bar name="肥猪料 (万吨)" dataKey="finisher_feed" stackId="feed" fill="rgba(34, 197, 94, 0.7)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Logistics & Safety */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
                跨省调运检疫A证与死猪无害化处理量 (跨区运量与疫情隐性损耗)
              </div>
              <div style={{ height: '320px', minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredLogistics} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} label={{ value: '检疫票/死猪处理量', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 9 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} label={{ value: '运费指数', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 9 }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                    <Bar yAxisId="left" name="跨省检疫票 (张)" dataKey="quarantine_certificates" fill="rgba(14, 165, 233, 0.4)" barSize={20} />
                    <Line yAxisId="right" name="运费指数" type="monotone" dataKey="transport_freight_index" stroke="var(--color-warn)" strokeWidth={2} dot={false} connectNulls />
                    <Line yAxisId="left" name="死猪无害化处理量 (吨)" type="monotone" dataKey="mortality_waste_disposal" stroke="var(--color-down)" strokeWidth={2} dot={false} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '16px', flex: 1 }}>
            {/* Chart 1: Production vs Consumption */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
                猪肉产量与消费量平衡走势 (万吨)
              </div>
              <div style={{ height: '320px', minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredDemand} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                    <Line name="猪肉产量 (万吨)" type="monotone" dataKey="pork_production" stroke="var(--color-up)" strokeWidth={2} dot={false} connectNulls />
                    <Line name="猪肉消费量 (万吨)" type="monotone" dataKey="pork_consumption" stroke="var(--color-warn)" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Deep Processing & Catering Demand */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
                下游深加工制品与餐饮肉类需求 (万吨)
              </div>
              <div style={{ height: '320px', minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredDemand} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={28} iconSize={12} style={{ fontSize: '0.75rem' }} />
                    <Line name="深加工需求 (万吨)" type="monotone" dataKey="processed_pork_demand" stroke="var(--color-accent)" strokeWidth={2} dot={false} connectNulls />
                    <Line name="餐饮需求 (万吨)" type="monotone" dataKey="catering_pork_demand" stroke="#ec4899" strokeWidth={1.5} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default MainCharts;
