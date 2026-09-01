'use client';

import React, { useState } from 'react';
import { DocumentCategory } from '@/types/document';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessPreset: (category: DocumentCategory) => void;
  onUploadFile: (file: File, category: DocumentCategory | 'auto') => void;
}

export const IntakeModal: React.FC<IntakeModalProps> = ({
  isOpen,
  onClose,
  onProcessPreset,
  onUploadFile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'auto'>('auto');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onUploadFile(selectedFile, selectedCategory);
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1917]/60 backdrop-blur-none p-4">
      <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] w-full max-w-2xl shadow-none overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#F2F1EC] border-b border-[#E2E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-[#1A1917]">
              DOCUMENT INTAKE WORKSTATION
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#5E5D57] hover:text-[#1A1917]"
          >
            [Close ×]
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Main Upload Zone */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono uppercase text-[11px] font-bold text-[#1A1917] mb-1">
                Add a Medical Document
              </label>
              <p className="text-[#5E5D57] text-xs mb-2">
                Supported formats: PDF, JPG, JPEG, PNG (Max 25MB). Direct OCR & Structured Extraction.
              </p>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('intake-modal-file')?.click()}
                className={`border-2 border-dashed rounded-[2px] p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#1A1917] bg-[#F2F1EC]'
                    : selectedFile
                    ? 'border-[#1C4D35] bg-[#F4F9F6]'
                    : 'border-[#D5D3C8] bg-[#FBFBFA] hover:border-[#1A1917]'
                }`}
              >
                <input
                  id="intake-modal-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="font-mono font-bold text-xs text-[#1C4D35]">
                      ✓ {selectedFile.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#5E5D57]">
                      {Math.round(selectedFile.size / 1024)} KB · Ready for PyMuPDF extraction
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="font-semibold text-xs text-[#1A1917]">
                      Drag and drop medical file here, or click to browse
                    </p>
                    <p className="text-[11px] text-[#5E5D57]">
                      Optical text capture will execute automatically
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Type Selection & Submit */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#5E5D57] whitespace-nowrap font-mono">
                  Document Type:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory | 'auto')}
                  className="px-2.5 py-1 text-xs bg-[#F7F7F5] border border-[#E2E0D8] rounded-[2px] text-[#1A1917] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#1A1917]"
                >
                  <option value="auto">Automatic Document Detection</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="medical_bill">Medical Bill</option>
                  <option value="prescription">Prescription</option>
                  <option value="discharge_summary">Discharge Summary</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedFile}
                className={`px-4 py-1.5 text-xs font-bold rounded-[2px] transition-colors ${
                  selectedFile
                    ? 'bg-[#1A1917] hover:bg-[#333230] text-[#FFFFFF] cursor-pointer'
                    : 'bg-[#EAE8DF] text-[#89877E] cursor-not-allowed'
                }`}
              >
                Upload & Process Record
              </button>
            </div>
          </form>

          {/* Download Sample Files for Live Testing */}
          <div className="pt-3 border-t border-[#F2F1EC] flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#5E5D57]">
            <span className="font-semibold text-[#1A1917]">Download Real Test Files:</span>
            <a
              href="/samples/medical_bill_sample.pdf"
              download="medical_bill_sample.pdf"
              className="px-2 py-0.5 bg-[#F2F1EC] hover:bg-[#EAE8E2] text-[#1A1917] border border-[#D5D3C8] rounded-[2px]"
            >
              ↓ Bill (PDF)
            </a>
            <a
              href="/samples/lab_report_sample.pdf"
              download="lab_report_sample.pdf"
              className="px-2 py-0.5 bg-[#F2F1EC] hover:bg-[#EAE8E2] text-[#1A1917] border border-[#D5D3C8] rounded-[2px]"
            >
              ↓ Lab (PDF)
            </a>
            <a
              href="/samples/prescription_sample.png"
              download="prescription_sample.png"
              className="px-2 py-0.5 bg-[#F2F1EC] hover:bg-[#EAE8E2] text-[#1A1917] border border-[#D5D3C8] rounded-[2px]"
            >
              ↓ Rx (PNG)
            </a>
            <a
              href="/samples/discharge_summary_sample.pdf"
              download="discharge_summary_sample.pdf"
              className="px-2 py-0.5 bg-[#F2F1EC] hover:bg-[#EAE8E2] text-[#1A1917] border border-[#D5D3C8] rounded-[2px]"
            >
              ↓ Discharge (PDF)
            </a>
          </div>

          {/* Quick Sample Presets */}
          <div className="pt-4 border-t border-[#E2E0D8] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold uppercase text-[11px] text-[#1A1917]">
                Quick-Load Evaluation Presets (Demo Mode)
              </span>
              <span className="text-[10px] font-mono text-[#5E5D57]">1-Click Workflow</span>
            </div>
            <p className="text-[11px] text-[#5E5D57]">
              Instantly test the entire intake &rarr; classification &rarr; OCR &rarr; structured extraction &rarr; review pipeline:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onProcessPreset('lab_report');
                  onClose();
                }}
                className="p-2.5 text-left bg-[#F9F9F7] border border-[#E2E0D8] hover:border-[#1A1917] hover:bg-[#FFFFFF] rounded-[2px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[#1A1917]">
                  Lab Report
                </div>
                <div className="text-[11px] text-[#5E5D57] mt-0.5">
                  Complete Blood Count & Metabolic Panel
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onProcessPreset('medical_bill');
                  onClose();
                }}
                className="p-2.5 text-left bg-[#F9F9F7] border border-[#E2E0D8] hover:border-[#1A1917] hover:bg-[#FFFFFF] rounded-[2px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[#1A1917]">
                  Medical Bill
                </div>
                <div className="text-[11px] text-[#5E5D57] mt-0.5">
                  Emergency Inpatient Bill ($2,450.00)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onProcessPreset('prescription');
                  onClose();
                }}
                className="p-2.5 text-left bg-[#F9F9F7] border border-[#E2E0D8] hover:border-[#1A1917] hover:bg-[#FFFFFF] rounded-[2px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[#1A1917]">
                  Prescription
                </div>
                <div className="text-[11px] text-[#5E5D57] mt-0.5">
                  ENT Infection & 3 Medications
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onProcessPreset('discharge_summary');
                  onClose();
                }}
                className="p-2.5 text-left bg-[#F9F9F7] border border-[#E2E0D8] hover:border-[#1A1917] hover:bg-[#FFFFFF] rounded-[2px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[#1A1917]">
                  Discharge Summary
                </div>
                <div className="text-[11px] text-[#5E5D57] mt-0.5">
                  Laparoscopic Cholecystectomy Post-Op
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F2F1EC] border-t border-[#E2E0D8] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1 text-xs font-mono text-[#5E5D57] hover:text-[#1A1917] rounded-[2px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
