/*
  Warnings:

  - A unique constraint covering the columns `[goalId,order]` on the table `GoalStep` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('once', 'daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ApprovalPolicy" AS ENUM ('any', 'all');

-- CreateTable
CREATE TABLE "ChoreTemplate" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "recurrence" "RecurrenceType" NOT NULL DEFAULT 'once',
    "interval" INTEGER NOT NULL DEFAULT 1,
    "daysOfWeek" TEXT[],
    "approvalPolicy" "ApprovalPolicy" NOT NULL DEFAULT 'any',
    "defaultAssignedTo" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChoreTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoreInstance" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "ChoreStatus" NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChoreInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoreApproval" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ChoreApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChoreTemplate_familyId_recurrence_idx" ON "ChoreTemplate"("familyId", "recurrence");

-- CreateIndex
CREATE INDEX "ChoreInstance_familyId_assignedTo_status_dueDate_idx" ON "ChoreInstance"("familyId", "assignedTo", "status", "dueDate");

-- CreateIndex
CREATE INDEX "ChoreApproval_parentId_status_idx" ON "ChoreApproval"("parentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ChoreApproval_instanceId_parentId_key" ON "ChoreApproval"("instanceId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalStep_goalId_order_key" ON "GoalStep"("goalId", "order");

-- AddForeignKey
ALTER TABLE "ChoreTemplate" ADD CONSTRAINT "ChoreTemplate_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreTemplate" ADD CONSTRAINT "ChoreTemplate_defaultAssignedTo_fkey" FOREIGN KEY ("defaultAssignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreTemplate" ADD CONSTRAINT "ChoreTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreInstance" ADD CONSTRAINT "ChoreInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChoreTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreInstance" ADD CONSTRAINT "ChoreInstance_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreInstance" ADD CONSTRAINT "ChoreInstance_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreApproval" ADD CONSTRAINT "ChoreApproval_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "ChoreInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreApproval" ADD CONSTRAINT "ChoreApproval_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
