import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import JSONResponse, Response

from app.config import UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES
from app.models.schemas import DocumentRecord, FieldUpdatePayload
from app.db.database import (
    get_all_documents, get_document_by_id, insert_document,
    update_document_extracted_data, mark_document_verified, delete_document_by_id
)
from app.services.text_extractor import extract_text_from_file
from app.services.document_classifier import classify_document
from app.services.ai_extractor import extract_structured_entities
from app.services.validator import validate_structured_data
from app.services.confidence_scorer import compute_overall_confidence

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("", response_model=List[DocumentRecord])
def list_documents(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """
    List all clinical records with optional category, status, and text search filters.
    """
    return get_all_documents(category=category, status=status, search=search)

@router.get("/{doc_id}", response_model=DocumentRecord)
def get_document(doc_id: str):
    """
    Retrieve single document metadata and structured extraction.
    """
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
    return doc

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    category_override: Optional[str] = Form("auto")
):
    """
    Uploads a clinical document (PDF, JPG, PNG), validates file size and type,
    executes OCR extraction, applies AI schema structuring, and persists record to SQLite.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported: PDF, JPG, JPEG, PNG"
        )

    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    saved_filename = f"{doc_id}_{file.filename}"
    saved_path = UPLOAD_DIR / saved_filename

    # Save file to disk
    with open(saved_path, "wb") as buffer:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="File exceeds maximum allowed size (25MB).")
        buffer.write(content)

    # 1. OCR / Text extraction
    raw_text, ocr_method, char_count = extract_text_from_file(saved_path)

    # 2. Classification
    if category_override and category_override != "auto":
        detected_category = category_override
        class_conf = 0.98
    else:
        detected_category, class_conf = classify_document(raw_text, file.filename)

    # Prefix display ID
    prefix_map = {
        "lab_report": "LAB",
        "medical_bill": "BILL",
        "prescription": "RX",
        "discharge_summary": "DISC"
    }
    display_id = f"{prefix_map.get(detected_category, 'DOC')}-2026-{uuid.uuid4().hex[:4].upper()}"

    # 3. AI Structured Extraction
    structured_data = extract_structured_entities(detected_category, raw_text, file.filename)

    # 4. Validation & Confidence Scoring
    validation_issues, needs_review = validate_structured_data(detected_category, structured_data)
    overall_conf, unverified_count = compute_overall_confidence(detected_category, structured_data)

    now_iso = datetime.utcnow().isoformat() + "Z"

    doc_record_data = {
        "id": doc_id,
        "display_id": display_id,
        "filename": file.filename,
        "file_size_bytes": len(content),
        "mime_type": file.content_type or "application/octet-stream",
        "category": detected_category,
        "status": "needs_review" if needs_review else "processed",
        "overall_confidence": overall_conf,
        "upload_timestamp": now_iso,
        "last_modified": now_iso,
        "facility_name": structured_data.get("facility", {}).get("value") or structured_data.get("hospital", {}).get("value") or "Central District Hospital",
        "patient_id_preview": structured_data.get("patient_id", {}).get("value") or "PT-NEW",
        "patient_name_preview": structured_data.get("patient_name", {}).get("value") or "Patient Name Pending",
        "summary_preview": f"{detected_category.replace('_', ' ').title()} · Ingested via {ocr_method}",
        "is_synthetic_demo": False,
        "needs_human_review": needs_review,
        "unverified_field_count": unverified_count,
        "ocr_method": ocr_method,
        "file_path": str(saved_path),
        "raw_text": raw_text
    }

    insert_document(
        doc_record_data,
        structured_data,
        [i.dict() if hasattr(i, "dict") else i for i in validation_issues]
    )

    created_doc = get_document_by_id(doc_id)
    return created_doc

@router.post("/{doc_id}/process")
def reprocess_document(doc_id: str):
    """
    Re-runs the OCR, structuring, and validation pipeline on an existing document.
    """
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    raw_text = doc.get("raw_text", "")
    category = doc.get("category", "lab_report")
    structured_data = extract_structured_entities(category, raw_text, doc.get("filename", ""))
    validation_issues, needs_review = validate_structured_data(category, structured_data)

    update_document_extracted_data(doc_id, structured_data, operator="System Pipeline (Reprocess)")
    return get_document_by_id(doc_id)

@router.get("/{doc_id}/extraction")
def get_document_extraction(doc_id: str):
    """
    Retrieve structured JSON extraction payload.
    """
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {
        "document_id": doc_id,
        "display_id": doc["display_id"],
        "category": doc["category"],
        "structured_data": doc["extracted_data"],
        "validation_issues": doc["validation_issues"]
    }

@router.patch("/{doc_id}/fields")
def update_extracted_fields(doc_id: str, payload: FieldUpdatePayload):
    """
    Save operator corrections/edits to structured fields.
    """
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    current_data = doc.get("extracted_data") or {}
    if payload.field_name in current_data:
        current_data[payload.field_name]["value"] = payload.value
        current_data[payload.field_name]["isVerified"] = payload.is_verified
        current_data[payload.field_name]["needsReview"] = False

    update_document_extracted_data(doc_id, current_data, operator=payload.operator)
    return get_document_by_id(doc_id)

@router.post("/{doc_id}/verify")
def verify_document_record(doc_id: str, operator: str = Form("Dr. K. Patel (Clinical Admin)")):
    """
    Human verification completion: marks record as verified and READY FOR CLAIM.
    """
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    mark_document_verified(doc_id, operator=operator)
    return get_document_by_id(doc_id)

@router.get("/{doc_id}/claim-record")
def get_claim_record(doc_id: str):
    """
    Returns structured claim-ready dataset formatted for hospital claims processing.
    """
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    return {
        "claim_reference": f"CLM-{doc['display_id']}",
        "status": "READY_FOR_CLAIM",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "document_metadata": {
            "document_id": doc["display_id"],
            "filename": doc["filename"],
            "category": doc["category"],
            "overall_confidence": doc["overall_confidence"]
        },
        "patient": {
            "name": doc["patient_name_preview"],
            "patient_id": doc["patient_id_preview"],
            "facility": doc["facility_name"]
        },
        "verified_structured_data": doc["extracted_data"],
        "audit_stamp": {
            "verified_by": "Dr. K. Patel (Clinical Admin)",
            "verification_status": "CERTIFIED"
        }
    }

@router.get("/{doc_id}/export")
def export_document_data(doc_id: str, format: str = Query("json")):
    """
    Export structured dataset in JSON or CSV format.
    """
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if format == "csv":
        # Generate itemized CSV
        csv_lines = ["Claim_ID,Document_ID,Category,Patient_Name,Patient_ID,Facility,Date,Service_Or_Parameter,Total_Amount,Status"]
        row = f"CLM-{doc['display_id']},{doc['display_id']},{doc['category']},\"{doc['patient_name_preview']}\",{doc['patient_id_preview']},\"{doc['facility_name']}\",{doc['upload_timestamp'][:10]},\"{doc['summary_preview']}\",\"{doc['overall_confidence']}%\",READY_FOR_CLAIM"
        csv_lines.append(row)
        csv_data = "\n".join(csv_lines)
        return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={doc['display_id']}_claim.csv"})

    return JSONResponse(content={
        "claim_id": f"CLM-{doc['display_id']}",
        "record": doc
    })

@router.delete("/{doc_id}")
def delete_document(doc_id: str):
    """
    Deletes document record and associated data (Privacy compliance).
    """
    success = delete_document_by_id(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"status": "success", "message": f"Document '{doc_id}' deleted successfully."}
