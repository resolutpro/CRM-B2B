import { Router } from "express";
import { db, repliesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/replies", requireAuth, async (req, res) => {
  try {
    const { leadId } = req.query;
    const data = leadId
      ? await db.select().from(repliesTable)
          .where(eq(repliesTable.leadId, parseInt(String(leadId))))
          .orderBy(desc(repliesTable.createdAt))
      : await db.select().from(repliesTable).orderBy(desc(repliesTable.createdAt));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/replies", requireAuth, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.receivedAt) body.receivedAt = new Date(body.receivedAt);
    const [reply] = await db.insert(repliesTable).values(body).returning();
    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.patch("/replies/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    const body = { ...req.body };
    if (body.receivedAt) body.receivedAt = new Date(body.receivedAt);
    const [updated] = await db
      .update(repliesTable)
      .set(body)
      .where(eq(repliesTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Respuesta no encontrada" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.delete("/replies/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    await db.delete(repliesTable).where(eq(repliesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
