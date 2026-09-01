'use client';

import React from 'react';
import { FieldConfidence } from '@/types/document';
import { ConfidenceIndicator } from '@/components/ui/StatusBadge';

interface FieldConfidenceInputProps {
  label: string;
  field: FieldConfidence;
  onChange: (updatedValue: string | number) => void;
  onVerify: () => void;
  multiline?: boolean;
  type?: 'text' | 'number';
  placeholder?: string;
  helpText?: string;
}

export const FieldConfidenceInput: React.FC<FieldConfidenceInputProps> = ({
  label,
  field,
  onChange,
  onVerify,
  multiline = false,
  type = 'text',
  placeholder = '',
  helpText,
}) => {
  const isLowConfidence = field.confidence < 80 && !field.isVerified;
  const isVerified = !!field.isVerified;

  return (
    <div className={`p-2.5 rounded-[2px] border transition-colors ${
      isLowConfidence
        ? 'bg-[#FFFDF7] border-[#EBD9A4]'
        : isVerified
        ? 'bg-[#F9FAF9] border-[#B8DFC8]'
        : 'bg-[#FFFFFF] border-[#E2E0D8] hover:border-[#C6C4BA]'
    }`}>
      {/* Label and Confidence / Verification Badge */}
      <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
        <label className="text-[11px] font-mono uppercase font-semibold text-[#5E5D57]">
          {label}
        </label>
        
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#EAF5EE] text-[#1C4D35] border border-[#B8DFC8] rounded-[2px]">
              ✓ Verified manually
            </span>
          ) : (
            <>
              <ConfidenceIndicator score={field.confidence} />
              {field.needsReview && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#FDF6E4] text-[#855304] border border-[#EBD9A4] rounded-[2px]">
                  Needs Review
                </span>
              )}
            </>
          )}

          {!isVerified && (
            <button
              type="button"
              onClick={onVerify}
              title="Mark this field as manually verified"
              className="text-[10px] font-mono px-1.5 py-0.5 bg-[#F2F1EC] hover:bg-[#1A1917] hover:text-[#FFFFFF] text-[#1A1917] border border-[#D5D3C8] rounded-[2px] transition-colors"
            >
              Verify
            </button>
          )}
        </div>
      </div>

      {/* Input or Textarea */}
      {multiline ? (
        <textarea
          rows={3}
          value={field.value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-2.5 py-1.5 text-xs font-sans rounded-[2px] border text-[#1A1917] focus:outline-none focus:bg-[#FFFFFF] transition-colors ${
            isLowConfidence
              ? 'border-[#EBD9A4] bg-[#FFFFFF] focus:border-[#855304]'
              : 'border-[#E2E0D8] bg-[#FBFBFA] focus:border-[#1A1917]'
          }`}
        />
      ) : (
        <input
          type={type}
          value={field.value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-2.5 py-1 text-xs font-medium rounded-[2px] border text-[#1A1917] focus:outline-none focus:bg-[#FFFFFF] transition-colors ${
            isLowConfidence
              ? 'border-[#EBD9A4] bg-[#FFFFFF] focus:border-[#855304]'
              : 'border-[#E2E0D8] bg-[#FBFBFA] focus:border-[#1A1917]'
          }`}
        />
      )}

      {helpText && (
        <span className="text-[10px] text-[#89877E] mt-1 block">
          {helpText}
        </span>
      )}
    </div>
  );
};
