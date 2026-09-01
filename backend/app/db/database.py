import sqlite3
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.config import DB_PATH
from app.models.schemas import WorkspaceMetrics

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Clinical Operator',
        created_at TEXT NOT NULL
    );
    """)

    # Documents Table (Scoper per user)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        display_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        overall_confidence INTEGER NOT NULL,
        upload_timestamp TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        facility_name TEXT,
        patient_id_preview TEXT,
        patient_name_preview TEXT,
        summary_preview TEXT,
        needs_human_review INTEGER NOT NULL DEFAULT 0,
        unverified_field_count INTEGER NOT NULL DEFAULT 0,
        ocr_method TEXT NOT NULL,
        file_path TEXT,
        raw_text TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # Extracted Records Table
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

    # Verification History Table
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
    conn.close()

# --- User Management DB Methods ---

def create_user(user_id: str, email: str, hashed_password: str, full_name: str, role: str = "Clinical Operator") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO users (id, email, hashed_password, full_name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, email.lower().strip(), hashed_password, full_name.strip(), role, now))
    conn.commit()
    conn.close()
    return {
        "id": user_id,
        "email": email.lower().strip(),
        "full_name": full_name.strip(),
        "role": role,
        "created_at": now
    }

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, role, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# --- Document Management DB Methods ---

def get_all_documents(
    user_id: str,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT d.*, e.structured_json, e.validation_issues_json 
    FROM documents d
    LEFT JOIN extracted_records e ON d.id = e.document_id
    WHERE d.user_id = ?
    """
    params = [user_id]

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
        item["needs_human_review"] = bool(item["needs_human_review"])
        item["extracted_data"] = json.loads(item["structured_json"]) if item.get("structured_json") else None
        item["validation_issues"] = json.loads(item["validation_issues_json"]) if item.get("validation_issues_json") else []
        
        # Fetch audit history
        cursor.execute("SELECT action, operator, details, timestamp FROM verification_history WHERE document_id = ? ORDER BY timestamp ASC", (item["id"],))
        item["audit_history"] = [dict(a) for a in cursor.fetchall()]
        
        results.append(item)

    conn.close()
    return results

def get_document_by_id(doc_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    if user_id:
        cursor.execute("""
        SELECT d.*, e.structured_json, e.validation_issues_json 
        FROM documents d
        LEFT JOIN extracted_records e ON d.id = e.document_id
        WHERE d.id = ? AND d.user_id = ?
        """, (doc_id, user_id))
    else:
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
    item["needs_human_review"] = bool(item["needs_human_review"])
    item["extracted_data"] = json.loads(item["structured_json"]) if item.get("structured_json") else None
    item["validation_issues"] = json.loads(item["validation_issues_json"]) if item.get("validation_issues_json") else []

    cursor.execute("SELECT action, operator, details, timestamp FROM verification_history WHERE document_id = ? ORDER BY timestamp ASC", (doc_id,))
    item["audit_history"] = [dict(a) for a in cursor.fetchall()]

    conn.close()
    return item

def insert_document(
    doc_data: Dict[str, Any],
    extracted_data: Dict[str, Any],
    validation_issues: List[Dict[str, Any]],
    user_id: str
) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO documents (
        id, display_id, user_id, filename, file_size_bytes, mime_type, category, status,
        overall_confidence, upload_timestamp, last_modified, facility_name,
        patient_id_preview, patient_name_preview, summary_preview,
        needs_human_review, unverified_field_count,
        ocr_method, file_path, raw_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_data["id"], doc_data["display_id"], user_id, doc_data["filename"],
        doc_data["file_size_bytes"], doc_data["mime_type"], doc_data["category"],
        doc_data["status"], doc_data["overall_confidence"], doc_data["upload_timestamp"],
        doc_data["last_modified"], doc_data.get("facility_name"), doc_data.get("patient_id_preview"),
        doc_data.get("patient_name_preview"), doc_data.get("summary_preview"),
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

def update_document_extracted_data(doc_id: str, user_id: str, updated_data: Dict[str, Any], operator: str = "Clinical Operator"):
    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    UPDATE extracted_records 
    SET structured_json = ?, updated_at = ?
    WHERE document_id = ? AND document_id IN (SELECT id FROM documents WHERE id = ? AND user_id = ?)
    """, (json.dumps(updated_data), now, doc_id, doc_id, user_id))

    cursor.execute("""
    UPDATE documents
    SET last_modified = ?
    WHERE id = ? AND user_id = ?
    """, (now, doc_id, user_id))

    cursor.execute("""
    INSERT INTO verification_history (document_id, action, operator, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        doc_id, "Field Edit", operator, "Structured fields updated by operator.", now
    ))

    conn.commit()
    conn.close()

def mark_document_verified(doc_id: str, user_id: str, operator: str = "Clinical Operator"):
    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    UPDATE documents
    SET status = 'claim_ready', overall_confidence = 100, needs_human_review = 0, unverified_field_count = 0, last_modified = ?
    WHERE id = ? AND user_id = ?
    """, (now, doc_id, user_id))

    cursor.execute("""
    UPDATE extracted_records
    SET validation_status = 'claim_ready', verified = 1, validation_issues_json = '[]', updated_at = ?
    WHERE document_id = ? AND document_id IN (SELECT id FROM documents WHERE id = ? AND user_id = ?)
    """, (now, doc_id, doc_id, user_id))

    cursor.execute("""
    INSERT INTO verification_history (document_id, action, operator, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        doc_id, "Human Verification Certified", operator, "All clinical and financial fields certified against source document. Status promoted to READY FOR CLAIM.", now
    ))

    conn.commit()
    conn.close()

def delete_document_by_id(doc_id: str, user_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM verification_history WHERE document_id = ? AND document_id IN (SELECT id FROM documents WHERE id = ? AND user_id = ?)", (doc_id, doc_id, user_id))
    cursor.execute("DELETE FROM extracted_records WHERE document_id = ? AND document_id IN (SELECT id FROM documents WHERE id = ? AND user_id = ?)", (doc_id, doc_id, user_id))
    cursor.execute("DELETE FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id))

    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_workspace_metrics(user_id: str) -> WorkspaceMetrics:
    conn = get_db_connection()
    cursor = conn.cursor()

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    cursor.execute("SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND upload_timestamp LIKE ?", (user_id, f"{today_str}%"))
    total_today = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND status = 'needs_review'", (user_id,))
    needs_review = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND status NOT IN ('processing', 'error')", (user_id,))
    processed = cursor.fetchone()["count"]

    cursor.execute("SELECT AVG(overall_confidence) as avg_conf FROM documents WHERE user_id = ?", (user_id,))
    avg_conf_raw = cursor.fetchone()["avg_conf"]
    avg_conf = round(avg_conf_raw) if avg_conf_raw is not None else 0

    cursor.execute("SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND status = 'verified'", (user_id,))
    verified = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND status = 'claim_ready'", (user_id,))
    claim_ready = cursor.fetchone()["count"]

    conn.close()
    return WorkspaceMetrics(
        documents_today_count=total_today,
        needs_review_count=needs_review,
        processed_count=processed,
        average_confidence=avg_conf,
        verified_count=verified,
        claim_ready_count=claim_ready
    )

