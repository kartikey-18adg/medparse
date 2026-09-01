import { MedicalDocumentRecord, WorkspaceMetrics, DocumentCategory } from '@/types/document';
import { MOCK_DOCUMENTS, INITIAL_WORKSPACE_METRICS } from '@/data/mockDocuments';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export class MedParseApiClient {
  private static async fetchWithFallback<T>(
    endpoint: string,
    options: RequestInit = {},
    fallbackData: T
  ): Promise<T> {
    try {
      const res = await fetch(`${BACKEND_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      if (!res.ok) {
        console.warn(`[MedParse API] ${endpoint} returned ${res.status}, using local fallback.`);
        return fallbackData;
      }

      return (await res.json()) as T;
    } catch (err) {
      // Backend offline or unreachable - gracefully fall back to local dataset
      return fallbackData;
    }
  }

  static async getDocuments(
    category?: string,
    status?: string,
    search?: string
  ): Promise<MedicalDocumentRecord[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.fetchWithFallback<MedicalDocumentRecord[]>(
      `/api/documents${queryStr}`,
      { method: 'GET' },
      MOCK_DOCUMENTS
    );
  }

  static async getDocumentById(id: string): Promise<MedicalDocumentRecord | null> {
    const fallback = MOCK_DOCUMENTS.find((d) => d.id === id) || null;
    return this.fetchWithFallback<MedicalDocumentRecord | null>(
      `/api/documents/${id}`,
      { method: 'GET' },
      fallback
    );
  }

  static async uploadDocument(
    file: File,
    categoryOverride: DocumentCategory | 'auto'
  ): Promise<MedicalDocumentRecord> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category_override', categoryOverride);

    try {
      const res = await fetch(`${BACKEND_API_BASE}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        return (await res.json()) as MedicalDocumentRecord;
      }
    } catch {
      // Offline fallback handled in page state
    }

    // Fallback record
    const prefix = categoryOverride !== 'auto' ? categoryOverride.substring(0, 3).toUpperCase() : 'DOC';
    return {
      id: `doc-${Date.now()}`,
      display_id: `${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      filename: file.name,
      file_size_bytes: file.size || 350000,
      mime_type: file.type || 'application/pdf',
      category: categoryOverride !== 'auto' ? categoryOverride : 'medical_bill',
      status: 'needs_review',
      overall_confidence: 86,
      upload_timestamp: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      facility_name: 'Central District Hospital',
      patient_id_preview: 'PT-NEW-01',
      patient_name_preview: 'Awaiting Human Verification',
      summary_preview: `Ingested ${file.name} · PyMuPDF Stream`,
      is_synthetic_demo: true,
      needs_human_review: true,
      unverified_field_count: 1,
      ocr_method: file.name.endsWith('.pdf') ? 'direct_pdf_stream' : 'tesseract_ocr',
      validation_issues: [
        {
          id: `val-${Date.now()}`,
          field: 'Patient Identifier',
          severity: 'warning',
          message: 'Optical confidence 86%. Operator review recommended.',
        },
      ],
    };
  }

  static async verifyDocument(docId: string): Promise<MedicalDocumentRecord> {
    const fallback = MOCK_DOCUMENTS.find((d) => d.id === docId) || MOCK_DOCUMENTS[0];
    return this.fetchWithFallback<MedicalDocumentRecord>(
      `/api/documents/${docId}/verify`,
      { method: 'POST' },
      {
        ...fallback,
        status: 'claim_ready',
        overall_confidence: 100,
        needs_human_review: false,
        unverified_field_count: 0,
      }
    );
  }

  static async getMetrics(): Promise<WorkspaceMetrics> {
    return this.fetchWithFallback<WorkspaceMetrics>(
      '/api/metrics',
      { method: 'GET' },
      INITIAL_WORKSPACE_METRICS
    );
  }
}
