import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ success: false, error: "Username and password required" });
    return;
  }

  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { userId: user._id.toString(), username: user.username },
    env.jwtSecret,
    { expiresIn: "24h" }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    },
  });
});

router.post("/users", requireAuth, async (req: Request, res: Response) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) {
    res.status(400).json({ success: false, error: "Username and password required" });
    return;
  }

  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) {
    res.status(409).json({ success: false, error: "Username already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    username: username.toLowerCase(),
    passwordHash,
    displayName,
    createdBy: req.user!.userId,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
  });
});

router.get("/users", requireAuth, async (_req: Request, res: Response) => {
  const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

router.delete("/users/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === req.user!.userId) {
    res.status(400).json({ success: false, error: "Cannot delete your own account" });
    return;
  }
  await User.findByIdAndDelete(id);
  res.json({ success: true });
});

router.put("/users/:id/password", requireAuth, async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ success: false, error: "Password required" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await User.findByIdAndUpdate(req.params.id, { passwordHash });
  res.json({ success: true });
});

export default router;
