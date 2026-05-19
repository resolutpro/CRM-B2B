import { pgTable, serial, text, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const crmStatusEnum = [
  "nuevo", "validado", "pendiente_revision", "pending_draft_generation",
  "email_preparado", "aprobado_para_contactar", "contactado", "respondio_interesado",
  "respondio_no_interesado", "seguimiento", "muestra_enviada",
  "negociacion", "cliente_ganado", "cliente_perdido", "no_contactar", "descartado"
] as const;

export const consentStatusEnum = [
  "desconocido", "email_publico_corporativo", "contacto_manual_recomendado",
  "consentimiento_obtenido", "relacion_previa", "no_contactar", "baja_solicitada"
] as const;

export const priorityEnum = ["alta", "media", "baja"] as const;

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  businessType: text("business_type"),
  city: text("city"),
  province: text("province"),
  country: text("country").default("España"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  instagram: text("instagram"),
  sourceUrl: text("source_url"),
  sourceNotes: text("source_notes"),
  fitScore: integer("fit_score").default(0),
  fitReason: text("fit_reason"),
  consentStatus: text("consent_status").default("desconocido"),
  crmStatus: text("crm_status").default("nuevo"),
  priority: text("priority").default("media"),
  assignedTo: text("assigned_to"),
  lastContactedAt: timestamp("last_contacted_at"),
  nextActionAt: timestamp("next_action_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
