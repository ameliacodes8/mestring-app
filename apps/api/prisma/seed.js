// Import Prisma Client - this is the auto-generated database client
// that provides type-safe access to your database
import { PrismaClient } from "@prisma/client";

// Create a new instance of Prisma Client to interact with the database
const prisma = new PrismaClient();

/**
 * Main seeding function
 * This populates the database with demo data for testing/development
 * Uses 'upsert' to avoid duplicate key errors if you run seed multiple times
 * Upsert = UPDATE if exists, INSERT if doesn't exist
 */
async function main() {
  // ===== CREATE DEMO FAMILY =====
  // This is the top-level container for all users and chores
  const family = await prisma.family.upsert({
    where: { id: "demo-family" }, // Look for existing family with this ID
    update: {}, // If found, don't change anything
    create: {
      // If not found, create new family
      id: "demo-family",
      name: "Demo Family",
    },
  });

  // ===== CREATE PARENT USER =====
  // Parents can create templates, approve chores, and manage the family
  const parent = await prisma.user.upsert({
    where: { id: "demo-parent" },
    update: {},
    create: {
      id: "demo-parent",
      email: "parent@example.com",
      name: "Demo Parent 1",
      role: "parent", // Role enum: 'parent' or 'child'
      familyId: family.id, // Link this user to the family
    },
  });

  // ===== CREATE CHILD USER =====
  // Children complete chores and earn points
  const child = await prisma.user.upsert({
    where: { id: "child-1" },
    update: {},
    create: {
      id: "child-1",
      email: "child1@example.com",
      name: "Demo Child 1",
      role: "child", // This user is a child
      familyId: family.id, // Link to the same family
    },
  });

  // ===== CREATE ONE-TIME CHORE =====
  // This is an old-style chore (not using the template system)
  // It's a single task that can be completed once
  await prisma.chore.create({
    data: {
      id: "chore-1",
      title: "Clean your room",
      description: "Tidy up and vacuum your room.",
      points: 1, // Earn 1 point when completed
      familyId: family.id, // Belongs to the demo family
      createdBy: parent.id, // Parent created this chore
      assignedTo: child.id, // Assigned to the child
    },
  });

  // ===== CREATE RECURRING CHORE TEMPLATE =====
  // Templates define chores that repeat on a schedule
  // The system generates instances from templates automatically
  await prisma.choreTemplate.create({
    data: {
      familyId: family.id, // Must use the actual family object's id
      title: "Vacuum top floor",
      description: "Whole top floor",
      points: 2, // Worth 2 points when approved
      recurrence: "weekly", // Repeats every week
      interval: 1, // Every 1 week (not every 2 weeks, etc.)
      daysOfWeek: ["SA"], // Only on Saturday (SA = Saturday code)
      defaultAssignedTo: child.id, // Auto-assign to this child
      createdBy: parent.id, // Parent created this template
    },
  });

  // ===== CREATE A GOAL WITH STEPS =====
  // Goals are multi-step achievements that children work towards
  const goal = await prisma.goal.create({
    data: {
      id: "goal-1",
      title: "Learn to ride a bike",
      description: "Practice balancing and pedaling.",
      pointsTotal: 5, // Total points needed to complete goal
      familyId: family.id,
      createdBy: parent.id,
      assignedTo: child.id,
    },
  });

  // ===== CREATE GOAL STEPS =====
  // Each goal can have multiple ordered steps
  // createMany inserts multiple records in one database call
  await prisma.goalStep.createMany({
    data: [
      {
        goalId: goal.id, // Link to the goal we just created
        title: "Balance Practice",
        order: 1, // First step
        points: 2, // Worth 2 points
      },
      {
        goalId: goal.id,
        title: "Brake practice",
        order: 2, // Second step
        points: 3, // Worth 3 points (total = 5)
      },
    ],
  });

  // ===== CREATE REWARD =====
  // Rewards are things children can "buy" with their points
  const reward = await prisma.reward.create({
    data: {
      familyId: family.id,
      title: "Ice Cream",
      pointsRequired: 5, // Costs 5 points to redeem
      description: "Get a delicious ice cream treat!",
    },
  });

  // ===== CREATE REWARD REDEMPTION =====
  // This records when a child requests/redeems a reward
  await prisma.redemption.create({
    data: {
      rewardId: reward.id, // Which reward they want
      userId: child.id, // Which child is requesting it
      status: "requested", // Status: 'requested', 'approved', 'denied'
    },
  });

  // Log success message to console
  console.log("✅ Database seeded successfully!");
  console.log("Demo family created:", family.name);
  console.log("Users created: Demo Parent 1, Demo Child 1");
  console.log("Sample chores, goals, and rewards created");
}

// ===== EXECUTE THE MAIN FUNCTION =====
// This runs the seeding and handles errors
main()
  .catch((e) => {
    // If anything goes wrong, log the error and exit with error code
    console.error("❌ Error seeding database:", e);
    process.exit(1); // Exit code 1 means error
  })
  .finally(async () => {
    // Always disconnect from database when done, even if there was an error
    await prisma.$disconnect();
  });
