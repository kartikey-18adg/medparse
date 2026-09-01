import { MedicalDocumentRecord, WorkspaceMetrics, DocumentCategory, User, ExtractedStructuredData } from '@/types/document';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const TOKEN_STORAGE_KEY = 'medparse_access_token';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export class MedParseApiClient {
  private static token: string | null = null;

  static getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return this.token;
  }

  static setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND_API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.setToken(null);
      throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
      throw new Error(errorData.detail || `Request failed with status ${res.status}`);
    }

    return (await res.json()) as T;
  }

  // --- Auth APIs ---

  static async register(email: string, password: string, full_name: string, role: string = 'Clinical Operator'): Promise<AuthResponse> {
    const res = await fetch(`${BACKEND_API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, role }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }

    const data = (await res.json()) as AuthResponse;
    this.setToken(data.access_token);
    return data;
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${BACKEND_API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
      throw new Error(err.detail || 'Invalid email or password');
    }

    const data = (await res.json()) as AuthResponse;
    this.setToken(data.access_token);
    return data;
  }

  static async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      return await this.request<User>('/api/auth/me', { method: 'GET' });
    } catch {
      this.setToken(null);
      return null;
    }
  }

  static logout(): void {
    this.setToken(null);
  }

  // --- Document APIs ---

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
    return this.request<MedicalDocumentRecord[]>(`/api/documents${queryStr}`, { method: 'GET' });
  }

  static async getDocumentById(id: string): Promise<MedicalDocumentRecord | null> {
    return this.request<MedicalDocumentRecord>(`/api/documents/${id}`, { method: 'GET' });
  }

  static async uploadDocument(
    file: File,
    categoryOverride: DocumentCategory | 'auto' = 'auto'
  ): Promise<MedicalDocumentRecord> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category_override', categoryOverride);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND_API_BASE}/api/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.status === 401) {
      this.setToken(null);
      throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Document upload failed' }));
      throw new Error(err.detail || 'Upload processing failed');
    }

    return (await res.json()) as MedicalDocumentRecord;
  }

  static async reprocessDocument(docId: string): Promise<MedicalDocumentRecord> {
    return this.request<MedicalDocumentRecord>(`/api/documents/${docId}/process`, { method: 'POST' });
  }

  static async updateDocumentField(
    docId: string,
    fieldName: string,
    value: unknown,
    isVerified: boolean = true,
    operator?: string
  ): Promise<MedicalDocumentRecord> {
    return this.request<MedicalDocumentRecord>(`/api/documents/${docId}/fields`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_name: fieldName, value, is_verified: isVerified, operator }),
    });
  }

  static async verifyDocument(docId: string, operator?: string): Promise<MedicalDocumentRecord> {
    const formData = new FormData();
    if (operator) {
      formData.append('operator', operator);
    }
    return this.request<MedicalDocumentRecord>(`/api/documents/${docId}/verify`, {
      method: 'POST',
      body: formData,
    });
  }

  static async deleteDocument(docId: string): Promise<void> {
    await this.request<{ status: string; message: string }>(`/api/documents/${docId}`, { method: 'DELETE' });
  }

  static async getMetrics(): Promise<WorkspaceMetrics> {
    return this.request<WorkspaceMetrics>('/api/metrics', { method: 'GET' });
  }
}

