import re
from typing import Tuple
from app.models.schemas import DocumentCategoryType

def classify_document(raw_text: str, filename: str) -> Tuple[DocumentCategoryType, float]:
    """
    Classify a clinical document using keyword frequency, clinical entity heuristics,
    and metadata matching.
    """
    text_lower = (raw_text + " " + filename).lower()

    # Keyword scoring dictionaries
    scores = {
        "lab_report": 0,
        "medical_bill": 0,
        "prescription": 0,
        "discharge_summary": 0,
    }

    # Lab report indicators
    lab_keywords = [
        "lab", "pathology", "hematology", "hemoglobin", "leukocyte", "platelet", 
        "glucose", "serum", "specimen", "reference range", "test result", "cbc", 
        "urinalysis", "creatinine", "blood count", "diagnostics"
    ]
    for kw in lab_keywords:
        if kw in text_lower:
            scores["lab_report"] += 2

    # Medical bill indicators
    bill_keywords = [
        "bill", "invoice", "cpt", "hcpcs", "subtotal", "tax", "discount", 
        "total amount", "line items", "unit rate", "amount due", "itemized", 
        "consultation fee", "charge", "payment", "due date"
    ]
    for kw in bill_keywords:
        if kw in text_lower:
            scores["medical_bill"] += 2

    # Prescription indicators
    rx_keywords = [
        "prescription", "rx", "dosage", "frequency", "duration", "instructions", 
        "take 1 tab", "oral", "mg", "twice daily", "after food", "dr.", "mbbs", 
        "sig:", "capsule", "syrup"
    ]
    for kw in rx_keywords:
        if kw in text_lower:
            scores["prescription"] += 2

    # Discharge summary indicators
    discharge_keywords = [
        "discharge summary", "admission date", "discharge date", "attending doctor", 
        "hospital course", "diagnosis", "procedures", "discharge condition", 
        "follow-up", "operative note", "cholecystectomy", "inpatient", "post-op"
    ]
    for kw in discharge_keywords:
        if kw in text_lower:
            scores["discharge_summary"] += 2

    best_category = max(scores, key=scores.get)
    max_score = scores[best_category]

    if max_score == 0:
        # Default based on filename cues if text was sparse
        if "bill" in filename.lower() or "invoice" in filename.lower():
            return "medical_bill", 0.85
        elif "lab" in filename.lower() or "blood" in filename.lower() or "test" in filename.lower():
            return "lab_report", 0.85
        elif "rx" in filename.lower() or "presc" in filename.lower():
            return "prescription", 0.85
        elif "disc" in filename.lower() or "summary" in filename.lower():
            return "discharge_summary", 0.85
        return "lab_report", 0.70

    confidence = min(0.99, 0.75 + (max_score * 0.03))
    return best_category, confidence
