import { Worker, Queue, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../lib/prisma';
import { logger } from '../config/logger';
import { createEmailQueue, EmailJobData } from './emailWorker';

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------
export const REMINDER_QUEUE_NAME = 'reminder';

export function createReminderQueue(connection: any) {
  return new Queue(REMINDER_QUEUE_NAME, { connection });
}

// ---------------------------------------------------------------------------
// Helper: Parse a simplified iCal RRULE and compute the next occurrence
// Supports: FREQ=DAILY|WEEKLY|MONTHLY;INTERVAL=N;COUNT=N
// ---------------------------------------------------------------------------
function computeNextOccurrence(dueAt: Date, rrule: string): Date | null {
  const parts: Record<string, string> = {};
  for (const segment of rrule.split(';')) {
    const [key, value] = segment.split('=');
    if (key && value) parts[key.toUpperCase()] = value;
  }

  const freq = parts['FREQ'];
  const interval = parseInt(parts['INTERVAL'] || '1', 10);
  const count = parts['COUNT'] ? parseInt(parts['COUNT'], 10) : null;

  // If count is 1, there is no "next" occurrence
  if (count !== null && count <= 1) return null;

  const next = new Date(dueAt);

  switch (freq) {
    case 'DAILY':
      next.setDate(next.getDate() + interval);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7 * interval);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      return null;
  }

  // Decrement count in the rule for the new reminder
  return next;
}

function decrementRruleCount(rrule: string): string | null {
  const parts: Record<string, string> = {};
  for (const segment of rrule.split(';')) {
    const [key, value] = segment.split('=');
    if (key && value) parts[key.toUpperCase()] = value;
  }

  if (parts['COUNT']) {
    const newCount = parseInt(parts['COUNT'], 10) - 1;
    if (newCount <= 0) return null;
    parts['COUNT'] = String(newCount);
  }

  return Object.entries(parts)
    .map(([k, v]) => `${k}=${v}`)
    .join(';');
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------
export function createReminderWorker(connection: any): Worker {
  const emailQueue = createEmailQueue(connection);

  const worker = new Worker(
    REMINDER_QUEUE_NAME,
    async (_job: Job) => {
      logger.info('[ReminderWorker] Checking due reminders');

      const now = new Date();

      const dueReminders = await prisma.reminder.findMany({
        where: {
          dueAt: { lte: now },
          completed: false,
          OR: [
            { snoozeUntil: null },
            { snoozeUntil: { lte: now } },
          ],
        },
        include: {
          project: true,
          user: true,
        },
        orderBy: { dueAt: 'asc' },
      });

      logger.info(`[ReminderWorker] Found ${dueReminders.length} due reminders`);

      let processed = 0;
      let recurring = 0;

      for (const reminder of dueReminders) {
        // Mark current reminder as completed
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { completed: true },
        });

        // Format reminder type for display
        const typeLabel = reminder.type.replace(/_/g, ' ');

        // Send email notification based on user preference
        if (reminder.user.emailDigest !== 'none') {
          await emailQueue.add('reminder-notification', {
            to: reminder.user.email,
            subject: `Reminder: ${reminder.title || typeLabel} – ${reminder.project.title}`,
            html: [
              `<h2>Reminder Due</h2>`,
              `<p><strong>Type:</strong> ${typeLabel}</p>`,
              reminder.title ? `<p><strong>Title:</strong> ${reminder.title}</p>` : '',
              `<p><strong>Project:</strong> ${reminder.project.title}</p>`,
              `<p><strong>Due:</strong> ${reminder.dueAt.toISOString()}</p>`,
              `<br/>`,
              `<p><a href="${process.env.APP_URL || 'http://localhost:3000'}/projects/${reminder.projectId}">View Project</a></p>`,
            ].join('\n'),
          } satisfies EmailJobData, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5_000 },
          });
        }

        // Handle recurrence
        if (reminder.recurrenceRule) {
          const nextDueAt = computeNextOccurrence(reminder.dueAt, reminder.recurrenceRule);
          const nextRrule = decrementRruleCount(reminder.recurrenceRule);

          if (nextDueAt) {
            await prisma.reminder.create({
              data: {
                projectId: reminder.projectId,
                userId: reminder.userId,
                type: reminder.type,
                title: reminder.title,
                dueAt: nextDueAt,
                recurrenceRule: nextRrule,
              },
            });
            recurring++;
            logger.info(`[ReminderWorker] Created next recurrence for reminder=${reminder.id}, nextDueAt=${nextDueAt.toISOString()}`);
          }
        }

        processed++;
      }

      logger.info(`[ReminderWorker] Processed ${processed} reminders, created ${recurring} recurrences`);
      return { processed, recurring };
    },
    { connection },
  );

  worker.on('completed', (job) => {
    logger.info(`[ReminderWorker] Job ${job.id} completed`, { result: job.returnvalue });
  });

  worker.on('failed', (job, err) => {
    logger.error(`[ReminderWorker] Job ${job?.id} failed`, { error: err.message });
  });

  return worker;
}
