import { Router } from "express";
import { db, agentRunsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/agent-runs", requireAuth, async (req, res) => {
  try {
    const limitNum = Math.min(parseInt((req.query.limit as string) || "50"), 200);
    const data = await db.select().from(agentRunsTable).orderBy(desc(agentRunsTable.createdAt)).limit(limitNum);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/agent-runs", requireAuth, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.startedAt) body.startedAt = new Date(body.startedAt);
    if (body.finishedAt) body.finishedAt = new Date(body.finishedAt);
    const [run] = await db.insert(agentRunsTable).values(body).returning();
    res.status(201).json(run);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
