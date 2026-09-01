import { MedicalDocumentRecord, WorkspaceMetrics } from '../types/document';

export const INITIAL_WORKSPACE_METRICS: WorkspaceMetrics = {
  documents_today_count: 0,
  needs_review_count: 0,
  processed_count: 0,
  average_confidence: 0,
  verified_count: 0,
  claim_ready_count: 0,
};

export const MOCK_DOCUMENTS: MedicalDocumentRecord[] = [];