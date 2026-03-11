import { z } from "zod";

// ─── Enum Schemas ────────────────────────────────────────────────────────────

export const userRoleSchema = z.enum(["admin", "designer", "sourcing"]);
export const planTierSchema = z.enum(["free", "pro", "enterprise"]);
export const projectStatusSchema = z.enum([
  "ideation",
  "sourcing",
  "sampling",
  "production",
  "shipped",
]);
export const communicationDirectionSchema = z.enum(["sent", "received"]);
export const communicationStatusSchema = z.enum([
  "draft",
  "sent",
  "delivered",
  "failed",
  "archived",
]);
export const reminderTypeSchema = z.enum([
  "follow_up",
  "milestone",
  "sample_review",
  "shipping",
  "quote_expiring",
]);
export const assetTypeSchema = z.enum([
  "sketch",
  "moodboard",
  "reference",
  "spec_sheet",
  "cad",
]);
export const moodboardItemTypeSchema = z.enum(["image", "text", "color", "shape"]);
export const insightTypeSchema = z.enum([
  "supplier_vetting",
  "creative_analysis",
  "market_intelligence",
  "quote_analysis",
  "spec_extraction",
]);
export const quoteStatusSchema = z.enum(["pending", "accepted", "rejected"]);
export const sampleStatusSchema = z.enum([
  "requested",
  "in_transit",
  "received",
  "approved",
  "rejected",
]);
export const teamRoleSchema = z.enum(["owner", "editor", "viewer"]);
export const manufacturerSourceSchema = z.enum(["manual", "alibaba"]);
export const communicationTypeSchema = z.enum([
  "initial_inquiry",
  "rfq",
  "sample_request",
  "negotiation",
  "follow_up",
  "rejection",
  "spec_clarification",
  "order_confirmation",
]);

// ─── Project Schemas ─────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  status: projectStatusSchema.optional().default("ideation"),
  targetLaunchDate: z.coerce.date().nullish(),
}).strict();

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  status: projectStatusSchema.optional(),
  targetLaunchDate: z.coerce.date().nullish(),
  archived: z.boolean().optional(),
}).strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ─── Manufacturer Schemas ────────────────────────────────────────────────────

export const createManufacturerSchema = z.object({
  name: z.string().min(1).max(300),
  country: z.string().min(1).max(100),
  city: z.string().max(100).nullish(),
  specialties: z.array(z.string().min(1).max(100)).default([]),
  certifications: z.array(z.string().min(1).max(100)).default([]),
  moq: z.number().int().positive().nullish(),
  verified: z.boolean().optional().default(false),
  responseRate: z.number().min(0).max(100).nullish(),
  rating: z.number().min(0).max(5).nullish(),
  source: manufacturerSourceSchema.optional().default("manual"),
  externalId: z.string().max(200).nullish(),
  sustainabilityScore: z.number().min(0).max(100).nullish(),
}).strict();

export const updateManufacturerSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  country: z.string().min(1).max(100).optional(),
  city: z.string().max(100).nullish(),
  specialties: z.array(z.string().min(1).max(100)).optional(),
  certifications: z.array(z.string().min(1).max(100)).optional(),
  moq: z.number().int().positive().nullish(),
  verified: z.boolean().optional(),
  responseRate: z.number().min(0).max(100).nullish(),
  rating: z.number().min(0).max(5).nullish(),
  source: manufacturerSourceSchema.optional(),
  externalId: z.string().max(200).nullish(),
  sustainabilityScore: z.number().min(0).max(100).nullish(),
}).strict();

export const searchManufacturersSchema = z.object({
  query: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  certifications: z.array(z.string().min(1).max(100)).optional(),
  moqMin: z.number().int().nonnegative().optional(),
  moqMax: z.number().int().positive().optional(),
  verified: z.boolean().optional(),
  specialties: z.array(z.string().min(1).max(100)).optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
}).strict().refine(
  (data) => {
    if (data.moqMin !== undefined && data.moqMax !== undefined) {
      return data.moqMin <= data.moqMax;
    }
    return true;
  },
  { message: "moqMin must be less than or equal to moqMax", path: ["moqMin"] },
);

export type CreateManufacturerInput = z.infer<typeof createManufacturerSchema>;
export type UpdateManufacturerInput = z.infer<typeof updateManufacturerSchema>;
export type SearchManufacturersInput = z.infer<typeof searchManufacturersSchema>;

// ─── Communication Schemas ───────────────────────────────────────────────────

export const createCommunicationSchema = z.object({
  projectId: z.string().uuid(),
  manufacturerId: z.string().uuid(),
  contactId: z.string().uuid().nullish(),
  subject: z.string().max(500).nullish(),
  body: z.string().min(1).max(50_000),
  direction: communicationDirectionSchema,
  status: communicationStatusSchema.optional().default("draft"),
  sentAt: z.coerce.date().nullish(),
  followUpDueAt: z.coerce.date().nullish(),
}).strict();

