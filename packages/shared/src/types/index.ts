// ─── Enums ───────────────────────────────────────────────────────────────────

export enum UserRole {
  admin = "admin",
  designer = "designer",
  sourcing = "sourcing",
}

export enum PlanTier {
  free = "free",
  pro = "pro",
  enterprise = "enterprise",
}

export enum ProjectStatus {
  ideation = "ideation",
  sourcing = "sourcing",
  sampling = "sampling",
  production = "production",
  shipped = "shipped",
}

export enum CommunicationDirection {
  sent = "sent",
  received = "received",
}

export enum CommunicationStatus {
  draft = "draft",
  sent = "sent",
  delivered = "delivered",
  failed = "failed",
  archived = "archived",
}

export enum ReminderType {
  follow_up = "follow_up",
  milestone = "milestone",
  sample_review = "sample_review",
  shipping = "shipping",
  quote_expiring = "quote_expiring",
}

export enum AssetType {
  sketch = "sketch",
  moodboard = "moodboard",
  reference = "reference",
  spec_sheet = "spec_sheet",
  cad = "cad",
}

export enum MoodboardItemType {
  image = "image",
  text = "text",
  color = "color",
  shape = "shape",
}

export enum InsightType {
  supplier_vetting = "supplier_vetting",
  creative_analysis = "creative_analysis",
  market_intelligence = "market_intelligence",
  quote_analysis = "quote_analysis",
  spec_extraction = "spec_extraction",
}

export enum QuoteStatus {
  pending = "pending",
  accepted = "accepted",
  rejected = "rejected",
}

export enum SampleStatus {
  requested = "requested",
  in_transit = "in_transit",
  received = "received",
  approved = "approved",
  rejected = "rejected",
}

export enum TeamRole {
  owner = "owner",
  editor = "editor",
  viewer = "viewer",
}

export enum ManufacturerSource {
  manual = "manual",
  alibaba = "alibaba",
}

// ─── Entity Interfaces ──────────────────────────────────────────────────────

export interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  role: UserRole;
  planTier: PlanTier;
  stripeCustomerId: string | null;
  emailDigest: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  targetLaunchDate: Date | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  city: string | null;
  specialties: string[];
  certifications: string[];
  moq: number | null;
  verified: boolean;
  responseRate: number | null;
  rating: number | null;
  source: ManufacturerSource;
  externalId: string | null;
  sustainabilityScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  manufacturerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  lastContactedAt: Date | null;
  preferredLanguage: string | null;
  createdAt: Date;
}

export interface Communication {
  id: string;
  projectId: string;
  manufacturerId: string;
  contactId: string | null;
  subject: string | null;
  body: string;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  sentAt: Date | null;
  followUpDueAt: Date | null;
  createdAt: Date;
}

export interface Reminder {
  id: string;
  projectId: string;
  userId: string;
  type: ReminderType;
  title: string | null;
  dueAt: Date;
  completed: boolean;
  recurrenceRule: string | null;
  snoozeUntil: Date | null;
  createdAt: Date;
}

export interface DesignAsset {
  id: string;
  projectId: string;
  userId: string;
  type: AssetType;
  fileName: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  tags: string[];
  version: number;
  createdAt: Date;
}

export interface MoodboardItem {
  id: string;
  designAssetId: string;
  sourceUrl: string | null;
  notes: string | null;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  zIndex: number;
  itemType: MoodboardItemType;
  createdAt: Date;
}

export interface AiInsight {
  id: string;
  projectId: string;
  promptContext: string | null;
  responseText: string;
  modelUsed: string;
  tokensUsed: number;
  insightType: InsightType;
  createdAt: Date;
}

export interface Quote {
  id: string;
  projectId: string;
  manufacturerId: string;
  unitPrice: number;
  currency: string;
  moq: number | null;
  leadTimeDays: number | null;
  validityDate: Date | null;
  status: QuoteStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sample {
  id: string;
  projectId: string;
  manufacturerId: string;
  requestedAt: Date;
  receivedAt: Date | null;
  status: SampleStatus;
  trackingNumber: string | null;
  notes: string | null;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  projectId: string;
  userId: string;
  role: TeamRole;
  invitedAt: Date;
  acceptedAt: Date | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  diffJson: unknown | null;
  createdAt: Date;
}

// ─── API Response Types ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  correlationId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  correlationId?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  correlationId?: string;
}
