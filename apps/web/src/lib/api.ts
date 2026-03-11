import axios, { type AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token interceptor
api.interceptors.request.use(async (config) => {
  // Clerk stores the session token; we retrieve it from the global window object
  // when the ClerkProvider is initialized
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
  name: string;
  description: string;
  status: string;
  manufacturerCount: number;
  createdAt: string;
  updatedAt: string;
  teamMembers?: string[];
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  status?: string;
}

export const projectsApi = {
  list: (params?: { status?: string }) =>
    api.get('/projects', { params }).then((r) => r.data.data.data ?? r.data.data),
  get: (id: string) =>
    api.get<{ data: Project }>(`/projects/${id}`).then((r) => r.data.data),
  create: (payload: CreateProjectPayload) =>
    api.post<{ data: Project }>('/projects', payload).then((r) => r.data.data),
  update: (id: string, payload: Partial<CreateProjectPayload>) =>
    api.patch<{ data: Project }>(`/projects/${id}`, payload).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// ── Manufacturer endpoints ─────────────────────────────────────────────
export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  specialties: string[];
  certifications: string[];
  rating: number;
  verified: boolean;
  sustainabilityScore: number;
  moqMin: number;
  moqMax: number;
  contactEmail: string;
  contactPhone: string;
  website: string;
  description: string;
  createdAt: string;
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
    api.get('/manufacturers', { params }).then((r) => r.data.data),
  get: (id: string): Promise<Manufacturer> =>
    api.get(`/manufacturers/${id}`).then((r) => r.data.data),
  search: (params: ManufacturerSearchParams): Promise<ManufacturerListResult> =>
    api.get('/manufacturers', { params }).then((r) => r.data.data),
};

// ── Communication endpoints ────────────────────────────────────────────
export interface Communication {
  id: string;
  projectId: string;
  manufacturerId: string;
  manufacturerName: string;
  subject: string;
  messages: Message[];
  status: 'awaiting_reply' | 'reply_received' | 'follow_up_due';
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'manufacturer';
  content: string;
  createdAt: string;
  attachments?: string[];
}

export interface SendMessagePayload {
  communicationId?: string;
  projectId: string;
  manufacturerId: string;
  subject?: string;
  content: string;
}

export const communicationsApi = {
  list: (params?: { projectId?: string; manufacturerId?: string }) =>
    api.get('/communications', { params }).then((r) => r.data.data.data ?? r.data.data),
  get: (id: string) =>
    api.get<{ data: Communication }>(`/communications/${id}`).then((r) => r.data.data),
  send: (payload: SendMessagePayload) =>
    api.post<{ data: Communication }>('/communications/send', payload).then((r) => r.data.data),
};

// ── Reminder endpoints ─────────────────────────────────────────────────
export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  projectId?: string;
  projectName?: string;
  completed: boolean;
  type: string;
}

export const remindersApi = {
  list: (params?: { upcoming?: boolean; days?: number }) =>
    api.get('/reminders', { params }).then((r) => r.data.data.data ?? r.data.data),
  create: (payload: Omit<Reminder, 'id'>) =>
    api.post<{ data: Reminder }>('/reminders', payload).then((r) => r.data.data),
  update: (id: string, payload: Partial<Reminder>) =>
    api.patch<{ data: Reminder }>(`/reminders/${id}`, payload).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/reminders/${id}`),
};

// ── Design Asset endpoints ─────────────────────────────────────────────
export interface DesignAsset {
  id: string;
  projectId: string;
  name: string;
  type: 'image' | 'document' | 'cad' | 'spec_sheet' | 'mood_board';
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  fileSize: number;
}

export const designAssetsApi = {
  list: (params?: { projectId?: string; type?: string }) =>
    api.get('/design-assets', { params }).then((r) => r.data.data.data ?? r.data.data),
  upload: (formData: FormData) =>
    api.post<{ data: DesignAsset }>('/design-assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/design-assets/${id}`),
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
  validUntil: string;
  notes: string;
  createdAt: string;
}

export const quotesApi = {
  list: (params?: { projectId?: string; status?: string }) =>
    api.get('/quotes', { params }).then((r) => r.data.data.data ?? r.data.data),
  get: (id: string) =>
    api.get<{ data: Quote }>(`/quotes/${id}`).then((r) => r.data.data),
  accept: (id: string) =>
    api.patch<{ data: Quote }>(`/quotes/${id}/accept`).then((r) => r.data.data),
  reject: (id: string) =>
    api.patch<{ data: Quote }>(`/quotes/${id}/reject`).then((r) => r.data.data),
};

// ── Sample endpoints ───────────────────────────────────────────────────
export interface Sample {
  id: string;
  projectId: string;
  projectName: string;
  manufacturerId: string;
  manufacturerName: string;
  status: 'requested' | 'in_production' | 'shipped' | 'received' | 'approved' | 'rejected';
  trackingNumber?: string;
  photos: string[];
  notes: string;
  requestedAt: string;
  receivedAt?: string;
}

export const samplesApi = {
  list: (params?: { projectId?: string; status?: string }) =>
    api.get('/samples', { params }).then((r) => r.data.data.data ?? r.data.data),
  get: (id: string) =>
    api.get<{ data: Sample }>(`/samples/${id}`).then((r) => r.data.data),
  updateStatus: (id: string, status: string) =>
    api.patch<{ data: Sample }>(`/samples/${id}/status`, { status }).then((r) => r.data.data),
  uploadPhoto: (id: string, formData: FormData) =>
    api.post<{ data: Sample }>(`/samples/${id}/photos`, formData, {
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
    api.post<{ data: { draft: string } }>('/ai/draft-message', payload).then((r) => r.data.data),
  vetManufacturer: (manufacturerId: string) =>
    api.get<{ data: AIVettingReport }>(`/ai/vet-manufacturer/${manufacturerId}`).then((r) => r.data.data),
  creativeInsights: (projectId: string) =>
    api.get<{ data: AICreativeInsight }>(`/ai/creative-insights/${projectId}`).then((r) => r.data.data),
  analyzeQuote: (quoteId: string) =>
    api.get<{ data: AIQuoteAnalysis }>(`/ai/analyze-quote/${quoteId}`).then((r) => r.data.data),
};

// ── Dashboard stats ────────────────────────────────────────────────────
export interface DashboardStats {
  activeProjects: number;
  manufacturersContacted?: number;
  totalManufacturers?: number;
  pendingReplies: number;
  upcomingReminders: number;
  pipelineCounts?: Record<string, number>;
  pipeline?: Record<string, number>;
}

export interface ActivityItem {
  id: string;
  type: string;
  message?: string;
  description?: string;
  timestamp: string;
  projectId?: string;
  projectName?: string;
  project?: string;
}

export const dashboardApi = {
  stats: () =>
    api.get<{ data: DashboardStats }>('/dashboard/stats').then((r) => r.data.data),
  recentActivity: () =>
    api.get<{ data: ActivityItem[] }>('/dashboard/activity').then((r) => r.data.data),
};

export default api;
