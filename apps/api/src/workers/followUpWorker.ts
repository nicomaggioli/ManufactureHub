import { Worker, Queue, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../lib/prisma';
import { logger } from '../config/logger';
import { createEmailQueue, EmailJobData } from './emailWorker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------
export const FOLLOW_UP_QUEUE_NAME = 'follow-up';

export function createFollowUpQueue(connection: any) {
  return new Queue(FOLLOW_UP_QUEUE_NAME, { connection });
}

// ---------------------------------------------------------------------------
// Helper: Generate AI follow-up message
// ---------------------------------------------------------------------------
async function generateFollowUpMessage(
  conversationHistory: Array<{ direction: string; body: string; subject: string | null; sentAt: Date | null }>,
  manufacturerName: string,
  projectTitle: string,
): Promise<{ subject: string; body: string }> {
  // In production, this would call the Anthropic SDK.
  // For now we produce a deterministic but realistic template based on history.
  const lastSent = conversationHistory.find((c) => c.direction === 'sent');
  const originalSubject = lastSent?.subject || `Re: ${projectTitle} inquiry`;

  const body = [
    `Dear ${manufacturerName} team,`,
    '',
    `I hope this message finds you well. I wanted to follow up on our previous conversation regarding "${projectTitle}".`,
    '',
    lastSent
      ? `In my last message I mentioned: "${lastSent.body.substring(0, 120)}…" — I'd love to hear your thoughts.`
      : `We're very interested in exploring a potential partnership and would appreciate any updates you can share.`,
    '',
    'Looking forward to hearing from you at your earliest convenience.',
    '',
    'Best regards',
  ].join('\n');

  return {
    subject: `Follow-up: ${originalSubject}`,
    body,
  };
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------
export function createFollowUpWorker(connection: any): Worker {
  const emailQueue = createEmailQueue(connection);

  const worker = new Worker(
    FOLLOW_UP_QUEUE_NAME,
    async (_job: Job) => {
      logger.info('[FollowUpWorker] Running follow-up check');

      const now = new Date();

      // Find communications where follow-up is due and no response received
      const dueCommunications = await prisma.communication.findMany({
        where: {
          followUpDueAt: { lte: now },
          direction: 'sent',
          status: { in: ['sent', 'delivered'] },
        },
        include: {
          project: true,
          manufacturer: { include: { contacts: true } },
          contact: true,
        },
        orderBy: { followUpDueAt: 'asc' },
      });

      logger.info(`[FollowUpWorker] Found ${dueCommunications.length} communications due for follow-up`);

      let created = 0;

      for (const comm of dueCommunications) {
        // Check if a follow-up draft already exists for this communication
        const existingDraft = await prisma.communication.findFirst({
          where: {
            projectId: comm.projectId,
            manufacturerId: comm.manufacturerId,
            status: 'draft',
            direction: 'sent',
            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // within last 24h
          },
        });

        if (existingDraft) {
          logger.info(`[FollowUpWorker] Draft already exists for project=${comm.projectId}, manufacturer=${comm.manufacturerId} – skipping`);
          continue;
        }

        // Check for any received response after this communication
        const responseReceived = await prisma.communication.findFirst({
          where: {
            projectId: comm.projectId,
            manufacturerId: comm.manufacturerId,
            direction: 'received',
            createdAt: { gt: comm.createdAt },
          },
        });

        if (responseReceived) {
          // Clear the follow-up since we got a response
          await prisma.communication.update({
            where: { id: comm.id },
            data: { followUpDueAt: null },
          });
          logger.info(`[FollowUpWorker] Response already received for comm=${comm.id} – cleared followUpDueAt`);
          continue;
        }

        // Fetch conversation history for AI context
        const conversationHistory = await prisma.communication.findMany({
          where: {
            projectId: comm.projectId,
            manufacturerId: comm.manufacturerId,
          },
          select: {
            direction: true,
            body: true,
            subject: true,
            sentAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        // Generate follow-up content
        const followUp = await generateFollowUpMessage(
          conversationHistory,
          comm.manufacturer.name,
          comm.project.title,
        );

        // Create draft communication
        await prisma.communication.create({
          data: {
            projectId: comm.projectId,
            manufacturerId: comm.manufacturerId,
            contactId: comm.contactId,
            subject: followUp.subject,
            body: followUp.body,
            direction: 'sent',
            status: 'draft',
          },
        });

        // Clear the original follow-up date to prevent re-processing
        await prisma.communication.update({
          where: { id: comm.id },
          data: { followUpDueAt: null },
        });

        // Find the project owner to send notification email
        const projectOwner = await prisma.user.findFirst({
          where: { id: comm.project.userId },
        });

        if (projectOwner) {
          await emailQueue.add('follow-up-notification', {
            to: projectOwner.email,
            subject: `Follow-up draft ready: ${comm.manufacturer.name}`,
            html: [
              `<h2>Follow-up Draft Ready for Review</h2>`,
              `<p>A follow-up draft has been created for <strong>${escapeHtml(comm.manufacturer.name)}</strong> ` +
                `on project <strong>${escapeHtml(comm.project.title)}</strong>.</p>`,
              `<hr/>`,
              `<p><strong>Subject:</strong> ${followUp.subject}</p>`,
              `<p>${followUp.body.replace(/\n/g, '<br/>')}</p>`,
              `<hr/>`,
              `<p><a href="${process.env.APP_URL || 'http://localhost:3000'}/projects/${comm.projectId}">Review and Send</a></p>`,
            ].join('\n'),
          } satisfies EmailJobData, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5_000 },
          });
        }

        created++;
      }

      logger.info(`[FollowUpWorker] Created ${created} follow-up drafts`);
      return { processed: dueCommunications.length, draftsCreated: created };
    },
    { connection },
  );

  worker.on('completed', (job) => {
    logger.info(`[FollowUpWorker] Job ${job.id} completed`, { result: job.returnvalue });
  });

  worker.on('failed', (job, err) => {
    logger.error(`[FollowUpWorker] Job ${job?.id} failed`, { error: err.message });
  });

  return worker;
}
