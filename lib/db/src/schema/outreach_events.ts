import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { leadsTable } from "./leads";

export const outreachEventsTable = pgTable("outreach_events", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leadsTable.id, { onDelete: "cascade" }).notNull(),
  channel: text("channel").notNull(),
  direction: text("direction").notNull(),
  subject: text("subject"),
  body: text("body"),
  status: text("status").default("preparado"),
  eventAt: timestamp("event_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOutreachEventSchema = createInsertSchema(outreachEventsTable).omit({ id: true, createdAt: true });
export type InsertOutreachEvent = z.infer<typeof insertOutreachEventSchema>;
export type OutreachEvent = typeof outreachEventsTable.$inferSelect;
