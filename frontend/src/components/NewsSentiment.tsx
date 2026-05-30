import React from 'react';
import { FileText } from 'lucide-react';
import type { EpidemicReport, SentimentIndex } from '../types';

interface NewsSentimentProps {
  epidemicReports: EpidemicReport[];
  sentimentIndex: SentimentIndex[];
}

const NewsSentiment: React.FC<NewsSentimentProps> = ({ epidemicReports, sentimentIndex }) => {
  return (
    <article className="glass-panel news-section">
      <div className="panel-title-bar" style={{ marginBottom: '8px', paddingBottom: '4px' }}>
        <div className="panel-title" style={{ fontSize: '0.85rem' }}>
          <FileText size={14} />
          <span>舆情监控</span>
        </div>
      </div>

      <div className="epidemic-feed" style={{ maxHeight: '140px', overflowY: 'auto' }}>
        {epidemicReports.slice(0, 3).map((report, idx) => (
          <div key={idx} className="epidemic-item" style={{ padding: '6px' }}>
            <div className="epidemic-item-header">
              <span className="epidemic-title" style={{ fontSize: '0.72rem', width: '180px' }}>{report.title}</span>
              <span className="epidemic-date mono" style={{ fontSize: '0.6rem' }}>{report.date.slice(5)}</span>
            </div>
            <p className="epidemic-body" style={{ fontSize: '0.68rem', WebkitLineClamp: 1 }}>{report.content}</p>
          </div>
        ))}
      </div>

      <div className="sentiment-grid" style={{ marginTop: '8px', gap: '4px' }}>
        {sentimentIndex.slice(0, 4).map((item, idx) => {
          const isHigh = item.sentiment_score > 50;
          const isMedium = item.sentiment_score > 25 && item.sentiment_score <= 50;
          const scoreClass = isHigh ? 'high' : isMedium ? 'medium' : 'low';

          return (
            <div key={idx} className="sentiment-badge" style={{ padding: '4px 8px' }}>
              <span className="sentiment-kw" style={{ fontSize: '0.65rem' }}>{item.keyword}</span>
              <span className={`sentiment-score ${scoreClass} mono`} style={{ fontSize: '0.7rem' }}>{item.sentiment_score}%</span>
            </div>
          );
        })}
      </div>
    </article>
  );
};

export default NewsSentiment;
