import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// Get points summary for a user
router.get("/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all transactions
    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
    });

    // Calculate total points
    const totalPoints = transactions.reduce((sum, t) => sum + t.points, 0);

    // Calculate this week's points (Sunday to Saturday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyTransactions = transactions.filter(
      (t) => new Date(t.timestamp) >= startOfWeek
    );
    const weeklyPoints = weeklyTransactions.reduce(
      (sum, t) => sum + t.points,
      0
    );

    res.json({
      userId,
      totalPoints,
      weeklyPoints,
      transactions: transactions.slice(0, 10), // Latest 10 transactions
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch points summary" });
  }
});

// Get leaderboard for a family
router.get("/leaderboard/:familyId", async (req, res) => {
  try {
    const { familyId } = req.params;

    // Get all children in the family
    const children = await prisma.user.findMany({
      where: { familyId, role: "child" },
    });

    // Get points for each child
    const leaderboard = await Promise.all(
      children.map(async (child) => {
        const transactions = await prisma.pointsTransaction.findMany({
          where: { userId: child.id },
        });
        const totalPoints = transactions.reduce((sum, t) => sum + t.points, 0);

        return {
          userId: child.id,
          name: child.name,
          totalPoints,
        };
      })
    );

    // Sort by points descending
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    res.json(leaderboard);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
