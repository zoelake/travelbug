import OpenAI from "openai";
import { ratelimit } from "@/lib/ratelimit";

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

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  // standard-ish rate limit headers
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", reset);

  if (!success) {
    // optional: add retry-after (seconds until reset)
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((Number(reset) * 1000 - Date.now()) / 1000)
    );
    res.setHeader("Retry-After", retryAfterSeconds);

    return res.status(429).json({
      error: "Too many requests, please try again tomorrow.",
    });
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
      return res.status(401).json({ message: msg });
    }

    console.error("openAI route error:", error?.status, error?.code, msg);

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
