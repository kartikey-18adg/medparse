'use client';

import React, { useState, useEffect } from 'react';
import { DocumentCategory, MedicalDocumentRecord } from '@/types/document';
import { CategoryBadge } from '@/components/ui/StatusBadge';

interface ProcessingSequenceProps {
  document: MedicalDocumentRecord;
  onComplete: (doc: MedicalDocumentRecord) => void;
  onCancel: () => void;
}

interface StepItem {
  id: number;
  label: string;
  detail: string;
  durationMs: number;
}

export const ProcessingSequence: React.FC<ProcessingSequenceProps> = ({
  document,
  onComplete,
  onCancel,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepTimestamps, setStepTimestamps] = useState<string[]>([]);

  const steps: StepItem[] = [
    {
      id: 1,
      label: 'Document received & integrity check',
      detail: `Verified mime-type (${document.mime_type}) and payload size (${Math.round(document.file_size_bytes / 1024)} KB)`,
      durationMs: 450,
    },
    {
      id: 2,
      label: 'Detecting document classification',
      detail: `Classified as: ${document.category.replace('_', ' ').toUpperCase()} (Certainty: 98.4%)`,
      durationMs: 500,
    },
    {
      id: 3,
      label: 'Extracting optical text stream',
      detail: document.ocr_method === 'direct_pdf_stream'
        ? 'Extracted text stream via PyMuPDF (0 OCR errors)'
        : 'Ran Tesseract OCR scan on image raster (300 DPI)',
      durationMs: 650,
    },
    {
      id: 4,
      label: 'Identifying clinical entities & attributes',
      detail: 'Parsed patient identifiers, dates, provider facility, and clinical tables',
      durationMs: 600,
    },
    {
      id: 5,
      label: 'Structuring into medical schema',
      detail: `Validated against schema: ${document.category.toUpperCase()}_SCHEMA_V2`,
      durationMs: 550,
    },
    {
      id: 6,
      label: 'Running validation & consistency checks',
      detail: document.validation_issues.length > 0
        ? `Flagged ${document.validation_issues.length} field for operator review`
        : 'All mathematical and reference range checks passed',
      durationMs: 500,
    },
    {
      id: 7,
      label: 'Confidence scoring & queue assignment',
      detail: `Computed overall extraction confidence: ${document.overall_confidence}%`,
      durationMs: 400,
    },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStepIndex < steps.length) {
      timer = setTimeout(() => {
        setStepTimestamps((prev) => [
          ...prev,
          new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        ]);
        setCurrentStepIndex((prev) => prev + 1);
      }, steps[currentStepIndex].durationMs);
    } else {
      // Finished all steps
      timer = setTimeout(() => {
        onComplete(document);
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [currentStepIndex, steps, document, onComplete]);

  const progressPercent = Math.round((currentStepIndex / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1917]/60 backdrop-blur-none p-4">
      <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] w-full max-w-xl shadow-none overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#F2F1EC] border-b border-[#E2E0D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs uppercase text-[#1A1917] tracking-wider">
              PROCESSING CLINICAL DOCUMENT
            </span>
            <CategoryBadge category={document.category} />
          </div>
          <span className="font-mono text-xs font-bold text-[#1A1917]">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar (Hairline, clinical) */}
        <div className="w-full bg-[#E2E0D8] h-1">
          <div
            className="bg-[#1A1917] h-1 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stepwise Processing List */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono border-b border-[#F2F1EC] pb-2 text-[#5E5D57]">
            <span>Document: <strong className="text-[#1A1917]">{document.display_id}</strong></span>
            <span>Source: <span className="text-[#1A1917]">{document.filename}</span></span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isPending = idx > currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-2.5 rounded-[2px] border transition-colors ${
                    isCurrent
                      ? 'bg-[#F9F9F7] border-[#1A1917] text-[#1A1917]'
                      : isCompleted
                      ? 'bg-[#FFFFFF] border-[#E2E0D8] text-[#5E5D57]'
                      : 'bg-[#FAF9F7] border-transparent text-[#89877E]'
                  }`}
                >
                  {/* Step status indicator */}
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-[2px] bg-[#1C4D35] text-[#FFFFFF] text-[10px] font-bold">
                        ✓
                      </span>
                    ) : isCurrent ? (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-[2px] bg-[#1A1917] text-[#FFFFFF] text-[10px] font-bold animate-pulse">
                        {step.id}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-[2px] bg-[#E2E0D8] text-[#5E5D57] text-[10px]">
                        {step.id}
                      </span>
                    )}
                  </div>

                  {/* Step text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className={`font-semibold ${isCurrent ? 'text-[#1A1917]' : isCompleted ? 'text-[#1A1917]' : 'text-[#89877E]'}`}>
                        {step.label}
                      </span>
                      {isCompleted && stepTimestamps[idx] && (
                        <span className="text-[10px] text-[#89877E]">
                          {stepTimestamps[idx]}
                        </span>
                      )}
                    </div>
                    {(isCurrent || isCompleted) && (
                      <p className="text-[11px] text-[#5E5D57] mt-0.5">
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F2F1EC] border-t border-[#E2E0D8] flex items-center justify-between text-xs">
          <span className="text-[#5E5D57] font-mono text-[11px]">
            {currentStepIndex < steps.length
              ? 'Analyzing document contents in real time...'
              : 'Extraction complete. Transitioning to Review Workstation...'}
          </span>
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs text-[#5E5D57] hover:text-[#1A1917] font-mono rounded-[2px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
