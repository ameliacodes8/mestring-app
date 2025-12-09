import { Router } from 'express';
import { z } from 'zod';

export const router = Router();

const CreateChoreSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  points: z.number().int().min(1),
  assignedTo: z.string().uuid(),
  dueDate: z.string().datetime().optional(),
});

router.get('/', async (req, res) => {
  // fetch chores from DB
  res.json([]);
});

router.post('/', async (req, res) => {
  const parse = CreateChoreSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  // create chore in DB
  res.status(201).json({ ok: true });
});