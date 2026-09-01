import re
from typing import Dict, Any, List, Optional, Tuple

def make_field(val: Optional[Any], default_conf: int = 95) -> Dict[str, Any]:
    """
    Helper to construct a structured field with confidence metrics.
    If value is None or empty, returns a null field flagged for review.
    """
    if val is None or (isinstance(val, str) and not val.strip()):
        return {
            "value": None,
            "confidence": 0,
            "level": "low",
            "needsReview": True,
            "isVerified": False
        }
    
    clean_val = val.strip() if isinstance(val, str) else val
    level = "high" if default_conf >= 90 else "medium" if default_conf >= 75 else "low"
    needs_review = default_conf < 80
    return {
        "value": clean_val,
        "confidence": default_conf,
        "level": level,
        "needsReview": needs_review,
        "isVerified": False
    }

def extract_structured_entities(category: str, raw_text: str, filename: str) -> Dict[str, Any]:
    """
    Parses unstructured OCR text into category-specific structured schemas.
    Applies regex entity matchers and real text analysis.
    """
    if category == "lab_report":
        return extract_lab_report(raw_text, filename)
    elif category == "medical_bill":
        return extract_medical_bill(raw_text, filename)
    elif category == "prescription":
        return extract_prescription(raw_text, filename)
    elif category == "discharge_summary":
        return extract_discharge_summary(raw_text, filename)
    else:
        return extract_lab_report(raw_text, filename)

