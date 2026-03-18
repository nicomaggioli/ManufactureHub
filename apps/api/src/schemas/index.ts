import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared / reusable
// ---------------------------------------------------------------------------

/** Cursor-based pagination query params shared across list endpoints. */
export const paginationQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const projectStatusEnum = z.enum([
  "ideation",
  "sourcing",
  "sampling",
  "production",
  "shipped",
]);

export const createProjectSchema = z.object({
  title: z.string().min(1, "title is required").max(500),
  description: z.string().max(5000).optional(),
  status: projectStatusEnum.optional(),
  targetLaunchDate: z.coerce.date().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: projectStatusEnum.optional(),
  targetLaunchDate: z.coerce.date().optional(),
});

export const listProjectsQuery = paginationQuery.extend({
  status: projectStatusEnum.optional(),
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const archiveProjectSchema = z.object({
  action: z.enum(["archive", "unarchive"]),
});

// ---------------------------------------------------------------------------
// Manufacturers
// ---------------------------------------------------------------------------

const manufacturerSourceEnum = z.enum(["manual", "alibaba"]);

export const createManufacturerSchema = z.object({
  name: z.string().min(1, "name is required").max(500),
  country: z.string().min(1, "country is required").max(200),
  city: z.string().max(200).optional(),
  specialties: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  moq: z.number().int().min(0).optional(),
  verified: z.boolean().optional(),
  responseRate: z.number().min(0).max(100).optional(),
  rating: z.number().min(0).max(5).optional(),
  sustainabilityScore: z.number().min(0).max(100).optional(),
  source: manufacturerSourceEnum.optional(),
  externalId: z.string().optional(),
});

export const updateManufacturerSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  country: z.string().min(1).max(200).optional(),
  city: z.string().max(200).optional(),
  specialties: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  moq: z.number().int().min(0).optional(),
  verified: z.boolean().optional(),
  responseRate: z.number().min(0).max(100).optional(),
  rating: z.number().min(0).max(5).optional(),
  sustainabilityScore: z.number().min(0).max(100).optional(),
});

export const listManufacturersQuery = paginationQuery.extend({
  search: z.string().optional(),
  country: z.string().optional(),
  certifications: z.string().optional(), // comma-separated, parsed in route
  moqMin: z.coerce.number().int().min(0).optional(),
  moqMax: z.coerce.number().int().min(0).optional(),
  verified: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sustainabilityScoreMin: z.coerce.number().min(0).max(100).optional(),
});

export const compareManufacturersQuery = z.object({
  ids: z.string().min(1, "ids query parameter is required"),
});

export const importManufacturersCsvSchema = z.object({
  rows: z
    .array(createManufacturerSchema)
    .min(1, "rows array must contain at least one entry"),
});

// ---------------------------------------------------------------------------
// Communications
// ---------------------------------------------------------------------------

const communicationDirectionEnum = z.enum(["sent", "received"]);

const communicationStatusEnum = z.enum([
  "draft",
  "sent",
  "delivered",
  "failed",
  "archived",
]);

export const createCommunicationSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
  manufacturerId: z.string().uuid("manufacturerId must be a valid UUID"),
  contactId: z.string().uuid().optional(),
  subject: z.string().max(1000).optional(),
  body: z.string().min(1, "body is required"),
  direction: communicationDirectionEnum,
  status: communicationStatusEnum.optional(),
  sentAt: z.coerce.date().optional(),
  followUpDueAt: z.coerce.date().optional(),
});

export const listCommunicationsQuery = paginationQuery.extend({
  projectId: z.string().uuid().optional(),
  manufacturerId: z.string().uuid().optional(),
});

export const searchCommunicationsSchema = z.object({
  keyword: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  projectId: z.string().uuid().optional(),
  manufacturerId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

const quoteStatusEnum = z.enum(["pending", "accepted", "rejected"]);

export const createQuoteSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
  manufacturerId: z.string().uuid("manufacturerId must be a valid UUID"),
  unitPrice: z.number().positive("unitPrice must be positive"),
  currency: z.string().max(10).optional(),
  moq: z.number().int().min(0).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  validityDate: z.coerce.date().optional(),
  notes: z.string().max(5000).optional(),
});

export const updateQuoteSchema = z.object({
  unitPrice: z.number().positive().optional(),
  currency: z.string().max(10).optional(),
  moq: z.number().int().min(0).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  validityDate: z.coerce.date().optional(),
  notes: z.string().max(5000).optional(),
});