export const draftMessageSchema = z.object({
  projectId: z.string().uuid(),
  manufacturerId: z.string().uuid(),
  contactId: z.string().uuid().nullish(),
  communicationType: communicationTypeSchema,
  subject: z.string().max(500).nullish(),
  body: z.string().min(1).max(50_000),
  context: z.string().max(5000).nullish(),
}).strict();

export type CreateCommunicationInput = z.infer<typeof createCommunicationSchema>;
export type DraftMessageInput = z.infer<typeof draftMessageSchema>;

// ─── Reminder Schemas ────────────────────────────────────────────────────────

export const createReminderSchema = z.object({
  projectId: z.string().uuid(),
  type: reminderTypeSchema,
  title: z.string().max(200).nullish(),
  dueAt: z.coerce.date(),
  recurrenceRule: z.string().max(500).nullish(),
}).strict();

export const updateReminderSchema = z.object({
  type: reminderTypeSchema.optional(),
  title: z.string().max(200).nullish(),
  dueAt: z.coerce.date().optional(),
  completed: z.boolean().optional(),
  recurrenceRule: z.string().max(500).nullish(),
  snoozeUntil: z.coerce.date().nullish(),
}).strict();

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

// ─── Design Asset Schemas ────────────────────────────────────────────────────

export const createDesignAssetSchema = z.object({
  projectId: z.string().uuid(),
  type: assetTypeSchema,
  fileName: z.string().max(500).nullish(),
  fileUrl: z.string().url().max(2000),
  thumbnailUrl: z.string().url().max(2000).nullish(),
  tags: z.array(z.string().min(1).max(50)).default([]),
}).strict();

export type CreateDesignAssetInput = z.infer<typeof createDesignAssetSchema>;

// ─── Moodboard Item Schemas ─────────────────────────────────────────────────

export const createMoodboardItemSchema = z.object({
  designAssetId: z.string().uuid(),
  sourceUrl: z.string().url().max(2000).nullish(),
  notes: z.string().max(1000).nullish(),
  positionX: z.number().finite().default(0),
  positionY: z.number().finite().default(0),
  width: z.number().positive().finite().default(200),
  height: z.number().positive().finite().default(200),
  zIndex: z.number().int().default(0),
  itemType: moodboardItemTypeSchema.optional().default("image"),
}).strict();

export const updateMoodboardItemSchema = z.object({
  sourceUrl: z.string().url().max(2000).nullish(),
  notes: z.string().max(1000).nullish(),
  positionX: z.number().finite().optional(),
  positionY: z.number().finite().optional(),
  width: z.number().positive().finite().optional(),
  height: z.number().positive().finite().optional(),
  zIndex: z.number().int().optional(),
  itemType: moodboardItemTypeSchema.optional(),
}).strict();

export type CreateMoodboardItemInput = z.infer<typeof createMoodboardItemSchema>;
export type UpdateMoodboardItemInput = z.infer<typeof updateMoodboardItemSchema>;

// ─── Quote Schemas ───────────────────────────────────────────────────────────

export const createQuoteSchema = z.object({
  projectId: z.string().uuid(),
  manufacturerId: z.string().uuid(),
  unitPrice: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  moq: z.number().int().positive().nullish(),
  leadTimeDays: z.number().int().positive().nullish(),
  validityDate: z.coerce.date().nullish(),
  status: quoteStatusSchema.optional().default("pending"),
  notes: z.string().max(5000).nullish(),
}).strict();

export const updateQuoteSchema = z.object({
  unitPrice: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  moq: z.number().int().positive().nullish(),
  leadTimeDays: z.number().int().positive().nullish(),
  validityDate: z.coerce.date().nullish(),
  status: quoteStatusSchema.optional(),
  notes: z.string().max(5000).nullish(),
}).strict();

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;

// ─── Sample Schemas ──────────────────────────────────────────────────────────

export const createSampleSchema = z.object({
  projectId: z.string().uuid(),
  manufacturerId: z.string().uuid(),
  status: sampleStatusSchema.optional().default("requested"),
  trackingNumber: z.string().max(200).nullish(),
  notes: z.string().max(5000).nullish(),
  photos: z.array(z.string().url().max(2000)).default([]),
}).strict();

export const updateSampleSchema = z.object({
  receivedAt: z.coerce.date().nullish(),
  status: sampleStatusSchema.optional(),
  trackingNumber: z.string().max(200).nullish(),
  notes: z.string().max(5000).nullish(),
  photos: z.array(z.string().url().max(2000)).optional(),
}).strict();

export type CreateSampleInput = z.infer<typeof createSampleSchema>;
export type UpdateSampleInput = z.infer<typeof updateSampleSchema>;

// ─── Team Member Schemas ─────────────────────────────────────────────────────

export const inviteTeamMemberSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email().max(320),
  role: teamRoleSchema.optional().default("viewer"),
}).strict();

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