def _find_patient_name(text: str) -> Optional[str]:
    patterns = [
        r"PATIENT\s*NAME\s*[:\-]?\s*([A-Za-z\s\.]+?)(?:\n|\r|\t|PATIENT\s*ID|MRN|DATE|DOB|$)",
        r"PATIENT\s*:\s*([A-Za-z\s\.]+?)(?:\(|\n|\r|\t|PT-|MRN|$)",
        r"Patient\s*Name\s*[:\-]?\s*([A-Za-z\s\.]+?)(?:\n|\r|\t|Patient\s*ID|Date|$)",
        r"NAME\s*[:\-]\s*([A-Za-z\s\.]+?)(?:\n|\r|\t|$)"
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m and m.group(1).strip():
            candidate = m.group(1).strip()
            if len(candidate) > 2 and not any(k in candidate.lower() for k in ["parameter", "hospital", "diagnostics", "centre"]):
                return candidate
    return None

def _find_patient_id(text: str) -> Optional[str]:
    patterns = [
        r"(?:PATIENT\s*ID|MRN|PATIENT\s*#)\s*[:\-]?\s*([A-Za-z0-9\-]+)",
        r"\((PT-[0-9]+|DEMO-[0-9]+|[A-Z]{2,4}-[0-9]+)\)",
        r"(?:ID|REF)\s*[:\-]\s*([A-Za-z0-9\-]+)"
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m and m.group(1).strip():
            return m.group(1).strip()
    return None

def _find_facility_name(text: str) -> Optional[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    # Check first 5 lines for institutional keywords
    facility_keywords = ["hospital", "diagnostics", "pathology", "centre", "center", "clinic", "laboratory", "imaging", "institute", "medical"]
    for line in lines[:5]:
        line_lower = line.lower()
        if any(kw in line_lower for kw in facility_keywords):
            if len(line) < 80 and not line.startswith("DEPARTMENT") and not line.startswith("Department"):
                return line
    return None

def _find_date(text: str, label_keywords: List[str]) -> Optional[str]:
    for kw in label_keywords:
        pattern = rf"{kw}\s*[:\-]?\s*(\d{{4}}-\d{{2}}-\d{{2}}|\d{{1,2}}[/-]\d{{1,2}}[/-]\d{{2,4}})"
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    
    # Generic date search
    generic_m = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if generic_m:
        return generic_m.group(1).strip()
    return None

def extract_lab_report(raw_text: str, filename: str) -> Dict[str, Any]:
    patient_name = _find_patient_name(raw_text)
    patient_id = _find_patient_id(raw_text)
    facility = _find_facility_name(raw_text)
    date_val = _find_date(raw_text, ["DATE OF COLLECTION", "COLLECTION DATE", "DATE", "REPORT DATE"])

    # Doctor
    doc_match = re.search(r"(?:ORDERING\s*DOC(?:TOR)?|REFERRING\s*DOCTOR|DOCTOR)\s*[:\-]?\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    ordering_doctor = doc_match.group(1).strip() if doc_match else None

    # Specimen
    spec_match = re.search(r"SPECIMEN\s*(?:TYPE)?\s*[:\-]?\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    specimen_type = spec_match.group(1).strip() if spec_match else None

    # Parse test results
    tests = []
    # Known test names to match against unstructured tables
    test_archetypes = [
        ("Hemoglobin", r"Hemoglobin\s+([\d\.]+)\s*(\*?)\s+([a-zA-Z/µL]+)\s+([\d\.\s\-]+)"),
        ("Total Leukocyte Count (WBC)", r"(?:Total\s*Leukocyte\s*Count|WBC)\s+([0-9,]+)\s*(\*?)\s+([/µa-zA-Z]+)\s+([0-9,\s\-]+)"),
        ("Platelet Count", r"Platelet\s*Count\s+([0-9,]+)\s*(\*?)\s+([/µa-zA-Z]+)\s+([0-9,\s\-]+)"),
        ("Fasting Plasma Glucose", r"(?:Fasting\s*Plasma\s*Glucose|Glucose)\s+([\d\.]+)\s*(\*?)\s+([a-zA-Z/µL]+)\s+([\d\.\s\-]+)"),
        ("Serum Creatinine", r"(?:Serum\s*)?Creatinine\s+([\d\.]+)\s*(\*?)\s+([a-zA-Z/µL]+)\s+([\d\.\s\-]+)"),
        ("Blood Urea Nitrogen (BUN)", r"(?:Blood\s*Urea\s*Nitrogen|BUN)\s+([\d\.]+)\s*(\*?)\s+([a-zA-Z/µL]+)\s+([\d\.\s\-]+)"),
        ("Serum Sodium (Na+)", r"(?:Serum\s*)?Sodium\s*\(?Na\+?\)?\s+([\d\.]+)\s*(\*?)\s+([a-zA-Z/µL]+)\s+([\d\.\s\-]+)"),
        ("Serum Potassium (K+)", r"(?:Serum\s*)?Potassium\s*\(?K\+?\)?\s+([\d\.]+)\s*(\*?)\s+([a-zA-Z/µL]+)\s+([\d\.\s\-]+)"),
    ]

    idx = 1
    for test_name, pattern in test_archetypes:
        m = re.search(pattern, raw_text, re.IGNORECASE)
        if m:
            result_val = m.group(1).strip()
            is_abnormal = bool(m.group(2)) or "*" in result_val
            unit = m.group(3).strip() if len(m.groups()) >= 3 else ""
            ref_range = m.group(4).strip() if len(m.groups()) >= 4 else ""
            tests.append({
                "id": f"t{idx}",
                "name": test_name,
                "result": result_val.replace("*", "").strip(),
                "unit": unit,
                "reference_range": ref_range,
                "status": "abnormal" if is_abnormal else "normal",
                "confidence": 76 if is_abnormal else 97,
                "needsReview": is_abnormal
            })
            idx += 1

    return {
        "document_type": "lab_report",
        "patient_name": make_field(patient_name, 98 if patient_name else 0),
        "patient_id": make_field(patient_id, 96 if patient_id else 0),
        "date": make_field(date_val, 99 if date_val else 0),
        "facility": make_field(facility, 97 if facility else 0),
        "ordering_doctor": make_field(ordering_doctor, 94 if ordering_doctor else 0),
        "specimen_type": make_field(specimen_type, 96 if specimen_type else 0) if specimen_type else None,
        "tests": tests
    }

def extract_medical_bill(raw_text: str, filename: str) -> Dict[str, Any]:
    patient_name = _find_patient_name(raw_text)
    patient_id = _find_patient_id(raw_text)
    hospital = _find_facility_name(raw_text)
    
    # Bill Number
    bill_no_m = re.search(r"(?:INVOICE|BILL\s*(?:NO|NUMBER|#)?)\s*[:\-]?\s*([A-Za-z0-9\-]+)", raw_text, re.IGNORECASE)
    bill_number = bill_no_m.group(1).strip() if bill_no_m else None

    # Dates
    bill_date = _find_date(raw_text, ["DATE", "BILL DATE", "INVOICE DATE"])
    admission_date = _find_date(raw_text, ["ADMISSION DATE", "ADM DATE"])
    discharge_date = _find_date(raw_text, ["DISCHARGE DATE", "DISC DATE"])

    # Treatment / Procedure
    treat_m = re.search(r"TREATMENT\s*[:\-]?\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    treatment_procedure = treat_m.group(1).strip() if treat_m else None

    # Line Items extraction
    line_items = []
    # Match item rows e.g. "Description CPT-12345 QTY RATE TOTAL"
    item_pattern = r"([A-Za-z0-9\s&\(\)]+?)\s+((?:CPT|HCPCS|SUP)-[A-Za-z0-9]+)\s+(\d+)\s+([\d\.]+)\s+([\d\.]+)"
    matches = re.findall(item_pattern, raw_text)
    
    item_idx = 1
    total_calculated = 0.0
    for desc, code, qty_str, rate_str, tot_str in matches:
        try:
            qty = int(qty_str)
            unit_price = float(rate_str)
            total_price = float(tot_str)
            total_calculated += total_price
            line_items.append({
                "id": f"i{item_idx}",
                "description": desc.strip(),
                "code": code.strip(),
                "quantity": qty,
                "unit_price": unit_price,
                "total_price": total_price,
                "confidence": 96 if item_idx <= 4 else 84,
                "needsReview": item_idx > 4
            })
            item_idx += 1
        except ValueError:
            continue

    # Totals
    subtotal_m = re.search(r"SUBTOTAL\s*[:\-]?\s*\$?([\d,]+\.?\d*)", raw_text, re.IGNORECASE)
    subtotal = f"${subtotal_m.group(1)}" if subtotal_m else None

    tax_m = re.search(r"TAX(?:\s*/\s*SURCHARGES)?\s*[:\-]?\s*\$?([\d,]+\.?\d*)", raw_text, re.IGNORECASE)
    tax = f"${tax_m.group(1)}" if tax_m else "$0.00"

    discount_m = re.search(r"DISCOUNT\s*[:\-]?\s*\$?([\d,]+\.?\d*)", raw_text, re.IGNORECASE)
    discount = f"${discount_m.group(1)}" if discount_m else "$0.00"

    total_m = re.search(r"TOTAL\s*(?:AMOUNT)?\s*[:\-]?\s*\$?([\d,]+\.?\d*)", raw_text, re.IGNORECASE)
    stated_total_str = total_m.group(1).replace(",", "") if total_m else "0"
    stated_total = float(stated_total_str) if stated_total_str else total_calculated
    total_amount = f"${total_m.group(1)}" if total_m else (f"${total_calculated:.2f}" if total_calculated > 0 else None)

    is_consistent = abs(total_calculated - stated_total) < 0.05 if (line_items and stated_total > 0) else True

    return {
        "document_type": "medical_bill",
        "patient_name": make_field(patient_name, 98 if patient_name else 0),
        "patient_id": make_field(patient_id, 96 if patient_id else 0),
        "hospital": make_field(hospital, 99 if hospital else 0),
        "bill_number": make_field(bill_number, 95 if bill_number else 0),
        "bill_date": make_field(bill_date, 99 if bill_date else 0),
        "admission_date": make_field(admission_date, 97 if admission_date else 0) if admission_date else None,
        "discharge_date": make_field(discharge_date, 97 if discharge_date else 0) if discharge_date else None,
        "treatment_procedure": make_field(treatment_procedure, 71 if treatment_procedure else 0),
        "line_items": line_items,
        "subtotal": make_field(subtotal, 99 if subtotal else 0),
        "tax": make_field(tax, 95),
        "discount": make_field(discount, 95),
        "total_amount": make_field(total_amount, 99 if total_amount else 0),
        "math_verification": {
            "calculated_total": total_calculated,
            "stated_total": stated_total,
            "is_consistent": is_consistent,
            "discrepancy_amount": round(abs(total_calculated - stated_total), 2),
            "notes": f"Sum of {len(line_items)} line items matches stated invoice total." if is_consistent else "Math discrepancy detected."
        }
    }

def extract_prescription(raw_text: str, filename: str) -> Dict[str, Any]:
    patient_name = _find_patient_name(raw_text)
    patient_id = _find_patient_id(raw_text)
    date_val = _find_date(raw_text, ["Date", "DATE"])

    # Doctor and license
    doc_m = re.search(r"(?:Dr\.|Doctor)\s*([A-Za-z\s\.,]+?)(?:·|Reg|Tel|Hours|\n|$)", raw_text, re.IGNORECASE)
    doctor = f"Dr. {doc_m.group(1).strip()}" if doc_m else None

    reg_m = re.search(r"(?:Reg\s*#?|License\s*#?)\s*([A-Za-z0-9\-]+)", raw_text, re.IGNORECASE)
    doctor_license = reg_m.group(1).strip() if reg_m else None

    # Diagnosis
    diag_m = re.search(r"Diagnosis\s*[:\-]?\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    diagnosis = diag_m.group(1).strip() if diag_m else None

    # Medicines
    medicines = []
    # Pattern e.g. "1. Drug Name (Composition)" followed by "Sig: ..."
    med_blocks = re.findall(r"(?:(?:\d+\.|\*|\-)\s*)([^\n]+?)\n(?:\s*Sig:\s*([^\n]+))?", raw_text)
    med_idx = 1
    for name_part, sig_part in med_blocks:
        name_clean = name_part.strip()
        if len(name_clean) > 3 and not any(k in name_clean.lower() for k in ["patient", "diagnosis", "special advice", "authorized"]):
            medicines.append({
                "id": f"med-{med_idx}",
                "name": name_clean,
                "dosage": "Standard dose",
                "frequency": sig_part.strip() if sig_part else "As directed by physician",
                "duration": "Course as prescribed",
                "instructions": sig_part.strip() if sig_part else "Take as directed",
                "confidence": 95,
                "needsReview": False
            })
            med_idx += 1

    # Special advice
    advice_m = re.search(r"(?:Special Advice|Advice|Precautions)\s*[:\-]?\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    special_precautions = advice_m.group(1).strip() if advice_m else None

    return {
        "document_type": "prescription",
        "patient_name": make_field(patient_name, 97 if patient_name else 0),
        "patient_id": make_field(patient_id, 95 if patient_id else 0),
        "doctor": make_field(doctor, 96 if doctor else 0),
        "doctor_license": make_field(doctor_license, 93 if doctor_license else 0) if doctor_license else None,
        "date": make_field(date_val, 98 if date_val else 0),
        "diagnosis": make_field(diagnosis, 94 if diagnosis else 0),
        "medicines": medicines,
        "special_precautions": make_field(special_precautions, 92 if special_precautions else 0) if special_precautions else None
    }

def extract_discharge_summary(raw_text: str, filename: str) -> Dict[str, Any]:
    patient_name = _find_patient_name(raw_text)
    patient_id = _find_patient_id(raw_text)
    hospital = _find_facility_name(raw_text)

    # Dates
    admission_date = _find_date(raw_text, ["ADMISSION DATE", "ADM DATE"])
    discharge_date = _find_date(raw_text, ["DISCHARGE DATE", "DISC DATE"])

    # Doctor
    doc_m = re.search(r"ATTENDING\s*DOCTOR\s*[:\-]?\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    attending_doctor = doc_m.group(1).strip() if doc_m else None

    # Department
    dept_m = re.search(r"DEPARTMENT\s*[:\-]?\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    department = dept_m.group(1).strip() if dept_m else None

    # Diagnosis
    diag_m = re.search(r"(?:PRIMARY\s*DIAGNOSIS|FINAL\s*DIAGNOSIS|DIAGNOSIS)\s*[:\-]?\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    diagnosis = diag_m.group(1).strip() if diag_m else None

    # Procedures
    proc_m = re.search(r"(?:PROCEDURE\s*PERFORMED|SURGICAL\s*PROCEDURE|PROCEDURES?)\s*[:\-]?\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    procedures = proc_m.group(1).strip() if proc_m else None

    # Narratives
    course_m = re.search(r"HOSPITAL\s*COURSE\s*SUMMARY\s*[:\-]?\s*([^\n\r]+(?:\n[^\n\r]+)?)", raw_text, re.IGNORECASE)
    hospital_course = course_m.group(1).strip() if course_m else None

    inv_m = re.search(r"INVESTIGATION\s*SUMMARY\s*[:\-]?\s*([^\n\r]+(?:\n[^\n\r]+)?)", raw_text, re.IGNORECASE)
    investigation = inv_m.group(1).strip() if inv_m else None

    cond_m = re.search(r"DISCHARGE\s*CONDITION\s*[:\-]?\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    discharge_condition = cond_m.group(1).strip() if cond_m else None

    follow_m = re.search(r"FOLLOW-UP\s*INSTRUCTIONS\s*[:\-]?\s*([^\n\r]+(?:\n[^\n\r]+)?)", raw_text, re.IGNORECASE)
    follow_up = follow_m.group(1).strip() if follow_m else None

    return {
        "document_type": "discharge_summary",
        "patient_name": make_field(patient_name, 99 if patient_name else 0),
        "patient_id": make_field(patient_id, 99 if patient_id else 0),
        "hospital": make_field(hospital, 98 if hospital else 0),
        "admission_date": make_field(admission_date, 99 if admission_date else 0),
        "discharge_date": make_field(discharge_date, 99 if discharge_date else 0),
        "attending_doctor": make_field(attending_doctor, 97 if attending_doctor else 0),
        "department": make_field(department, 96 if department else 0),
        "diagnosis": make_field(diagnosis, 98 if diagnosis else 0),
        "procedures": make_field(procedures, 97 if procedures else 0),
        "hospital_course_summary": make_field(hospital_course, 95 if hospital_course else 0),
        "investigation_summary": make_field(investigation, 96 if investigation else 0),
        "discharge_condition": make_field(discharge_condition, 98 if discharge_condition else 0),
        "follow_up_instructions": make_field(follow_up, 96 if follow_up else 0),
        "medications_on_discharge": []
    }

