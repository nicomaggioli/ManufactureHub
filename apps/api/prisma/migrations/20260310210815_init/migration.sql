-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'designer', 'sourcing');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ideation', 'sourcing', 'sampling', 'production', 'shipped');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('sent', 'received');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('draft', 'sent', 'delivered', 'failed', 'archived');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('follow_up', 'milestone', 'sample_review', 'shipping', 'quote_expiring');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('sketch', 'moodboard', 'reference', 'spec_sheet', 'cad');

-- CreateEnum
CREATE TYPE "MoodboardItemType" AS ENUM ('image', 'text', 'color', 'shape');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('supplier_vetting', 'creative_analysis', 'market_intelligence', 'quote_analysis', 'spec_extraction');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('requested', 'in_transit', 'received', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('owner', 'editor', 'viewer');

-- CreateEnum
CREATE TYPE "ManufacturerSource" AS ENUM ('manual', 'alibaba');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'designer',
    "planTier" "PlanTier" NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "emailDigest" TEXT NOT NULL DEFAULT 'daily',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ideation',
    "targetLaunchDate" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "specialties" TEXT[],
    "certifications" TEXT[],
    "moq" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "responseRate" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "source" "ManufacturerSource" NOT NULL DEFAULT 'manual',
    "externalId" TEXT,
    "sustainabilityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "preferredLanguage" TEXT DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "contactId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "followUpDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "title" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "snoozeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_assets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "tags" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moodboard_items" (
    "id" TEXT NOT NULL,
    "designAssetId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "itemType" "MoodboardItemType" NOT NULL DEFAULT 'image',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moodboard_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "promptContext" TEXT,
    "responseText" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "insightType" "InsightType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "moq" INTEGER,
    "leadTimeDays" INTEGER,
    "validityDate" TIMESTAMP(3),
    "status" "QuoteStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "samples" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "status" "SampleStatus" NOT NULL DEFAULT 'requested',
    "trackingNumber" TEXT,
    "notes" TEXT,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'viewer',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "diffJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "manufacturers_country_idx" ON "manufacturers"("country");

-- CreateIndex
CREATE INDEX "manufacturers_name_idx" ON "manufacturers"("name");

-- CreateIndex
CREATE INDEX "contacts_manufacturerId_idx" ON "contacts"("manufacturerId");

-- CreateIndex
CREATE INDEX "communications_projectId_idx" ON "communications"("projectId");

-- CreateIndex
CREATE INDEX "communications_manufacturerId_idx" ON "communications"("manufacturerId");

-- CreateIndex
CREATE INDEX "communications_followUpDueAt_idx" ON "communications"("followUpDueAt");

-- CreateIndex
CREATE INDEX "reminders_userId_dueAt_idx" ON "reminders"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "reminders_projectId_idx" ON "reminders"("projectId");

-- CreateIndex
CREATE INDEX "design_assets_projectId_idx" ON "design_assets"("projectId");

-- CreateIndex
CREATE INDEX "moodboard_items_designAssetId_idx" ON "moodboard_items"("designAssetId");

-- CreateIndex
CREATE INDEX "ai_insights_projectId_idx" ON "ai_insights"("projectId");

-- CreateIndex
CREATE INDEX "quotes_projectId_idx" ON "quotes"("projectId");

-- CreateIndex
CREATE INDEX "quotes_manufacturerId_idx" ON "quotes"("manufacturerId");

-- CreateIndex
CREATE INDEX "samples_projectId_idx" ON "samples"("projectId");

-- CreateIndex
CREATE INDEX "samples_manufacturerId_idx" ON "samples"("manufacturerId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_projectId_userId_key" ON "team_members"("projectId", "userId");

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_assets" ADD CONSTRAINT "design_assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_assets" ADD CONSTRAINT "design_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moodboard_items" ADD CONSTRAINT "moodboard_items_designAssetId_fkey" FOREIGN KEY ("designAssetId") REFERENCES "design_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
