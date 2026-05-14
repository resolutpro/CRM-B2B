import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/settings", requireAuth, async (_req, res) => {
  try {
    const data = await db.select().from(settingsTable);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.patch("/settings", requireAuth, async (req, res) => {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await db
        .insert(settingsTable)
        .values({ key, value })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
    }
    const data = await db.select().from(settingsTable);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
