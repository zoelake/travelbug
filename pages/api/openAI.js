import OpenAI from "openai";
import { ratelimit } from "@/lib/ratelimit";
import sendAlertOnce from "@/lib/sendAlert";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const ip = getClientIp(req);

  let rl = null;
  try {
    rl = await ratelimit.limit(ip);
  } catch (e) {
    console.error("ratelimit failed (Upstash unavailable). Blocking request.", e);

    await sendAlertOnce(
      "🚨 Travelbug – Rate limiter failure",
      `Upstash rate limit failed at ${new Date().toISOString()}\n\nError: ${e?.message ?? e}`
    );

    return res.status(503).json({
      message: "Service temporarily unavailable. Please try again tomorrow."
    });
  }

  if (rl) {
    const { success, limit, remaining, reset } = rl;

    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", reset);

    if (!success) {
      // reset is usually a unix timestamp in seconds
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(Number(reset) - Date.now() / 1000)
      );
      res.setHeader("Retry-After", retryAfterSeconds);

      return res.status(429).json({
        error: "Too many requests, please try again tomorrow.",
      });
    }
  }

  try {
    const idea = req.body?.idea;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: generatePrompt(idea) }],
    });

    return res.status(200).json({
      prompt: idea,
      result: completion.choices[0].message.content,
    });
  } catch (error) {
    const msg = error?.message || "";

    if (msg.includes("exceeded your current quota")) {
      await sendAlertOnce(
        "🚨 Travelbug – OpenAI quota failure",
        `Exceeded credits quota at ${new Date().toISOString()}\n\nError: ${msg}`
      );

      return res.status(401).json({ message: msg });
    }

    console.error("openAI route error:", error?.status, error?.code, msg);

    await sendAlertOnce(
      "🚨 Travelbug – Unknown OpenAI failure",
      `Something went wrong at ${new Date().toISOString()}\n\nStatus: ${
        error?.status ?? "unknown"
      }\nCode: ${error?.code ?? "unknown"}\nMessage: ${msg}`
    );

    return res.status(error?.status || 500).json({
      message: "Something went wrong. Please try again.",
    });
  }
}

function generatePrompt(idea) {
  const safe = typeof idea === "string" ? idea : "";
  const newIdea = safe ? safe[0].toUpperCase() + safe.slice(1).toLowerCase() : "";

  return `Suggest a city based on keywords entered.

    Important:
    - Reply with ONLY the city answer (e.g. "Paris, Île-de-France, France")
    - Do NOT include the label "City:" and do NOT add extra text.

    Keywords: Rainy city with with both mountains and ocean.
    Answer: Vancouver, British-Columbia, Canada

    Keywords: Big city with a subway, lots of art/culture, and broadway shows.
    Answer: New York, New York, USA

    Keywords: Romantic walks, renaissance art, pastries and baggettes, night clubs.
    Answer: Paris, Île-de-France, France

    Keywords: Hot tropical beaches, sun-tanning, monkeys, ancient temples
    Answer: Denpasar, Bali, Indonesia

    Keywords: ${newIdea}
    Answer:
  `;
}
