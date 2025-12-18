import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// Get users by family (for assigning chores)
router.get("/", async (req, res) => {
  try {
    const { familyId, role } = req.query;
    if (!familyId) return res.status(400).json({ error: "familyId required" });

    const where = { familyId };
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
