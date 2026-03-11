import { Worker, Queue, Job } from 'bullmq';
import sgMail from '@sendgrid/mail';
import IORedis from 'ioredis';
import { logger } from '../config/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// ---------------------------------------------------------------------------
// Queue (importable by other modules to enqueue emails)
// ---------------------------------------------------------------------------
export const EMAIL_QUEUE_NAME = 'email';

export function createEmailQueue(connection: any) {
  return new Queue<EmailJobData>(EMAIL_QUEUE_NAME, { connection });
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------
export function createEmailWorker(connection: any): Worker<EmailJobData> {
  const fromDefault = process.env.SENDGRID_FROM_EMAIL || 'noreply@manufacturehub.io';
  const apiKey = process.env.SENDGRID_API_KEY || '';

  if (apiKey) {
    sgMail.setApiKey(apiKey);
  }

  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { to, subject, html, from } = job.data;

      logger.info(`[EmailWorker] Sending email to ${to}`, {
        jobId: job.id,
        subject,
      });

      if (!apiKey) {
        logger.warn('[EmailWorker] SENDGRID_API_KEY not set – skipping actual send');
        return { status: 'skipped', reason: 'no_api_key' };
      }

      const msg = {
        to,
        from: from || fromDefault,
        subject,
        html,
      };

      const [response] = await sgMail.send(msg);

      logger.info(`[EmailWorker] Email delivered to ${to}`, {
        jobId: job.id,
        statusCode: response.statusCode,
      });

      return { status: 'delivered', statusCode: response.statusCode };
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 100,
        duration: 60_000, // 100 emails per minute
      },
    },
  );

  worker.on('completed', (job) => {
    logger.info(`[EmailWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[EmailWorker] Job ${job?.id} failed`, {
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  return worker;
}
