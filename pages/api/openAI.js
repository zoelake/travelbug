import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
  const completion = await openai.createCompletion("text-curie-001", {
    prompt: generatePrompt(req.body.idea),
    temperature: 0.7,
  });
  res.status(200).json({ prompt: req.body.idea, result: completion.data.choices[0].text });
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
