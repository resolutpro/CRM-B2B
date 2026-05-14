import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable, outreachEventsTable, tasksTable, repliesTable } from "@workspace/db";
import { sql, count, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (_req, res) => {
  try {
    const byStatus = await db
      .select({ label: leadsTable.crmStatus, count: count() })
      .from(leadsTable)
      .groupBy(leadsTable.crmStatus);

    const byBusinessType = await db
      .select({ label: leadsTable.businessType, count: count() })
      .from(leadsTable)
      .groupBy(leadsTable.businessType);

    const byCity = await db
      .select({ label: leadsTable.city, count: count() })
      .from(leadsTable)
      .groupBy(leadsTable.city);

    const totalLeadsResult = await db.select({ count: count() }).from(leadsTable);
    const totalLeads = totalLeadsResult[0]?.count ?? 0;

    const recentEvents = await db
      .select()
      .from(outreachEventsTable)
      .orderBy(sql`${outreachEventsTable.createdAt} desc`)
      .limit(10);

    const pendingTasksResult = await db
      .select({ count: count() })
      .from(tasksTable)
      .where(eq(tasksTable.status, "pendiente"));
    const pendingTasks = pendingTasksResult[0]?.count ?? 0;

    const totalReplies = await db.select({ count: count() }).from(repliesTable);
    const totalContacted = byStatus.find(s => s.label === "contactado")?.count ?? 0;
    const responseRate = totalContacted > 0
      ? Math.round(((totalReplies[0]?.count ?? 0) / Number(totalContacted)) * 100)
      : 0;

    res.json({
      totalLeads: Number(totalLeads),
      byStatus: byStatus
        .filter(s => s.label)
        .map(s => ({ label: s.label as string, count: Number(s.count) })),
      byBusinessType: byBusinessType
        .filter(s => s.label)
        .map(s => ({ label: s.label as string, count: Number(s.count) })),
      byCity: byCity
        .filter(s => s.label)
        .map(s => ({ label: s.label as string, count: Number(s.count) })),
      recentEvents,
      responseRate,
      pendingTasks: Number(pendingTasks),
    });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
