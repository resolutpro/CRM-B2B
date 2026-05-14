import { Router } from "express";
import { db, emailDraftsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/email-drafts", requireAuth, async (req, res) => {
  try {
    const { leadId } = req.query;
    const data = leadId
      ? await db.select().from(emailDraftsTable).where(eq(emailDraftsTable.leadId, parseInt(String(leadId))))
      : await db.select().from(emailDraftsTable);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/email-drafts", requireAuth, async (req, res) => {
  try {
    const [draft] = await db.insert(emailDraftsTable).values(req.body).returning();
    res.status(201).json(draft);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.patch("/email-drafts/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    const [updated] = await db
      .update(emailDraftsTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(emailDraftsTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.delete("/email-drafts/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    await db.delete(emailDraftsTable).where(eq(emailDraftsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
