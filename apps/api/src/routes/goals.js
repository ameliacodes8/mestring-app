import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  const familyId = req.query.familyId || req.user?.user_metadata?.family_id || 'demo-family';
  const goals = await prisma.goal.findMany({ where: { familyId }, include: { steps: true }, orderBy: { createdAt: 'desc' } });
  res.json(goals);
});

router.post('/', async (req, res) => {
  const { title, description, familyId, assignedTo } = req.body;
  if (!title || !familyId) return res.status(400).json({ error: 'title and familyId required' });

  const goal = await prisma.goal.create({
    data: {
      title,
      description,
      familyId,
      assignedTo,
      createdBy: req.user?.sub
    }
  });
  res.status(201).json(goal);
});

router.post('/:id/steps', async (req, res) => {
  const goalId = req.params.id;
  const { title, instructions, mediaUrl, order = 1, points = 1 } = req.body;
  const step = await prisma.goalStep.create({
    data: { goalId, title, instructions, mediaUrl, order, points }
  });
  res.status(201).json(step);
});

export default router;