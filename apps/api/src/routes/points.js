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

    // Calculate last week's points for comparison
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek);

    const lastWeekTransactions = transactions.filter((t) => {
      const timestamp = new Date(t.timestamp);
      return timestamp >= lastWeekStart && timestamp < lastWeekEnd;
    });
    const lastWeekPoints = lastWeekTransactions.reduce(
      (sum, t) => sum + t.points,
      0
    );

    // Get next reward goal (find cheapest reward they can't afford yet)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    let nextReward = null;
    if (user?.familyId) {
      const rewards = await prisma.reward.findMany({
        where: {
          familyId: user.familyId,
          pointsRequired: { gt: totalPoints },
        },
        orderBy: { pointsRequired: "asc" },
        take: 1,
      });
      nextReward = rewards[0] || null;
    }

    res.json({
      userId,
      totalPoints,
      weeklyPoints,
      lastWeekPoints,
      nextReward,
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

    // Calculate week boundaries
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Get points for each child
    const leaderboard = await Promise.all(
      children.map(async (child) => {
        const transactions = await prisma.pointsTransaction.findMany({
          where: { userId: child.id },
        });
        const totalPoints = transactions.reduce((sum, t) => sum + t.points, 0);

        // This week's points
        const weeklyTransactions = transactions.filter(
          (t) => new Date(t.timestamp) >= startOfWeek
        );
        const weeklyPoints = weeklyTransactions.reduce(
          (sum, t) => sum + t.points,
          0
        );

        // Last week's points
        const lastWeekTransactions = transactions.filter((t) => {
          const timestamp = new Date(t.timestamp);
          return timestamp >= lastWeekStart && timestamp < startOfWeek;
        });
        const lastWeekPoints = lastWeekTransactions.reduce(
          (sum, t) => sum + t.points,
          0
        );

        return {
          userId: child.id,
          name: child.name,
          totalPoints,
          weeklyPoints,
          lastWeekPoints,
        };
      })
    );

    // Sort by weekly points descending (show who's doing best this week)
    leaderboard.sort((a, b) => b.weeklyPoints - a.weeklyPoints);

    res.json(leaderboard);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
