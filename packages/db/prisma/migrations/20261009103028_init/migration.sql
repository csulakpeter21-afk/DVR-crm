-- CreateEnum
CREATE TYPE "LeadState" AS ENUM ('sourced', 'enriched', 'researched', 'queued', 'dialled', 'connected', 'conversation', 'meeting_booked', 'meeting_held', 'qualified', 'opportunity', 'won', 'disqualified', 'nurture', 'suppressed', 'recycled');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('rep', 'team_lead', 'qualifier', 'closer', 'growth_lead', 'compliance', 'admin');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "passwordHash" TEXT,
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
