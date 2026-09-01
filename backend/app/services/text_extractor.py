import os
from pathlib import Path
from typing import Tuple
import fitz  # PyMuPDF
from PIL import Image

def extract_text_from_file(file_path: Path) -> Tuple[str, str, int]:
    """
    Extracts raw text from a PDF or image file.
    Returns: (raw_text, ocr_method_used, character_count)
    """
    ext = file_path.suffix.lower()
    
    if ext == ".pdf":
        return extract_from_pdf(file_path)
    elif ext in [".jpg", ".jpeg", ".png"]:
        return extract_from_image(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

def extract_from_pdf(file_path: Path) -> Tuple[str, str, int]:
    """
    Extracts text using PyMuPDF direct text stream.
    Falls back to image raster analysis if text stream is empty (e.g. scanned PDF).
    """
    try:
        doc = fitz.open(str(file_path))
        text_content = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text("text")
            if page_text.strip():
                text_content.append(page_text.strip())

        full_text = "\n\n".join(text_content)

        if len(full_text.strip()) > 30:
            return full_text, "direct_pdf_stream", len(full_text)
        
        # Scanned PDF fallback - rasterize first page and extract
        if len(doc) > 0:
            pix = doc[0].get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            fallback_text = run_ocr_on_bytes(img_bytes)
            return fallback_text, "tesseract_ocr", len(fallback_text)

        return "Empty document", "direct_pdf_stream", 0
    except Exception as e:
        return f"PDF read error: {str(e)}", "direct_pdf_stream", 0

def extract_from_image(file_path: Path) -> Tuple[str, str, int]:
    """
    Extracts text from raster image using OCR.
    """
    try:
        with open(file_path, "rb") as f:
            img_bytes = f.read()
        ocr_text = run_ocr_on_bytes(img_bytes)
        return ocr_text, "tesseract_ocr", len(ocr_text)
    except Exception as e:
        return f"Image OCR error: {str(e)}", "tesseract_ocr", 0

def run_ocr_on_bytes(img_bytes: bytes) -> str:
    """
    OCR execution layer. Tries pytesseract if available.
    """
    try:
        import pytesseract
        import io
        image = Image.open(io.BytesIO(img_bytes))
        text = pytesseract.image_to_string(image)
        if text.strip():
            return text.strip()
    except Exception:
        pass

    return ""

