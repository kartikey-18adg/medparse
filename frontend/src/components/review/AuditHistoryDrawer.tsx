'use client';

import React from 'react';
import { MedicalDocumentRecord } from '@/types/document';

interface AuditHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: MedicalDocumentRecord;
}

export const AuditHistoryDrawer: React.FC<AuditHistoryDrawerProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#1A1917]/40 backdrop-blur-none">
      <div className="bg-[#FFFFFF] border-l border-[#E2E0D8] w-full max-w-md h-full flex flex-col shadow-none">
        {/* Header */}
        <div className="px-5 py-4 bg-[#F2F1EC] border-b border-[#E2E0D8] flex items-center justify-between">
          <div>
            <h3 className="font-mono font-bold text-xs uppercase text-[#1A1917]">
              VERIFICATION AUDIT TRAIL
            </h3>
            <p className="text-[11px] font-mono text-[#5E5D57]">
              Immutable record for {document.display_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#5E5D57] hover:text-[#1A1917] px-2 py-1 rounded-[2px]"
          >
            [Close ×]
          </button>
        </div>

        {/* Timeline Events */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Document Ingestion Event */}
          <div className="flex items-start gap-3 relative pb-4 border-l-2 border-[#1A1917] pl-4 ml-1">
            <span className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-[#1A1917]" />
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-[#1A1917]">1. Document Received</span>
                <span className="text-[10px] text-[#89877E]">
                  {document.upload_timestamp.substring(0, 19).replace('T', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-[#5E5D57]">
                Ingested <strong className="text-[#1A1917]">{document.filename}</strong> ({Math.round(document.file_size_bytes / 1024)} KB) via Intake Station.
              </p>
            </div>
          </div>

          {/* Optical OCR & Classification Event */}
          <div className="flex items-start gap-3 relative pb-4 border-l-2 border-[#1A1917] pl-4 ml-1">
            <span className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-[#1A1917]" />
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-[#1A1917]">2. OCR & Classification</span>
                <span className="text-[10px] text-[#89877E]">
                  {document.upload_timestamp.substring(0, 19).replace('T', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-[#5E5D57]">
                Extracted via <strong className="text-[#1A1917]">{document.ocr_method}</strong>. Classified as <strong className="text-[#1A1917]">{document.category.toUpperCase()}</strong>.
              </p>
              <div className="text-[10px] text-[#5E5D57] bg-[#F9F9F7] p-1.5 border border-[#E2E0D8] rounded-[2px]">
                Computed Base Confidence: {document.overall_confidence}%
              </div>
            </div>
          </div>

          {/* Custom Audit History Entries */}
          {document.audit_history && document.audit_history.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3 relative pb-4 border-l-2 border-[#1C4D35] pl-4 ml-1">
              <span className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-[#1C4D35]" />
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-[#1C4D35]">{idx + 3}. {log.action}</span>
                  <span className="text-[10px] text-[#89877E]">
                    {log.timestamp.substring(0, 19).replace('T', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-[#1A1917]">{log.details}</p>
                <div className="text-[10px] text-[#89877E]">Operator: {log.operator}</div>
              </div>
            </div>
          ))}

          {/* Verification Status Banner */}
          <div className="p-3 bg-[#EAF5EE] border border-[#B8DFC8] rounded-[2px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#1C4D35]">
                {document.status === 'claim_ready' || document.status === 'verified'
                  ? '✓ VERIFICATION CERTIFIED'
                  : 'HUMAN REVIEW PENDING'}
              </span>
              <span className="text-[10px] font-mono text-[#1C4D35]">
                {document.overall_confidence}% Score
              </span>
            </div>
            <p className="text-[11px] text-[#1C4D35]">
              {document.status === 'claim_ready' || document.status === 'verified'
                ? 'All field modifications reconciled against source image. Record locked for claims processing.'
                : 'Pending clinical operator sign-off.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F2F1EC] border-t border-[#E2E0D8] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1 text-xs font-mono bg-[#1A1917] text-[#FFFFFF] rounded-[2px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
