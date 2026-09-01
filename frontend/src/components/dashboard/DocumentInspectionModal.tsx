'use client';

import React from 'react';
import { MedicalDocumentRecord } from '@/types/document';
import { StatusBadge, CategoryBadge, ConfidenceIndicator } from '@/components/ui/StatusBadge';

interface DocumentInspectionModalProps {
  document: MedicalDocumentRecord | null;
  onClose: () => void;
  onOpenFullReview: (doc: MedicalDocumentRecord) => void;
}

export const DocumentInspectionModal: React.FC<DocumentInspectionModalProps> = ({
  document,
  onClose,
  onOpenFullReview,
}) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1917]/50 backdrop-blur-none p-4">
      <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-none">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#F2F1EC] border-b border-[#E2E0D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm text-[#1A1917]">
              {document.display_id}
            </span>
            <CategoryBadge category={document.category} />
            <StatusBadge status={document.status} />
          </div>
          <button
            onClick={onClose}
            className="text-sm font-mono text-[#5E5D57] hover:text-[#1A1917] px-2 py-0.5 rounded-[2px]"
          >
            [Close ×]
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Metadata Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#F9F9F7] border border-[#E2E0D8] rounded-[2px] font-mono">
            <div>
              <span className="text-[10px] text-[#5E5D57] uppercase block">Patient</span>
              <span className="font-bold text-[#1A1917] text-xs">
                {document.patient_name_preview}
              </span>
              <span className="text-[10px] text-[#5E5D57] block">
                ID: {document.patient_id_preview}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#5E5D57] uppercase block">Facility</span>
              <span className="font-medium text-[#1A1917] text-xs truncate block">
                {document.facility_name}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#5E5D57] uppercase block">Overall Confidence</span>
              <ConfidenceIndicator score={document.overall_confidence} />
            </div>
            <div>
              <span className="text-[10px] text-[#5E5D57] uppercase block">OCR Pipeline</span>
              <span className="text-xs text-[#1A1917] font-medium">
                {document.ocr_method === 'direct_pdf_stream' ? 'PyMuPDF Stream' : 'Tesseract OCR'}
              </span>
            </div>
          </div>

          {/* Validation Warnings if any */}
          {document.validation_issues.length > 0 && (
            <div className="p-3 bg-[#FDF6E4] border border-[#EBD9A4] rounded-[2px] space-y-1.5">
              <div className="text-[11px] font-mono font-bold uppercase text-[#855304]">
                Validation Flag ({document.validation_issues.length} item requiring attention)
              </div>
              {document.validation_issues.map((issue) => (
                <div key={issue.id} className="text-xs text-[#855304] flex items-start gap-2">
                  <span className="font-mono font-semibold">[{issue.field}]:</span>
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Structured Field Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917]">
              Extracted Structured Attributes
            </h3>

            {document.extracted_data && (
              <div className="border border-[#E2E0D8] rounded-[2px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F2F1EC] text-[10px] font-mono text-[#5E5D57] uppercase">
                    <tr>
                      <th className="py-2 px-3">Field</th>
                      <th className="py-2 px-3">Extracted Value</th>
                      <th className="py-2 px-3">Confidence</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F1EC]">
                    {/* Patient Name */}
                    <tr>
                      <td className="py-2 px-3 font-mono text-[#5E5D57]">patient_name</td>
                      <td className="py-2 px-3 font-medium text-[#1A1917]">
                        {document.extracted_data.patient_name.value}
                      </td>
                      <td className="py-2 px-3">
                        <ConfidenceIndicator score={document.extracted_data.patient_name.confidence} />
                      </td>
                      <td className="py-2 px-3 text-[11px] text-[#5E5D57]">
                        {document.extracted_data.patient_name.needsReview ? 'Needs Review' : 'Verified'}
                      </td>
                    </tr>

                    {/* Patient ID */}
                    <tr>
                      <td className="py-2 px-3 font-mono text-[#5E5D57]">patient_id</td>
                      <td className="py-2 px-3 font-medium text-[#1A1917] font-mono">
                        {document.extracted_data.patient_id.value}
                      </td>
                      <td className="py-2 px-3">
                        <ConfidenceIndicator score={document.extracted_data.patient_id.confidence} />
                      </td>
                      <td className="py-2 px-3 text-[11px] text-[#5E5D57]">Verified</td>
                    </tr>

                    {/* Category specific preview */}
                    {document.category === 'lab_report' && 'tests' in document.extracted_data && (
                      <tr>
                        <td className="py-2 px-3 font-mono text-[#5E5D57]">tests_extracted</td>
                        <td className="py-2 px-3 font-medium text-[#1A1917]" colSpan={3}>
                          <span className="font-bold">{document.extracted_data.tests.length} laboratory tests</span>: {document.extracted_data.tests.map(t => `${t.name} (${t.result} ${t.unit})`).join(', ')}
                        </td>
                      </tr>
                    )}

                    {document.category === 'medical_bill' && 'total_amount' in document.extracted_data && (
                      <tr>
                        <td className="py-2 px-3 font-mono text-[#5E5D57]">invoice_total</td>
                        <td className="py-2 px-3 font-bold text-[#1A1917] font-mono">
                          {document.extracted_data.total_amount.value}
                        </td>
                        <td className="py-2 px-3">
                          <ConfidenceIndicator score={document.extracted_data.total_amount.confidence} />
                        </td>
                        <td className="py-2 px-3 text-[11px] text-[#1C4D35] font-mono">
                          Math Verified
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit History */}
          {document.audit_history && document.audit_history.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <h4 className="text-[11px] font-mono uppercase text-[#5E5D57]">
                Processing Audit History
              </h4>
              <div className="border border-[#E2E0D8] rounded-[2px] p-2 bg-[#F9F9F7] space-y-1 text-[11px] font-mono">
                {document.audit_history.map((log, idx) => (
                  <div key={idx} className="flex items-baseline justify-between text-[#5E5D57]">
                    <div>
                      <span className="font-bold text-[#1A1917]">[{log.action}]</span> {log.details}
                    </div>
                    <span className="text-[10px] text-[#89877E] shrink-0 ml-2">
                      {log.operator}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 bg-[#F2F1EC] border-t border-[#E2E0D8] flex items-center justify-between">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(document.extracted_data || document, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = window.document.createElement('a');
              a.href = url;
              a.download = `${document.display_id}_structured_export.json`;
              a.click();
            }}
            className="px-3 py-1.5 text-xs font-mono bg-[#FFFFFF] hover:bg-[#FAF9F5] text-[#1A1917] border border-[#E2E0D8] rounded-[2px] transition-colors"
          >
            Export JSON
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#5E5D57] hover:text-[#1A1917] rounded-[2px]"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenFullReview(document);
              }}
              className="px-4 py-1.5 text-xs font-bold bg-[#1A1917] hover:bg-[#333230] text-[#FFFFFF] rounded-[2px] transition-colors"
            >
              Open Full Review Workstation &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
