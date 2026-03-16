import { Router, Request, Response } from "express";
import { ReminderService } from "../services/ReminderService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { NotFoundError } from "../services/ProjectService";
import {
  createReminderSchema,
  updateReminderSchema,
  listRemindersQuery,
  snoozeReminderSchema,
} from "../schemas";

const router = Router();
const reminderService = new ReminderService();

router.use(requireAuth);

// GET /api/v1/reminders
router.get("/", validate(listRemindersQuery, "query"), async (req: Request, res: Response) => {
  try {
    // If ?upcoming=true, return next-7-day reminders (no pagination)
    if ((req.query.upcoming as string) === "true") {
      const reminders = await reminderService.listUpcoming(req.user!.id);
      res.json({ success: true, data: reminders });
      return;
    }

    const result = await reminderService.list(
      req.user!.id,
      {
        projectId: req.query.projectId as string | undefined,
        completed: (req.query.completed as string) === "true",
      },
      {
        cursor: req.query.cursor as string | undefined,
        limit: (req.query.limit as unknown as number) ?? 20,
      }
    );

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/reminders
router.post("/", validate(createReminderSchema), async (req: Request, res: Response) => {
  try {
    const reminder = await reminderService.create(req.user!.id, {
      ...req.body,
      dueAt: new Date(req.body.dueAt),
    });

    res.status(201).json({ success: true, data: reminder });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// PUT /api/v1/reminders/:id
router.put("/:id", validate(updateReminderSchema), async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.dueAt) data.dueAt = new Date(data.dueAt);

    const reminder = await reminderService.update(req.params.id as string, req.user!.id, data);
    res.json({ success: true, data: reminder });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// DELETE /api/v1/reminders/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await reminderService.delete(req.params.id as string, req.user!.id);
    res.json({ success: true, data: null });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/reminders/:id/complete
router.post("/:id/complete", async (req: Request, res: Response) => {
  try {
    const reminder = await reminderService.markComplete(req.params.id as string, req.user!.id);
    res.json({ success: true, data: reminder });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/reminders/:id/snooze
router.post("/:id/snooze", validate(snoozeReminderSchema), async (req: Request, res: Response) => {
  try {
    const snoozeMinutes = req.body.minutes ?? 60;
    const reminder = await reminderService.snooze(req.params.id as string, req.user!.id, snoozeMinutes);
    res.json({ success: true, data: reminder });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

export default router;
