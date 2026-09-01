from typing import List, Dict, Any

# Clinical dictionary mapping clinical diagnoses to ICD-10-CM codes
ICD10_DATABASE: Dict[str, Dict[str, Any]] = {
    "cholecystitis": {
        "code": "K80.00",
        "description": "Calculus of gallbladder with acute cholecystitis without obstruction",
        "category": "Digestive System (Gastroenterology)",
        "confidence": 98
    },
    "cholelithiasis": {
        "code": "K80.20",
        "description": "Calculus of gallbladder without cholecystitis without obstruction",
        "category": "Digestive System (Gastroenterology)",
        "confidence": 96
    },
    "rhinosinusitis": {
        "code": "J01.90",
        "description": "Acute sinusitis, unspecified",
        "category": "Respiratory System (ENT)",
        "confidence": 97
    },
    "sinusitis": {
        "code": "J01.90",
        "description": "Acute sinusitis, unspecified",
        "category": "Respiratory System (ENT)",
        "confidence": 95
    },
    "hypertension": {
        "code": "I10",
        "description": "Essential (primary) hypertension",
        "category": "Circulatory System (Cardiology)",
        "confidence": 99
    },
    "diabetes": {
        "code": "E11.9",
        "description": "Type 2 diabetes mellitus without complications",
        "category": "Endocrine & Metabolic",
        "confidence": 98
    },
    "glucose": {
        "code": "R73.09",
        "description": "Other abnormal glucose (Impaired fasting glucose)",
        "category": "Symptoms & Clinical Findings",
        "confidence": 94
    },
    "trauma": {
        "code": "T14.90",
        "description": "Injury, unspecified",
        "category": "Injury & Trauma",
        "confidence": 92
    },
    "head injury": {
        "code": "S09.90XA",
        "description": "Unspecified injury of head, initial encounter",
        "category": "Injury & Trauma",
        "confidence": 95
    }
}

# Clinical dictionary mapping procedure narratives to CPT / HCPCS codes
CPT_DATABASE: Dict[str, Dict[str, Any]] = {
    "cholecystectomy": {
        "code": "CPT-47562",
        "description": "Laparoscopy, surgical; cholecystectomy",
        "relative_value_units": 15.4,
        "confidence": 98
    },
    "ct head": {
        "code": "CPT-70450",
        "description": "Computed tomography, head or brain; without contrast material",
        "relative_value_units": 4.8,
        "confidence": 99
    },
    "emergency room": {
        "code": "CPT-99284",
        "description": "Emergency department visit, high medical decision making (Level 4)",
        "relative_value_units": 3.6,
        "confidence": 97
    },
    "ecg": {
        "code": "CPT-93000",
        "description": "Electrocardiogram, routine ECG with at least 12 leads; with interpretation",
        "relative_value_units": 0.8,
        "confidence": 98
    },
    "hydration": {
        "code": "CPT-96360",
        "description": "Intravenous hydration infusion, initial, 31 minutes to 1 hour",
        "relative_value_units": 1.2,
        "confidence": 96
    },
    "mri spine": {
        "code": "CPT-72148",
        "description": "Magnetic resonance (eg, proton) imaging, spinal canal and contents, lumbar; without contrast",
        "relative_value_units": 6.5,
        "confidence": 98
    },
    "complete blood count": {
        "code": "CPT-85025",
        "description": "Blood count; complete (CBC) automated and automated differential WBC count",
        "relative_value_units": 0.5,
        "confidence": 99
    }
}

def suggest_icd10_codes(diagnosis_text: str) -> List[Dict[str, Any]]:
    """
    Analyzes clinical diagnosis text and recommends matching ICD-10-CM diagnostic codes.
    """
    text_lower = diagnosis_text.lower()
    matches = []

    for keyword, info in ICD10_DATABASE.items():
        if keyword in text_lower:
            matches.append(info)

    if not matches:
        # Default fallback match for unmapped diagnostic narratives
        matches.append({
            "code": "R69",
            "description": "Illness, unspecified (Clinical diagnosis review pending)",
            "category": "General Clinical Findings",
            "confidence": 80
        })

    return matches

def suggest_cpt_codes(procedure_text: str) -> List[Dict[str, Any]]:
    """
    Analyzes surgical and procedural narratives and recommends matching CPT codes.
    """
    text_lower = procedure_text.lower()
    matches = []

    for keyword, info in CPT_DATABASE.items():
        if keyword in text_lower:
            matches.append(info)

    if not matches:
        matches.append({
            "code": "CPT-99213",
            "description": "Office or other outpatient visit, established patient",
            "relative_value_units": 1.3,
            "confidence": 80
        })

    return matches
