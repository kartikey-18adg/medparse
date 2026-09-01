'use client';

import React from 'react';
import { MedicalDocumentRecord } from '@/types/document';
import { StatusBadge, CategoryBadge, ConfidenceIndicator } from '@/components/ui/StatusBadge';

interface DocumentTableProps {
  documents: MedicalDocumentRecord[];
  onSelectDocument: (doc: MedicalDocumentRecord) => void;
  onOpenReview: (doc: MedicalDocumentRecord) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onSelectDocument,
  onOpenReview,
}) => {
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = Math.round(bytes / 1024);
    return `${kb} KB`;
  };

  if (documents.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] p-12 text-center">
        <div className="max-w-md mx-auto space-y-2">
          <p className="text-xs uppercase font-mono tracking-wider text-[#5E5D57]">
            DOCUMENTS REPOSITORY
          </p>
          <p className="text-sm text-[#1A1917] font-medium">
            No matching documents found in this workspace view.
          </p>
          <p className="text-xs text-[#5E5D57]">
            Try adjusting your search query, clearing filters, or uploading a new clinical record.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F2F1EC] border-b border-[#E2E0D8] text-[11px] font-mono text-[#5E5D57] uppercase tracking-wider">
              <th className="py-2.5 px-4 font-semibold">Document Reference</th>
              <th className="py-2.5 px-3 font-semibold">Category</th>
              <th className="py-2.5 px-3 font-semibold">Patient & Facility</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold">Confidence</th>
              <th className="py-2.5 px-3 font-semibold">Ingested</th>
              <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2F1EC] text-xs">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="hover:bg-[#F9F9F7] cursor-pointer transition-colors group"
              >
                {/* Reference & File */}
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-[#1A1917] group-hover:text-[#000000]">
                      {doc.display_id}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-[#5E5D57]">
                      <span className="truncate max-w-[180px] font-mono" title={doc.filename}>
                        {doc.filename}
                      </span>
                      <span>·</span>
                      <span className="font-mono">{formatFileSize(doc.file_size_bytes)}</span>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <CategoryBadge category={doc.category} />
                </td>

                {/* Patient & Facility */}
                <td className="py-3 px-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 font-medium text-[#1A1917]">
                      <span>{doc.patient_name_preview || 'N/A'}</span>
                      {doc.patient_id_preview && (
                        <span className="text-[11px] font-mono text-[#5E5D57]">
                          [{doc.patient_id_preview}]
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#5E5D57] truncate max-w-[200px]">
                      {doc.facility_name || 'N/A'}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <StatusBadge status={doc.status} />
                </td>

                {/* Confidence */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <ConfidenceIndicator score={doc.overall_confidence} />
                </td>

                {/* Ingested */}
                <td className="py-3 px-3 whitespace-nowrap text-[11px] font-mono text-[#5E5D57]">
                  {formatDateTime(doc.upload_timestamp)}
                </td>

                {/* Action buttons */}
                <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1.5">
                    {doc.status === 'needs_review' ? (
                      <button
                        onClick={() => onOpenReview(doc)}
                        className="px-2.5 py-1 text-xs font-semibold bg-[#FDF6E4] hover:bg-[#F9EFC9] text-[#855304] border border-[#EBD9A4] rounded-[2px] transition-colors"
                      >
                        Review
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectDocument(doc)}
                        className="px-2.5 py-1 text-xs font-medium bg-[#FFFFFF] hover:bg-[#F2F1EC] text-[#1A1917] border border-[#E2E0D8] rounded-[2px] transition-colors"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
