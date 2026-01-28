import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

let lastAlert = 0;

export default async function sendAlertOnce(subject, text) {
  const now = Date.now();

  // 30 min cooldown to avoid spam
  if (now - lastAlert < 1000 * 60 * 30) return;

  lastAlert = now;
  console.log('sending to:', process.env.ALERT_EMAIL_TO)

  try {
    const email = await resend.emails.send({
      from: "onboarding@resend.dev", // default email from resend
      to: process.env.ALERT_EMAIL_TO,
      subject,
      text,
    });
    console.log('email',email)
  } catch (e) {
    console.error("Alert email failed:", e);
  }
}