import axios, { type AxiosError } from 'axios';
import { DEMO_MODE, mockApi } from './mock-data';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token interceptor
api.interceptors.request.use(async (config) => {
  const token =
    typeof window !== 'undefined'
      ? await (window as any).__clerk_session?.getToken()
      : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message || error.message;
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${message}`);
    return Promise.reject(error);
  }
);

// ── Project endpoints ──────────────────────────────────────────────────
export interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  targetLaunchDate?: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { communications: number; quotes: number; samples: number; designAssets: number; reminders?: number };
  teamMembers?: { id: string; user: { id: string; name: string; email: string }; role: string }[];
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  status?: string;
}

export const projectsApi = {
  list: (params?: { status?: string }) =>
    DEMO_MODE ? mockApi.projectsList(params) : api.get('/projects', { params }).then((r) => r.data.data.data ?? r.data.data),
  get: (id: string) =>
    DEMO_MODE ? mockApi.projectsGet(id) : api.get<{ data: Project }>(`/projects/${id}`).then((r) => r.data.data),
  create: (payload: CreateProjectPayload) =>
    DEMO_MODE ? mockApi.projectsCreate(payload) : api.post<{ data: Project }>('/projects', payload).then((r) => r.data.data),
  update: (id: string, payload: Partial<CreateProjectPayload>) =>
    DEMO_MODE ? mockApi.projectsCreate(payload) : api.put<{ data: Project }>(`/projects/${id}`, payload).then((r) => r.data.data),
  delete: (id: string) => DEMO_MODE ? Promise.resolve() : api.delete(`/projects/${id}`),
};

// ── Manufacturer endpoints ─────────────────────────────────────────────
export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  city?: string;
  specialties: string[];
  certifications: string[];
  rating: number;
  verified: boolean;
  sustainabilityScore: number;
  moq: number | null;
  responseRate?: number;
  source?: string;
  externalId?: string;
  contacts?: { id: string; name: string; email?: string; phone?: string; role?: string }[];
  createdAt: string;
  _count?: { quotes: number; samples: number; communications: number };
}

export interface ManufacturerSearchParams {
  search?: string;
  country?: string;
  certifications?: string;
  moqMin?: number;
  moqMax?: number;
  verified?: boolean;
  sustainabilityScoreMin?: number;
  cursor?: string;
  limit?: number;
}

export interface ManufacturerListResult {
  data: Manufacturer[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const manufacturersApi = {
  list: (params?: ManufacturerSearchParams): Promise<ManufacturerListResult> =>
    DEMO_MODE ? mockApi.manufacturersList() : api.get('/manufacturers', { params }).then((r) => r.data.data),
  get: (id: string): Promise<Manufacturer> =>
    DEMO_MODE ? mockApi.manufacturersGet(id) as any : api.get(`/manufacturers/${id}`).then((r) => r.data.data),
  search: (params: ManufacturerSearchParams): Promise<ManufacturerListResult> =>
    DEMO_MODE ? mockApi.manufacturersList() : api.get('/manufacturers', { params }).then((r) => r.data.data),
};

// ── Communication endpoints ────────────────────────────────────────────
export interface Communication {
  id: string;
  projectId: string;
  manufacturerId: string;
  contactId?: string;
  subject?: string;
  body: string;
  direction: 'sent' | 'received';
  status: 'draft' | 'sent' | 'delivered' | 'failed' | 'archived';
  sentAt?: string;
  followUpDueAt?: string;
  createdAt: string;
  manufacturer?: { id: string; name: string; country?: string };
  project?: { id: string; title: string };
}

export interface SendMessagePayload {
  projectId: string;
  manufacturerId: string;
  contactId?: string;
  subject?: string;
  body: string;
  direction: 'sent' | 'received';
  status?: string;
  sentAt?: string;
  followUpDueAt?: string;
}

export const communicationsApi = {
  list: (params?: { projectId?: string; manufacturerId?: string }) =>
    DEMO_MODE ? mockApi.communicationsList() : api.get('/communications', { params }).then((r) => r.data.data.data ?? r.data.data),
  get: (id: string) =>
    DEMO_MODE ? mockApi.communicationsGet(id) : api.get<{ data: Communication }>(`/communications/${id}`).then((r) => r.data.data),
  send: (payload: SendMessagePayload) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.post<{ data: Communication }>('/communications', payload).then((r) => r.data.data),
};

// ── Reminder endpoints ─────────────────────────────────────────────────
export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  type: 'follow_up' | 'deadline' | 'task' | 'milestone' | 'inspection';
  projectId?: string;
  projectName?: string;
  completed: boolean;
}

export const remindersApi = {
  list: (params?: { upcoming?: boolean; days?: number }) =>
    DEMO_MODE ? mockApi.remindersList() : api.get('/reminders', { params }).then((r) => r.data.data.data ?? r.data.data),
  create: (payload: Omit<Reminder, 'id'>) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.post<{ data: Reminder }>('/reminders', payload).then((r) => r.data.data),
  update: (id: string, payload: Partial<Reminder>) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.put<{ data: Reminder }>(`/reminders/${id}`, payload).then((r) => r.data.data),
  delete: (id: string) => DEMO_MODE ? Promise.resolve() : api.delete(`/reminders/${id}`),
};

// ── Design Asset endpoints ─────────────────────────────────────────────
export interface DesignAsset {
  id: string;
  projectId: string;
  fileName?: string;
  type: 'sketch' | 'moodboard' | 'reference' | 'spec_sheet' | 'cad';
  fileUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  version?: number;
  createdAt: string;
}

export const designAssetsApi = {
  list: (params?: { projectId?: string; type?: string }) =>
    DEMO_MODE ? mockApi.designAssetsList() : api.get('/design/assets', { params }).then((r) => r.data.data.data ?? r.data.data),
  create: (payload: { projectId: string; type: string; fileName?: string; fileUrl: string; thumbnailUrl?: string; tags?: string[] }) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.post('/design/assets', payload).then((r) => r.data.data),
  update: (id: string, payload: Partial<{ type: string; fileName: string; fileUrl: string; thumbnailUrl: string; tags: string[] }>) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.put(`/design/assets/${id}`, payload).then((r) => r.data.data),
  delete: (id: string) => DEMO_MODE ? Promise.resolve() : api.delete(`/design/assets/${id}`),
};

// ── Quote endpoints ────────────────────────────────────────────────────
export interface Quote {
  id: string;
  projectId: string;
  projectName: string;
  manufacturerId: string;
  manufacturerName: string;
  unitPrice: number;
  moq: number;
  leadTimeDays: number;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  validityDate: string;
  notes: string;
  createdAt: string;
}

export const quotesApi = {
  list: (params?: { projectId?: string; manufacturerId?: string; status?: string }) =>
    DEMO_MODE ? mockApi.quotesList() : api.get('/quotes', { params }).then((r) => r.data.data.data ?? r.data.data),
  get: (id: string) =>
    DEMO_MODE ? mockApi.quotesGet(id) : api.get<{ data: Quote }>(`/quotes/${id}`).then((r) => r.data.data),
  accept: (id: string) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.post<{ data: Quote }>(`/quotes/${id}/accept`).then((r) => r.data.data),
  reject: (id: string) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.post<{ data: Quote }>(`/quotes/${id}/reject`).then((r) => r.data.data),
};

// ── Sample endpoints ───────────────────────────────────────────────────
export interface Sample {
  id: string;
  projectId: string;
  projectName: string;
  manufacturerId: string;
  manufacturerName: string;
  status: 'requested' | 'in_transit' | 'received' | 'approved' | 'rejected';
  trackingNumber?: string;
  photos: string[];
  notes: string;
  requestedAt: string;
  receivedAt?: string;
}

export const samplesApi = {
  list: (params?: { projectId?: string; manufacturerId?: string; status?: string }) =>
    DEMO_MODE ? mockApi.samplesList(params) : api.get('/samples', { params }).then((r) => r.data.data.data ?? r.data.data),
  get: (id: string) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.get<{ data: Sample }>(`/samples/${id}`).then((r) => r.data.data),
  updateStatus: (id: string, status: string) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.put<{ data: Sample }>(`/samples/${id}/status`, { status }).then((r) => r.data.data),
  uploadPhoto: (id: string, formData: FormData) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.post<{ data: Sample }>(`/samples/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data),
};

