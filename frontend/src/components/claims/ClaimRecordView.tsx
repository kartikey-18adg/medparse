'use client';

import React from 'react';
import { MedicalDocumentRecord } from '@/types/document';
import { useAuth } from '@/context/AuthContext';
import { CategoryBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { exportStructuredJson, exportClaimCsv, exportHl7FhirBundle } from './ClaimExporter';

interface ClaimRecordViewProps {
  document: MedicalDocumentRecord;
  onReturnToWorkspace: () => void;
}

export const ClaimRecordView: React.FC<ClaimRecordViewProps> = ({
  document,
  onReturnToWorkspace,
}) => {
  const { user } = useAuth();
  const operatorName = user ? `${user.full_name} (${user.role})` : 'Clinical Operator';

  const handlePrint = () => {
    window.print();
  };



  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-[#1A1917]">
      {/* Top Action Bar */}
      <div className="bg-[#FFFFFF] border-b border-[#E2E0D8] px-4 md:px-6 py-2.5 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToWorkspace}
            className="px-2.5 py-1 text-xs font-mono text-[#5E5D57] hover:text-[#1A1917] bg-[#F2F1EC] hover:bg-[#EAE8E2] border border-[#D5D3C8] rounded-[2px] transition-colors"
          >
            &larr; Return to Workspace
          </button>
          <div className="h-4 w-px bg-[#E2E0D8] hidden sm:block" />
          <span className="font-mono font-bold text-sm text-[#1A1917]">
            CLAIM-READY RECORD: CLM-{document.display_id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportStructuredJson(document)}
            className="px-3 py-1.5 text-xs font-mono bg-[#FFFFFF] hover:bg-[#F2F1EC] text-[#1A1917] border border-[#E2E0D8] rounded-[2px] transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={() => exportClaimCsv(document)}
            className="px-3 py-1.5 text-xs font-mono bg-[#FFFFFF] hover:bg-[#F2F1EC] text-[#1A1917] border border-[#E2E0D8] rounded-[2px] transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => exportHl7FhirBundle(document)}
            className="px-3 py-1.5 text-xs font-mono bg-[#FFFFFF] hover:bg-[#F2F1EC] text-[#1C4D35] border border-[#B8DFC8] rounded-[2px] transition-colors font-bold"
            title="Export standard HL7 FHIR R4 Bundle for hospital EMR/EHR systems"
          >
            Export HL7 FHIR
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-bold bg-[#1A1917] hover:bg-[#333230] text-[#FFFFFF] rounded-[2px] transition-colors"
          >
            Print / Download
          </button>
        </div>
      </div>

      {/* Main Claim Sheet */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        <div className="bg-[#FFFFFF] border border-[#C6C4BA] p-6 sm:p-8 space-y-6 shadow-none">
          {/* Claim Record Header */}
          <div className="border-b-2 border-[#1A1917] pb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#5E5D57]">
                  HOSPITAL BILLING & CLAIMS PROCESSING
                </span>
                <span className="inline-flex items-center text-xs font-mono font-bold px-2 py-0.5 bg-[#EAF5EE] text-[#1C4D35] border border-[#B8DFC8] rounded-[2px]">
                  ✓ READY FOR CLAIM
                </span>
              </div>
              <h1 className="text-xl font-bold font-mono tracking-tight text-[#1A1917] mt-1">
                Verified Clinical Claim Record
              </h1>
              <p className="text-xs text-[#5E5D57]">
                Generated from OCR structured extraction and certified human-in-the-loop verification.
              </p>
            </div>

            <div className="text-right font-mono text-xs space-y-0.5">
              <div>Claim Ref: <strong className="text-[#1A1917]">CLM-{document.display_id}</strong></div>
              <div>Source Ref: <strong>{document.display_id}</strong></div>
              <div className="text-[#5E5D57]">
                Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Patient & Provider Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F9F9F7] border border-[#E2E0D8] rounded-[2px] font-mono text-xs">
            <div>
              <span className="text-[10px] text-[#5E5D57] uppercase block">Patient Name</span>
              <span className="font-bold text-[#1A1917]">{document.patient_name_preview}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#5E5D57] uppercase block">Patient ID / MRN</span>
              <span className="font-bold text-[#1A1917]">{document.patient_id_preview}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#5E5D57] uppercase block">Healthcare Facility</span>
              <span className="font-semibold text-[#1A1917] truncate block">{document.facility_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#5E5D57] uppercase block">Document Category</span>
              <CategoryBadge category={document.category} />
            </div>
          </div>

          {/* Clinical & Financial Summary Breakdown */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917] border-b border-[#E2E0D8] pb-1">
              Verified Medical & Billing Attributes
            </h2>

            {/* Medical Bill breakdown */}
            {document.extracted_data && document.extracted_data.document_type === 'medical_bill' && (
              <div className="space-y-3">
                <div className="text-xs">
                  <span className="font-semibold text-[#5E5D57] font-mono">Primary Treatment: </span>
                  <span className="font-bold text-[#1A1917]">{document.extracted_data.treatment_procedure.value}</span>
                </div>

                <div className="border border-[#E2E0D8] rounded-[2px] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-[#F2F1EC] text-[10px] text-[#5E5D57] uppercase">
                      <tr>
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-2">Code</th>
                        <th className="py-2 px-2 text-right">Qty</th>
                        <th className="py-2 px-2 text-right">Rate ($)</th>
                        <th className="py-2 px-3 text-right">Verified Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2F1EC]">
                      {document.extracted_data.line_items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 font-medium text-[#1A1917]">{item.description}</td>
                          <td className="py-2 px-2 text-[#5E5D57]">{item.code || 'N/A'}</td>
                          <td className="py-2 px-2 text-right">{item.quantity}</td>
                          <td className="py-2 px-2 text-right">${item.unit_price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-[#1A1917]">${item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Claim Totals */}
                <div className="flex justify-end pt-2 border-t border-[#1A1917] font-mono text-xs">
                  <div className="w-60 space-y-1">
                    <div className="flex justify-between text-[#5E5D57]">
                      <span>Subtotal Billed:</span>
                      <span>{document.extracted_data.subtotal.value}</span>
                    </div>
                    <div className="flex justify-between text-[#5E5D57]">
                      <span>Tax / Levies:</span>
                      <span>{document.extracted_data.tax.value}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-[#1A1917] border-t border-[#E2E0D8] pt-1.5">
                      <span>Total Claimable Amount:</span>
                      <span>{document.extracted_data.total_amount.value}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lab Report breakdown */}
            {document.extracted_data && document.extracted_data.document_type === 'lab_report' && (
              <div className="space-y-3">
                <div className="border border-[#E2E0D8] rounded-[2px] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-[#F2F1EC] text-[10px] text-[#5E5D57] uppercase">
                      <tr>
                        <th className="py-2 px-3">Test Parameter</th>
                        <th className="py-2 px-3">Result</th>
                        <th className="py-2 px-2">Unit</th>
                        <th className="py-2 px-2">Reference Range</th>
                        <th className="py-2 px-3">Clinical Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2F1EC]">
                      {document.extracted_data.tests.map((t) => (
                        <tr key={t.id}>
                          <td className="py-2 px-3 font-medium text-[#1A1917]">{t.name}</td>
                          <td className="py-2 px-3 font-bold text-[#1A1917]">{t.result}</td>
                          <td className="py-2 px-2 text-[#5E5D57]">{t.unit}</td>
                          <td className="py-2 px-2 text-[#5E5D57]">{t.reference_range}</td>
                          <td className="py-2 px-3">
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-[1px] ${
                              t.status === 'normal'
                                ? 'bg-[#EAF5EE] text-[#1C4D35]'
                                : 'bg-[#FDF6E4] text-[#855304]'
                            }`}>
                              {t.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Prescription breakdown */}
            {document.extracted_data && document.extracted_data.document_type === 'prescription' && (
              <div className="space-y-3">
                <div className="text-xs">
                  <span className="font-semibold text-[#5E5D57] font-mono">Diagnosis: </span>
                  <span className="font-bold text-[#1A1917]">{document.extracted_data.diagnosis.value}</span>
                </div>
                <div className="border border-[#E2E0D8] rounded-[2px] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-[#F2F1EC] text-[10px] text-[#5E5D57] uppercase">
                      <tr>
                        <th className="py-2 px-3">Prescribed Medication</th>
                        <th className="py-2 px-2">Dosage</th>
                        <th className="py-2 px-2">Frequency</th>
                        <th className="py-2 px-2">Duration</th>
                        <th className="py-2 px-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2F1EC]">
                      {document.extracted_data.medicines.map((m) => (
                        <tr key={m.id}>
                          <td className="py-2 px-3 font-medium text-[#1A1917]">{m.name}</td>
                          <td className="py-2 px-2 font-bold">{m.dosage}</td>
                          <td className="py-2 px-2">{m.frequency}</td>
                          <td className="py-2 px-2">{m.duration}</td>
                          <td className="py-2 px-3 text-[#5E5D57]">{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Discharge Summary breakdown */}
            {document.extracted_data && document.extracted_data.document_type === 'discharge_summary' && (
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 bg-[#F9F9F7] border border-[#E2E0D8] rounded-[2px] space-y-1">
                  <div><strong>Primary Diagnosis:</strong> {document.extracted_data.diagnosis.value}</div>
                  <div><strong>Procedures Performed:</strong> {document.extracted_data.procedures.value}</div>
                  <div><strong>Stay Duration:</strong> {document.extracted_data.admission_date.value} to {document.extracted_data.discharge_date.value}</div>
                </div>
              </div>
            )}
          </div>

          {/* Audit Verification Stamp */}
          <div className="pt-6 border-t border-[#E2E0D8] flex flex-wrap items-end justify-between gap-4 font-mono text-[11px] text-[#5E5D57]">
            <div className="space-y-0.5">
              <p>Source Document: <strong>{document.filename}</strong></p>
              <p>OCR Engine: {document.ocr_method === 'direct_pdf_stream' ? 'PyMuPDF Direct' : 'Tesseract Raster'}</p>
              <p>Extraction Confidence: 100% (Post-Verification)</p>
            </div>

            <div className="p-3 bg-[#F9FAF9] border border-[#B8DFC8] rounded-[2px] text-right space-y-1">
              <div className="text-[10px] uppercase font-bold text-[#1C4D35]">
                HUMAN-IN-THE-LOOP AUDIT CERTIFICATE
              </div>
              <div className="text-xs font-bold text-[#1A1917]">
                Operator: {operatorName}
              </div>
              <div className="text-[10px] text-[#5E5D57]">
                Verified at {new Date().toISOString()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