export const listQuotesQuery = paginationQuery.extend({
  projectId: z.string().uuid().optional(),
  manufacturerId: z.string().uuid().optional(),
  status: quoteStatusEnum.optional(),
});

// ---------------------------------------------------------------------------
// Samples
// ---------------------------------------------------------------------------

const sampleStatusEnum = z.enum([
  "requested",
  "in_transit",
  "received",
  "approved",
  "rejected",
]);

export const createSampleSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
  manufacturerId: z.string().uuid("manufacturerId must be a valid UUID"),
  trackingNumber: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  photos: z.array(z.string().url()).optional(),
});

export const updateSampleSchema = z.object({
  trackingNumber: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  photos: z.array(z.string().url()).optional(),
});

export const updateSampleStatusSchema = z.object({
  status: sampleStatusEnum,
});

export const listSamplesQuery = paginationQuery.extend({
  projectId: z.string().uuid().optional(),
  manufacturerId: z.string().uuid().optional(),
  status: sampleStatusEnum.optional(),
});

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

const reminderTypeEnum = z.enum([
  "follow_up",
  "milestone",
  "sample_review",
  "shipping",
  "quote_expiring",
]);

export const createReminderSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
  type: reminderTypeEnum,
  title: z.string().max(500).optional(),
  dueAt: z.coerce.date(),
  recurrenceRule: z.string().max(500).optional(),
});

export const updateReminderSchema = z.object({
  type: reminderTypeEnum.optional(),
  title: z.string().max(500).optional(),
  dueAt: z.coerce.date().optional(),
  recurrenceRule: z.string().max(500).optional(),
});

export const listRemindersQuery = paginationQuery.extend({
  projectId: z.string().uuid().optional(),
  upcoming: z.enum(["true", "false"]).optional(),
  completed: z.enum(["true", "false"]).optional(),
});

export const snoozeReminderSchema = z.object({
  minutes: z.number().int().min(1).max(10080).optional().default(60), // max 7 days
});

// ---------------------------------------------------------------------------
// Design Assets
// ---------------------------------------------------------------------------

const assetTypeEnum = z.enum([
  "sketch",
  "moodboard",
  "reference",
  "spec_sheet",
  "cad",
]);

const moodboardItemTypeEnum = z.enum(["image", "text", "color", "shape"]);

