import { Configuration, OpenAIApi } from "openai";
import rateLimit from "express-rate-limit";

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  max: 20, // 20 requests per windowMs
  message: { error: "Too many requests, please try again tomorrow." }
});

export default function handler(req, res) {
  limiter(req, res, async () => {
    try {
      const completion = await openai.createCompletion("text-curie-001", {
        prompt: generatePrompt(req.body.idea),
        temperature: 0.7,
      });
      res.status(200).json({ prompt: req.body.idea, result: completion.data.choices[0].text });
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
