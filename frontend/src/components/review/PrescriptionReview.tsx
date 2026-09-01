'use client';

import React from 'react';
import { PrescriptionData, PrescriptionMedicine, FieldConfidence } from '@/types/document';
import { FieldConfidenceInput } from './FieldConfidenceInput';
import { ConfidenceIndicator } from '@/components/ui/StatusBadge';

interface PrescriptionReviewProps {
  data: PrescriptionData;
  onUpdateData: (updated: PrescriptionData) => void;
}

export const PrescriptionReview: React.FC<PrescriptionReviewProps> = ({
  data,
  onUpdateData,
}) => {
  const handleFieldChange = (key: keyof PrescriptionData, value: string | number) => {
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

  const handleFieldVerify = (key: keyof PrescriptionData) => {
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

  const handleMedChange = (medId: string, updatedFields: Partial<PrescriptionMedicine>) => {
    const updatedMeds = data.medicines.map((m) => {
      if (m.id === medId) {
        return {
          ...m,
          ...updatedFields,
          isVerified: true,
          needsReview: false,
        };
      }
      return m;
    });
    onUpdateData({
      ...data,
      medicines: updatedMeds,
    });
  };

  const handleMedVerify = (medId: string) => {
    const updatedMeds = data.medicines.map((m) => {
      if (m.id === medId) {
        return { ...m, isVerified: true, needsReview: false };
      }
      return m;
    });
    onUpdateData({
      ...data,
      medicines: updatedMeds,
    });
  };

  return (
    <div className="space-y-5">
      {/* Patient & Prescribing Physician Metadata */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917]">
          Prescription Header & Clinical Diagnosis
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
            label="Prescribing Physician"
            field={data.doctor}
            onChange={(val) => handleFieldChange('doctor', val)}
            onVerify={() => handleFieldVerify('doctor')}
          />
          {data.doctor_license && (
            <FieldConfidenceInput
              label="Physician Medical Reg #"
              field={data.doctor_license}
              onChange={(val) => handleFieldChange('doctor_license', val)}
              onVerify={() => handleFieldVerify('doctor_license')}
            />
          )}
          <FieldConfidenceInput
            label="Prescription Date"
            field={data.date}
            onChange={(val) => handleFieldChange('date', val)}
            onVerify={() => handleFieldVerify('date')}
          />
          <FieldConfidenceInput
            label="Primary Diagnosis"
            field={data.diagnosis}
            onChange={(val) => handleFieldChange('diagnosis', val)}
            onVerify={() => handleFieldVerify('diagnosis')}
          />
        </div>
      </div>

      {/* Prescribed Medications Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917]">
            Prescribed Medications ({data.medicines.length} items)
          </h3>
          <span className="text-[10px] font-mono text-[#5E5D57]">
            Verify dosage and frequency parameters
          </span>
        </div>

        <div className="border border-[#E2E0D8] rounded-[2px] overflow-hidden bg-[#FFFFFF]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F2F1EC] border-b border-[#E2E0D8] text-[10px] font-mono text-[#5E5D57] uppercase">
                <th className="py-2 px-3">Medication Name & Strength</th>
                <th className="py-2 px-2 w-28">Dosage</th>
                <th className="py-2 px-2 w-32">Frequency</th>
                <th className="py-2 px-2 w-20">Duration</th>
                <th className="py-2 px-2">Instructions</th>
                <th className="py-2 px-2 w-20">Confidence</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F1EC] text-xs">
              {data.medicines.map((med) => {
                const isLowConf = med.confidence < 80 && !med.isVerified;

                return (
                  <tr
                    key={med.id}
                    className={`transition-colors ${
                      isLowConf ? 'bg-[#FFFDF7]' : 'hover:bg-[#F9F9F7]'
                    }`}
                  >
                    {/* Medication Name */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) =>
                          handleMedChange(med.id, { name: e.target.value })
                        }
                        className="w-full bg-transparent font-medium text-[#1A1917] focus:outline-none focus:bg-[#FFFFFF] px-1 py-0.5 rounded-[2px] border border-transparent focus:border-[#1A1917]"
                      />
                    </td>

                    {/* Dosage */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) =>
                          handleMedChange(med.id, { dosage: e.target.value })
                        }
                        className={`w-full font-mono text-xs px-1 py-0.5 rounded-[2px] border focus:outline-none ${
                          isLowConf
                            ? 'border-[#EBD9A4] bg-[#FFFFFF] text-[#855304]'
                            : 'border-[#E2E0D8] bg-[#FBFBFA] focus:border-[#1A1917]'
                        }`}
                      />
                    </td>

                    {/* Frequency */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) =>
                          handleMedChange(med.id, { frequency: e.target.value })
                        }
                        className="w-full text-xs px-1 py-0.5 rounded-[2px] border border-[#E2E0D8] bg-[#FBFBFA] focus:border-[#1A1917] focus:outline-none"
                      />
                    </td>

                    {/* Duration */}
                    <td className="py-2 px-2 font-mono text-xs">
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) =>
                          handleMedChange(med.id, { duration: e.target.value })
                        }
                        className="w-full text-xs px-1 py-0.5 rounded-[2px] border border-[#E2E0D8] bg-[#FBFBFA] focus:border-[#1A1917] focus:outline-none"
                      />
                    </td>

                    {/* Instructions */}
                    <td className="py-2 px-2 text-[11px] text-[#5E5D57]">
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) =>
                          handleMedChange(med.id, { instructions: e.target.value })
                        }
                        className="w-full text-[11px] px-1 py-0.5 rounded-[2px] border border-[#E2E0D8] bg-[#FBFBFA] focus:border-[#1A1917] focus:outline-none"
                      />
                    </td>

                    {/* Confidence */}
                    <td className="py-2 px-2">
                      {med.isVerified ? (
                        <span className="text-[10px] font-mono text-[#1C4D35] font-bold">
                          ✓ Verified
                        </span>
                      ) : (
                        <ConfidenceIndicator score={med.confidence} showLabel={false} />
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2 px-2 text-right">
                      {!med.isVerified && (
                        <button
                          onClick={() => handleMedVerify(med.id)}
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

      {/* Special Precautions */}
      {data.special_precautions && (
        <FieldConfidenceInput
          label="Special Clinical Precautions & Instructions"
          field={data.special_precautions}
          onChange={(val) => handleFieldChange('special_precautions', val)}
          onVerify={() => handleFieldVerify('special_precautions')}
          multiline
        />
      )}
    </div>
  );
};
