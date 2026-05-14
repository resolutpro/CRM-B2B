import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { leadsTable } from "./leads";

export const emailDraftStatusEnum = [
  "borrador", "pendiente_revision", "aprobado", "enviado", "rechazado"
] as const;

export const emailDraftsTable = pgTable("email_drafts", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leadsTable.id, { onDelete: "cascade" }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").default("borrador"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmailDraftSchema = createInsertSchema(emailDraftsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmailDraft = z.infer<typeof insertEmailDraftSchema>;
export type EmailDraft = typeof emailDraftsTable.$inferSelect;
