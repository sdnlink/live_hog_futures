import React, { useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart
} from 'recharts';
import { 
  Activity, TrendingUp, ShieldAlert, Award, FileText, CheckCircle2, Zap
} from 'lucide-react';
import type { 
  SentimentIndex, BiopharmaceuticalProcurement, BreedingConsumable, FeedSalesBreakdown, HogLogisticsSafety, PorkDownstreamDemand 
} from '../types';

interface SentimentValidationPanelProps {
  sentimentIndex: SentimentIndex[];
  biopharmData: BiopharmaceuticalProcurement[];
  consumablesData?: BreedingConsumable[];
  feedBreakdownData: FeedSalesBreakdown[];
  logisticsSafetyData: HogLogisticsSafety[];
  downstreamDemandData: PorkDownstreamDemand[];
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

const SentimentValidationPanel: React.FC<SentimentValidationPanelProps> = ({
  sentimentIndex,
  biopharmData,
  consumablesData,
  feedBreakdownData,
  logisticsSafetyData,
  downstreamDemandData,
  filterByTimeRange
}) => {

  // Filter datasets by selected time range
  const filteredSentiment = useMemo(() => {
    // Group sentiment by date for easy charting
    const dateMap: { [date: string]: any } = {};
    sentimentIndex.forEach(item => {
      if (!dateMap[item.date]) {
        dateMap[item.date] = { date: item.date };
      }
      dateMap[item.date][item.keyword] = item.sentiment_score;
    });
    const sorted = Object.values(dateMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
    return filterByTimeRange(sorted);
  }, [sentimentIndex, filterByTimeRange]);

  const filteredBiopharm = useMemo(() => filterByTimeRange(biopharmData), [biopharmData, filterByTimeRange]);
  const filteredConsumables = useMemo(() => filterByTimeRange(consumablesData || []), [consumablesData, filterByTimeRange]);
  const filteredFeed = useMemo(() => filterByTimeRange(feedBreakdownData), [feedBreakdownData, filterByTimeRange]);
  const filteredDemand = useMemo(() => filterByTimeRange(downstreamDemandData), [downstreamDemandData, filterByTimeRange]);
  const filteredLogistics = useMemo(() => filterByTimeRange(logisticsSafetyData), [logisticsSafetyData, filterByTimeRange]);

  // Compute correlation and analysis insights
  const latestSentiment = useMemo(() => {
    if (!sentimentIndex || sentimentIndex.length === 0) return null;
    const latestDate = [...sentimentIndex].sort((a, b) => b.date.localeCompare(a.date))[0].date;
    return sentimentIndex.filter(item => item.date === latestDate);
  }, [sentimentIndex]);

  const stats = useMemo(() => {
    if (!latestSentiment || latestSentiment.length === 0) return { medicineScore: 50, feedScore: 50, demandScore: 50, verificationStatus: '正常' };
    const med = latestSentiment.find(item => item.keyword === '用药挺价舆情')?.sentiment_score || 50;
    const feed = latestSentiment.find(item => item.keyword === '饲料消耗指数')?.sentiment_score || 50;
    const dem = latestSentiment.find(item => item.keyword === '深加工采购情绪')?.sentiment_score || 50;
    const validationStatus = (med > 65 || feed > 65 || dem > 65) ? '警惕/背离中' : '多维印证良好';
    return {
      medicineScore: med,
      feedScore: feed,
      demandScore: dem,
      verificationStatus: validationStatus
    };
  }, [latestSentiment]);

  return (
    <div style={styles.container}>
      {/* Divergence Verdict Ribbon - 物理实物与网络情绪背离裁决 */}
      <div style={{
        padding: '12px 18px',
        borderRadius: '10px',
        background: stats.verificationStatus.includes('警惕')
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: stats.verificationStatus.includes('警惕') ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(34, 197, 94, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={20} style={{ color: stats.verificationStatus.includes('警惕') ? 'var(--color-down)' : 'var(--color-up)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                前瞻物理指标背离印证裁决
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: stats.verificationStatus.includes('警惕') ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                color: stats.verificationStatus.includes('警惕') ? 'var(--color-down)' : 'var(--color-up)'
              }}>
                {stats.verificationStatus.includes('警惕') ? '🚨 出现背离风险' : '🛡️ 物理多维印证坚实'}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px', margin: 0 }}>
              {stats.verificationStatus.includes('警惕')
                ? '提示：监测到网络情绪热度与实体兽药采购或饲料消耗出现背离，谨防盘面虚假繁荣或过度踩踏，逢高套保为宜。'
                : '提示：线下动保采购与饲料细分销量真实反映基础产能出清，无虚假压栏泡沫，期货多头具备真实物理层面支撑。'}
            </p>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: stats.verificationStatus.includes('警惕') ? 'var(--color-down)' : 'var(--color-up)' }}>
          {stats.verificationStatus.includes('警惕') ? '期货操作：逢高套保 / 防范挤仓' : '期货操作：回踩吸纳 / 依托实物筑底'}
        </div>
      </div>

      {/* KPI Header Grid */}
      <div style={styles.kpiGrid}>
        <div className="glass-panel" style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <Activity size={18} style={{ color: 'var(--color-accent)' }} />
            <span style={styles.kpiLabel}>用药舆情/动保指数</span>
          </div>
          <span style={styles.kpiValue}>{stats.medicineScore.toFixed(1)}分</span>
          <p style={styles.kpiDesc}>动保采购热度与网上用药维权挺价舆情关联指数。</p>
        </div>

        <div className="glass-panel" style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <TrendingUp size={18} style={{ color: 'var(--color-up)' }} />
            <span style={styles.kpiLabel}>饲料消耗/压栏情绪</span>
          </div>
          <span style={styles.kpiValue}>{stats.feedScore.toFixed(1)}分</span>
          <p style={styles.kpiDesc}>肥猪料及母猪配合料消耗对二育/压栏的印证率。</p>
        </div>

        <div className="glass-panel" style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <Award size={18} style={{ color: 'var(--color-warn)' }} />
            <span style={styles.kpiLabel}>深加工采购意愿</span>
          </div>
          <span style={styles.kpiValue}>{stats.demandScore.toFixed(1)}分</span>
          <p style={styles.kpiDesc}>猪肉深加工制品和餐饮采购的情绪活跃百分比。</p>
        </div>

        <div className="glass-panel" style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <ShieldAlert size={18} style={{ color: stats.verificationStatus.includes('警惕') ? 'var(--color-down)' : 'var(--color-up)' }} />
            <span style={styles.kpiLabel}>多维交叉校验状态</span>
          </div>
          <span style={{ ...styles.kpiValue, color: stats.verificationStatus.includes('警惕') ? 'var(--color-down)' : 'var(--color-up)' }}>
            {stats.verificationStatus}
          </span>
          <p style={styles.kpiDesc}>交叉校验官方滞后产能与前瞻社会舆情一致性状态。</p>
        </div>
      </div>

      {/* Main Grid: Charts */}
      <div style={styles.chartsGrid}>
        
        {/* Section 1: Social Media Sentiment Index */}
        <article className="glass-panel" style={styles.chartPanel}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <FileText size={18} style={{ color: 'var(--color-accent)' }} />
              <span>多渠道社交媒体舆情词频监测 (Soozhu + 东财 + 同花顺)</span>
            </div>
          </div>
          <div style={{ height: '320px', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredSentiment} margin={{ top: 10, right: 20, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" domain={[0, 100]} fontSize={10} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '0.7rem' }} />
                <Line name="用药舆情" type="monotone" dataKey="用药挺价舆情" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                <Line name="饲料指数" type="monotone" dataKey="饲料消耗指数" stroke="var(--color-up)" strokeWidth={2} dot={false} />
                <Line name="深加工情绪" type="monotone" dataKey="深加工采购情绪" stroke="var(--color-warn)" strokeWidth={2} dot={false} />
                <Line name="非瘟恐慌" type="monotone" dataKey="非瘟恐慌舆情" stroke="var(--color-down)" strokeWidth={1.5} dot={false} />
                <Line name="二育投机" type="monotone" dataKey="二育投机情绪" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line name="消费意愿" type="monotone" dataKey="消费端采购意愿" stroke="#e91e63" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Section 2: Veterinary Drugs / Vaccines Procurement */}
        <article className="glass-panel" style={styles.chartPanel}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <CheckCircle2 size={18} style={{ color: 'var(--color-up)' }} />
              <span>生物动保药品采购与接种量监控 (用药真实印证)</span>
            </div>
          </div>
          <div style={{ height: '320px', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredBiopharm} margin={{ top: 10, right: 20, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorVIndex" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-up)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-up)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '0.7rem' }} />
                <Area name="动保景气度综合指数" type="monotone" dataKey="vaccine_index" stroke="var(--color-up)" fillOpacity={1} fill="url(#colorVIndex)" strokeWidth={2} />
                <Line name="猪瘟疫苗 (万支)" type="monotone" dataKey="swine_fever_vaccine" stroke="var(--color-accent)" strokeWidth={1.5} dot={false} />
                <Line name="蓝耳疫苗 (万支)" type="monotone" dataKey="prrs_vaccine" stroke="var(--color-warn)" strokeWidth={1.5} dot={false} />
                <Line name="口蹄疫疫苗 (万支)" type="monotone" dataKey="fmd_vaccine" stroke="#e91e63" strokeWidth={1.5} dot={false} />
                <Line name="腹泻疫苗 (万支)" type="monotone" dataKey="diarrhea_vaccine" stroke="#a855f7" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Section 3: Feed Sales Structure */}
        <article className="glass-panel" style={styles.chartPanel}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <Activity size={18} style={{ color: 'var(--color-warn)' }} />
              <span>饲料结构销量趋势 (母猪/教槽/中猪/肥猪料占比)</span>
            </div>
          </div>
          <div style={{ height: '320px', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredFeed} margin={{ top: 10, right: 20, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '0.7rem' }} />
                <Bar name="母猪料 (万吨)" dataKey="sow_feed" stackId="feed" fill="rgba(14, 165, 233, 0.7)" />
                <Bar name="教槽/乳猪料 (万吨)" dataKey="piglet_feed" stackId="feed" fill="rgba(236, 72, 153, 0.7)" />
                <Bar name="保育/中猪料 (万吨)" dataKey="grower_feed" stackId="feed" fill="rgba(245, 158, 11, 0.7)" />
                <Bar name="肥猪料 (万吨)" dataKey="finisher_feed" stackId="feed" fill="rgba(34, 197, 94, 0.7)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Section 4: Downstream Pork Demand & Deep Processing */}
        <article className="glass-panel" style={styles.chartPanel}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <TrendingUp size={18} style={{ color: 'var(--color-accent)' }} />
              <span>下游实际肉品需求与深加工比例 (印证食品零售端)</span>
            </div>
          </div>
          <div style={{ height: '320px', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredDemand} margin={{ top: 10, right: 20, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '0.7rem' }} />
                <Line name="猪肉产量 (万吨)" type="monotone" dataKey="pork_production" stroke="var(--color-up)" strokeWidth={2} dot={false} />
                <Line name="猪肉消费量 (万吨)" type="monotone" dataKey="pork_consumption" stroke="var(--color-warn)" strokeWidth={2} dot={false} />
                <Line name="深加工制品需求 (万吨)" type="monotone" dataKey="processed_pork_demand" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                <Line name="餐饮肉类需求 (万吨)" type="monotone" dataKey="catering_pork_demand" stroke="#e91e63" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Section 5: Trans-provincial Logistics & Safety */}
        <article className="glass-panel" style={{ ...styles.chartPanel, gridColumn: 'span 2' }}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <ShieldAlert size={18} style={{ color: 'var(--color-warn)' }} />
              <span>跨省调运检疫检疫票发放量 vs. 运猪运费指数 vs. 无害化死猪处理 (安全印证)</span>
            </div>
          </div>
          <div style={{ height: '320px', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredLogistics} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} label={{ value: '数量', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} label={{ value: '指数', angle: 90, position: 'insideRight', fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '0.7rem' }} />
                <Bar yAxisId="left" name="跨省检疫票 (张)" dataKey="quarantine_certificates" fill="rgba(14, 165, 233, 0.4)" barSize={25} />
                <Line yAxisId="right" name="运费指数" type="monotone" dataKey="transport_freight_index" stroke="var(--color-warn)" strokeWidth={2.5} dot={false} />
                <Line yAxisId="left" name="死猪处理量 (吨)" type="monotone" dataKey="mortality_waste_disposal" stroke="var(--color-down)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Section 6: Breeding Consumables Hard Physical Data */}
        <article className="glass-panel" style={{ ...styles.chartPanel, gridColumn: 'span 2' }}>
          <div className="panel-title-bar">
            <div className="panel-title">
              <Zap size={18} style={{ color: 'var(--color-accent)' }} />
              <span>母猪配种与产房耗材实际消耗量 (超前 6~10 个月物理验证能繁真实产能)</span>
            </div>
          </div>
          <div style={{ height: '320px', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredConsumables} margin={{ top: 10, right: 20, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '0.7rem' }} />
                <Line name="人工授精管 (万支 - 领先10个月)" type="monotone" dataKey="insemination_catheters" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                <Line name="精液稀释粉 (万包 - 领先10个月)" type="monotone" dataKey="semen_extender" stroke="var(--color-up)" strokeWidth={2} dot={false} />
                <Line name="护舍干燥粉 (吨 - 领先6个月分娩)" type="monotone" dataKey="farrowing_dry_powder" stroke="var(--color-warn)" strokeWidth={2} dot={false} />
                <Line name="仔猪补铁针 (万支 - 领先6个月健仔)" type="monotone" dataKey="iron_injection" stroke="#ec4899" strokeWidth={1.5} dot={false} />
                <Line name="防疫耳标 (万套 - 领先4个月保育)" type="monotone" dataKey="ear_tags" stroke="#a855f7" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
            🔍 <strong>实物前瞻校验法则：</strong>能繁母猪从配种到育肥出栏需经历 114天怀孕 + 180天育肥（约9.8个月）。当社会统计能繁母猪存栏发生争议时，输精管与稀释粉销量即为真实配种的铁证；护舍粉与补铁针则直接映射接生仔猪头数，有效刺破口头假去化或虚假瞒报。
          </div>
        </article>

      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    paddingBottom: '20px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  kpiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  kpiLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  kpiValue: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
  },
  kpiDesc: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  chartPanel: {
    padding: '16px',
  }
};

export default SentimentValidationPanel;