export const createDesignAssetSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
  type: assetTypeEnum,
  fileName: z.string().max(500).optional(),
  fileUrl: z.string().url("fileUrl must be a valid URL"),
  thumbnailUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateDesignAssetSchema = z.object({
  type: assetTypeEnum.optional(),
  fileName: z.string().max(500).optional(),
  fileUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export const listDesignAssetsQuery = paginationQuery.extend({
  projectId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  type: assetTypeEnum.optional(),
});

export const createMoodboardItemSchema = z.object({
  designAssetId: z.string().uuid("designAssetId must be a valid UUID"),
  sourceUrl: z.string().url().optional(),
  notes: z.string().max(5000).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  zIndex: z.number().int().optional(),
  itemType: moodboardItemTypeEnum.optional(),
});

export const updateMoodboardItemSchema = z.object({
  sourceUrl: z.string().url().optional(),
  notes: z.string().max(5000).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  zIndex: z.number().int().optional(),
  itemType: moodboardItemTypeEnum.optional(),
});

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export const aiDraftMessageSchema = z.object({
  type: z.string().min(1, "type is required"),
  projectContext: z.record(z.unknown()).or(z.string()).refine(Boolean, {
    message: "projectContext is required",
  }),
  manufacturerData: z.record(z.unknown()).or(z.string()).refine(Boolean, {
    message: "manufacturerData is required",
  }),
  tone: z.string().optional(),
});

export const aiVetSupplierSchema = z.object({
  manufacturerData: z.record(z.unknown()).refine(
    (v) => Object.keys(v).length > 0,
    { message: "manufacturerData is required" }
  ),
});

export const aiAnalyzeDesignSchema = z.object({
  assetUrls: z.array(z.string().url()).min(1, "assetUrls must contain at least one URL"),
  moodboardData: z.unknown().optional(),
  projectContext: z.unknown().optional(),
});

export const aiExtractSpecSchema = z.object({
  description: z.string().min(1, "description is required"),
});

export const aiAnalyzeQuotesSchema = z.object({
  quotes: z
    .array(z.record(z.unknown()))
    .min(1, "quotes array is required and must not be empty"),
});

export const aiGenerateFollowupSchema = z.object({
  conversationHistory: z
    .array(z.record(z.unknown()))
    .min(1, "conversationHistory array is required"),
});

export const aiAlibabaSearchSchema = z.object({
  query: z.string().min(1, "query is required"),
  filters: z.record(z.unknown()).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

// ---------------------------------------------------------------------------
// Tech Packs
// ---------------------------------------------------------------------------

const techPackStatusEnum = z.enum(["draft", "review", "approved", "production"]);

const techPackMaterialSchema = z.object({
  name: z.string().min(1, "name is required"),
  type: z.string().min(1, "type is required"),
  composition: z.string().optional(),
  color: z.string().optional(),
  colorCode: z.string().optional(),
  supplier: z.string().optional(),
  costPerUnit: z.number().min(0).optional(),
  unit: z.string().optional(),
  placement: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const techPackMeasurementSchema = z.object({
  pointOfMeasure: z.string().min(1, "pointOfMeasure is required"),
  sizes: z.record(z.number()),
  tolerance: z.number().min(0).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const techPackConstructionSchema = z.object({
  title: z.string().min(1, "title is required"),
  value: z.string().min(1, "value is required"),
  category: z.string().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const techPackColorwaySchema = z.object({
  name: z.string().min(1, "name is required"),
  hexCode: z.string().min(1, "hexCode is required"),
  pantoneRef: z.string().optional(),
  status: z.enum(["active", "discontinued", "pending"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const techPackLabelSchema = z.object({
  type: z.string().min(1, "type is required"),
  text: z.string().optional(),
  placement: z.string().optional(),
  careSymbols: z.array(z.string()).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createTechPackSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
  name: z.string().min(1, "name is required").max(500),
  category: z.string().max(200).optional(),
  season: z.string().max(50).optional(),
  status: techPackStatusEnum.optional(),
  materials: z.array(techPackMaterialSchema).optional(),
  measurements: z.array(techPackMeasurementSchema).optional(),
  construction: z.array(techPackConstructionSchema).optional(),
  colorways: z.array(techPackColorwaySchema).optional(),
  labels: z.array(techPackLabelSchema).optional(),
});

export const updateTechPackSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  category: z.string().max(200).optional(),
  season: z.string().max(50).optional(),
  status: techPackStatusEnum.optional(),
  materials: z.array(techPackMaterialSchema).optional(),
  measurements: z.array(techPackMeasurementSchema).optional(),
  construction: z.array(techPackConstructionSchema).optional(),
  colorways: z.array(techPackColorwaySchema).optional(),
  labels: z.array(techPackLabelSchema).optional(),
});

export const duplicateTechPackSchema = z.object({
  name: z.string().min(1, "name is required").max(500),
});

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

const approvalStatusEnum = z.enum(["pending", "approved", "changes_requested"]);
const deliverableTypeEnum = z.enum(["tech_pack", "mockup", "sample", "fabric_swatch", "production_proof"]);

export const createApprovalSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
  deliverableName: z.string().min(1, "deliverableName is required").max(500),
  type: deliverableTypeEnum,
  clientName: z.string().max(200).optional(),
});

export const updateApprovalStatusSchema = z.object({
  status: z.enum(["approved", "changes_requested"]),
  feedback: z.string().max(5000).optional(),
});

export const listApprovalsQuery = paginationQuery.extend({
  projectId: z.string().uuid().optional(),
  status: approvalStatusEnum.optional(),
});

// ---------------------------------------------------------------------------
// Shipments
// ---------------------------------------------------------------------------

const shippingStatusEnum = z.enum(["label_created", "picked_up", "in_transit", "out_for_delivery", "delivered"]);

export const createShipmentSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
  manufacturerId: z.string().uuid("manufacturerId must be a valid UUID"),
  sampleId: z.string().uuid().optional(),
  itemName: z.string().min(1, "itemName is required").max(500),
  courier: z.string().min(1, "courier is required").max(100),
  trackingNumber: z.string().min(1, "trackingNumber is required").max(200),
  shipDate: z.coerce.date(),
  estimatedDelivery: z.coerce.date().optional(),
});

export const updateShipmentStatusSchema = z.object({
  status: shippingStatusEnum,
  actualDelivery: z.coerce.date().optional(),
});

export const listShipmentsQuery = paginationQuery.extend({
  projectId: z.string().uuid().optional(),
  manufacturerId: z.string().uuid().optional(),
  status: shippingStatusEnum.optional(),
});
