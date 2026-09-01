import React from 'react';
import { DocumentCategory, DocumentStatus, ConfidenceLevel } from '@/types/document';

interface StatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'needs_review':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-[2px] border ${sizeClasses}`}
          style={{
            color: 'var(--status-amber-text)',
            backgroundColor: 'var(--status-amber-bg)',
            borderColor: 'var(--status-amber-border)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[#855304]" />
          Needs Review
        </span>
      );
    case 'verified':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-[2px] border ${sizeClasses}`}
          style={{
            color: 'var(--status-green-text)',
            backgroundColor: 'var(--status-green-bg)',
            borderColor: 'var(--status-green-border)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[#1C4D35]" />
          Verified
        </span>
      );
    case 'claim_ready':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-[2px] border ${sizeClasses}`}
          style={{
            color: '#114B3F',
            backgroundColor: '#E6F4EA',
            borderColor: '#A3D9C9',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[#114B3F]" />
          Claim Ready
        </span>
      );
    case 'processed':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-[2px] border ${sizeClasses}`}
          style={{
            color: 'var(--status-neutral-text)',
            backgroundColor: 'var(--status-neutral-bg)',
            borderColor: 'var(--status-neutral-border)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[#5A6872]" />
          Processed
        </span>
      );
    case 'processing':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-[2px] border animate-pulse ${sizeClasses}`}
          style={{
            color: '#1C3D5A',
            backgroundColor: '#E8F1F8',
            borderColor: '#BDD5E7',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[#1C3D5A]" />
          Processing
        </span>
      );
    case 'error':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-[2px] border ${sizeClasses}`}
          style={{
            color: 'var(--status-red-text)',
            backgroundColor: 'var(--status-red-bg)',
            borderColor: 'var(--status-red-border)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[#8A1E20]" />
          Error
        </span>
      );
    default:
      return null;
  }
};

interface CategoryBadgeProps {
  category: DocumentCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const formatLabel = (cat: DocumentCategory) => {
    switch (cat) {
      case 'lab_report':
        return 'Lab Report';
      case 'medical_bill':
        return 'Medical Bill';
      case 'prescription':
        return 'Prescription';
      case 'discharge_summary':
        return 'Discharge Summary';
      default:
        return cat;
    }
  };

  return (
    <span className="inline-flex items-center text-[11px] font-mono px-2 py-0.5 bg-[#F0EFEB] text-[#4A4843] border border-[#DDDCD5] rounded-[2px]">
      {formatLabel(category)}
    </span>
  );
};

interface ConfidenceIndicatorProps {
  score: number; // 0 - 100
  showLabel?: boolean;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  showLabel = true,
}) => {
  let levelClass = '';
  let dotColor = '';

  if (score >= 95) {
    levelClass = 'text-[#1C4D35]';
    dotColor = 'bg-[#1C4D35]';
  } else if (score >= 80) {
    levelClass = 'text-[#855304]';
    dotColor = 'bg-[#855304]';
  } else {
    levelClass = 'text-[#8A1E20]';
    dotColor = 'bg-[#8A1E20]';
  }

  return (
    <div className="inline-flex items-center gap-1.5 font-tabular text-xs">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className={`font-semibold ${levelClass}`}>{score}%</span>
      {showLabel && score < 80 && (
        <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-[#FDF0F0] text-[#8A1E20] border border-[#F0C4C4] rounded-[2px]">
          Low
        </span>
      )}
    </div>
  );
};
