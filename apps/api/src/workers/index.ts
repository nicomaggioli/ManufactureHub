import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import { logger } from '../config/logger';
import { createEmailWorker } from './emailWorker';
import { createFollowUpWorker, createFollowUpQueue, FOLLOW_UP_QUEUE_NAME } from './followUpWorker';
import { createReminderWorker, createReminderQueue, REMINDER_QUEUE_NAME } from './reminderWorker';

// ---------------------------------------------------------------------------
// Initialize all workers
// ---------------------------------------------------------------------------
export async function initWorkers(): Promise<{
  workers: Worker[];
  shutdown: () => Promise<void>;
} | null> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.info('[Workers] REDIS_URL not set – skipping worker initialization');
    return null;
  }

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  connection.on('error', (err) => {
    logger.error('[Workers] Redis connection error', { error: err.message });
  });

  connection.on('connect', () => {
    logger.info('[Workers] Redis connected');
  });

  // -------------------------------------------------------------------------
  // Create workers
  // -------------------------------------------------------------------------
  const emailWorker = createEmailWorker(connection);
  const followUpWorker = createFollowUpWorker(connection);
  const reminderWorker = createReminderWorker(connection);

  const workers: Worker[] = [emailWorker, followUpWorker, reminderWorker];

  logger.info('[Workers] All workers initialized');

  // -------------------------------------------------------------------------
  // Set up cron-style repeatable jobs
  // -------------------------------------------------------------------------
  const followUpQueue = createFollowUpQueue(connection);
  const reminderQueue = createReminderQueue(connection);

  // Follow-up check: every hour
  await followUpQueue.upsertJobScheduler(
    'follow-up-cron',
    { pattern: '0 * * * *' }, // every hour at minute 0
    {
      name: 'follow-up-check',
      data: {},
      opts: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
      },
    },
  );

  // Reminder check: every 5 minutes
  await reminderQueue.upsertJobScheduler(
    'reminder-cron',
    { pattern: '*/5 * * * *' }, // every 5 minutes
    {
      name: 'reminder-check',
      data: {},
      opts: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
      },
    },
  );

  logger.info('[Workers] Cron schedules registered', {
    [FOLLOW_UP_QUEUE_NAME]: '0 * * * * (hourly)',
    [REMINDER_QUEUE_NAME]: '*/5 * * * * (every 5 min)',
  });

  // -------------------------------------------------------------------------
  // Graceful shutdown
  // -------------------------------------------------------------------------
  const shutdown = async () => {
    logger.info('[Workers] Shutting down workers…');

    await Promise.allSettled(workers.map((w) => w.close()));
    await Promise.allSettled([followUpQueue.close(), reminderQueue.close()]);
    await connection.quit();

    logger.info('[Workers] All workers shut down');
  };

  // Handle process signals
  const onSignal = async (signal: string) => {
    logger.info(`[Workers] ${signal} received`);
    await shutdown();
    process.exit(0);
  };

  process.on('SIGINT', () => onSignal('SIGINT'));
  process.on('SIGTERM', () => onSignal('SIGTERM'));

  return { workers, shutdown };
}

// ---------------------------------------------------------------------------
// Standalone entry point — run workers independently of the API server
// ---------------------------------------------------------------------------
if (require.main === module) {
  initWorkers()
    .then(() => logger.info('[Workers] Running in standalone mode'))
    .catch((err) => {
      logger.error('[Workers] Failed to start', { error: err });
      process.exit(1);
    });
}
