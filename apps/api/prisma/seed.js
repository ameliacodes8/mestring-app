import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const family = await prisma.family.upsert({
    where: { id: "demo-family" },
    update: {},
    create: { id: "demo-family", name: "Demo Family" },
  });

  const parent = await prisma.user.upsert({
    where: { id: "demo-parent" },
    update: {},
    create: {
      id: "demo-parent",
      email: "parent@example.com",
      name: "Demo Parent 1",
      role: "parent",
      familyId: family.id,
    },
  });

  const child = await prisma.user.upsert({
    where: { id: "child-1" },
    update: {},
    create: {
      id: "child-1",
      email: "child1@example.com",
      name: "Demo Child 1",
      role: "child",
      familyId: family.id,
    },
  });

  //Create Chores
  await prisma.chore.create({
    data: {
      id: "chore-1",
      title: "Clean your room",
      description: "Tidy up and vacuum your room.",
      points: 1,
      familyId: family.id,
      createdBy: parent.id,
      assignedTo: child.id,
    },
  });

  await prisma.choreTemplate.create({
    data: {
      familyId,
      title: "Vacuum top floor",
      description: "Whole top floor",
      points: 2,
      recurrence: "weekly",
      interval: 1,
      daysOfWeek: ["SA"],
      defaultAssignedTo: childId,
      createdBy: parentId,
    },
  });

  //Create a goal with steps

  const goal = await prisma.goal.create({
    data: {
      id: "goal-1",
      title: "Learn to ride a bike",
      description: "Practice balancing and pedaling.",
      pointsTotal: 5,
      familyId: family.id,
      createdBy: parent.id,
      assignedTo: child.id,
    },
  });

  await prisma.goalStep.createMany({
    data: [
      { goalId: goal.id, title: "Balance Practice", order: 1, points: 2 },
      { goalId: goal.id, title: "Brake practice", order: 2, points: 3 },
    ],
  });

  // Rewards

  const reward = await prisma.reward.create({
    data: {
      familyId: family.id,
      title: "Ice Cream",
      pointsRequired: 5,
      description: "Get a delicious ice cream treat!",
    },
  });

  await prisma.redemption.create({
    data: {
      rewardId: reward.id,
      userId: child.id,
      status: "requested",
    },
  });

  console.log("Seeded family:", family);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
