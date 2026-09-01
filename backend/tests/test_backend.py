import unittest
import json
import uuid
from pathlib import Path
from app.db.database import (
    init_db, create_user, get_user_by_email, get_user_by_id,
    get_all_documents, get_document_by_id, insert_document, get_workspace_metrics
)
from app.services.auth import hash_password, verify_password, create_access_token, decode_access_token
from app.services.document_classifier import classify_document
from app.services.validator import validate_structured_data
from app.services.confidence_scorer import compute_overall_confidence
from app.services.ai_extractor import extract_structured_entities

class TestMedParseBackend(unittest.TestCase):
    def setUp(self):
        init_db()

    def test_auth_password_hashing(self):
        pwd = "DoctorSecret123!"
        hashed = hash_password(pwd)
        self.assertNotEqual(pwd, hashed)
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

    def test_jwt_token_flow(self):
        payload = {"sub": "usr-123", "email": "dr.patel@hospital.org"}
        token = create_access_token(payload)
        self.assertIsInstance(token, str)
        decoded = decode_access_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["sub"], "usr-123")
        self.assertEqual(decoded["email"], "dr.patel@hospital.org")

    def test_user_creation_and_isolation(self):
        user_a_id = f"usr-a-{uuid.uuid4().hex[:6]}"
        user_b_id = f"usr-b-{uuid.uuid4().hex[:6]}"
        
        user_a = create_user(user_a_id, f"doctor_a_{user_a_id}@hospital.org", hash_password("pass123"), "Dr. Alice", "Clinical Specialist")
        user_b = create_user(user_b_id, f"doctor_b_{user_b_id}@hospital.org", hash_password("pass123"), "Dr. Bob", "Medical Reviewer")
        
        self.assertEqual(user_a["full_name"], "Dr. Alice")
        self.assertEqual(user_b["full_name"], "Dr. Bob")

        # Insert doc for User A
        doc_id = f"doc-{uuid.uuid4().hex[:6]}"
        doc_data = {
            "id": doc_id,
            "display_id": "BILL-2026-TEST",
            "filename": "test_bill.pdf",
            "file_size_bytes": 1024,
            "mime_type": "application/pdf",
            "category": "medical_bill",
            "status": "needs_review",
            "overall_confidence": 85,
            "upload_timestamp": "2026-09-02T10:00:00Z",
            "last_modified": "2026-09-02T10:00:00Z",
            "facility_name": "Metro Clinic",
            "patient_id_preview": "PT-001",
            "patient_name_preview": "John Doe",
            "summary_preview": "Medical Bill Test",
            "needs_human_review": True,
            "unverified_field_count": 1,
            "ocr_method": "direct_pdf_stream",
            "file_path": "",
            "raw_text": "Sample text"
        }
        insert_document(doc_data, {"document_type": "medical_bill"}, [], user_id=user_a_id)

        # User A can see it
        docs_a = get_all_documents(user_id=user_a_id)
        self.assertEqual(len(docs_a), 1)
        self.assertEqual(docs_a[0]["id"], doc_id)

        # User B CANNOT see it
        docs_b = get_all_documents(user_id=user_b_id)
        self.assertEqual(len(docs_b), 0)

        # User B cannot access by ID
        doc_b_view = get_document_by_id(doc_id, user_id=user_b_id)
        self.assertIsNone(doc_b_view)

        # Metrics for User A vs User B
        metrics_a = get_workspace_metrics(user_id=user_a_id)
        self.assertEqual(metrics_a.needs_review_count, 1)

        metrics_b = get_workspace_metrics(user_id=user_b_id)
        self.assertEqual(metrics_b.documents_today_count, 0)
        self.assertEqual(metrics_b.needs_review_count, 0)
        self.assertEqual(metrics_b.average_confidence, 0)

    def test_classification_heuristics(self):
        cat, conf = classify_document("Patient complete blood count hemoglobin platelet", "test.pdf")
        self.assertEqual(cat, "lab_report")

        cat_bill, _ = classify_document("Hospital invoice line items subtotal tax total amount", "bill.pdf")
        self.assertEqual(cat_bill, "medical_bill")

    def test_math_validation_discrepancy(self):
        bill_data = {
            "document_type": "medical_bill",
            "line_items": [
                {"id": "1", "description": "Consultation", "total_price": 100.0, "confidence": 98},
                {"id": "2", "description": "X-Ray", "total_price": 200.0, "confidence": 98},
            ],
            "total_amount": {"value": "$400.00", "confidence": 99} # Incorrect stated total
        }
        issues, needs_review = validate_structured_data("medical_bill", bill_data)
        self.assertTrue(needs_review)
        self.assertTrue(any("does not match" in i.message for i in issues))

    def test_real_extraction_null_handling(self):
        # Empty text yields None values without inventing fake names
        raw_text = "Some random unclassified text without patient or clinical entities."
        res = extract_structured_entities("lab_report", raw_text, "random.pdf")
        self.assertIsNone(res["patient_name"]["value"])
        self.assertIsNone(res["patient_id"]["value"])
        self.assertEqual(len(res["tests"]), 0)

if __name__ == "__main__":
    unittest.main()

