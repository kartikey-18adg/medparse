'use client';

import React, { useState } from 'react';
import { DocumentCategory } from '@/types/document';

interface QuickIntakeCardProps {
  onProcessSample: (category: DocumentCategory) => void;
  onUploadFile: (file: File, category: DocumentCategory | 'auto') => void;
}

export const QuickIntakeCard: React.FC<QuickIntakeCardProps> = ({
  onProcessSample,
  onUploadFile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'auto'>('auto');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
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
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2F1EC] pb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#1A1917]">
            Document Intake Workstation
          </h2>
          <p className="text-xs text-[#5E5D57]">
            Ingest unstructured clinical files for PyMuPDF optical text extraction and structured parsing.
          </p>
        </div>
        <div className="text-[11px] font-mono text-[#5E5D57]">
          Supported: <span className="font-semibold text-[#1A1917]">PDF, JPG, JPEG, PNG</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Direct File Intake */}
        <div className="lg:col-span-7 space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[2px] p-6 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-[#1A1917] bg-[#F2F1EC]'
                  : selectedFile
                  ? 'border-[#1C4D35] bg-[#F4F9F6]'
                  : 'border-[#D5D3C8] bg-[#FBFBFA] hover:border-[#1A1917]'
              }`}
              onClick={() => document.getElementById('file-input-primary')?.click()}
            >
              <input
                id="file-input-primary"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-[#1C4D35]">
                    [Selected File: {selectedFile.name}]
                  </div>
                  <div className="text-[11px] text-[#5E5D57] font-mono">
                    Size: {Math.round(selectedFile.size / 1024)} KB · Type: {selectedFile.type || 'Unknown'}
                  </div>
                  <p className="text-[11px] text-[#1A1917] font-medium pt-1">
                    Click to replace or choose document type below
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[#1A1917]">
                    Add a medical document
                  </p>
                  <p className="text-[11px] text-[#5E5D57]">
                    Drag and drop file here, or click to browse local files
                  </p>
                  <p className="text-[10px] font-mono text-[#89877E] uppercase">
                    Max file size 25MB · Vector Text & OCR enabled
                  </p>
                </div>
              )}
            </div>

            {/* Document Type Selection & Upload CTA */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#5E5D57] whitespace-nowrap font-mono">
                  Document Type:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory | 'auto')}
                  className="px-2 py-1 text-xs bg-[#F7F7F5] border border-[#E2E0D8] rounded-[2px] text-[#1A1917] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#1A1917]"
                >
                  <option value="auto">Auto-detect classification</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="medical_bill">Medical Bill</option>
                  <option value="prescription">Prescription</option>
                  <option value="discharge_summary">Discharge Summary</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="px-2.5 py-1 text-xs text-[#8A1E20] hover:bg-[#FDF0F0] rounded-[2px] transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!selectedFile}
                  className={`px-4 py-1.5 text-xs font-bold rounded-[2px] transition-colors ${
                    selectedFile
                      ? 'bg-[#1A1917] hover:bg-[#333230] text-[#FFFFFF] cursor-pointer'
                      : 'bg-[#EAE8DF] text-[#89877E] cursor-not-allowed'
                  }`}
                >
                  Process Document
                </button>
              </div>
            </div>
          </form>

          {/* Direct Download Sample Files for Drag & Drop Testing */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#5E5D57]">
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
        </div>

        {/* Right Column: 1-Click Evaluation Presets */}
        <div className="lg:col-span-5 bg-[#F9F9F7] border border-[#E2E0D8] rounded-[2px] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider font-semibold text-[#1A1917]">
              Sample Presets (Demo Mode)
            </span>
            <span className="text-[10px] font-mono text-[#5E5D57]">Instant Evaluation</span>
          </div>
          <p className="text-[11px] text-[#5E5D57]">
            Select a verified clinical archetype to run extraction, confidence scoring, and review:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => onProcessSample('lab_report')}
              className="p-2 text-left bg-[#FFFFFF] border border-[#E2E0D8] hover:border-[#1A1917] hover:bg-[#FAF9F5] rounded-[2px] transition-colors group"
            >
              <div className="text-xs font-bold text-[#1A1917] font-mono">
                Lab Report
              </div>
              <div className="text-[10px] text-[#5E5D57] truncate mt-0.5">
                CBC & Blood Glucose
              </div>
              <div className="text-[10px] text-[#855304] mt-1 font-mono">
                1 flagged value
              </div>
            </button>

            <button
              onClick={() => onProcessSample('medical_bill')}
              className="p-2 text-left bg-[#FFFFFF] border border-[#E2E0D8] hover:border-[#1A1917] hover:bg-[#FAF9F5] rounded-[2px] transition-colors group"
            >
              <div className="text-xs font-bold text-[#1A1917] font-mono">
                Medical Bill
              </div>
              <div className="text-[10px] text-[#5E5D57] truncate mt-0.5">
                Emergency Itemized ($2,450)
              </div>
              <div className="text-[10px] text-[#855304] mt-1 font-mono">
                Math verification check
              </div>
            </button>

            <button
              onClick={() => onProcessSample('prescription')}
              className="p-2 text-left bg-[#FFFFFF] border border-[#E2E0D8] hover:border-[#1A1917] hover:bg-[#FAF9F5] rounded-[2px] transition-colors group"
            >
              <div className="text-xs font-bold text-[#1A1917] font-mono">
                Prescription
              </div>
              <div className="text-[10px] text-[#5E5D57] truncate mt-0.5">
                ENT Anti-infectives
              </div>
              <div className="text-[10px] text-[#1C4D35] mt-1 font-mono">
                OCR scanned image
              </div>
            </button>

            <button
              onClick={() => onProcessSample('discharge_summary')}
              className="p-2 text-left bg-[#FFFFFF] border border-[#E2E0D8] hover:border-[#1A1917] hover:bg-[#FAF9F5] rounded-[2px] transition-colors group"
            >
              <div className="text-xs font-bold text-[#1A1917] font-mono">
                Discharge Summary
              </div>
              <div className="text-[10px] text-[#5E5D57] truncate mt-0.5">
                Laparoscopic Surgery
              </div>
              <div className="text-[10px] text-[#1C4D35] mt-1 font-mono">
                Full clinical history
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
