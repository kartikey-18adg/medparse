import React from 'react';
import { WorkspaceMetrics } from '@/types/document';

interface MetricStripProps {
  metrics: WorkspaceMetrics;
  onFilterReviewQueue: () => void;
  onFilterProcessed: () => void;
  onFilterAll: () => void;
}

export const MetricStrip: React.FC<MetricStripProps> = ({
  metrics,
  onFilterReviewQueue,
  onFilterProcessed,
  onFilterAll,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Metric 1: Documents Today */}
      <div 
        onClick={onFilterAll}
        className="p-4 bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] cursor-pointer hover:border-[#C6C4BA] transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-mono text-[#5E5D57]">
            Documents Today
          </span>
          <span className="text-[11px] font-mono text-[#89877E]">24h period</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-tabular text-[#1A1917]">
            {metrics.documents_today_count}
          </span>
          <span className="text-xs text-[#5E5D57]">ingested</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#F2F1EC] text-[11px] text-[#5E5D57]">
          <span>4 document types active</span>
        </div>
      </div>

      {/* Metric 2: Needs Review */}
      <div 
        onClick={onFilterReviewQueue}
        className="p-4 bg-[#FFFFFF] border border-[#EBD9A4] rounded-[2px] cursor-pointer hover:bg-[#FFFCF4] transition-colors"
        style={{ backgroundColor: '#FDFCF7' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-mono text-[#855304] font-semibold">
            Needs Review
          </span>
          <span className="w-2 h-2 rounded-full bg-[#855304]" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-tabular text-[#855304]">
            {metrics.needs_review_count}
          </span>
          <span className="text-xs text-[#855304] font-medium">pending verification</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#F5EDD5] text-[11px] text-[#855304]">
          <span>Low confidence / discrepancy</span>
        </div>
      </div>

      {/* Metric 3: Processed */}
      <div 
        onClick={onFilterProcessed}
        className="p-4 bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] cursor-pointer hover:border-[#C6C4BA] transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-mono text-[#5E5D57]">
            Processed
          </span>
          <span className="text-[11px] font-mono text-[#1C4D35]">Online</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-tabular text-[#1A1917]">
            {metrics.processed_count}
          </span>
          <span className="text-xs text-[#5E5D57]">structured records</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#F2F1EC] text-[11px] text-[#5E5D57]">
          <span>{metrics.verified_count} verified for billing</span>
        </div>
      </div>

      {/* Metric 4: Average Confidence */}
      <div className="p-4 bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px]">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-mono text-[#5E5D57]">
            Avg. Confidence
          </span>
          <span className="text-[11px] font-mono text-[#1C4D35]">
            {metrics.average_confidence >= 90 ? 'High Band' : metrics.average_confidence >= 75 ? 'Med Band' : metrics.average_confidence > 0 ? 'Review Band' : 'Zero State'}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-tabular text-[#1C4D35]">
            {metrics.average_confidence}%
          </span>
          <span className="text-xs text-[#5E5D57]">weighted score</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#F2F1EC] text-[11px] text-[#5E5D57]">
          <span>Threshold requirement &ge; 90%</span>
        </div>
      </div>
    </div>
  );
};
