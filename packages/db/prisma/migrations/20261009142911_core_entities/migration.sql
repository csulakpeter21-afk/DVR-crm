-- CreateEnum
CREATE TYPE "DossierStatus" AS ENUM ('not_ready', 'ready');

-- CreateEnum
CREATE TYPE "CallState" AS ENUM ('started', 'ringing', 'connected', 'ended', 'failed');

-- CreateEnum
CREATE TYPE "MeetingState" AS ENUM ('booked', 'held', 'no_show', 'rescheduled', 'cancelled');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "sizeBand" TEXT,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "decisionMaker" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icpThreshold" INTEGER NOT NULL DEFAULT 60,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "stage" "LeadState" NOT NULL DEFAULT 'sourced',
    "icpScore" INTEGER NOT NULL DEFAULT 0,
    "icpFactors" JSONB NOT NULL DEFAULT '[]',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assignedToUserId" UUID,
    "reasonCode" TEXT,
    "reasonDetail" TEXT,
    "reEntryAt" TIMESTAMP(3),
    "stageEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signals" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "leadId" UUID,
    "kind" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "detail" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "status" "DossierStatus" NOT NULL DEFAULT 'not_ready',
    "summary" TEXT,
    "hook" TEXT,
    "risks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_claims" (
    "id" UUID NOT NULL,
    "dossierId" UUID NOT NULL,
    "claim" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,

    CONSTRAINT "dossier_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "reasonCode" TEXT,
    "detail" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "correlationId" UUID NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "actorUserId" UUID,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_rules" (
    "country" TEXT NOT NULL,
    "callWindowStartMinutes" INTEGER NOT NULL DEFAULT 540,
    "callWindowEndMinutes" INTEGER NOT NULL DEFAULT 1140,
    "callDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "recordingNoticeRequired" BOOLEAN NOT NULL DEFAULT true,
    "retentionDays" INTEGER NOT NULL DEFAULT 365,
    "registryCheckRequired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_rules_pkey" PRIMARY KEY ("country")
);

-- CreateTable
CREATE TABLE "suppression_entries" (
    "id" UUID NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "domain" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppression_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_basis_records" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "basis" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL,
    "assessmentRef" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_basis_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_trees" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "script_trees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_versions" (
    "id" UUID NOT NULL,
    "treeId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "rootNodeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "script_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_nodes" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "fallbackLine" TEXT,
    "intent" TEXT,
    "outcome" TEXT,
    "isBooking" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "script_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_answers" (
    "id" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "nextNodeId" UUID,
    "outcomeTag" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "script_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_paths" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "answerId" UUID,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "call_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "versionId" UUID,
    "state" "CallState" NOT NULL DEFAULT 'started',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "recordingNoticeAt" TIMESTAMP(3),
    "recordingUrl" TEXT,
    "disposition" TEXT,
    "decisionMakerReached" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "qualifierUserId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "state" "MeetingState" NOT NULL DEFAULT 'booked',
    "bookedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_domain_key" ON "companies"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_key" ON "contacts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_phone_key" ON "contacts"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_linkedinUrl_key" ON "contacts"("linkedinUrl");

-- CreateIndex
CREATE INDEX "contacts_companyId_idx" ON "contacts"("companyId");

-- CreateIndex
CREATE INDEX "leads_stage_priority_idx" ON "leads"("stage", "priority");

-- CreateIndex
CREATE INDEX "leads_assignedToUserId_stage_idx" ON "leads"("assignedToUserId", "stage");

-- CreateIndex
CREATE INDEX "signals_companyId_idx" ON "signals"("companyId");

-- CreateIndex
CREATE INDEX "signals_leadId_idx" ON "signals"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_leadId_key" ON "dossiers"("leadId");

-- CreateIndex
CREATE INDEX "dossier_claims_dossierId_idx" ON "dossier_claims"("dossierId");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_occurredAt_idx" ON "audit_log"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_idempotencyKey_key" ON "outbox_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "outbox_events_dispatchedAt_occurredAt_idx" ON "outbox_events"("dispatchedAt", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "suppression_entries_phone_key" ON "suppression_entries"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "suppression_entries_email_key" ON "suppression_entries"("email");

-- CreateIndex
CREATE UNIQUE INDEX "suppression_entries_domain_key" ON "suppression_entries"("domain");

-- CreateIndex
CREATE INDEX "legal_basis_records_contactId_idx" ON "legal_basis_records"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "script_versions_treeId_version_key" ON "script_versions"("treeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "script_nodes_versionId_key_key" ON "script_nodes"("versionId", "key");

-- CreateIndex
CREATE INDEX "script_answers_nodeId_idx" ON "script_answers"("nodeId");

-- CreateIndex
CREATE INDEX "call_paths_callId_idx" ON "call_paths"("callId");

-- CreateIndex
CREATE INDEX "calls_leadId_idx" ON "calls"("leadId");

-- CreateIndex
CREATE INDEX "calls_userId_startedAt_idx" ON "calls"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "meetings_leadId_idx" ON "meetings"("leadId");

-- CreateIndex
CREATE INDEX "meetings_qualifierUserId_scheduledAt_idx" ON "meetings"("qualifierUserId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_claims" ADD CONSTRAINT "dossier_claims_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_basis_records" ADD CONSTRAINT "legal_basis_records_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_versions" ADD CONSTRAINT "script_versions_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "script_trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_nodes" ADD CONSTRAINT "script_nodes_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "script_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_answers" ADD CONSTRAINT "script_answers_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "script_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_answers" ADD CONSTRAINT "script_answers_nextNodeId_fkey" FOREIGN KEY ("nextNodeId") REFERENCES "script_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_paths" ADD CONSTRAINT "call_paths_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_paths" ADD CONSTRAINT "call_paths_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "script_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_paths" ADD CONSTRAINT "call_paths_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "script_answers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "script_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_qualifierUserId_fkey" FOREIGN KEY ("qualifierUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
