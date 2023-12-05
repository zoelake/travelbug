
import OpenAI from "openai";
import rateLimit from "express-rate-limit";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  max: 20, // 20 requests per windowMs
  message: { error: "Too many requests, please try again tomorrow." }
});

export default async function handler(req, res) {
  limiter(req, res, async () => {
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: generatePrompt(req.body.idea) }],
        model: "gpt-3.5-turbo",
      });
      console.log(completion.choices[0]);
      res.status(200).json({ prompt: req.body.idea, result: completion.choices[0].message.content });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

function generatePrompt(idea) {
  const newIdea =
    idea[0].toUpperCase() + idea.slice(1).toLowerCase();
  return `Suggest a city based on keywords entered.

  Keywords: Rainy city with with both mountains and ocean. 
  City: Vancouver, British-Columbia, Canada 

  Keywords: Big city with a subway, lots of art/culture, and broadway shows.
  City: New York, New York, USA 

  Keywords: Romantic walks, renaissance art, pastries and baggettes, night clubs.
  City: Paris, Île-de-France, France 

  Keywords: Hot tropical beaches, sun-tanning, monkeys, ancient temples
  City: Denpasar, Bali, Indonesia 

  Keywords: ${newIdea}
  City: 
`;
}
