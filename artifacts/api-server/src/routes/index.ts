import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import dashboardRouter from "./dashboard.js";
import leadsRouter from "./leads.js";
import contactsRouter from "./contacts.js";
import emailDraftsRouter from "./email_drafts.js";
import outreachEventsRouter from "./outreach_events.js";
import repliesRouter from "./replies.js";
import tasksRouter from "./tasks.js";
import suppressionRouter from "./suppression.js";
import settingsRouter from "./settings.js";
import agentRunsRouter from "./agent_runs.js";
import agentRouter from "./agent.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(leadsRouter);
router.use(contactsRouter);
router.use(emailDraftsRouter);
router.use(outreachEventsRouter);
router.use(repliesRouter);
router.use(tasksRouter);
router.use(suppressionRouter);
router.use(settingsRouter);
router.use(agentRunsRouter);
router.use(agentRouter);

export default router;
