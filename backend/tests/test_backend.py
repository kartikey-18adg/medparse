import unittest
import json
from pathlib import Path
from app.db.database import init_db, get_all_documents, get_document_by_id, get_workspace_metrics
from app.services.document_classifier import classify_document
from app.services.validator import validate_structured_data
from app.services.confidence_scorer import compute_overall_confidence
from app.services.ai_extractor import extract_structured_entities

class TestMedParseBackend(unittest.TestCase):
    def setUp(self):
        init_db()

    def test_database_seeding(self):
        docs = get_all_documents()
        self.assertGreater(len(docs), 0)
        self.assertEqual(docs[0]["status"], "needs_review")

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

    def test_confidence_scoring(self):
        score, low_count = compute_overall_confidence("lab_report", {
            "patient_name": {"value": "John", "confidence": 95},
            "tests": [
                {"id": "1", "name": "Glucose", "confidence": 75, "isVerified": False}
            ]
        })
        self.assertEqual(score, 85)
        self.assertEqual(low_count, 1)

if __name__ == "__main__":
    unittest.main()
