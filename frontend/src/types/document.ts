export type DocumentCategory = 
  | 'lab_report' 
  | 'medical_bill' 
  | 'prescription' 
  | 'discharge_summary';

export type DocumentStatus = 
  | 'processing' 
  | 'processed'
  | 'needs_review' 
  | 'verified' 
  | 'claim_ready' 
  | 'error';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface FieldConfidence {
  value: string | number;
  confidence: number; // 0 - 100
  level: ConfidenceLevel;
  needsReview: boolean;
  isVerified?: boolean;
  originalValue?: string | number;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface LabTestItem {
  id: string;
  name: string;
  result: string;
  unit: string;
  reference_range: string;
  status: 'normal' | 'abnormal' | 'critical' | 'inconclusive';
  confidence: number;
  needsReview?: boolean;
  isVerified?: boolean;
}

export interface LabReportData {
  document_type: 'lab_report';
  patient_name: FieldConfidence;
  patient_id: FieldConfidence;
  date: FieldConfidence;
  facility: FieldConfidence;
  ordering_doctor: FieldConfidence;
  specimen_type?: FieldConfidence;
  tests: LabTestItem[];
}

export interface BillLineItem {
  id: string;
  description: string;
  code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  confidence: number;
  needsReview?: boolean;
  isVerified?: boolean;
}

export interface MedicalBillData {
  document_type: 'medical_bill';
  patient_name: FieldConfidence;
  patient_id: FieldConfidence;
  hospital: FieldConfidence;
  bill_number: FieldConfidence;
  bill_date: FieldConfidence;
  admission_date?: FieldConfidence;
  discharge_date?: FieldConfidence;
  treatment_procedure: FieldConfidence;
  line_items: BillLineItem[];
  subtotal: FieldConfidence;
  tax: FieldConfidence;
  discount: FieldConfidence;
  total_amount: FieldConfidence;
  math_verification: {
    calculated_total: number;
    stated_total: number;
    is_consistent: boolean;
    discrepancy_amount?: number;
    notes?: string;
  };
}

export interface PrescriptionMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  confidence: number;
  needsReview?: boolean;
  isVerified?: boolean;
}

export interface PrescriptionData {
  document_type: 'prescription';
  patient_name: FieldConfidence;
  patient_id: FieldConfidence;
  doctor: FieldConfidence;
  doctor_license?: FieldConfidence;
  date: FieldConfidence;
  diagnosis: FieldConfidence;
  medicines: PrescriptionMedicine[];
  special_precautions?: FieldConfidence;
}

export interface DischargeSummaryData {
  document_type: 'discharge_summary';
  patient_name: FieldConfidence;
  patient_id: FieldConfidence;
  hospital: FieldConfidence;
  admission_date: FieldConfidence;
  discharge_date: FieldConfidence;
  attending_doctor: FieldConfidence;
  department: FieldConfidence;
  diagnosis: FieldConfidence;
  procedures: FieldConfidence;
  hospital_course_summary: FieldConfidence;
  investigation_summary: FieldConfidence;
  discharge_condition: FieldConfidence;
  follow_up_instructions: FieldConfidence;
  medications_on_discharge: PrescriptionMedicine[];
}

export type ExtractedStructuredData = 
  | LabReportData 
  | MedicalBillData 
  | PrescriptionData 
  | DischargeSummaryData;

export interface ValidationIssue {
  id: string;
  field: string;
  severity: 'warning' | 'error' | 'info';
  message: string;
}

export interface MedicalDocumentRecord {
  id: string;
  display_id: string; // e.g. LAB-2026-0831
  filename: string;
  file_size_bytes: number;
  mime_type: string;
  category: DocumentCategory;
  status: DocumentStatus;
  overall_confidence: number; // 0 - 100
  upload_timestamp: string;
  last_modified: string;
  facility_name: string;
  patient_id_preview: string;
  patient_name_preview: string;
  summary_preview: string;
  is_synthetic_demo: boolean;
  needs_human_review: boolean;
  unverified_field_count: number;
  extracted_data?: ExtractedStructuredData;
  validation_issues: ValidationIssue[];
  ocr_method: 'direct_pdf_stream' | 'tesseract_ocr' | 'hybrid_extract';
  raw_text_snippet?: string;
  audit_history?: {
    action: string;
    timestamp: string;
    operator: string;
    details: string;
  }[];
}

export interface WorkspaceMetrics {
  documents_today_count: number;
  needs_review_count: number;
  processed_count: number;
  average_confidence: number;
  verified_count: number;
  claim_ready_count: number;
}
