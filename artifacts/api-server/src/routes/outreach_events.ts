import { Router } from "express";
import { db, outreachEventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/outreach-events", requireAuth, async (req, res) => {
  try {
    const { leadId } = req.query;
    const data = leadId
      ? await db.select().from(outreachEventsTable)
          .where(eq(outreachEventsTable.leadId, parseInt(String(leadId))))
          .orderBy(desc(outreachEventsTable.createdAt))
      : await db.select().from(outreachEventsTable).orderBy(desc(outreachEventsTable.createdAt));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/outreach-events", requireAuth, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.eventAt) body.eventAt = new Date(body.eventAt);
    const [event] = await db.insert(outreachEventsTable).values(body).returning();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.patch("/outreach-events/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    const [updated] = await db
      .update(outreachEventsTable)
      .set(req.body)
      .where(eq(outreachEventsTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
