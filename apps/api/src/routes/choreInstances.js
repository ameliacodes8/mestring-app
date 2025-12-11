import { Router } from "express";
import { prisma } from "../db.js";
import { todayWeekdayCode, startOfDay, endOfDay } from "../utils/weekdays.js";

const router = Router();

// Generate instances due today for weekly templates
router.post("/generate-today", async (req, res) => {
  try {
    const { familyId, assignedToFallback } = req.body;
    if (!familyId) return res.status(400).json({ error: "familyId required" });

    const weekday = todayWeekdayCode();
    const templates = await prisma.choreTemplate.findMany({
      where: { familyId, recurrence: "weekly", daysOfWeek: { has: weekday } },
    });

    const created = [];
    const today = new Date();
    const sod = startOfDay(today);
    const eod = endOfDay(today);

    for (const t of templates) {
      // ensure one instance per template per day
      const exists = await prisma.choreInstance.findFirst({
        where: { templateId: t.id, dueDate: { gte: sod, lte: eod } },
      });
      if (exists) continue;

      const assigneeId = t.defaultAssignedTo ?? assignedToFallback;
      if (!assigneeId) continue; // skip if no assignee determined

      const inst = await prisma.choreInstance.create({
        data: {
          templateId: t.id,
          familyId: t.familyId,
          assignedTo: assigneeId,
          points: t.points,
          dueDate: today,
        },
      });
      created.push(inst);
    }

    res.status(201).json({ createdCount: created.length, instances: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to generate instances" });
  }
});

// List instances (filterable)
router.get("/", async (req, res) => {
  try {
    const { familyId, assignedTo, status, dueDateFrom, dueDateTo } = req.query;
    const where = {};
    if (familyId) where.familyId = familyId;
    if (assignedTo) where.assignedTo = assignedTo;
    if (status) where.status = status;
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom);
      if (dueDateTo) where.dueDate.lte = new Date(dueDateTo);
    }
    const instances = await prisma.choreInstance.findMany({
      where,
      orderBy: { dueDate: "asc" },
    });
    res.json(instances);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list instances" });
  }
});

// Child completes instance
router.post("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const inst = await prisma.choreInstance.update({
      where: { id },
      data: { status: "completed", completedAt: new Date() },
    });

    // Create approvals for parents in the family
    const parents = await prisma.user.findMany({
      where: { familyId: inst.familyId, role: "parent" },
    });
    if (parents.length > 0) {
      await prisma.choreApproval.createMany({
        data: parents.map((p) => ({ instanceId: inst.id, parentId: p.id })),
      });
    }

    res.json(inst);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to complete instance" });
  }
});

// Parent approves instance
router.post("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;
    if (!parentId) return res.status(400).json({ error: "parentId required" });

    // approve
    await prisma.choreApproval.update({
      where: { instanceId_parentId: { instanceId: id, parentId } },
      data: { status: "approved", decidedAt: new Date() },
    });

    // Get instance with template to check approval policy
    const instance = await prisma.choreInstance.findUnique({
      where: { id },
      include: { template: true },
    });

    const policy = instance.template.approvalPolicy;

    // check approvals
    const approvals = await prisma.choreApproval.findMany({
      where: { instanceId: id },
    });
    const approvedCount = approvals.filter(
      (a) => a.status === "approved"
    ).length;
    const required = approvals.length;

    const meetsThreshold =
      policy === "any" ? approvedCount >= 1 : approvedCount >= required;

    let finalInst = null;
    if (meetsThreshold) {
      finalInst = await prisma.choreInstance.update({
        where: { id },
        data: { status: "approved", approvedAt: new Date() },
      });
      // Optional: log points assignment or create a ProgressEvent, etc.
    } else {
      finalInst = await prisma.choreInstance.findUnique({ where: { id } });
    }

    res.json({ instance: finalInst, approvals });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to approve instance" });
  }
});

export default router;
