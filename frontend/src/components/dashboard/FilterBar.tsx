'use client';

import React from 'react';
import { DocumentCategory, DocumentStatus } from '@/types/document';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  totalResultsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  totalResultsCount,
}) => {
  const categories: { label: string; value: string }[] = [
    { label: 'All Documents', value: 'all' },
    { label: 'Lab Reports', value: 'lab_report' },
    { label: 'Medical Bills', value: 'medical_bill' },
    { label: 'Prescriptions', value: 'prescription' },
    { label: 'Discharge Summaries', value: 'discharge_summary' },
  ];

  const statuses: { label: string; value: string }[] = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Needs Review', value: 'needs_review' },
    { label: 'Verified', value: 'verified' },
    { label: 'Claim Ready', value: 'claim_ready' },
    { label: 'Processed', value: 'processed' },
  ];

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] p-3 space-y-3">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2F1EC] pb-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-[2px] transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-[#1A1917] text-[#FFFFFF]'
                  : 'text-[#5E5D57] hover:bg-[#F2F1EC] hover:text-[#1A1917]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-[#5E5D57]">
          Showing <span className="font-bold text-[#1A1917]">{totalResultsCount}</span> records
        </div>
      </div>

      {/* Search and Secondary Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Document ID, Patient Name, Patient ID, Facility..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 text-xs bg-[#F7F7F5] border border-[#E2E0D8] rounded-[2px] text-[#1A1917] placeholder-[#89877E] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#1A1917] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1.5 text-xs text-[#89877E] hover:text-[#1A1917]"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Status Dropdown Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#5E5D57] font-medium whitespace-nowrap">
            Status:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F7F7F5] border border-[#E2E0D8] rounded-[2px] text-[#1A1917] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#1A1917]"
          >
            {statuses.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
