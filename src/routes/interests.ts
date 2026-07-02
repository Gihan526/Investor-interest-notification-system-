import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { authenticate, type AuthRequest } from "../middleware/auth";

const router = Router();

const schema = z.object({
  startupId: z.string().min(1),
  founderId: z.string().min(1),
});

router.post("/express", authenticate, async (req: AuthRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.flatten() });

  const { startupId, founderId } = parsed.data;
  const investorId = req.user!.id;

  try {
    const interest = await prisma.interest.create({
      data: { investorId, startupId },
    });

    const notification = await prisma.notification.create({
      data: {
        userId: founderId,
        message: `Investor ${req.user!.email} expressed interest in your startup`,
      },
    });

    await redis.publish("new_interest", JSON.stringify({ interest, notification, founderId }));

    res.status(201).json({ interest });
  } catch (err: any) {
    if (err.code === "P2002") return void res.status(409).json({ error: "interest already expressed" });
    throw err;
  }
});

export default router;
