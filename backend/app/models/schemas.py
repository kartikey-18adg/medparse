from typing import List, Optional, Union, Literal, Any, Dict
from pydantic import BaseModel, Field, EmailStr

DocumentCategoryType = Literal["lab_report", "medical_bill", "prescription", "discharge_summary"]
DocumentStatusType = Literal["processing", "processed", "needs_review", "verified", "claim_ready", "error"]
ConfidenceLevelType = Literal["high", "medium", "low"]

# --- Authentication Schemas ---
class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "Clinical Operator"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Clinical Structured Extraction Schemas ---
class FieldConfidence(BaseModel):
    value: Optional[Any] = None
    confidence: int = Field(default=0, ge=0, le=100)
    level: ConfidenceLevelType = "low"
    needsReview: bool = False
    isVerified: Optional[bool] = False
    originalValue: Optional[Any] = None
    verifiedAt: Optional[str] = None
    verifiedBy: Optional[str] = None

class LabTestItem(BaseModel):
    id: str
    name: str
    result: str
    unit: str
    reference_range: str
    status: Literal["normal", "abnormal", "critical", "inconclusive"] = "normal"
    confidence: int = 95
    needsReview: Optional[bool] = False
    isVerified: Optional[bool] = False

class LabReportSchema(BaseModel):
    document_type: Literal["lab_report"] = "lab_report"
    patient_name: FieldConfidence
    patient_id: FieldConfidence
    date: FieldConfidence
    facility: FieldConfidence
    ordering_doctor: FieldConfidence
    specimen_type: Optional[FieldConfidence] = None
    tests: List[LabTestItem] = []

class BillLineItem(BaseModel):
    id: str
    description: str
    code: Optional[str] = None
    quantity: int = 1
    unit_price: float = 0.0
    total_price: float = 0.0
    confidence: int = 95
    needsReview: Optional[bool] = False
    isVerified: Optional[bool] = False

class MathVerification(BaseModel):
    calculated_total: float
    stated_total: float
    is_consistent: bool
    discrepancy_amount: Optional[float] = 0.0
    notes: Optional[str] = None

class MedicalBillSchema(BaseModel):
    document_type: Literal["medical_bill"] = "medical_bill"
    patient_name: FieldConfidence
    patient_id: FieldConfidence
    hospital: FieldConfidence
    bill_number: FieldConfidence
    bill_date: FieldConfidence
    admission_date: Optional[FieldConfidence] = None
    discharge_date: Optional[FieldConfidence] = None
    treatment_procedure: FieldConfidence
    line_items: List[BillLineItem] = []
    subtotal: FieldConfidence
    tax: FieldConfidence
    discount: FieldConfidence
    total_amount: FieldConfidence
    math_verification: MathVerification

class PrescriptionMedicine(BaseModel):
    id: str
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: str
    confidence: int = 95
    needsReview: Optional[bool] = False
    isVerified: Optional[bool] = False

class PrescriptionSchema(BaseModel):
    document_type: Literal["prescription"] = "prescription"
    patient_name: FieldConfidence
    patient_id: FieldConfidence
    doctor: FieldConfidence
    doctor_license: Optional[FieldConfidence] = None
    date: FieldConfidence
    diagnosis: FieldConfidence
    medicines: List[PrescriptionMedicine] = []
    special_precautions: Optional[FieldConfidence] = None

class DischargeSummarySchema(BaseModel):
    document_type: Literal["discharge_summary"] = "discharge_summary"
    patient_name: FieldConfidence
    patient_id: FieldConfidence
    hospital: FieldConfidence
    admission_date: FieldConfidence
    discharge_date: FieldConfidence
    attending_doctor: FieldConfidence
    department: FieldConfidence
    diagnosis: FieldConfidence
    procedures: FieldConfidence
    hospital_course_summary: FieldConfidence
    investigation_summary: FieldConfidence
    discharge_condition: FieldConfidence
    follow_up_instructions: FieldConfidence
    medications_on_discharge: List[PrescriptionMedicine] = []

ExtractedDataUnion = Union[LabReportSchema, MedicalBillSchema, PrescriptionSchema, DischargeSummarySchema]

class ValidationIssue(BaseModel):
    id: str
    field: str
    severity: Literal["warning", "error", "info"]
    message: str

class AuditLogItem(BaseModel):
    action: str
    timestamp: str
    operator: str
    details: str

class DocumentRecord(BaseModel):
    id: str
    display_id: str
    user_id: Optional[str] = None
    filename: str
    file_size_bytes: int
    mime_type: str
    category: DocumentCategoryType
    status: DocumentStatusType
    overall_confidence: int
    upload_timestamp: str
    last_modified: str
    facility_name: Optional[str] = None
    patient_id_preview: Optional[str] = None
    patient_name_preview: Optional[str] = None
    summary_preview: Optional[str] = None
    needs_human_review: bool = False
    unverified_field_count: int = 0
    ocr_method: Literal["direct_pdf_stream", "tesseract_ocr", "hybrid_extract"] = "direct_pdf_stream"
    validation_issues: List[ValidationIssue] = []
    extracted_data: Optional[Dict[str, Any]] = None
    audit_history: List[AuditLogItem] = []

class WorkspaceMetrics(BaseModel):
    documents_today_count: int
    needs_review_count: int
    processed_count: int
    average_confidence: int
    verified_count: int
    claim_ready_count: int

class FieldUpdatePayload(BaseModel):
    field_name: str
    value: Any
    is_verified: bool = True
    operator: Optional[str] = "Clinical Operator"
