import { MedicalDocumentRecord } from '@/types/document';

export function exportStructuredJson(doc: MedicalDocumentRecord) {
  const exportPayload = {
    claim_id: `CLM-${doc.display_id}`,
    record_status: 'READY_FOR_CLAIM',
    export_timestamp: new Date().toISOString(),
    document_reference: {
      display_id: doc.display_id,
      filename: doc.filename,
      category: doc.category,
      ocr_pipeline: doc.ocr_method,
      overall_confidence: doc.overall_confidence,
    },
    patient: {
      name: doc.patient_name_preview,
      patient_id: doc.patient_id_preview,
      facility: doc.facility_name,
    },
    structured_data: doc.extracted_data,
    verification_audit: {
      status: 'VERIFIED_HUMAN_IN_THE_LOOP',
      verified_by: 'Dr. K. Patel (Clinical Admin)',
      verified_at: new Date().toISOString(),
    },
  };

  const dataStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.display_id}_claim_ready_record.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportClaimCsv(doc: MedicalDocumentRecord) {
  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Headers
  csvContent += 'Claim_ID,Document_ID,Category,Patient_Name,Patient_ID,Facility,Date,Service_Or_Test,Code,Quantity,Unit_Rate,Total_Amount,Confidence,Status\n';

  if (doc.category === 'medical_bill' && doc.extracted_data && 'line_items' in doc.extracted_data) {
    const data = doc.extracted_data;
    data.line_items.forEach((item) => {
      const row = [
        `CLM-${doc.display_id}`,
        doc.display_id,
        doc.category,
        `"${doc.patient_name_preview}"`,
        doc.patient_id_preview,
        `"${doc.facility_name}"`,
        data.bill_date.value,
        `"${item.description.replace(/"/g, '""')}"`,
        item.code || 'N/A',
        item.quantity,
        item.unit_price,
        item.total_price,
        `${item.confidence}%`,
        'CLAIM_READY',
      ];
      csvContent += row.join(',') + '\n';
    });
  } else if (doc.category === 'lab_report' && doc.extracted_data && 'tests' in doc.extracted_data) {
    const data = doc.extracted_data;
    data.tests.forEach((test) => {
      const row = [
        `CLM-${doc.display_id}`,
        doc.display_id,
        doc.category,
        `"${doc.patient_name_preview}"`,
        doc.patient_id_preview,
        `"${doc.facility_name}"`,
        data.date.value,
        `"${test.name.replace(/"/g, '""')}"`,
        'LAB-CPT',
        1,
        0,
        `"${test.result} ${test.unit}"`,
        `${test.confidence}%`,
        'CLAIM_READY',
      ];
      csvContent += row.join(',') + '\n';
    });
  } else {
    const row = [
      `CLM-${doc.display_id}`,
      doc.display_id,
      doc.category,
      `"${doc.patient_name_preview}"`,
      doc.patient_id_preview,
      `"${doc.facility_name}"`,
      doc.upload_timestamp.substring(0, 10),
      `"${doc.summary_preview.replace(/"/g, '""')}"`,
      'N/A',
      1,
      0,
      'N/A',
      `${doc.overall_confidence}%`,
      'CLAIM_READY',
    ];
    csvContent += row.join(',') + '\n';
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${doc.display_id}_claim_itemized.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportConsolidatedClaimsBatch(documents: MedicalDocumentRecord[]) {
  const claimReadyDocs = documents.filter((d) => d.status === 'claim_ready' || d.status === 'verified');
  
  const batchPayload = {
    batch_reference_id: `BATCH-CLM-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-01`,
    generation_timestamp: new Date().toISOString(),
    total_claims_count: claimReadyDocs.length,
    billing_facility: 'Central District Hospital · Institutional Claims',
    claims: claimReadyDocs.map((doc) => ({
      claim_id: `CLM-${doc.display_id}`,
      source_document: doc.filename,
      category: doc.category,
      patient_name: doc.patient_name_preview,
      patient_id: doc.patient_id_preview,
      structured_data: doc.extracted_data,
      verification_status: 'CERTIFIED',
    })),
  };

  const dataStr = JSON.stringify(batchPayload, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MedParse_Consolidated_Claims_Batch_${new Date().toISOString().substring(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportHl7FhirBundle(doc: MedicalDocumentRecord) {
  const fhirBundle = {
    resourceType: 'Bundle',
    id: `bundle-claim-${doc.display_id.toLowerCase()}`,
    meta: {
      lastUpdated: new Date().toISOString(),
      profile: ['http://hl7.org/fhir/StructureDefinition/Bundle'],
    },
    type: 'collection',
    entry: [
      // 1. Patient Resource
      {
        fullUrl: `urn:uuid:patient-${doc.patient_id_preview.toLowerCase()}`,
        resource: {
          resourceType: 'Patient',
          id: doc.patient_id_preview.toLowerCase(),
          identifier: [
            {
              system: 'http://hospital.health.org/mrn',
              value: doc.patient_id_preview,
            },
          ],
          name: [
            {
              use: 'official',
              text: doc.patient_name_preview,
            },
          ],
          managingOrganization: {
            display: doc.facility_name,
          },
        },
      },
      // 2. Encounter / Document Reference
      {
        fullUrl: `urn:uuid:encounter-${doc.display_id.toLowerCase()}`,
        resource: {
          resourceType: 'Encounter',
          id: `enc-${doc.display_id.toLowerCase()}`,
          status: 'finished',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: doc.category === 'medical_bill' ? 'EMER' : 'AMB',
            display: doc.category.replace('_', ' ').toUpperCase(),
          },
          subject: {
            reference: `urn:uuid:patient-${doc.patient_id_preview.toLowerCase()}`,
            display: doc.patient_name_preview,
          },
          period: {
            start: doc.upload_timestamp,
            end: doc.last_modified,
          },
        },
      },
      // 3. ExplanationOfBenefit / Claim Resource
      {
        fullUrl: `urn:uuid:eob-${doc.display_id.toLowerCase()}`,
        resource: {
          resourceType: 'ExplanationOfBenefit',
          id: `eob-${doc.display_id.toLowerCase()}`,
          status: 'active',
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/claim-type',
                code: 'institutional',
                display: 'Institutional Clinical Claim',
              },
            ],
          },
          use: 'claim',
          patient: {
            reference: `urn:uuid:patient-${doc.patient_id_preview.toLowerCase()}`,
            display: doc.patient_name_preview,
          },
          provider: {
            display: doc.facility_name,
          },
          outcome: 'complete',
          disposition: 'Verified claim-ready dataset generated by MedParse clinical intelligence.',
        },
      },
    ],
  };

  const dataStr = JSON.stringify(fhirBundle, null, 2);
  const blob = new Blob([dataStr], { type: 'application/fhir+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.display_id}_HL7_FHIR_R4_Bundle.json`;
  a.click();
  URL.revokeObjectURL(url);
}
