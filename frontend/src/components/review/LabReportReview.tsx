'use client';

import React from 'react';
import { LabReportData, LabTestItem, FieldConfidence } from '@/types/document';
import { FieldConfidenceInput } from './FieldConfidenceInput';
import { ConfidenceIndicator } from '@/components/ui/StatusBadge';

interface LabReportReviewProps {
  data: LabReportData;
  onUpdateData: (updated: LabReportData) => void;
}

export const LabReportReview: React.FC<LabReportReviewProps> = ({
  data,
  onUpdateData,
}) => {
  const handleFieldChange = (key: keyof LabReportData, value: string | number) => {
    const existing = data[key] as FieldConfidence;
    onUpdateData({
      ...data,
      [key]: {
        ...existing,
        value,
        isVerified: true,
        needsReview: false,
      },
    });
  };

  const handleFieldVerify = (key: keyof LabReportData) => {
    const existing = data[key] as FieldConfidence;
    onUpdateData({
      ...data,
      [key]: {
        ...existing,
        isVerified: true,
        needsReview: false,
      },
    });
  };

  const handleTestChange = (testId: string, updatedFields: Partial<LabTestItem>) => {
    const updatedTests = data.tests.map((t) => {
      if (t.id === testId) {
        return {
          ...t,
          ...updatedFields,
          isVerified: true,
          needsReview: false,
        };
      }
      return t;
    });
    onUpdateData({
      ...data,
      tests: updatedTests,
    });
  };

  return (
    <div className="space-y-5">
      {/* Patient & Facility Demographics */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917]">
          Patient & Order Metadata
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <FieldConfidenceInput
            label="Patient Name"
            field={data.patient_name}
            onChange={(val) => handleFieldChange('patient_name', val)}
            onVerify={() => handleFieldVerify('patient_name')}
          />
          <FieldConfidenceInput
            label="Patient Identifier"
            field={data.patient_id}
            onChange={(val) => handleFieldChange('patient_id', val)}
            onVerify={() => handleFieldVerify('patient_id')}
          />
          <FieldConfidenceInput
            label="Specimen Collection Date"
            field={data.date}
            onChange={(val) => handleFieldChange('date', val)}
            onVerify={() => handleFieldVerify('date')}
          />
          <FieldConfidenceInput
            label="Diagnostic Facility"
            field={data.facility}
            onChange={(val) => handleFieldChange('facility', val)}
            onVerify={() => handleFieldVerify('facility')}
          />
          <FieldConfidenceInput
            label="Ordering Physician"
            field={data.ordering_doctor}
            onChange={(val) => handleFieldChange('ordering_doctor', val)}
            onVerify={() => handleFieldVerify('ordering_doctor')}
          />
          {data.specimen_type && (
            <FieldConfidenceInput
              label="Specimen Type"
              field={data.specimen_type}
              onChange={(val) => handleFieldChange('specimen_type', val)}
              onVerify={() => handleFieldVerify('specimen_type')}
            />
          )}
        </div>
      </div>

      {/* Structured Laboratory Test Parameters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917]">
            Laboratory Test Parameters ({data.tests.length} extracted)
          </h3>
          <span className="text-[10px] font-mono text-[#5E5D57]">
            Values outside reference boundaries flagged
          </span>
        </div>

        <div className="border border-[#E2E0D8] rounded-[2px] overflow-hidden bg-[#FFFFFF]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F2F1EC] border-b border-[#E2E0D8] text-[10px] font-mono text-[#5E5D57] uppercase">
                <th className="py-2 px-3">Test Parameter</th>
                <th className="py-2 px-3 w-28">Result</th>
                <th className="py-2 px-2 w-20">Unit</th>
                <th className="py-2 px-2 w-28">Reference</th>
                <th className="py-2 px-2 w-24">Status</th>
                <th className="py-2 px-2 w-20">Confidence</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F1EC] text-xs">
              {data.tests.map((test) => {
                const isAbnormal = test.status === 'abnormal' || test.status === 'critical';
                const isLowConf = test.confidence < 80 && !test.isVerified;

                return (
                  <tr
                    key={test.id}
                    className={`transition-colors ${
                      isLowConf
                        ? 'bg-[#FFFDF7]'
                        : isAbnormal
                        ? 'bg-[#FCFAF4]'
                        : 'hover:bg-[#F9F9F7]'
                    }`}
                  >
                    {/* Test Name */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={test.name}
                        onChange={(e) => handleTestChange(test.id, { name: e.target.value })}
                        className="w-full bg-transparent font-medium text-[#1A1917] focus:outline-none focus:bg-[#FFFFFF] px-1 py-0.5 rounded-[2px] border border-transparent focus:border-[#1A1917]"
                      />
                    </td>

                    {/* Result */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={test.result}
                        onChange={(e) => handleTestChange(test.id, { result: e.target.value })}
                        className={`w-full font-mono font-bold px-1.5 py-0.5 rounded-[2px] border focus:outline-none ${
                          isLowConf
                            ? 'border-[#EBD9A4] bg-[#FFFFFF] text-[#855304]'
                            : 'border-[#E2E0D8] bg-[#FBFBFA] text-[#1A1917] focus:border-[#1A1917]'
                        }`}
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-2 font-mono text-[11px] text-[#5E5D57]">
                      {test.unit}
                    </td>

                    {/* Reference Range */}
                    <td className="py-2 px-2 font-mono text-[11px] text-[#5E5D57]">
                      {test.reference_range}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-2 px-2">
                      <select
                        value={test.status}
                        onChange={(e) =>
                          handleTestChange(test.id, {
                            status: e.target.value as LabTestItem['status'],
                          })
                        }
                        className={`text-[10px] font-mono font-semibold px-1 py-0.5 rounded-[2px] border ${
                          isAbnormal
                            ? 'bg-[#FDF6E4] text-[#855304] border-[#EBD9A4]'
                            : 'bg-[#EAF5EE] text-[#1C4D35] border-[#B8DFC8]'
                        }`}
                      >
                        <option value="normal">Normal</option>
                        <option value="abnormal">Abnormal</option>
                        <option value="critical">Critical</option>
                      </select>
                    </td>

                    {/* Confidence */}
                    <td className="py-2 px-2">
                      {test.isVerified ? (
                        <span className="text-[10px] font-mono text-[#1C4D35] font-bold">
                          ✓ Verified
                        </span>
                      ) : (
                        <ConfidenceIndicator score={test.confidence} showLabel={false} />
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2 px-2 text-right">
                      {!test.isVerified && (
                        <button
                          onClick={() => handleTestChange(test.id, { isVerified: true })}
                          className="px-1.5 py-0.5 text-[10px] font-mono bg-[#F2F1EC] hover:bg-[#1A1917] hover:text-[#FFFFFF] text-[#1A1917] border border-[#D5D3C8] rounded-[2px]"
                        >
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