// ── AI endpoints ───────────────────────────────────────────────────────
export interface AIDraftPayload {
  messageType: string;
  projectId?: string;
  manufacturerId?: string;
  tone?: string;
  context?: string;
}

export interface AIVettingReport {
  overallScore: number;
  categories: { name: string; score: number; notes: string }[];
  risks: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface AICreativeInsight {
  suggestions: string[];
  trendAnalysis: string;
  materialRecommendations: string[];
}

export interface AIQuoteAnalysis {
  competitiveness: string;
  marketComparison: string;
  negotiationTips: string[];
  recommendation: string;
}

export const aiApi = {
  generateDraft: (payload: AIDraftPayload) =>
    DEMO_MODE ? mockApi.aiGenerateDraft() : api.post('/ai/draft-message', {
      type: payload.messageType,
      projectContext: payload.context || {},
      manufacturerData: {},
      tone: payload.tone,
    }).then((r) => r.data.data),
  vetManufacturer: (manufacturerData: Record<string, unknown>) =>
    DEMO_MODE ? mockApi.aiVetManufacturer() : api.post('/ai/vet-supplier', { manufacturerData }).then((r) => r.data.data),
  analyzeDesign: (assetUrls: string[], moodboardData?: unknown, projectContext?: unknown) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.post('/ai/analyze-design', { assetUrls, moodboardData, projectContext }).then((r) => r.data.data),
  extractSpec: (description: string) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.post('/ai/extract-spec', { description }).then((r) => r.data.data),
  analyzeQuotes: (quotes: Record<string, unknown>[]) =>
    DEMO_MODE ? mockApi.aiAnalyzeQuote() : api.post('/ai/analyze-quotes', { quotes }).then((r) => r.data.data),
  generateFollowup: (conversationHistory: Record<string, unknown>[]) =>
    DEMO_MODE ? Promise.resolve({} as any) : api.post('/ai/generate-followup', { conversationHistory }).then((r) => r.data.data),
};

// ── TechPack endpoints ─────────────────────────────────────────────────
export interface TechPack {
  id: string;
  projectId: string;
  name: string;
  category?: string;
  season?: string;
  status: string;
  materials: TechPackMaterial[];
  measurements: TechPackMeasurement[];
  construction: TechPackConstruction[];
  colorways: TechPackColorway[];
  labels: TechPackLabel[];
  createdAt: string;
  updatedAt: string;
}

export interface TechPackMaterial {
  id: string;
  name: string;
  type: string;
  composition?: string;
  color?: string;
  colorCode?: string;
  supplier?: string;
  costPerUnit?: number;
  unit?: string;
  placement?: string;
}

export interface TechPackMeasurement {
  id: string;
  pointOfMeasure: string;
  sizes: Record<string, number>;
  tolerance?: number;
}

export interface TechPackConstruction {
  id: string;
  title: string;
  value: string;
  category?: string;
  notes?: string;
}

export interface TechPackColorway {
  id: string;
  name: string;
  hexCode: string;
  pantoneRef?: string;
  status?: string;
}

export interface TechPackLabel {
  id: string;
  type: string;
  text?: string;
  placement?: string;
  careSymbols?: string[];
}

export const techPacksApi = {
  list: (projectId: string) =>
    DEMO_MODE ? mockApi.techpacks.list(projectId) : api.get(`/techpacks?projectId=${projectId}`).then(r => r.data.data),
  get: (id: string) =>
    DEMO_MODE ? mockApi.techpacks.get(id) : api.get(`/techpacks/${id}`).then(r => r.data.data),
  create: (data: Partial<TechPack>) =>
    DEMO_MODE ? mockApi.techpacks.create(data) : api.post('/techpacks', data).then(r => r.data.data),
  update: (id: string, data: Partial<TechPack>) =>
    DEMO_MODE ? mockApi.techpacks.update(id, data) : api.put(`/techpacks/${id}`, data).then(r => r.data.data),
  delete: (id: string) =>
    DEMO_MODE ? mockApi.techpacks.delete(id) : api.delete(`/techpacks/${id}`).then(r => r.data.data),
  duplicate: (id: string, newName: string) =>
    DEMO_MODE ? mockApi.techpacks.duplicate(id, newName) : api.post(`/techpacks/${id}/duplicate`, { name: newName }).then(r => r.data.data),
};

// ── Upload endpoints ──────────────────────────────────────────────────
export const uploadsApi = {
  getPresignedUrl: (fileName: string, contentType: string, folder?: string) =>
    DEMO_MODE
      ? Promise.resolve({ uploadUrl: '', fileUrl: `https://demo-bucket.s3.amazonaws.com/uploads/${fileName}`, key: fileName })
      : api.post('/uploads/presigned-url', { fileName, contentType, folder }).then(r => r.data.data),
};

// ── Dashboard stats ────────────────────────────────────────────────────
export interface DashboardStats {
  activeProjects: number;
  manufacturersContacted?: number;
  totalManufacturers?: number;
  pendingReplies: number;
  upcomingReminders: number;
  pipeline?: Record<string, number>;
}

export interface ActivityItem {
  id: string;
  type: string;
  description?: string;
  timestamp: string;
  projectId?: string;
  project?: string;
}

export const dashboardApi = {
  stats: () =>
    DEMO_MODE ? mockApi.dashboardStats() : api.get<{ data: DashboardStats }>('/dashboard/stats').then((r) => r.data.data),
  recentActivity: () =>
    DEMO_MODE ? mockApi.dashboardActivity() : api.get<{ data: ActivityItem[] }>('/dashboard/activity').then((r) => r.data.data),
};

export default api;
