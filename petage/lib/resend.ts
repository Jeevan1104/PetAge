import "server-only";
import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "reminders@petage.app";

/**
 * Send a reminder email via Resend.
 * Returns true on success, false on failure (does not throw).
 */
export async function sendReminderEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: `PetAge <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Resend] Failed to send email:", error);
    return false;
  }
}
