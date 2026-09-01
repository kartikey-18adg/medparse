import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.config import DB_PATH
from app.models.schemas import DocumentRecord, WorkspaceMetrics

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        display_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        overall_confidence INTEGER NOT NULL,
        upload_timestamp TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        facility_name TEXT NOT NULL,
        patient_id_preview TEXT NOT NULL,
        patient_name_preview TEXT NOT NULL,
        summary_preview TEXT NOT NULL,
        is_synthetic_demo INTEGER NOT NULL DEFAULT 1,
        needs_human_review INTEGER NOT NULL DEFAULT 0,
        unverified_field_count INTEGER NOT NULL DEFAULT 0,
        ocr_method TEXT NOT NULL,
        file_path TEXT,
        raw_text TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS extracted_records (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        structured_json TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        validation_issues_json TEXT,
        validation_status TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verification_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT NOT NULL,
        action TEXT NOT NULL,
        operator TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
    );
    """)

    conn.commit()

    # Seed initial documents if empty
    cursor.execute("SELECT COUNT(*) as count FROM documents")
    count = cursor.fetchone()["count"]
    if count == 0:
        seed_initial_data(conn)

    conn.close()

def seed_initial_data(conn: sqlite3.Connection):
    # Sample Initial Document: Lab Report
    lab_json = {
        "document_type": "lab_report",
        "patient_name": {"value": "Rahul Sharma", "confidence": 98, "level": "high", "needsReview": False},
        "patient_id": {"value": "PT-92831", "confidence": 96, "level": "high", "needsReview": False},
        "date": {"value": "2026-08-31", "confidence": 99, "level": "high", "needsReview": False},
        "facility": {"value": "City Care Diagnostics & Pathology", "confidence": 97, "level": "high", "needsReview": False},
        "ordering_doctor": {"value": "Dr. Alok Verma, MD (Internal Med)", "confidence": 94, "level": "medium", "needsReview": False},
        "specimen_type": {"value": "Venous Whole Blood & Serum", "confidence": 96, "level": "high", "needsReview": False},
        "tests": [
            {"id": "t1", "name": "Hemoglobin", "result": "13.4", "unit": "g/dL", "reference_range": "13.0 - 17.0", "status": "normal", "confidence": 98},
            {"id": "t2", "name": "Total Leukocyte Count (WBC)", "result": "7,200", "unit": "/µL", "reference_range": "4,000 - 11,000", "status": "normal", "confidence": 97},
            {"id": "t3", "name": "Platelet Count", "result": "240,000", "unit": "/µL", "reference_range": "150,000 - 450,000", "status": "normal", "confidence": 96},
            {"id": "t4", "name": "Fasting Plasma Glucose", "result": "118", "unit": "mg/dL", "reference_range": "70 - 99", "status": "abnormal", "confidence": 76, "needsReview": True},
            {"id": "t5", "name": "Serum Creatinine", "result": "0.92", "unit": "mg/dL", "reference_range": "0.70 - 1.30", "status": "normal", "confidence": 95}
        ]
    }

    lab_issues = [
        {"id": "val-01", "field": "Fasting Plasma Glucose", "severity": "warning", "message": "Value 118 mg/dL exceeds reference threshold (70-99 mg/dL). Optical confidence 76%."}
    ]

    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO documents (id, display_id, filename, file_size_bytes, mime_type, category, status, overall_confidence, upload_timestamp, last_modified, facility_name, patient_id_preview, patient_name_preview, summary_preview, is_synthetic_demo, needs_human_review, unverified_field_count, ocr_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "doc-001", "LAB-2026-0831", "lab_report_hematology_pt92831.pdf", 284100, "application/pdf", "lab_report", "needs_review", 88,
        "2026-09-01T08:14:00Z", "2026-09-01T08:15:20Z", "City Care Diagnostics & Pathology", "PT-92831", "Rahul Sharma",
        "Complete Blood Count & Metabolic Panel · Glucose elevated (118 mg/dL)", 1, 1, 1, "direct_pdf_stream"
    ))

    cursor.execute("""
    INSERT INTO extracted_records (id, document_id, structured_json, confidence, validation_issues_json, validation_status, verified, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "rec-001", "doc-001", json.dumps(lab_json), 88, json.dumps(lab_issues), "needs_review", 0, "2026-09-01T08:15:20Z"
    ))

    cursor.execute("""
    INSERT INTO verification_history (document_id, action, operator, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        "doc-001", "AI Structured Extraction", "AI Extraction Engine v2.4", "Extracted 5 test metrics. Flagged 1 field for low OCR certainty.", "2026-09-01T08:14:04Z"
    ))

    # Sample Initial Document: Medical Bill
    bill_json = {
        "document_type": "medical_bill",
        "patient_name": {"value": "Aarav Mehta", "confidence": 98, "level": "high", "needsReview": False},
        "patient_id": {"value": "DEMO-10482", "confidence": 96, "level": "high", "needsReview": False},
        "hospital": {"value": "CityCare Medical Centre", "confidence": 99, "level": "high", "needsReview": False},
        "bill_number": {"value": "BILL-2026-9812", "confidence": 95, "level": "high", "needsReview": False},
        "bill_date": {"value": "2026-08-30", "confidence": 99, "level": "high", "needsReview": False},
        "treatment_procedure": {"value": "Emergency Trauma Care & Diagnostic Imaging", "confidence": 71, "level": "low", "needsReview": True},
        "line_items": [
            {"id": "i1", "description": "Emergency Room Consultation Level IV", "code": "CPT-99284", "quantity": 1, "unit_price": 650.0, "total_price": 650.0, "confidence": 98},
            {"id": "i2", "description": "CT Scan Head & Brain without Contrast", "code": "CPT-70450", "quantity": 1, "unit_price": 1100.0, "total_price": 1100.0, "confidence": 96},
            {"id": "i3", "description": "Intravenous Hydration Therapy 1000ml", "code": "CPT-96360", "quantity": 2, "unit_price": 120.0, "total_price": 240.0, "confidence": 92},
            {"id": "i4", "description": "Diagnostic 12-Lead Electrocardiogram", "code": "CPT-93000", "quantity": 1, "unit_price": 160.0, "total_price": 160.0, "confidence": 95},
            {"id": "i5", "description": "Pharmacy Supplies & Wound Dressing", "code": "SUP-4011", "quantity": 1, "unit_price": 300.0, "total_price": 300.0, "confidence": 84, "needsReview": True}
        ],
        "subtotal": {"value": "$2,450.00", "confidence": 99, "level": "high", "needsReview": False},
        "tax": {"value": "$0.00", "confidence": 95, "level": "high", "needsReview": False},
        "discount": {"value": "$0.00", "confidence": 95, "level": "high", "needsReview": False},
        "total_amount": {"value": "$2,450.00", "confidence": 99, "level": "high", "needsReview": False},
        "math_verification": {
            "calculated_total": 2450.0,
            "stated_total": 2450.0,
            "is_consistent": True,
            "discrepancy_amount": 0.0,
            "notes": "Sum of 5 line items matches stated invoice total ($2,450.00)."
        }
    }

    bill_issues = [
        {"id": "val-02", "field": "Diagnosis & Procedure Code", "severity": "warning", "message": "Procedure description extracted with 71% confidence. Requires operator confirmation."}
    ]

    cursor.execute("""
    INSERT INTO documents (id, display_id, filename, file_size_bytes, mime_type, category, status, overall_confidence, upload_timestamp, last_modified, facility_name, patient_id_preview, patient_name_preview, summary_preview, is_synthetic_demo, needs_human_review, unverified_field_count, ocr_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "doc-002", "BILL-2026-0830", "itemized_hospital_bill_demo10482.pdf", 412800, "application/pdf", "medical_bill", "needs_review", 82,
        "2026-09-01T07:42:00Z", "2026-09-01T07:43:10Z", "CityCare Medical Centre", "DEMO-10482", "Aarav Mehta",
        "Inpatient Billing · 5 Line items · Procedure: Acute Trauma Evaluation · $2,450.00", 1, 1, 2, "direct_pdf_stream"
    ))

    cursor.execute("""
    INSERT INTO extracted_records (id, document_id, structured_json, confidence, validation_issues_json, validation_status, verified, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "rec-002", "doc-002", json.dumps(bill_json), 82, json.dumps(bill_issues), "needs_review", 0, "2026-09-01T07:43:10Z"
    ))

    conn.commit()

def get_all_documents(category: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT d.*, e.structured_json, e.validation_issues_json 
    FROM documents d
    LEFT JOIN extracted_records e ON d.id = e.document_id
    WHERE 1=1
    """
    params = []

    if category and category != "all":
        query += " AND d.category = ?"
        params.append(category)

    if status and status != "all":
        query += " AND d.status = ?"
        params.append(status)

    if search:
        query += " AND (d.display_id LIKE ? OR d.filename LIKE ? OR d.patient_name_preview LIKE ? OR d.patient_id_preview LIKE ? OR d.facility_name LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern, pattern, pattern])

    query += " ORDER BY d.upload_timestamp DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    results = []

    for row in rows:
        item = dict(row)
        item["is_synthetic_demo"] = bool(item["is_synthetic_demo"])
        item["needs_human_review"] = bool(item["needs_human_review"])
        item["extracted_data"] = json.loads(item["structured_json"]) if item.get("structured_json") else None
        item["validation_issues"] = json.loads(item["validation_issues_json"]) if item.get("validation_issues_json") else []
        
        # Fetch audit history
        cursor.execute("SELECT action, operator, details, timestamp FROM verification_history WHERE document_id = ? ORDER BY timestamp ASC", (item["id"],))
        item["audit_history"] = [dict(a) for a in cursor.fetchall()]
        
        results.append(item)

    conn.close()
    return results

def get_document_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT d.*, e.structured_json, e.validation_issues_json 
    FROM documents d
    LEFT JOIN extracted_records e ON d.id = e.document_id
    WHERE d.id = ?
    """, (doc_id,))
    
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    item = dict(row)
    item["is_synthetic_demo"] = bool(item["is_synthetic_demo"])
    item["needs_human_review"] = bool(item["needs_human_review"])
    item["extracted_data"] = json.loads(item["structured_json"]) if item.get("structured_json") else None
    item["validation_issues"] = json.loads(item["validation_issues_json"]) if item.get("validation_issues_json") else []

    cursor.execute("SELECT action, operator, details, timestamp FROM verification_history WHERE document_id = ? ORDER BY timestamp ASC", (doc_id,))
    item["audit_history"] = [dict(a) for a in cursor.fetchall()]

    conn.close()
    return item

def insert_document(doc_data: Dict[str, Any], extracted_data: Dict[str, Any], validation_issues: List[Dict[str, Any]]) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO documents (
        id, display_id, filename, file_size_bytes, mime_type, category, status,
        overall_confidence, upload_timestamp, last_modified, facility_name,
        patient_id_preview, patient_name_preview, summary_preview,
        is_synthetic_demo, needs_human_review, unverified_field_count,
        ocr_method, file_path, raw_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_data["id"], doc_data["display_id"], doc_data["filename"],
        doc_data["file_size_bytes"], doc_data["mime_type"], doc_data["category"],
        doc_data["status"], doc_data["overall_confidence"], doc_data["upload_timestamp"],
        doc_data["last_modified"], doc_data["facility_name"], doc_data["patient_id_preview"],
        doc_data["patient_name_preview"], doc_data["summary_preview"],
        1 if doc_data.get("is_synthetic_demo") else 0,
        1 if doc_data.get("needs_human_review") else 0,
        doc_data.get("unverified_field_count", 0),
        doc_data.get("ocr_method", "direct_pdf_stream"),
        doc_data.get("file_path", ""), doc_data.get("raw_text", "")
    ))

    rec_id = f"rec-{doc_data['id']}"
    cursor.execute("""
    INSERT INTO extracted_records (
        id, document_id, structured_json, confidence, validation_issues_json, validation_status, verified, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        rec_id, doc_data["id"], json.dumps(extracted_data), doc_data["overall_confidence"],
        json.dumps(validation_issues), doc_data["status"], 0, doc_data["last_modified"]
    ))

    cursor.execute("""
    INSERT INTO verification_history (document_id, action, operator, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        doc_data["id"], "Document Ingestion & OCR", "MedParse Ingestion Pipeline", "File received and processed through structured extraction engine.", doc_data["upload_timestamp"]
    ))

    conn.commit()
    conn.close()
    return doc_data["id"]

def update_document_extracted_data(doc_id: str, updated_data: Dict[str, Any], operator: str = "Dr. K. Patel"):
    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.utcnow().isoformat() + "Z"

    cursor.execute("""
    UPDATE extracted_records 
    SET structured_json = ?, updated_at = ?
    WHERE document_id = ?
    """, (json.dumps(updated_data), now, doc_id))

    cursor.execute("""
    UPDATE documents
    SET last_modified = ?
    WHERE id = ?
    """, (now, doc_id))

    cursor.execute("""
    INSERT INTO verification_history (document_id, action, operator, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        doc_id, "Field Edit", operator, "Structured fields updated by operator.", now
    ))

    conn.commit()
    conn.close()

