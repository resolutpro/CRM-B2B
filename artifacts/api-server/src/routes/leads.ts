import { Router } from "express";
import { db } from "@workspace/db";
import {
  leadsTable, contactsTable, emailDraftsTable,
  outreachEventsTable, repliesTable, tasksTable, suppressionListTable
} from "@workspace/db";
import { eq, or, ilike, and, gte, desc, asc, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const APPROVAL_STATUS = "aprobado_para_contactar";

router.get("/leads", requireAuth, async (req, res) => {
  try {
    const { query, status, priority, minScore, sortBy, sortDir, page, limit } = req.query;
    const pageNum = parseInt(String(page || "1"));
    const limitNum = Math.min(parseInt(String(limit || "50")), 200);
    const offset = (pageNum - 1) * limitNum;

    const conditions: ReturnType<typeof eq>[] = [];
    if (query) {
      const q = `%${query}%`;
      conditions.push(or(
        ilike(leadsTable.businessName, q),
        ilike(leadsTable.city, q),
        ilike(leadsTable.email, q),
        ilike(leadsTable.businessType, q),
      )!);
    }
    if (status) conditions.push(eq(leadsTable.crmStatus, String(status)));
    if (priority) conditions.push(eq(leadsTable.priority, String(priority)));
    if (minScore) conditions.push(gte(leadsTable.fitScore, parseInt(String(minScore))));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const dir = String(sortDir) === "desc" ? desc : asc;
    let orderBy: ReturnType<typeof desc>;
    if (sortBy === "fitScore") orderBy = dir(leadsTable.fitScore);
    else if (sortBy === "crmStatus") orderBy = dir(leadsTable.crmStatus);
    else orderBy = dir(leadsTable.createdAt);

    const [data, totalResult] = await Promise.all([
      db.select().from(leadsTable).where(where).orderBy(orderBy).limit(limitNum).offset(offset),
      db.select({ count: count() }).from(leadsTable).where(where),
    ]);

    res.json({ data, total: Number(totalResult[0]?.count ?? 0), page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/leads", requireAuth, async (req, res) => {
  try {
    const [lead] = await db.insert(leadsTable).values(req.body).returning();
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.get("/leads/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, id));
    if (!lead) { res.status(404).json({ error: "Lead no encontrado" }); return; }

    const [contacts, emailDrafts, outreachEvents, replies, tasks] = await Promise.all([
      db.select().from(contactsTable).where(eq(contactsTable.leadId, id)),
      db.select().from(emailDraftsTable).where(eq(emailDraftsTable.leadId, id)),
      db.select().from(outreachEventsTable).where(eq(outreachEventsTable.leadId, id)).orderBy(desc(outreachEventsTable.createdAt)),
      db.select().from(repliesTable).where(eq(repliesTable.leadId, id)),
      db.select().from(tasksTable).where(eq(tasksTable.leadId, id)),
    ]);

    res.json({ ...lead, contacts, emailDrafts, outreachEvents, replies, tasks });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.patch("/leads/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    const body = req.body as Record<string, unknown>;

    if (body["crmStatus"] === APPROVAL_STATUS) {
      const [current] = await db.select().from(leadsTable).where(eq(leadsTable.id, id));
      if (!current) { res.status(404).json({ error: "Lead no encontrado" }); return; }

      if (current.email) {
        const email = current.email.toLowerCase();
        const domain = email.split("@")[1] ?? "";
        const suppressed = await db
          .select()
          .from(suppressionListTable)
          .where(
            or(
              eq(suppressionListTable.email, email),
              eq(suppressionListTable.domain, domain),
            ),
          )
          .limit(1);

        if (suppressed.length > 0) {
          const entry = suppressed[0]!;
          const reason = entry.reason ?? "sin motivo especificado";
          res.status(422).json({
            error: "Lead bloqueado por lista de supresión",
            detail: `El email "${current.email}" o su dominio "${domain}" está en la lista de supresión. Motivo: ${reason}`,
            suppressionId: entry.id,
          });
          return;
        }
      }
    }

    const [updated] = await db
      .update(leadsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(leadsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Lead no encontrado" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.delete("/leads/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    await db.delete(leadsTable).where(eq(leadsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/leads/:id/suppress", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    const [updated] = await db
      .update(leadsTable)
      .set({ crmStatus: "no_contactar", updatedAt: new Date() })
      .where(eq(leadsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Lead no encontrado" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
