import sgMail from "@sendgrid/mail";
import { config } from "../config";

const SENDGRID_KEY = config.sendgrid.apiKey;
const EMAIL_FROM = config.sendgrid.fromEmail;

// Only initialize if we have a real key
const isEnabled =
  !!SENDGRID_KEY &&
  !SENDGRID_KEY.startsWith("SG.xxx") &&
  SENDGRID_KEY !== "placeholder";

if (isEnabled) {
  sgMail.setApiKey(SENDGRID_KEY);
}

export class EmailService {
  async sendEmail(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
  }): Promise<{ sent: boolean; messageId?: string }> {
    if (!isEnabled) {
      console.log(
        "[EmailService] SendGrid not configured, skipping email to:",
        params.to
      );
      return { sent: false };
    }

    try {
      const [response] = await sgMail.send({
        to: params.to,
        from: EMAIL_FROM,
        subject: params.subject,
        text: params.text,
        html: params.html || params.text,
        replyTo: params.replyTo,
      });

      console.log(
        "[EmailService] Email sent to:",
        params.to,
        "status:",
        response.statusCode
      );
      return {
        sent: true,
        messageId: response.headers["x-message-id"] as string,
      };
    } catch (error: any) {
      console.error(
        "[EmailService] Failed to send email:",
        error?.message || error
      );
      return { sent: false };
    }
  }

  async sendCommunication(params: {
    to: string;
    manufacturerName: string;
    subject: string;
    body: string;
    senderName?: string;
  }): Promise<{ sent: boolean; messageId?: string }> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #2e6fbf; padding-bottom: 16px; margin-bottom: 24px;">
          <strong style="color: #0f1d2e; font-size: 16px;">${params.senderName || "RAVI User"}</strong>
          <span style="color: #6b7280; font-size: 14px;"> via RAVI</span>
        </div>
        <div style="color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${params.body}</div>
        <div style="border-top: 1px solid #e0e4ea; margin-top: 32px; padding-top: 16px; color: #9ca3af; font-size: 12px;">
          Sent via <strong>RAVI</strong> — Manufacturing Management Platform
        </div>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject:
        params.subject || `Message from ${params.senderName || "RAVI User"}`,
      text: params.body,
      html,
    });
  }
}
