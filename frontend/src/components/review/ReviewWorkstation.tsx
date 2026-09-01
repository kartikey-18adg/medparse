'use client';

import React, { useState } from 'react';
import { MedicalDocumentRecord, ExtractedStructuredData } from '@/types/document';
import { DocumentViewerPane } from './DocumentViewerPane';
import { LabReportReview } from './LabReportReview';
import { MedicalBillReview } from './MedicalBillReview';
import { PrescriptionReview } from './PrescriptionReview';
import { DischargeSummaryReview } from './DischargeSummaryReview';
import { AuditHistoryDrawer } from './AuditHistoryDrawer';
import { CodingSuggesterWidget } from './CodingSuggesterWidget';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge, CategoryBadge, ConfidenceIndicator } from '@/components/ui/StatusBadge';

interface ReviewWorkstationProps {
  document: MedicalDocumentRecord;
  onSaveDocument: (updatedDoc: MedicalDocumentRecord) => void;
  onVerifyRecord: (updatedDoc: MedicalDocumentRecord) => void;
  onReturnToWorkspace: () => void;
  onProceedToClaim: (doc: MedicalDocumentRecord) => void;
}

export const ReviewWorkstation: React.FC<ReviewWorkstationProps> = ({
  document: initialDoc,
  onSaveDocument,
  onVerifyRecord,
  onReturnToWorkspace,
  onProceedToClaim,
}) => {
  const { user } = useAuth();
  const [doc, setDoc] = useState<MedicalDocumentRecord>(initialDoc);
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);

  const operatorName = user ? `${user.full_name} (${user.role})` : 'Clinical Operator';

  const handleUpdateStructuredData = (updatedData: ExtractedStructuredData) => {
    setDoc((prev) => ({
      ...prev,
      extracted_data: updatedData,
      last_modified: new Date().toISOString(),
    }));
  };

  const handleSave = () => {
    onSaveDocument(doc);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleVerify = () => {
    const verifiedDoc: MedicalDocumentRecord = {
      ...doc,
      status: 'claim_ready',
      overall_confidence: 100,
      needs_human_review: false,
      unverified_field_count: 0,
      validation_issues: [],
      last_modified: new Date().toISOString(),
      audit_history: [
        ...(doc.audit_history || []),
        {
          action: 'Human Verification Certified',
          timestamp: new Date().toISOString(),
          operator: operatorName,
          details: 'All clinical and billing fields verified against source document. Status: READY FOR CLAIM.',
        },
      ],
    };
    setDoc(verifiedDoc);
    onVerifyRecord(verifiedDoc);
    setIsSavedNotice(true);
  };


  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-[#1A1917]">
      {/* Top Workstation Action Toolbar */}
      <div className="bg-[#FFFFFF] border-b border-[#E2E0D8] px-4 md:px-6 py-2.5 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Document info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToWorkspace}
            className="px-2.5 py-1 text-xs font-mono text-[#5E5D57] hover:text-[#1A1917] bg-[#F2F1EC] hover:bg-[#EAE8E2] border border-[#D5D3C8] rounded-[2px] transition-colors"
          >
            &larr; Return to Workspace
          </button>

          <div className="h-4 w-px bg-[#E2E0D8] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-[#1A1917]">
              {doc.display_id}
            </span>
            <CategoryBadge category={doc.category} />
            <StatusBadge status={doc.status} />
          </div>
        </div>

        {/* Right: Actions & Audit Trail */}
        <div className="flex items-center gap-2">
          {isSavedNotice && (
            <span className="text-[11px] font-mono text-[#1C4D35] bg-[#EAF5EE] px-2 py-0.5 border border-[#B8DFC8] rounded-[2px]">
              ✓ Changes Saved
            </span>
          )}

          <button
            onClick={() => setIsAuditOpen(true)}
            className="px-3 py-1.5 text-xs font-mono bg-[#FFFFFF] hover:bg-[#F2F1EC] text-[#5E5D57] hover:text-[#1A1917] border border-[#E2E0D8] rounded-[2px] transition-colors"
          >
            Audit Trail
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium bg-[#FFFFFF] hover:bg-[#F2F1EC] text-[#1A1917] border border-[#E2E0D8] rounded-[2px] transition-colors"
          >
            Save Changes
          </button>

          <button
            onClick={handleVerify}
            className="px-3.5 py-1.5 text-xs font-bold bg-[#1C4D35] hover:bg-[#153B28] text-[#FFFFFF] rounded-[2px] transition-colors"
          >
            Verify Record
          </button>

          {(doc.status === 'verified' || doc.status === 'claim_ready') && (
            <button
              onClick={() => onProceedToClaim(doc)}
              className="px-3.5 py-1.5 text-xs font-bold bg-[#1A1917] hover:bg-[#333230] text-[#FFFFFF] rounded-[2px] transition-colors flex items-center gap-1"
            >
              <span>View Claim Record</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Flagged Review Alert Strip if low confidence fields exist */}
      {doc.validation_issues.length > 0 && doc.status === 'needs_review' && (
        <div className="bg-[#FDF6E4] border-b border-[#EBD9A4] px-6 py-2 flex flex-wrap items-center justify-between text-xs text-[#855304] font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold">HUMAN VERIFICATION REQUIRED:</span>
            <span>
              {doc.validation_issues.map((i) => `[${i.field}]: ${i.message}`).join(' · ')}
            </span>
          </div>
          <span className="text-[11px] text-[#855304]">
            AI assists with extraction. Human verification remains the final step.
          </span>
        </div>
      )}

      {/* Main Split Screen Workspace */}
      <div className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1600px] w-full mx-auto">
        {/* Left Column: Source Document Viewer (Facsimile & OCR Stream with Bounding Grounding) */}
        <div className="lg:col-span-5 h-[calc(100vh-140px)] min-h-[500px]">
          <DocumentViewerPane
            document={doc}
            highlightedField={highlightedField}
          />
        </div>

        {/* Right Column: Structured Editable Information Workstation */}
        <div className="lg:col-span-7 h-[calc(100vh-140px)] min-h-[500px] bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3 bg-[#F2F1EC] border-b border-[#E2E0D8] flex flex-wrap items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1A1917]">EXTRACTED STRUCTURED DATA</span>
              <span>·</span>
              <span className="text-[#5E5D57]">Confidence:</span>
              <ConfidenceIndicator score={doc.overall_confidence} />
            </div>
            <div className="text-[11px] text-[#5E5D57]">
              Hover or edit any field to inspect visual coordinate grounding
            </div>
          </div>

          {/* Scrollable Editable Structured Content */}
          <div
            className="flex-1 p-5 overflow-y-auto"
            onMouseLeave={() => setHighlightedField(null)}
          >
            {doc.extracted_data && (
              <div
                onFocus={(e) => {
                  const target = e.target as HTMLElement;
                  const label = target.closest('div')?.querySelector('label')?.textContent;
                  if (label) setHighlightedField(label);
                }}
              >
                {doc.extracted_data.document_type === 'lab_report' && (
                  <LabReportReview
                    data={doc.extracted_data}
                    onUpdateData={handleUpdateStructuredData}
                  />
                )}

                {doc.extracted_data.document_type === 'medical_bill' && (
                  <MedicalBillReview
                    data={doc.extracted_data}
                    onUpdateData={handleUpdateStructuredData}
                  />
                )}

                {doc.extracted_data.document_type === 'prescription' && (
                  <PrescriptionReview
                    data={doc.extracted_data}
                    onUpdateData={handleUpdateStructuredData}
                  />
                )}

                {doc.extracted_data.document_type === 'discharge_summary' && (
                  <DischargeSummaryReview
                    data={doc.extracted_data}
                    onUpdateData={handleUpdateStructuredData}
                  />
                )}

                {/* ICD-10 & CPT Healthcare Code Intelligence Suggester */}
                <div className="pt-4 border-t border-[#E2E0D8]">
                  <CodingSuggesterWidget
                    diagnosisText={
                      doc.extracted_data.document_type === 'prescription' || doc.extracted_data.document_type === 'discharge_summary'
                        ? String(doc.extracted_data.diagnosis?.value || '')
                        : (doc.summary_preview || '')
                    }
                    procedureText={
                      doc.extracted_data.document_type === 'medical_bill'
                        ? String(doc.extracted_data.treatment_procedure?.value || '')
                        : doc.extracted_data.document_type === 'discharge_summary'
                        ? String(doc.extracted_data.procedures?.value || '')
                        : ''
                    }
                    onApplyCode={(code, desc) => {
                      setIsSavedNotice(true);
                      setTimeout(() => setIsSavedNotice(false), 2000);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Workstation Footer status bar */}
          <div className="px-5 py-2.5 bg-[#F2F1EC] border-t border-[#E2E0D8] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#5E5D57]">
            <div className="flex items-center gap-3">
              <span>Station: <strong>CDH-OP-04</strong></span>
              <span>·</span>
              <span>Operator: <strong>Dr. K. Patel</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span>Status: <strong className="text-[#1A1917] capitalize">{doc.status.replace('_', ' ')}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit History Drawer */}
      <AuditHistoryDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        document={doc}
      />
    </div>
  );
};
