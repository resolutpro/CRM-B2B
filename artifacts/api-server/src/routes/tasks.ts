import { Router } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/tasks", requireAuth, async (req, res) => {
  try {
    const { leadId, status } = req.query;
    const conditions: ReturnType<typeof eq>[] = [];
    if (leadId) conditions.push(eq(tasksTable.leadId, parseInt(String(leadId))));
    if (status) conditions.push(eq(tasksTable.status, String(status)));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const data = await db.select().from(tasksTable).where(where);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/tasks", requireAuth, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.dueDate) body.dueDate = new Date(body.dueDate);
    const [task] = await db.insert(tasksTable).values(body).returning();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.patch("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    const body = { ...req.body, updatedAt: new Date() };
    if (body.dueDate) body.dueDate = new Date(body.dueDate);
    const [updated] = await db.update(tasksTable).set(body).where(eq(tasksTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.delete("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    await db.delete(tasksTable).where(eq(tasksTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
