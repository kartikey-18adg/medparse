import unittest
import io
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import init_db

client = TestClient(app)

class TestApiIntegration(unittest.TestCase):
    def setUp(self):
        init_db()

    def test_unauthenticated_access_blocked(self):
        """Unauthenticated requests must receive 401 Unauthorized"""
        res = client.get("/api/documents")
        self.assertEqual(res.status_code, 401)

        res = client.get("/api/metrics")
        self.assertEqual(res.status_code, 401)

        res = client.get("/api/auth/me")
        self.assertEqual(res.status_code, 401)

    def test_register_and_login_flow(self):
        # 1. Register User 1
        reg_payload = {
            "email": "dr.k.patel@hospital.org",
            "password": "SecurePassword2026!",
            "full_name": "Dr. K. Patel",
            "role": "Clinical Operations Admin"
        }
        reg_res = client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(reg_res.status_code, 200)
        data = reg_res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "dr.k.patel@hospital.org")
        self.assertEqual(data["user"]["full_name"], "Dr. K. Patel")

        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get /api/auth/me
        me_res = client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "dr.k.patel@hospital.org")

        # 3. Login with credentials
        login_res = client.post("/api/auth/login", json={
            "email": "dr.k.patel@hospital.org",
            "password": "SecurePassword2026!"
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertIn("access_token", login_res.json())

        # 4. Login with wrong password fails
        bad_login = client.post("/api/auth/login", json={
            "email": "dr.k.patel@hospital.org",
            "password": "WrongPassword!"
        })
        self.assertEqual(bad_login.status_code, 401)

    def test_document_lifecycle_and_user_isolation(self):
        # Setup User A
        res_a = client.post("/api/auth/register", json={
            "email": "doctor_a@hospital.org",
            "password": "Password123!",
            "full_name": "Dr. Alice",
            "role": "Clinical Operator"
        })
        token_a = res_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Setup User B
        res_b = client.post("/api/auth/register", json={
            "email": "doctor_b@hospital.org",
            "password": "Password123!",
            "full_name": "Dr. Bob",
            "role": "Auditor"
        })
        token_b = res_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # 1. Initial State: 0 documents
        docs_a = client.get("/api/documents", headers=headers_a).json()
        self.assertEqual(len(docs_a), 0)

        metrics_a = client.get("/api/metrics", headers=headers_a).json()
        self.assertEqual(metrics_a["documents_today_count"], 0)
        self.assertEqual(metrics_a["average_confidence"], 0)

        # 2. Upload Document for User A
        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(CITY GENERAL HOSPITAL) Tj\n0 -20 Td\n(PATIENT NAME: Sarah Connor) Tj\n0 -20 Td\n(PATIENT ID: PT-9021) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000216 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n386\n%%EOF"
        
        upload_res = client.post(
            "/api/documents/upload",
            headers=headers_a,
            files={"file": ("sample_report.pdf", io.BytesIO(pdf_content), "application/pdf")},
            data={"category_override": "lab_report"}
        )
        self.assertEqual(upload_res.status_code, 200)
        uploaded_doc = upload_res.json()
        doc_id = uploaded_doc["id"]

        # Check extracted fields
        self.assertEqual(uploaded_doc["category"], "lab_report")
        self.assertEqual(uploaded_doc["patient_name_preview"], "Sarah Connor")
        self.assertEqual(uploaded_doc["patient_id_preview"], "PT-9021")

        # 3. User A can retrieve doc & metrics
        doc_view_a = client.get(f"/api/documents/{doc_id}", headers=headers_a)
        self.assertEqual(doc_view_a.status_code, 200)

        metrics_a = client.get("/api/metrics", headers=headers_a).json()
        self.assertEqual(metrics_a["documents_today_count"], 1)

        # 4. User B CANNOT see doc or access it
        docs_b = client.get("/api/documents", headers=headers_b).json()
        self.assertEqual(len(docs_b), 0)

        doc_view_b = client.get(f"/api/documents/{doc_id}", headers=headers_b)
        self.assertEqual(doc_view_b.status_code, 404)

        metrics_b = client.get("/api/metrics", headers=headers_b).json()
        self.assertEqual(metrics_b["documents_today_count"], 0)

        # 5. User A verifies the document
        verify_res = client.post(f"/api/documents/{doc_id}/verify", headers=headers_a, data={"operator": "Dr. Alice"})
        self.assertEqual(verify_res.status_code, 200)
        self.assertEqual(verify_res.json()["status"], "claim_ready")

        # 6. User A gets claim-record
        claim_res = client.get(f"/api/documents/{doc_id}/claim-record", headers=headers_a)
        self.assertEqual(claim_res.status_code, 200)
        claim_data = claim_res.json()
        self.assertEqual(claim_data["patient"]["name"], "Sarah Connor")
        self.assertEqual(claim_data["audit_stamp"]["verified_by"], "Dr. Alice")

        # 7. Delete document
        del_res = client.delete(f"/api/documents/{doc_id}", headers=headers_a)
        self.assertEqual(del_res.status_code, 200)

        # Confirm deleted
        self.assertEqual(client.get(f"/api/documents/{doc_id}", headers=headers_a).status_code, 404)

if __name__ == "__main__":
    unittest.main()
