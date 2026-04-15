import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  resendInstance = new Resend(apiKey);
  return resendInstance;
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS || "LU3 Camp <camp@lu3camp.com>";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping email send.");
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo,
  });

  if (error) {
    console.error("[email] Failed to send:", error);
    return false;
  }

  return true;
}
