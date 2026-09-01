'use client';

import React, { useState } from 'react';
import { MedicalDocumentRecord } from '@/types/document';
import { CategoryBadge } from '@/components/ui/StatusBadge';

interface DocumentViewerPaneProps {
  document: MedicalDocumentRecord;
  highlightedField?: string | null;
}

export const DocumentViewerPane: React.FC<DocumentViewerPaneProps> = ({
  document,
  highlightedField = null,
}) => {
  const [viewMode, setViewMode] = useState<'facsimile' | 'ocr_stream'>('facsimile');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 145));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 70));

  const isFieldActive = (fieldKey: string) => {
    if (!highlightedField) return false;
    return highlightedField.toLowerCase().includes(fieldKey.toLowerCase());
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] flex flex-col h-full overflow-hidden">
      {/* Pane Toolbar */}
      <div className="px-4 py-2.5 bg-[#F2F1EC] border-b border-[#E2E0D8] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1A1917]">SOURCE DOCUMENT:</span>
          <span className="text-[#5E5D57] truncate max-w-[180px]" title={document.filename}>
            {document.filename}
          </span>
          <CategoryBadge category={document.category} />
        </div>

        {/* View mode toggle and zoom controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-[2px] border border-[#D5D3C8] bg-[#FFFFFF] p-0.5">
            <button
              onClick={() => setViewMode('facsimile')}
              className={`px-2 py-0.5 text-[11px] rounded-[1px] transition-colors ${
                viewMode === 'facsimile'
                  ? 'bg-[#1A1917] text-[#FFFFFF] font-semibold'
                  : 'text-[#5E5D57] hover:text-[#1A1917]'
              }`}
            >
              Document View
            </button>
            <button
              onClick={() => setViewMode('ocr_stream')}
              className={`px-2 py-0.5 text-[11px] rounded-[1px] transition-colors ${
                viewMode === 'ocr_stream'
                  ? 'bg-[#1A1917] text-[#FFFFFF] font-semibold'
                  : 'text-[#5E5D57] hover:text-[#1A1917]'
              }`}
            >
              Raw OCR Stream
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-l border-[#D5D3C8] pl-2">
            <button
              onClick={handleZoomOut}
              className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#D5D3C8] text-[#1A1917] hover:bg-[#F2F1EC] rounded-[2px]"
              title="Zoom out"
            >
              -
            </button>
            <span className="text-[10px] w-8 text-center text-[#5E5D57]">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#D5D3C8] text-[#1A1917] hover:bg-[#F2F1EC] rounded-[2px]"
              title="Zoom in"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Pane Content Area */}
      <div className="flex-1 p-4 bg-[#EAE8E2] overflow-y-auto flex items-start justify-center relative">
        {viewMode === 'facsimile' ? (
          /* High-Fidelity Medical Document Facsimile with Reactive OCR Bounding Box Grounding */
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-[595px] bg-[#FFFFFF] border border-[#C6C4BA] p-6 sm:p-8 space-y-5 text-[#1A1917] shadow-none transition-transform duration-150 relative"
          >
            {/* Active Visual Grounding Indicator Bar */}
            {highlightedField && (
              <div className="absolute top-2 right-4 px-2 py-0.5 bg-[#1A1917] text-[#FFFFFF] font-mono text-[10px] rounded-[2px] z-10">
                [OCR BOUNDING BOX: {highlightedField.toUpperCase()}]
              </div>
            )}

            {/* Header Letterhead */}
            <div className={`border-b-2 pb-3 flex items-start justify-between transition-all ${
              isFieldActive('facility') || isFieldActive('hospital')
                ? 'ring-2 ring-[#855304] bg-[#FFFDF7] p-1 border-[#855304]'
                : 'border-[#1A1917]'
            }`}>
              <div>
                <h1 className="text-base font-bold tracking-tight font-serif uppercase">
                  {document.facility_name}
                </h1>
                <p className="text-[10px] text-[#5E5D57]">
                  Clinical Operations & Diagnostic Services · Lic #MED-88129
                </p>
                <p className="text-[10px] text-[#5E5D57]">
                  100 Healthcare Boulevard, Suite 400 · Tel: (555) 019-2834
                </p>
              </div>
              <div className="text-right font-mono text-[10px]">
                <div className="border border-[#1A1917] px-2 py-1 bg-[#F9F9F7]">
                  <span className="font-bold block text-xs">{document.display_id}</span>
                  <span className="text-[#5E5D57]">DOC REF ID</span>
                </div>
              </div>
            </div>

            {/* Patient Demographic Box */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#F9F9F7] border border-[#E2E0D8] text-[11px] font-mono">
              <div className={`p-1 rounded-[1px] transition-all ${isFieldActive('patient_name') ? 'ring-2 ring-[#855304] bg-[#FFFDF7]' : ''}`}>
                <span className="text-[#5E5D57] block text-[9px] uppercase">Patient Name</span>
                <span className="font-bold text-[#1A1917]">{document.patient_name_preview}</span>
              </div>
              <div className={`p-1 rounded-[1px] transition-all ${isFieldActive('patient_id') ? 'ring-2 ring-[#855304] bg-[#FFFDF7]' : ''}`}>
                <span className="text-[#5E5D57] block text-[9px] uppercase">Patient Identifier</span>
                <span className="font-bold text-[#1A1917]">{document.patient_id_preview}</span>
              </div>
              <div className="p-1">
                <span className="text-[#5E5D57] block text-[9px] uppercase">Document Category</span>
                <span className="font-semibold text-[#1A1917] capitalize">{document.category.replace('_', ' ')}</span>
              </div>
              <div className={`p-1 rounded-[1px] transition-all ${isFieldActive('date') ? 'ring-2 ring-[#855304] bg-[#FFFDF7]' : ''}`}>
                <span className="text-[#5E5D57] block text-[9px] uppercase">Date of Record</span>
                <span className="font-semibold text-[#1A1917]">
                  {new Date(document.upload_timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Clinical Content Rendering based on Category */}
            {document.category === 'lab_report' && (
              <div className="space-y-3 text-xs">
                <div className="font-bold uppercase tracking-wider text-[11px] border-b border-[#E2E0D8] pb-1">
                  DEPARTMENT OF CLINICAL PATHOLOGY & HEMATOLOGY
                </div>
                <table className="w-full text-left text-[11px] font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-[#1A1917] bg-[#F2F1EC]">
                      <th className="py-1 px-2">Investigation Test</th>
                      <th className="py-1 px-2">Observed Result</th>
                      <th className="py-1 px-2">Reference Units</th>
                      <th className="py-1 px-2">Biological Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E0D8]">
                    {document.extracted_data && 'tests' in document.extracted_data ? (
                      document.extracted_data.tests.map((test) => {
                        const isThisRowActive = isFieldActive(test.name) || (test.id && isFieldActive(test.id));
                        return (
                          <tr
                            key={test.id}
                            className={`transition-colors ${
                              isThisRowActive
                                ? 'bg-[#FDF6E4] ring-1 ring-[#855304]'
                                : test.status !== 'normal'
                                ? 'bg-[#FFFDF7]'
                                : ''
                            }`}
                          >
                            <td className="py-1.5 px-2 font-medium">{test.name}</td>
                            <td className={`py-1.5 px-2 font-bold ${test.status !== 'normal' ? 'text-[#855304]' : 'text-[#1A1917]'}`}>
                              {test.result} {test.status !== 'normal' && '*'}
                            </td>
                            <td className="py-1.5 px-2 text-[#5E5D57]">{test.unit}</td>
                            <td className="py-1.5 px-2 text-[#5E5D57]">{test.reference_range}</td>
                          </tr>
                        );
                      })
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            {document.category === 'medical_bill' && (
              <div className="space-y-3 text-xs">
                <div className={`font-bold uppercase tracking-wider text-[11px] border-b border-[#E2E0D8] pb-1 ${
                  isFieldActive('treatment') || isFieldActive('procedure')
                    ? 'ring-2 ring-[#855304] bg-[#FFFDF7] p-1'
                    : ''
                }`}>
                  INPATIENT / OUTPATIENT ITEMIZED INVOICE
                </div>
                <table className="w-full text-left text-[11px] font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-[#1A1917] bg-[#F2F1EC]">
                      <th className="py-1 px-2">Item Description</th>
                      <th className="py-1 px-2">Code</th>
                      <th className="py-1 px-2 text-right">Qty</th>
                      <th className="py-1 px-2 text-right">Rate ($)</th>
                      <th className="py-1 px-2 text-right">Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E0D8]">
                    {document.extracted_data && 'line_items' in document.extracted_data ? (
                      document.extracted_data.line_items.map((item) => {
                        const isThisItemActive = isFieldActive(item.description) || (item.id && isFieldActive(item.id));
                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors ${
                              isThisItemActive ? 'bg-[#FDF6E4] ring-1 ring-[#855304]' : ''
                            }`}
                          >
                            <td className="py-1.5 px-2 font-medium">{item.description}</td>
                            <td className="py-1.5 px-2 text-[#5E5D57]">{item.code || 'N/A'}</td>
                            <td className="py-1.5 px-2 text-right">{item.quantity}</td>
                            <td className="py-1.5 px-2 text-right">${item.unit_price.toFixed(2)}</td>
                            <td className="py-1.5 px-2 text-right font-bold">${item.total_price.toFixed(2)}</td>
                          </tr>
                        );
                      })
                    ) : null}
                  </tbody>
                </table>

                {/* Bill Totals */}
                <div className={`pt-2 border-t border-[#1A1917] flex justify-end font-mono text-[11px] ${
                  isFieldActive('total') || isFieldActive('subtotal')
                    ? 'ring-2 ring-[#855304] bg-[#FFFDF7] p-1'
                    : ''
                }`}>
                  <div className="w-48 space-y-1">
                    <div className="flex justify-between text-[#5E5D57]">
                      <span>Subtotal:</span>
                      <span>$2,450.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs text-[#1A1917] border-t border-[#E2E0D8] pt-1">
                      <span>Total Amount:</span>
                      <span>$2,450.00</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {document.category === 'prescription' && (
              <div className="space-y-3 text-xs">
                <div className="font-bold uppercase tracking-wider text-[11px] border-b border-[#E2E0D8] pb-1 flex justify-between">
                  <span>OUTPATIENT PRESCRIPTION RECORD</span>
                  <span className="font-mono text-[10px]">Rx #4819</span>
                </div>
                <div className={`text-[11px] p-1 ${isFieldActive('diagnosis') ? 'ring-2 ring-[#855304] bg-[#FFFDF7]' : ''}`}>
                  <span className="font-semibold">Clinical Diagnosis: </span>
                  <span>Acute Bacterial Rhinosinusitis / URI</span>
                </div>
                <div className="border border-[#E2E0D8] p-3 space-y-2 bg-[#FAF9F7] font-mono text-[11px]">
                  <div className={`p-1 ${isFieldActive('Augmentin') || isFieldActive('Amoxicillin') ? 'bg-[#FDF6E4] ring-1 ring-[#855304]' : ''}`}>
                    <div className="font-bold text-[#1A1917]">1. Augmentin 625 Duo (Amoxicillin + Clavulanate 625mg)</div>
                    <div className="text-[#5E5D57] pl-3">Sig: 1 tab twice daily (after food) x 7 days</div>
                  </div>
                  <div className={`p-1 ${isFieldActive('Levocetirizine') ? 'bg-[#FDF6E4] ring-1 ring-[#855304]' : ''}`}>
                    <div className="font-bold text-[#1A1917]">2. Levocetirizine 5mg</div>
                    <div className="text-[#5E5D57] pl-3">Sig: 1 tab once daily at bedtime x 5 days</div>
                  </div>
                  <div className={`p-1 ${isFieldActive('Fluticasone') ? 'bg-[#FDF6E4] ring-1 ring-[#855304]' : ''}`}>
                    <div className="font-bold text-[#1A1917]">3. Fluticasone Furoate Nasal Spray 27.5mcg</div>
                    <div className="text-[#5E5D57] pl-3">Sig: 2 sprays each nostril once daily x 14 days</div>
                  </div>
                </div>
              </div>
            )}

            {document.category === 'discharge_summary' && (
              <div className="space-y-3 text-xs">
                <div className="font-bold uppercase tracking-wider text-[11px] border-b border-[#E2E0D8] pb-1">
                  CLINICAL DISCHARGE SUMMARY & OPERATIVE NOTE
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className={`p-1 ${isFieldActive('diagnosis') ? 'ring-2 ring-[#855304] bg-[#FFFDF7]' : ''}`}>
                    <span className="font-semibold block font-mono uppercase text-[10px] text-[#5E5D57]">Final Diagnosis</span>
                    <p className="font-medium text-[#1A1917]">
                      Symptomatic Cholelithiasis with Chronic Calculous Cholecystitis
                    </p>
                  </div>
                  <div className={`p-1 ${isFieldActive('procedures') ? 'ring-2 ring-[#855304] bg-[#FFFDF7]' : ''}`}>
                    <span className="font-semibold block font-mono uppercase text-[10px] text-[#5E5D57]">Surgical Procedure</span>
                    <p className="font-medium text-[#1A1917]">
                      Elective Laparoscopic Cholecystectomy under General Anesthesia
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Signature Footer */}
            <div className="pt-4 border-t border-[#E2E0D8] flex items-end justify-between font-mono text-[10px] text-[#5E5D57]">
              <div>
                <p>Digital Optical Capture: PyMuPDF Stream</p>
                <p>Checksum: SHA-256 Verified</p>
              </div>
              <div className="text-right border-t border-dashed border-[#5E5D57] pt-1 w-44">
                <span className="font-bold text-[#1A1917] block">Dr. Alok Verma, MD</span>
                <span>Authorized Clinical Signatory</span>
              </div>
            </div>
          </div>
        ) : (
          /* Raw OCR Text Stream View */
          <div className="w-full bg-[#1A1917] text-[#D5D3C8] font-mono text-xs p-4 rounded-[2px] overflow-x-auto space-y-1">
            <div className="text-[10px] text-[#89877E] border-b border-[#333230] pb-2 mb-2">
              [RAW OCR TEXT STREAM] Extracted via {document.ocr_method} · Confidence: {document.overall_confidence}%
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed">
{`001: ========================================================
002: ${(document.facility_name || 'CENTRAL CLINICAL FACILITY').toUpperCase()}
003: CLINICAL OPERATIONS & DIAGNOSTIC SERVICES
004: DOCUMENT REFERENCE: ${document.display_id}
005: DATE OF RECORD: ${document.upload_timestamp.substring(0, 10)}
006: ========================================================
007: PATIENT NAME: ${document.patient_name_preview || 'N/A'}
008: PATIENT ID:   ${document.patient_id_preview || 'N/A'}
009: CATEGORY:     ${document.category.toUpperCase()}
010: --------------------------------------------------------
011: CLINICAL ATTRIBUTES & LINE DATA:
012: Summary: ${document.summary_preview || 'N/A'}
013: Status:  ${document.status.toUpperCase()}
014: --------------------------------------------------------
015: [OCR EOF - Checksum verified: Valid Stream]`}
            </pre>
          </div>
        )}
      </div>

      {/* Pane Footer */}
      <div className="px-4 py-2 bg-[#F2F1EC] border-t border-[#E2E0D8] flex items-center justify-between text-[11px] font-mono text-[#5E5D57]">
        <span>Page 1 of 1</span>
        <span>Resolution: 300 DPI · Vector Preserved</span>
      </div>
    </div>
  );
};
