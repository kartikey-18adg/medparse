from typing import List, Dict, Any, Tuple
from app.models.schemas import ValidationIssue

def validate_structured_data(category: str, data: Dict[str, Any]) -> Tuple[List[ValidationIssue], bool]:
    """
    Applies clinical and mathematical rule validation across extracted structured records.
    Returns: (validation_issues, needs_human_review)
    """
    issues: List[ValidationIssue] = []

    if category == "medical_bill":
        issues.extend(validate_medical_bill(data))
    elif category == "lab_report":
        issues.extend(validate_lab_report(data))
    elif category == "discharge_summary":
        issues.extend(validate_discharge_summary(data))
    elif category == "prescription":
        issues.extend(validate_prescription(data))

    needs_review = any(i.severity in ["warning", "error"] for i in issues)
    return issues, needs_review

def validate_medical_bill(data: Dict[str, Any]) -> List[ValidationIssue]:
    issues = []
    line_items = data.get("line_items", [])
    
    # Check 1: Math Consistency
    computed_sum = sum(item.get("total_price", 0.0) for item in line_items)
    
    stated_total_str = str(data.get("total_amount", {}).get("value", "0")).replace("$", "").replace(",", "").strip()
    try:
        stated_total = float(stated_total_str)
        if abs(computed_sum - stated_total) > 0.05:
            issues.append(ValidationIssue(
                id="val-math-discrepancy",
                field="Total Invoice Amount",
                severity="warning",
                message=f"Line items sum (${computed_sum:.2f}) does not match stated invoice total (${stated_total:.2f})."
            ))
    except ValueError:
        issues.append(ValidationIssue(
            id="val-total-parse",
            field="Total Invoice Amount",
            severity="error",
            message="Unable to parse numerical total from stated amount string."
        ))

    # Check 2: Duplicate Service Items / Potential Unbundling
    seen_descriptions = set()
    for idx, item in enumerate(line_items):
        desc = item.get("description", "").strip().lower()
        if desc in seen_descriptions:
            issues.append(ValidationIssue(
                id=f"val-duplicate-{idx}",
                field=f"Line Item #{idx+1}",
                severity="info",
                message=f"Potential duplicate service entry detected: '{item.get('description')}'. Verify clinical justification."
            ))
        else:
            seen_descriptions.add(desc)

    # Check 3: Low-confidence line items
    for idx, item in enumerate(line_items):
        if item.get("confidence", 100) < 80 and not item.get("isVerified"):
            issues.append(ValidationIssue(
                id=f"val-line-{idx}",
                field=f"Line Item #{idx+1} ({item.get('description', 'Service')})",
                severity="warning",
                message=f"Low OCR confidence ({item.get('confidence')}%) on service description or billing rate."
            ))

    return issues

def validate_lab_report(data: Dict[str, Any]) -> List[ValidationIssue]:
    issues = []
    tests = data.get("tests", [])

    for test in tests:
        res_str = str(test.get("result", "")).replace(",", "").strip()
        if test.get("status") != "normal" and test.get("confidence", 100) < 80:
            issues.append(ValidationIssue(
                id=f"val-lab-{test.get('id', 't')}",
                field=test.get("name", "Lab Parameter"),
                severity="warning",
                message=f"Abnormal test value '{res_str} {test.get('unit', '')}' detected with low optical confidence ({test.get('confidence')}%)."
            ))

    return issues

def validate_discharge_summary(data: Dict[str, Any]) -> List[ValidationIssue]:
    issues = []
    adm_str = data.get("admission_date", {}).get("value", "")
    disc_str = data.get("discharge_date", {}).get("value", "")

    if adm_str and disc_str:
        if disc_str < adm_str:
            issues.append(ValidationIssue(
                id="val-date-sequence",
                field="Discharge Date",
                severity="error",
                message="Chronological inconsistency: Discharge date precedes admission date."
            ))

    return issues

def validate_prescription(data: Dict[str, Any]) -> List[ValidationIssue]:
    issues = []
    medicines = data.get("medicines", [])

    for idx, med in enumerate(medicines):
        if med.get("confidence", 100) < 80 and not med.get("isVerified"):
            issues.append(ValidationIssue(
                id=f"val-rx-{idx}",
                field=f"Medication: {med.get('name', 'Drug')}",
                severity="warning",
                message=f"Low optical confidence ({med.get('confidence')}%) on dosage '{med.get('dosage')}'. Verification required."
            ))

    return issues
