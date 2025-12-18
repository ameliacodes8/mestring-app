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
      include: {
        template: true,
        approvals: {
          include: {
            parent: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });
    res.json(instances);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list instances" });
  }
});

// Create a new chore instance (manual assignment)
router.post("/", async (req, res) => {
  try {
    const { templateId, familyId, assignedTo, points, dueDate } = req.body;

    if (!familyId || !assignedTo) {
      return res
        .status(400)
        .json({ error: "familyId and assignedTo required" });
    }

    const instance = await prisma.choreInstance.create({
      data: {
        templateId,
        familyId,
        assignedTo,
        points: points || 1,
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        status: "pending",
      },
      include: {
        template: true,
      },
    });

    res.status(201).json(instance);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create instance" });
  }
});

// Child completes instance
router.post("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const inst = await prisma.choreInstance.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
        rejectionMessage: null,
      },
    });

    // Get or create approvals for parents in the family
    const parents = await prisma.user.findMany({
      where: { familyId: inst.familyId, role: "parent" },
    });

    if (parents.length > 0) {
      // Check if approvals already exist (from previous completion/rejection cycle)
      const existingApprovals = await prisma.choreApproval.findMany({
        where: { instanceId: inst.id },
      });

      if (existingApprovals.length > 0) {
        // Reset existing approvals to pending
        await prisma.choreApproval.updateMany({
          where: { instanceId: inst.id },
          data: { status: "pending", decidedAt: null },
        });
      } else {
        // Create new approvals
        await prisma.choreApproval.createMany({
          data: parents.map((p) => ({ instanceId: inst.id, parentId: p.id })),
        });
      }
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

      // Award points to the child
      await prisma.pointsTransaction.create({
        data: {
          userId: instance.assignedTo,
          points: instance.points,
          source: "chore_approval",
          sourceId: instance.id,
        },
      });
    } else {
      finalInst = await prisma.choreInstance.findUnique({ where: { id } });
    }

    res.json({ instance: finalInst, approvals });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to approve instance" });
  }
});

// Parent rejects instance
router.post("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId, message } = req.body;
    if (!parentId) return res.status(400).json({ error: "parentId required" });

    // Mark approval as rejected
    await prisma.choreApproval.update({
      where: { instanceId_parentId: { instanceId: id, parentId } },
      data: { status: "rejected", decidedAt: new Date() },
    });

    // Reset instance status to pending and add rejection message
    const instance = await prisma.choreInstance.update({
      where: { id },
      data: {
        status: "pending",
        completedAt: null,
        rejectionMessage: message || "Please redo this chore.",
      },
      include: { template: true },
    });

    res.json(instance);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to reject instance" });
  }
});

// Parent unapproves/reverts an approved instance
router.post("/:id/unapprove", async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;
    if (!parentId) return res.status(400).json({ error: "parentId required" });

    // Get the instance to check points
    const instance = await prisma.choreInstance.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!instance) {
      return res.status(404).json({ error: "Instance not found" });
    }

    if (instance.status !== "approved") {
      return res.status(400).json({ error: "Instance is not approved" });
    }

    // Reset instance status to completed (back to pending approval)
    const updatedInstance = await prisma.choreInstance.update({
      where: { id },
      data: {
        status: "completed",
        approvedAt: null,
      },
      include: { template: true },
    });

    // Reset all approvals to pending
    await prisma.choreApproval.updateMany({
      where: { instanceId: id },
      data: { status: "pending", decidedAt: null },
    });

    // Reverse the points transaction by creating a negative transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: instance.assignedTo,
        points: -instance.points, // Negative to deduct points
        source: "chore_unapproval",
        sourceId: instance.id,
      },
    });

    res.json(updatedInstance);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to unapprove instance" });
  }
});

export default router;
