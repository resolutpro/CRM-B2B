import { Router } from "express";
import { db } from "@workspace/db";
import {
  leadsTable, contactsTable, emailDraftsTable,
  outreachEventsTable, repliesTable, tasksTable,
  suppressionListTable, agentRunsTable, settingsTable
} from "@workspace/db";
import { eq, or, ilike, and } from "drizzle-orm";
import { requireBearerToken } from "../middlewares/auth.js";

const router = Router();
router.use(requireBearerToken);

const PROTECTED_STATUSES = ["cliente_ganado", "no_contactar", "baja_solicitada"];

router.get("/agent/health", (_req, res) => {
  res.json({ ok: true, service: "labercianita-crm", timestamp: new Date().toISOString() });
});

router.get("/agent/config", async (_req, res) => {
  try {
    const settings = await db.select().from(settingsTable);
    const s = Object.fromEntries(settings.map(r => [r.key, r.value]));
    res.json({
      target_cities: s.target_cities ? JSON.parse(s.target_cities) : [],
      target_business_types: s.target_business_types ? JSON.parse(s.target_business_types) : [],
      min_score: parseInt(s.min_score || "60"),
      daily_contact_limit: parseInt(s.daily_contact_limit || "20"),
      brand: {
        name: "La Bercianita",
        website: s.website || "https://www.labercianita.com/",
        sender_name: s.sender_name || "",
        sender_email: s.sender_email || "",
        phone: s.phone || "",
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

async function upsertLead(leadData: any) {
  const { website, email } = leadData;
  let existing = null;
  if (email) {
    const rows = await db.select().from(leadsTable).where(eq(leadsTable.email, email));
    existing = rows[0] ?? null;
  }
  if (!existing && website) {
    const rows = await db.select().from(leadsTable).where(eq(leadsTable.website, website));
    existing = rows[0] ?? null;
  }

  if (existing) {
    if (PROTECTED_STATUSES.includes(existing.crmStatus || "")) {
      return { lead: existing, action: "skipped" };
    }
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const existingRecord = existing as Record<string, unknown>;
    for (const [k, v] of Object.entries(leadData as Record<string, unknown>)) {
      if (v !== undefined && v !== null && v !== "") {
        if (!existingRecord[k]) updates[k] = v;
      }
    }
    const [updated] = await db.update(leadsTable).set(updates).where(eq(leadsTable.id, existing.id)).returning();
    return { lead: updated, action: "updated" };
  } else {
    const [created] = await db.insert(leadsTable).values(leadData).returning();
    return { lead: created, action: "created" };
  }
}

router.post("/agent/leads/upsert", async (req, res) => {
  try {
    const { lead, action } = await upsertLead(req.body);
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/agent/leads/bulk-upsert", async (req, res) => {
  try {
    const { leads } = req.body as { leads: any[] };
    let created = 0, updated = 0, skipped = 0;
    const errors: string[] = [];
    for (const leadData of leads) {
      try {
        const { action } = await upsertLead(leadData);
        if (action === "created") created++;
        else if (action === "updated") updated++;
        else skipped++;
      } catch (e: any) {
        errors.push(e.message || "Error desconocido");
      }
    }
    res.json({ created, updated, skipped, errors });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.get("/agent/leads", async (req, res) => {
  try {
    const { query, status, city, business_type, limit } = req.query;
    const limitNum = Math.min(parseInt((limit as string) || "50"), 200);
    const conditions: any[] = [];
    if (query) {
      const q = `%${query}%`;
      conditions.push(or(ilike(leadsTable.businessName, q), ilike(leadsTable.email, q)));
    }
    if (status) conditions.push(eq(leadsTable.crmStatus, status as string));
    if (city) conditions.push(eq(leadsTable.city, city as string));
    if (business_type) conditions.push(eq(leadsTable.businessType, business_type as string));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const data = await db.select().from(leadsTable).where(where).limit(limitNum);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.get("/agent/leads/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, id));
    if (!lead) { res.status(404).json({ error: "Lead no encontrado" }); return; }
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.patch("/agent/leads/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(leadsTable).where(eq(leadsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Lead no encontrado" }); return; }
    if (req.body.crmStatus && PROTECTED_STATUSES.includes(existing.crmStatus || "")) {
      res.status(400).json({ error: "No se puede actualizar un lead en estado protegido" });
      return;
    }
    const body = { ...req.body, updatedAt: new Date() };
    if (body.lastContactedAt) body.lastContactedAt = new Date(body.lastContactedAt);
    if (body.nextActionAt) body.nextActionAt = new Date(body.nextActionAt);
    const [updated] = await db.update(leadsTable).set(body).where(eq(leadsTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/agent/contacts", async (req, res) => {
  try {
    const [contact] = await db.insert(contactsTable).values(req.body).returning();
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/agent/email-drafts", async (req, res) => {
  try {
    const [draft] = await db.insert(emailDraftsTable).values(req.body).returning();
    res.status(201).json(draft);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/agent/events", async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.eventAt) body.eventAt = new Date(body.eventAt);
    const [event] = await db.insert(outreachEventsTable).values(body).returning();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/agent/replies", async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.receivedAt) body.receivedAt = new Date(body.receivedAt);
    const [reply] = await db.insert(repliesTable).values(body).returning();
    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/agent/tasks", async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.dueDate) body.dueDate = new Date(body.dueDate);
    const [task] = await db.insert(tasksTable).values(body).returning();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.get("/agent/suppression", async (_req, res) => {
  try {
    const data = await db.select().from(suppressionListTable);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/agent/suppression", async (req, res) => {
  try {
    const [entry] = await db.insert(suppressionListTable).values(req.body).returning();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/agent/runs", async (req, res) => {
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
