import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  const familyId = req.query.familyId || req.user?.user_metadata?.family_id || 'demo-family';
  const chores = await prisma.chore.findMany({ where: { familyId }, orderBy: { createdAt: 'desc' } });
  res.json(chores);
});

router.post('/', async (req, res) => {
  const { title, description, points = 1, dueDate, familyId, assignedTo } = req.body;
  if (!title || !familyId) return res.status(400).json({ error: 'title and familyId required' });

  const chore = await prisma.chore.create({
    data: { title, description, points, dueDate: dueDate ? new Date(dueDate) : null, familyId, assignedTo, createdBy: req.user?.sub }
  });

  res.status(201).json(chore);
});

router.post('/:id/complete', async (req, res) => {
  const id = req.params.id;
  const chore = await prisma.chore.update({ where: { id }, data: { status: 'completed' } });
  res.json(chore);
});

export default router;