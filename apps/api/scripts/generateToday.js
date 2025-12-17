/**
 * AUTOMATIC DAILY CHORE GENERATION SCRIPT
 *
 * This script automatically creates chore instances from templates that are due today.
 * It should be run once per day (via cron job or scheduled task) to generate
 * the day's chores for all families.
 *
 * How it works:
 * 1. Get today's weekday code (MO, TU, WE, TH, FR, SA, SU)
 * 2. Find all weekly templates that match today's weekday
 * 3. Check if instances already exist for today (avoid duplicates)
 * 4. Create new instances for templates that need them
 *
 * Run with: npm run generate:today
 */

// Import the Prisma client to interact with the database
import { prisma } from "../src/db.js";

// Import date utility functions
import {
  todayWeekdayCode, // Returns today's weekday code (e.g., "MO", "TU")
  startOfDay, // Returns midnight (00:00:00) for a given date
  endOfDay, // Returns 11:59:59 PM for a given date
} from "../src/utils/weekdays.js";

/**
 * Main function that generates today's chore instances
 */
async function main() {
  // ===== STEP 1: GET ALL FAMILIES =====
  // Fetch all families from the database (only need their IDs)
  const families = await prisma.family.findMany({
    select: { id: true },
  });

  // ===== STEP 2: DETERMINE TODAY'S WEEKDAY =====
  // Get today's weekday code (e.g., "MO" for Monday, "SA" for Saturday)
  // This will be matched against template's daysOfWeek array
  const weekday = todayWeekdayCode();

  // Get the current date/time
  const today = new Date();

  // Calculate start and end of today (midnight to 11:59:59 PM)
  // Used to check if a chore instance already exists for today
  const sod = startOfDay(today);
  const eod = endOfDay(today);

  // Counter to track how many instances we create
  let totalCreated = 0;

  // ===== STEP 3: LOOP THROUGH EACH FAMILY =====
  for (const f of families) {
    // ===== STEP 4: FIND TEMPLATES DUE TODAY =====
    // Get all weekly templates for this family where:
    // - recurrence is "weekly" (not "once", "daily", or "monthly")
    // - daysOfWeek array contains today's weekday code
    const templates = await prisma.choreTemplate.findMany({
      where: {
        familyId: f.id,
        recurrence: "weekly",
        daysOfWeek: { has: weekday }, // PostgreSQL array operator
      },
    });

    // ===== STEP 5: CREATE INSTANCES FOR EACH TEMPLATE =====
    for (const t of templates) {
      // ===== STEP 6: CHECK FOR DUPLICATE =====
      // See if an instance already exists for this template today
      // This prevents creating duplicates if the script runs multiple times
      const exists = await prisma.choreInstance.findFirst({
        where: {
          templateId: t.id,
          dueDate: { gte: sod, lte: eod }, // Due date is within today
        },
      });

      // If instance already exists, skip to next template
      if (exists) continue;

      // ===== STEP 7: CHECK FOR ASSIGNEE =====
      // Get the default assignee from the template
      // If no one is assigned, we can't create the instance
      const assigneeId = t.defaultAssignedTo;
      if (!assigneeId) continue; // Skip if no assignee

      // ===== STEP 8: CREATE THE INSTANCE =====
      // Create a new chore instance for today
      await prisma.choreInstance.create({
        data: {
          templateId: t.id, // Link to the template
          familyId: t.familyId, // Same family as template
          assignedTo: assigneeId, // Assign to the default user
          points: t.points, // Copy points value from template
          dueDate: today, // Due today
          // status defaults to "pending" (set in schema)
        },
      });

      // Increment our counter
      totalCreated++;
    }
  }

  // ===== STEP 9: LOG RESULTS =====
  // Print summary to console
  console.log(`✅ Generated ${totalCreated} chore instances for ${weekday}`);
  console.log(`   Checked ${families.length} families`);
}

// ===== EXECUTE THE SCRIPT =====
// Run the main function and handle errors
main()
  .catch((e) => {
    // If there's an error, log it and exit with error code
    console.error("❌ Error generating chore instances:", e);
    process.exit(1); // Exit code 1 indicates failure
  })
  .finally(async () => {
    // Always disconnect from database when done
    // This ensures connections don't leak
    await prisma.$disconnect();
  });
