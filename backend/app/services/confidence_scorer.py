from typing import Dict, Any, Tuple

def compute_overall_confidence(category: str, structured_data: Dict[str, Any]) -> Tuple[int, int]:
    """
    Calculates weighted overall confidence score (0-100) and counts unverified low-confidence fields.
    Returns: (overall_confidence, unverified_low_conf_count)
    """
    total_scores = []
    low_conf_count = 0

    def process_field(field_obj: Any):
        nonlocal low_conf_count
        if isinstance(field_obj, dict) and "confidence" in field_obj:
            conf = field_obj.get("confidence", 95)
            total_scores.append(conf)
            if conf < 80 and not field_obj.get("isVerified"):
                low_conf_count += 1

    # Traverse main attributes
    for key, val in structured_data.items():
        if key in ["tests", "line_items", "medicines", "medications_on_discharge"]:
            continue
        process_field(val)

    # Process array items
    if "tests" in structured_data:
        for t in structured_data["tests"]:
            process_field(t)

    if "line_items" in structured_data:
        for item in structured_data["line_items"]:
            process_field(item)

    if "medicines" in structured_data:
        for m in structured_data["medicines"]:
            process_field(m)

    if not total_scores:
        return 90, 0

    avg_score = round(sum(total_scores) / len(total_scores))
    return avg_score, low_conf_count
