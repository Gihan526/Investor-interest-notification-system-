import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["investor", "founder"]).optional(),
});

router.post("/register", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.flatten() });

  const { email, password, role } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return void res.status(409).json({ error: "email already in use" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed, role: role ?? "investor" } });

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  res.status(201).json({ token });
});

router.post("/login", async (req, res) => {
  const parsed = schema.omit({ role: true }).safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return void res.status(401).json({ error: "invalid credentials" });

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  res.json({ token });
});

export default router;
