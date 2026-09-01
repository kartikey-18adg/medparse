'use client';

import React, { useState } from 'react';
import { ConfidenceIndicator } from '@/components/ui/StatusBadge';

interface CodeSuggestion {
  code: string;
  description: string;
  category: string;
  confidence: number;
}

interface CodingSuggesterWidgetProps {
  diagnosisText?: string;
  procedureText?: string;
  onApplyCode?: (code: string, description: string) => void;
}

export const CodingSuggesterWidget: React.FC<CodingSuggesterWidgetProps> = ({
  diagnosisText = '',
  procedureText = '',
  onApplyCode,
}) => {
  const [appliedCodes, setAppliedCodes] = useState<string[]>([]);

  // Heuristic ICD-10 & CPT suggestions based on clinical text
  const getSuggestions = (): CodeSuggestion[] => {
    const combined = (diagnosisText + ' ' + procedureText).toLowerCase();
    const list: CodeSuggestion[] = [];

    if (combined.includes('cholecystitis') || combined.includes('gallbladder')) {
      list.push({
        code: 'ICD-10: K80.00',
        description: 'Calculus of gallbladder with acute cholecystitis without obstruction',
        category: 'Digestive & Gastro',
        confidence: 98,
      });
      list.push({
        code: 'CPT: 47562',
        description: 'Laparoscopy, surgical; cholecystectomy',
        category: 'Surgical Procedure',
        confidence: 98,
      });
    }

    if (combined.includes('sinusitis') || combined.includes('rhinosinusitis') || combined.includes('ent')) {
      list.push({
        code: 'ICD-10: J01.90',
        description: 'Acute sinusitis, unspecified',
        category: 'Respiratory (ENT)',
        confidence: 97,
      });
    }

    if (combined.includes('trauma') || combined.includes('emergency') || combined.includes('head')) {
      list.push({
        code: 'CPT: 99284',
        description: 'Emergency department visit, Level 4 (High Medical Decision)',
        category: 'Evaluation & Management',
        confidence: 98,
      });
      list.push({
        code: 'CPT: 70450',
        description: 'CT Scan head/brain without contrast material',
        category: 'Diagnostic Radiology',
        confidence: 99,
      });
      list.push({
        code: 'ICD-10: S09.90XA',
        description: 'Unspecified injury of head, initial encounter',
        category: 'Trauma & Injury',
        confidence: 94,
      });
    }

    if (combined.includes('glucose') || combined.includes('diabetes')) {
      list.push({
        code: 'ICD-10: R73.09',
        description: 'Other abnormal glucose (Impaired fasting glucose)',
        category: 'Endocrine & Metabolic',
        confidence: 95,
      });
    }

    if (combined.includes('mri') || combined.includes('lumbar')) {
      list.push({
        code: 'CPT: 72148',
        description: 'MRI Lumbar spine without contrast',
        category: 'Diagnostic Radiology',
        confidence: 99,
      });
    }

    if (list.length === 0) {
      list.push({
        code: 'ICD-10: R69',
        description: 'Illness, unspecified (Clinical diagnosis review pending)',
        category: 'General Clinical Findings',
        confidence: 85,
      });
    }

    return list;
  };

  const suggestions = getSuggestions();

  const handleApply = (item: CodeSuggestion) => {
    if (!appliedCodes.includes(item.code)) {
      setAppliedCodes([...appliedCodes, item.code]);
      if (onApplyCode) {
        onApplyCode(item.code, item.description);
      }
    }
  };

  return (
    <div className="p-3 bg-[#FBFBFA] border border-[#E2E0D8] rounded-[2px] space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#F2F1EC] pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[#1A1917] text-[11px] uppercase tracking-wider">
            ICD-10 & CPT Code Intelligence Suggester
          </span>
          <span className="text-[10px] text-[#5E5D57] bg-[#EAE8DF] px-1.5 py-0.2 rounded-[1px]">
            Billing Intelligence
          </span>
        </div>
        <span className="text-[10px] text-[#5E5D57]">
          {suggestions.length} matched codes
        </span>
      </div>

      <p className="text-[11px] text-[#5E5D57]">
        Clinical NLP cross-referenced standard billing codes for insurance claims:
      </p>

      <div className="space-y-1.5 pt-1">
        {suggestions.map((item, idx) => {
          const isApplied = appliedCodes.includes(item.code);

          return (
            <div
              key={idx}
              className={`p-2 rounded-[2px] border flex flex-wrap items-center justify-between gap-2 transition-colors ${
                isApplied
                  ? 'bg-[#EAF5EE] border-[#B8DFC8]'
                  : 'bg-[#FFFFFF] border-[#E2E0D8] hover:border-[#1A1917]'
              }`}
            >
              <div className="space-y-0.5 max-w-[420px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1A1917] text-xs">
                    {item.code}
                  </span>
                  <span className="text-[10px] text-[#5E5D57]">
                    [{item.category}]
                  </span>
                  <ConfidenceIndicator score={item.confidence} showLabel={false} />
                </div>
                <div className="text-[11px] text-[#5E5D57] leading-tight">
                  {item.description}
                </div>
              </div>

              <div>
                {isApplied ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold text-[#1C4D35] bg-[#FFFFFF] border border-[#B8DFC8] rounded-[2px]">
                    ✓ Attached to Claim
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApply(item)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#1A1917] hover:bg-[#333230] text-[#FFFFFF] rounded-[2px] transition-colors"
                  >
                    + Attach Code
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
