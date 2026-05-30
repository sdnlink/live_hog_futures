import React from 'react';
import { Map } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import type { ProvincialPrice } from '../types';

interface RegionalPriceRankingProps {
  provPrices: ProvincialPrice[];
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

const RegionalPriceRanking: React.FC<RegionalPriceRankingProps> = ({ provPrices }) => {
  const sortedProvPrices = [...provPrices].sort((a, b) => b.price - a.price);

  return (
    <article className="glass-panel" style={{ flexShrink: 0 }}>
      <div className="panel-title-bar" style={{ marginBottom: '8px', paddingBottom: '4px' }}>
        <div className="panel-title" style={{ fontSize: '0.85rem' }}>
          <Map size={14} />
          <span>重点省份现货排名</span>
        </div>
      </div>

      <div style={{ height: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedProvPrices.slice(0, 10)}
            layout="vertical"
            margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis type="number" stroke="var(--text-muted)" fontSize={9} domain={[10, 20]} />
            <YAxis type="category" dataKey="province" stroke="var(--text-primary)" fontSize={9} width={35} />
            <Tooltip content={<CustomChartTooltip />} />
            <Bar
              name="价"
              dataKey="price"
              fill="var(--color-accent)"
              radius={[0, 2, 2, 0]}
              barSize={8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
};

export default RegionalPriceRanking;
