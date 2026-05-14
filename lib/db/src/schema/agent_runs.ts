import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentRunsTable = pgTable("agent_runs", {
  id: serial("id").primaryKey(),
  agentName: text("agent_name").notNull(),
  runType: text("run_type"),
  status: text("status").default("running"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  summary: text("summary"),
  errors: text("errors"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentRunSchema = createInsertSchema(agentRunsTable).omit({ id: true, createdAt: true });
export type InsertAgentRun = z.infer<typeof insertAgentRunSchema>;
export type AgentRun = typeof agentRunsTable.$inferSelect;
