import { prisma } from "../src/db.js";
import {
  todayWeekdayCode,
  startOfDay,
  endOfDay,
} from "../src/utils/weekdays.js";

async function main() {
  const families = await prisma.family.findMany({ select: { id: true } });
  const weekday = todayWeekdayCode();
  const today = new Date();
  const sod = startOfDay(today);
  const eod = endOfDay(today);

  let totalCreated = 0;

  for (const f of families) {
    const templates = await prisma.choreTemplate.findMany({
      where: {
        familyId: f.id,
        recurrence: "weekly",
        daysOfWeek: { has: weekday },
      },
    });

    for (const t of templates) {
      const exists = await prisma.choreInstance.findFirst({
        where: { templateId: t.id, dueDate: { gte: sod, lte: eod } },
      });
      if (exists) continue;

      const assigneeId = t.defaultAssignedTo;
      if (!assigneeId) continue;

      await prisma.choreInstance.create({
        data: {
          templateId: t.id,
          familyId: t.familyId,
          assignedTo: assigneeId,
          points: t.points,
          dueDate: today,
        },
      });
      totalCreated++;
    }
  }

  console.log(`Generated ${totalCreated} chore instances for ${weekday}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
