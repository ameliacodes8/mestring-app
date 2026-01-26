-- DropForeignKey
ALTER TABLE "ChoreApproval" DROP CONSTRAINT "ChoreApproval_instanceId_fkey";

-- DropForeignKey
ALTER TABLE "ChoreApproval" DROP CONSTRAINT "ChoreApproval_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ChoreInstance" DROP CONSTRAINT "ChoreInstance_assignedTo_fkey";

-- DropForeignKey
ALTER TABLE "ChoreInstance" DROP CONSTRAINT "ChoreInstance_familyId_fkey";

-- DropForeignKey
ALTER TABLE "ChoreInstance" DROP CONSTRAINT "ChoreInstance_templateId_fkey";

-- DropForeignKey
ALTER TABLE "ChoreTemplate" DROP CONSTRAINT "ChoreTemplate_familyId_fkey";

-- DropForeignKey
ALTER TABLE "PointsTransaction" DROP CONSTRAINT "PointsTransaction_userId_fkey";

-- AddForeignKey
ALTER TABLE "ChoreTemplate" ADD CONSTRAINT "ChoreTemplate_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreInstance" ADD CONSTRAINT "ChoreInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChoreTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreInstance" ADD CONSTRAINT "ChoreInstance_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreInstance" ADD CONSTRAINT "ChoreInstance_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreApproval" ADD CONSTRAINT "ChoreApproval_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "ChoreInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreApproval" ADD CONSTRAINT "ChoreApproval_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
