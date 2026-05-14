import { Router } from "express";
import { db, suppressionListTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/suppression", requireAuth, async (_req, res) => {
  try {
    const data = await db.select().from(suppressionListTable);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/suppression", requireAuth, async (req, res) => {
  try {
    const [entry] = await db.insert(suppressionListTable).values(req.body).returning();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.delete("/suppression/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    await db.delete(suppressionListTable).where(eq(suppressionListTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