def mark_document_verified(doc_id: str, operator: str = "Dr. K. Patel (Clinical Admin)"):
    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.utcnow().isoformat() + "Z"

    cursor.execute("""
    UPDATE documents
    SET status = 'claim_ready', overall_confidence = 100, needs_human_review = 0, unverified_field_count = 0, last_modified = ?
    WHERE id = ?
    """, (now, doc_id))

    cursor.execute("""
    UPDATE extracted_records
    SET validation_status = 'claim_ready', verified = 1, validation_issues_json = '[]', updated_at = ?
    WHERE document_id = ?
    """, (now, doc_id))

    cursor.execute("""
    INSERT INTO verification_history (document_id, action, operator, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        doc_id, "Human Verification Certified", operator, "All clinical and financial fields certified against source document. Status promoted to READY FOR CLAIM.", now
    ))

    conn.commit()
    conn.close()

def delete_document_by_id(doc_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    cursor.execute("DELETE FROM extracted_records WHERE document_id = ?", (doc_id,))
    cursor.execute("DELETE FROM verification_history WHERE document_id = ?", (doc_id,))

    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_workspace_metrics() -> WorkspaceMetrics:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM documents")
    total = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM documents WHERE status = 'needs_review'")
    needs_review = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM documents WHERE status != 'processing' AND status != 'error'")
    processed = cursor.fetchone()["count"]

    cursor.execute("SELECT AVG(overall_confidence) as avg_conf FROM documents")
    avg_conf = cursor.fetchone()["avg_conf"] or 94

    cursor.execute("SELECT COUNT(*) as count FROM documents WHERE status = 'verified'")
    verified = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM documents WHERE status = 'claim_ready'")
    claim_ready = cursor.fetchone()["count"]

    conn.close()
    return WorkspaceMetrics(
        documents_today_count=total,
        needs_review_count=needs_review,
        processed_count=processed,
        average_confidence=round(avg_conf),
        verified_count=verified,
        claim_ready_count=claim_ready
    )
