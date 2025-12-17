/**
 * CHORE ROUTES (OLD SYSTEM - NOT CURRENTLY USED)
 * 
 * This file defines API routes for the old one-time chore system.
 * Note: Your app now uses the ChoreTemplate/ChoreInstance system instead.
 * This file appears to be legacy code that isn't actively used.
 * 
 * Routes defined:
 * - GET / - List all chores
 * - POST / - Create a new chore
 * 
 * Uses Zod for request validation (schema validation library)
 */

// Import Express Router to define route handlers
import { Router, Request, Response } from 'express';
// Import Zod for schema validation (runtime type checking)
// Note: 'zod' package needs to be installed: npm install zod
import { z } from 'zod';

// Create a new router instance
// This will be exported and mounted in the main app
export const router = Router();

/**
 * VALIDATION SCHEMA FOR CREATING CHORES
 * 
 * Defines the expected shape of the request body when creating a chore.
 * Zod validates the data at runtime and provides helpful error messages.
 */
const CreateChoreSchema = z.object({
  title: z.string().min(2),           // Title must be a string, at least 2 characters
  description: z.string().optional(), // Description is optional
  points: z.number().int().min(1),    // Points must be an integer >= 1
  assignedTo: z.string().uuid(),      // Assignee must be a valid UUID string
  dueDate: z.string().datetime().optional(), // Due date must be ISO 8601 datetime string, optional
});

/**
 * GET / - LIST ALL CHORES
 * 
 * Returns an array of all chores in the database.
 * Currently returns empty array (placeholder implementation).
 * 
 * Response: Array of chore objects
 */
router.get('/', async (req: Request, res: Response) => {
  // TODO: Implement database query
  // Example: const chores = await prisma.chore.findMany();
  
  // Placeholder: return empty array
  res.json([]);
});

/**
 * POST / - CREATE A NEW CHORE
 * 
 * Creates a new one-time chore in the database.
 * Validates the request body against CreateChoreSchema.
 * 
 * Request body:
 * {
 *   title: string (min 2 chars),
 *   description?: string,
 *   points: number (integer >= 1),
 *   assignedTo: string (UUID),
 *   dueDate?: string (ISO datetime)
 * }
 * 
 * Response: 
 * - 201: Chore created successfully
 * - 400: Validation error
 */
router.post('/', async (req: Request, res: Response) => {
  // Validate request body using Zod schema
  // safeParse returns { success: boolean, data?: T, error?: ZodError }
  const parse = CreateChoreSchema.safeParse(req.body);
  
  // If validation fails, return 400 with formatted error details
  if (!parse.success) {
    return res.status(400).json(parse.error.flatten());
  }
  
  // TODO: Implement database creation
  // Example: 
  // const chore = await prisma.chore.create({
  //   data: {
  //     ...parse.data,
  //     familyId: req.user.familyId, // Get from auth middleware
  //     createdBy: req.user.id,
  //   }
  // });
  
  // Placeholder: return success response
  res.status(201).json({ ok: true });
});
