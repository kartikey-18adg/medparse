'use client';

import React from 'react';
import { DischargeSummaryData, FieldConfidence } from '@/types/document';
import { FieldConfidenceInput } from './FieldConfidenceInput';

interface DischargeSummaryReviewProps {
  data: DischargeSummaryData;
  onUpdateData: (updated: DischargeSummaryData) => void;
}

export const DischargeSummaryReview: React.FC<DischargeSummaryReviewProps> = ({
  data,
  onUpdateData,
}) => {
  const handleFieldChange = (key: keyof DischargeSummaryData, value: string | number) => {
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

  const handleFieldVerify = (key: keyof DischargeSummaryData) => {
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

  return (
    <div className="space-y-5">
      {/* Patient & Hospital Demographics */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917]">
          Patient Demographics & Hospital Stay
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
            label="Hospital / Institution"
            field={data.hospital}
            onChange={(val) => handleFieldChange('hospital', val)}
            onVerify={() => handleFieldVerify('hospital')}
          />
          <FieldConfidenceInput
            label="Attending Physician"
            field={data.attending_doctor}
            onChange={(val) => handleFieldChange('attending_doctor', val)}
            onVerify={() => handleFieldVerify('attending_doctor')}
          />
          <FieldConfidenceInput
            label="Admission Date"
            field={data.admission_date}
            onChange={(val) => handleFieldChange('admission_date', val)}
            onVerify={() => handleFieldVerify('admission_date')}
          />
          <FieldConfidenceInput
            label="Discharge Date"
            field={data.discharge_date}
            onChange={(val) => handleFieldChange('discharge_date', val)}
            onVerify={() => handleFieldVerify('discharge_date')}
          />
        </div>
      </div>

      {/* Clinical Diagnosis & Procedures */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917]">
          Clinical Diagnosis & Operative Records
        </h3>
        <FieldConfidenceInput
          label="Primary Discharge Diagnosis"
          field={data.diagnosis}
          onChange={(val) => handleFieldChange('diagnosis', val)}
          onVerify={() => handleFieldVerify('diagnosis')}
        />
        <FieldConfidenceInput
          label="Surgical & Interventional Procedures Performed"
          field={data.procedures}
          onChange={(val) => handleFieldChange('procedures', val)}
          onVerify={() => handleFieldVerify('procedures')}
        />
      </div>

      {/* Hospital Course & Clinical Narratives */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917]">
          Hospital Course & Clinical Investigations
        </h3>
        <FieldConfidenceInput
          label="Hospital Course & Inpatient Summary"
          field={data.hospital_course_summary}
          onChange={(val) => handleFieldChange('hospital_course_summary', val)}
          onVerify={() => handleFieldVerify('hospital_course_summary')}
          multiline
        />
        <FieldConfidenceInput
          label="Diagnostic Investigations & Histopathology Summary"
          field={data.investigation_summary}
          onChange={(val) => handleFieldChange('investigation_summary', val)}
          onVerify={() => handleFieldVerify('investigation_summary')}
          multiline
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <FieldConfidenceInput
            label="Discharge Clinical Condition"
            field={data.discharge_condition}
            onChange={(val) => handleFieldChange('discharge_condition', val)}
            onVerify={() => handleFieldVerify('discharge_condition')}
          />
          <FieldConfidenceInput
            label="Post-Discharge Follow-up Instructions"
            field={data.follow_up_instructions}
            onChange={(val) => handleFieldChange('follow_up_instructions', val)}
            onVerify={() => handleFieldVerify('follow_up_instructions')}
          />
        </div>
      </div>

      {/* Discharge Medications Table */}
      {data.medications_on_discharge && data.medications_on_discharge.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917]">
            Discharge Medications ({data.medications_on_discharge.length} prescribed)
          </h3>
          <div className="border border-[#E2E0D8] rounded-[2px] overflow-hidden bg-[#FFFFFF]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F2F1EC] border-b border-[#E2E0D8] text-[10px] font-mono text-[#5E5D57] uppercase">
                  <th className="py-2 px-3">Medication</th>
                  <th className="py-2 px-2">Dosage</th>
                  <th className="py-2 px-2">Frequency</th>
                  <th className="py-2 px-2">Duration</th>
                  <th className="py-2 px-2">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F1EC] text-xs">
                {data.medications_on_discharge.map((med) => (
                  <tr key={med.id} className="hover:bg-[#F9F9F7]">
                    <td className="py-2 px-3 font-medium text-[#1A1917]">{med.name}</td>
                    <td className="py-2 px-2 font-mono text-xs">{med.dosage}</td>
                    <td className="py-2 px-2 text-xs">{med.frequency}</td>
                    <td className="py-2 px-2 font-mono text-xs">{med.duration}</td>
                    <td className="py-2 px-2 text-[11px] text-[#5E5D57]">{med.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
