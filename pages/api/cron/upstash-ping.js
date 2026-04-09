import { redis } from "@/lib/ratelimit";
import sendAlertOnce from "@/lib/sendAlert";

export default async function handler(req, res) {
  console.log("cron upstash-ping fired", new Date().toISOString());

  // protect it so randoms can’t hit it
  const auth = req.headers.authorization || "";
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false });
  }

  try {
    const ts = new Date().toISOString();
    await redis.set("cron:keepalive", ts, { ex: 60 * 60 * 24 * 14 });
    return res.status(200).json({ ok: true, keepalive: ts });
  } catch (e) {
    await sendAlertOnce(
      "🚨 Travelbug – Upstash ping failure",
      `Upstash ping failed at ${new Date().toISOString()}\n\nError: ${e?.message ?? e}`
    );
      
  return res.status(503).json({ ok: false, error: e?.message ?? "ping failed" });  }
}