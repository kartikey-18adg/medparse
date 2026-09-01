import os
from pathlib import Path
import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

FRONTEND_SAMPLES = Path(r"C:\Users\lenovo\.gemini\antigravity\scratch\frontend\public\samples")
BACKEND_UPLOADS = Path(r"C:\Users\lenovo\.gemini\antigravity\scratch\backend\uploads")

FRONTEND_SAMPLES.mkdir(parents=True, exist_ok=True)
BACKEND_UPLOADS.mkdir(parents=True, exist_ok=True)

def create_lab_report_pdf(target_path: Path):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4

    # Draw border
    rect = fitz.Rect(30, 30, 565, 812)
    page.draw_rect(rect, color=(0.1, 0.1, 0.1), width=1)

    # Header
    page.insert_text((50, 65), "CITY CARE DIAGNOSTICS & PATHOLOGY", fontsize=14, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((50, 80), "Clinical Reference Laboratory · Accreditation #LAB-99201", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
    page.insert_text((50, 92), "100 Healthcare Boulevard, Suite 400 · Tel: (555) 019-2834", fontsize=8, fontname="helv", color=(0.4, 0.4, 0.4))
    page.draw_line(fitz.Point(50, 105), fitz.Point(545, 105), color=(0.1, 0.1, 0.1), width=1.5)

    # Patient info box
    page.draw_rect(fitz.Rect(50, 115, 545, 175), color=(0.8, 0.8, 0.8), fill=(0.96, 0.96, 0.95))
    page.insert_text((60, 132), "PATIENT NAME:   Rahul Sharma", fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((60, 148), "PATIENT ID:     PT-92831", fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((60, 164), "ORDERING DOC:   Dr. Alok Verma, MD", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))

    page.insert_text((320, 132), "DATE OF COLLECTION:  2026-08-31", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((320, 148), "SPECIMEN TYPE:       Venous Whole Blood", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((320, 164), "REPORT STATUS:       FINAL CERTIFIED", fontsize=9, fontname="helv", color=(0.1, 0.4, 0.2))

    # Table Header
    page.draw_rect(fitz.Rect(50, 195, 545, 215), fill=(0.9, 0.9, 0.88))
    page.insert_text((60, 209), "INVESTIGATION PARAMETER", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((260, 209), "OBSERVED RESULT", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((380, 209), "UNITS", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((450, 209), "REFERENCE RANGE", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))

    # Table Rows
    tests = [
        ("Hemoglobin", "13.4", "g/dL", "13.0 - 17.0", "normal"),
        ("Total Leukocyte Count (WBC)", "7,200", "/µL", "4,000 - 11,000", "normal"),
        ("Platelet Count", "240,000", "/µL", "150,000 - 450,000", "normal"),
        ("Fasting Plasma Glucose", "118 *", "mg/dL", "70 - 99", "abnormal"),
        ("Serum Creatinine", "0.92", "mg/dL", "0.70 - 1.30", "normal"),
        ("Blood Urea Nitrogen (BUN)", "14.2", "mg/dL", "7.0 - 20.0", "normal"),
        ("Serum Sodium (Na+)", "140", "mEq/L", "135 - 145", "normal"),
        ("Serum Potassium (K+)", "4.3", "mEq/L", "3.5 - 5.1", "normal"),
    ]

    y = 235
    for name, res, unit, ref, status in tests:
        if status == "abnormal":
            page.draw_rect(fitz.Rect(50, y - 12, 545, y + 6), fill=(0.99, 0.97, 0.92))
        page.insert_text((60, y), name, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        page.insert_text((260, y), res, fontsize=9, fontname="helv", color=(0.6, 0.2, 0.1) if status == "abnormal" else (0.1, 0.1, 0.1))
        page.insert_text((380, y), unit, fontsize=8, fontname="helv", color=(0.3, 0.3, 0.3))
        page.insert_text((450, y), ref, fontsize=8, fontname="helv", color=(0.3, 0.3, 0.3))
        page.draw_line(fitz.Point(50, y + 6), fitz.Point(545, y + 6), color=(0.85, 0.85, 0.85), width=0.5)
        y += 22

    # Notes & Signatures
    page.insert_text((50, 480), "* Value exceeds normal reference range threshold. Follow-up recommended.", fontsize=8, fontname="helv", color=(0.5, 0.2, 0.1))
    page.draw_line(fitz.Point(50, 720), fitz.Point(545, 720), color=(0.8, 0.8, 0.8), width=1)
    page.insert_text((50, 740), "Pathology Lab Verification: Dr. S. K. Gupta, MD (Pathology)", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text((50, 755), "Authorized Laboratory Signatory · Electronic Verification Complete", fontsize=8, fontname="helv", color=(0.4, 0.4, 0.4))

    doc.save(str(target_path))
    doc.close()

def create_medical_bill_pdf(target_path: Path):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)

    # Border
    page.draw_rect(fitz.Rect(30, 30, 565, 812), color=(0.1, 0.1, 0.1), width=1)

    # Header
    page.insert_text((50, 65), "CITYCARE MEDICAL CENTRE", fontsize=15, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((50, 80), "Department of Emergency Medicine & Inpatient Billing", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
    page.insert_text((50, 92), "Tax ID: 88-1029481 · Provider NPI: 104928104", fontsize=8, fontname="helv", color=(0.4, 0.4, 0.4))
    
    # Bill Reference Tag
    page.draw_rect(fitz.Rect(380, 50, 545, 95), fill=(0.95, 0.95, 0.94), color=(0.1, 0.1, 0.1))
    page.insert_text((390, 68), "INVOICE: BILL-2026-9812", fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((390, 85), "DATE: 2026-08-30", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))

    page.draw_line(fitz.Point(50, 105), fitz.Point(545, 105), color=(0.1, 0.1, 0.1), width=1.5)

    # Patient & Admission Box
    page.draw_rect(fitz.Rect(50, 115, 545, 175), fill=(0.96, 0.96, 0.95), color=(0.8, 0.8, 0.8))
    page.insert_text((60, 132), "PATIENT NAME:   Aarav Mehta", fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((60, 148), "PATIENT ID:     DEMO-10482", fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((60, 164), "TREATMENT:      Emergency Trauma Care & Diagnostic Imaging", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))

    page.insert_text((320, 132), "ADMISSION DATE:  2026-08-28", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((320, 148), "DISCHARGE DATE:  2026-08-30", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((320, 164), "PAYMENT STATUS:  UNPAID / CLAIM PENDING", fontsize=9, fontname="helv", color=(0.6, 0.2, 0.1))

    # Line Items Header
    page.draw_rect(fitz.Rect(50, 195, 545, 215), fill=(0.9, 0.9, 0.88))
    page.insert_text((60, 209), "SERVICE / PROCEDURE DESCRIPTION", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((310, 209), "CODE", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((380, 209), "QTY", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((430, 209), "RATE ($)", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((490, 209), "TOTAL ($)", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))

    items = [
        ("Emergency Room Consultation Level IV", "CPT-99284", "1", "650.00", "650.00"),
        ("CT Scan Head & Brain without Contrast", "CPT-70450", "1", "1100.00", "1100.00"),
        ("Intravenous Hydration Therapy 1000ml", "CPT-96360", "2", "120.00", "240.00"),
        ("Diagnostic 12-Lead Electrocardiogram", "CPT-93000", "1", "160.00", "160.00"),
        ("Pharmacy Supplies & Wound Dressing", "SUP-4011", "1", "300.00", "300.00"),
    ]

    y = 235
    for desc, code, qty, rate, total in items:
        page.insert_text((60, y), desc, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        page.insert_text((310, y), code, fontsize=8, fontname="helv", color=(0.3, 0.3, 0.3))
        page.insert_text((385, y), qty, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        page.insert_text((430, y), rate, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        page.insert_text((490, y), total, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        page.draw_line(fitz.Point(50, y + 6), fitz.Point(545, y + 6), color=(0.85, 0.85, 0.85), width=0.5)
        y += 24

    # Financial Total Box
    page.draw_rect(fitz.Rect(350, 390, 545, 480), fill=(0.97, 0.97, 0.96), color=(0.8, 0.8, 0.8))
    page.insert_text((365, 410), "SUBTOTAL:          $2,450.00", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text((365, 428), "TAX / SURCHARGES:      $0.00", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text((365, 446), "DISCOUNT:              $0.00", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))
    page.draw_line(fitz.Point(365, 455), fitz.Point(535, 455), color=(0.2, 0.2, 0.2), width=1)
    page.insert_text((365, 472), "TOTAL AMOUNT:      $2,450.00", fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    doc.save(str(target_path))
    doc.close()

def create_discharge_summary_pdf(target_path: Path):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)

    # Border
    page.draw_rect(fitz.Rect(30, 30, 565, 812), color=(0.1, 0.1, 0.1), width=1)

    # Header
    page.insert_text((50, 65), "ST. JUDE MEMORIAL HOSPITAL", fontsize=15, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((50, 80), "DEPARTMENT OF SURGICAL GASTROENTEROLOGY", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
    page.draw_line(fitz.Point(50, 95), fitz.Point(545, 95), color=(0.1, 0.1, 0.1), width=1.5)

    # Demographics
    page.draw_rect(fitz.Rect(50, 105, 545, 165), fill=(0.96, 0.96, 0.95), color=(0.8, 0.8, 0.8))
    page.insert_text((60, 122), "PATIENT: Vikram Singhania (PT-41908)", fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((60, 138), "ATTENDING DOCTOR: Dr. Rajesh Nair, MS, MCh", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((60, 154), "DEPARTMENT: Surgical Gastroenterology", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))

    page.insert_text((350, 122), "ADMISSION DATE:  2026-08-20", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((350, 138), "DISCHARGE DATE:  2026-08-25", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))

    # Clinical Sections
    y = 190
    sections = [
        ("PRIMARY DIAGNOSIS", "Symptomatic Cholelithiasis with Chronic Calculous Cholecystitis"),
        ("PROCEDURE PERFORMED", "Elective Laparoscopic Cholecystectomy under General Anesthesia (Date: 2026-08-21)"),
        ("HOSPITAL COURSE SUMMARY", "Patient admitted with recurrent biliary colic. Underwent uneventful laparoscopic cholecystectomy. Post-op vitals stable. Normal bowel sounds returned Day 2. Incision sites clean and dry."),
        ("INVESTIGATION SUMMARY", "Pre-op USG Abdomen confirmed multiple gallstones. Post-op LFT and CBC within normal limits. Histopathology confirmed chronic cholecystitis without dysplasia."),
        ("DISCHARGE CONDITION", "Hemodynamically stable, afebrile, surgical incisions healing well, ambulating comfortably."),
        ("FOLLOW-UP INSTRUCTIONS", "Review in Surgical OPD on 2026-09-02 for suture removal. Maintain low-fat diet for 2 weeks.")
    ]

    for title, desc in sections:
        page.insert_text((50, y), title, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        page.draw_line(fitz.Point(50, y + 3), fitz.Point(200, y + 3), color=(0.4, 0.4, 0.4), width=0.5)
        y += 16
        
        # Wrapped text
        rect = fitz.Rect(50, y - 5, 545, y + 35)
        page.insert_textbox(rect, desc, fontsize=8.5, fontname="helv", color=(0.25, 0.25, 0.25))
        y += 42

    doc.save(str(target_path))
    doc.close()

def create_prescription_image(target_path: Path):
    img = Image.new("RGB", (700, 950), color="#FAF9F6")
    draw = ImageDraw.Draw(img)

    # Border
    draw.rectangle([20, 20, 680, 930], outline="#2B2B2B", width=2)

    # Header
    draw.text((40, 40), "METRO CARE OUTPATIENT CLINIC", fill="#1A1A1A")
    draw.text((40, 65), "Dr. Ananya Sen, MBBS, MS (ENT) · Reg #MCI-48201", fill="#4A4A4A")
    draw.text((40, 85), "Tel: (555) 012-9481 · Clinic Hours: 09:00 - 17:00", fill="#6A6A6A")
    draw.line([(40, 110), (660, 110)], fill="#1A1A1A", width=2)

    # Patient Box
    draw.rectangle([40, 125, 660, 185], fill="#F0EFEB", outline="#D0CECA")
    draw.text((55, 140), "Patient Name: Priya Patel", fill="#1A1A1A")
    draw.text((55, 160), "Patient ID:   PT-84192", fill="#1A1A1A")
    draw.text((420, 140), "Date: 2026-08-30", fill="#1A1A1A")
    draw.text((420, 160), "Diagnosis: Acute Bacterial Rhinosinusitis", fill="#1A1A1A")

    # Rx Symbol & Prescribed Medications
    draw.text((40, 210), "Rx", fill="#1A1A1A")
    
    meds = [
        ("1. Augmentin 625 Duo (Amoxicillin + Clavulanate 625mg)", "Sig: 1 tablet twice daily (after food) x 7 days"),
        ("2. Levocetirizine 5mg Tablets", "Sig: 1 tablet once daily at bedtime x 5 days"),
        ("3. Fluticasone Furoate Nasal Spray 27.5mcg", "Sig: 2 sprays each nostril once daily x 14 days")
    ]

    my = 260
    for title, sig in meds:
        draw.text((60, my), title, fill="#1A1A1A")
        draw.text((80, my + 25), sig, fill="#4A4A4A")
        draw.line([(60, my + 60), (640, my + 60)], fill="#E0DED8", width=1)
        my += 80

    # Instructions & Signature
    draw.text((40, 560), "Special Advice: Warm steam inhalation twice daily. Maintain adequate hydration.", fill="#3A3A3A")
    draw.line([(440, 850), (640, 850)], fill="#1A1A1A", width=1)
    draw.text((460, 860), "Dr. Ananya Sen, MS", fill="#1A1A1A")
    draw.text((460, 880), "Authorized Medical Signatory", fill="#6A6A6A")

    img.save(str(target_path))

if __name__ == "__main__":
    print("Generating authentic sample medical documents...")
    create_lab_report_pdf(FRONTEND_SAMPLES / "lab_report_sample.pdf")
    create_lab_report_pdf(BACKEND_UPLOADS / "lab_report_sample.pdf")

    create_medical_bill_pdf(FRONTEND_SAMPLES / "medical_bill_sample.pdf")
    create_medical_bill_pdf(BACKEND_UPLOADS / "medical_bill_sample.pdf")

    create_discharge_summary_pdf(FRONTEND_SAMPLES / "discharge_summary_sample.pdf")
    create_discharge_summary_pdf(BACKEND_UPLOADS / "discharge_summary_sample.pdf")

    create_prescription_image(FRONTEND_SAMPLES / "prescription_sample.png")
    create_prescription_image(BACKEND_UPLOADS / "prescription_sample.png")
    print("All sample medical documents successfully generated in public/samples and uploads.")
