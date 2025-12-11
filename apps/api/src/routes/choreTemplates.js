import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// Create a template
router.post("/", async (req, res) => {
  try {
    const {
      familyId,
      title,
      description,
      points = 1,
      recurrence = "weekly",
      interval = 1,
      daysOfWeek = [],
      defaultAssignedTo,
      createdBy,
    } = req.body;
    if (!familyId || !title)
      return res.status(400).json({ error: "familyId and title are required" });

    const template = await prisma.choreTemplate.create({
      data: {
        familyId,
        title,
        description,
        points,
        recurrence,
        interval,
        daysOfWeek,
        defaultAssignedTo,
        createdBy,
      },
    });
    res.status(201).json(template);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// List templates by family
router.get("/", async (req, res) => {
  try {
    const { familyId } = req.query;
    if (!familyId) return res.status(400).json({ error: "familyId required" });
    const templates = await prisma.choreTemplate.findMany({
      where: { familyId },
    });
    res.json(templates);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list templates" });
  }
});

export default router;
