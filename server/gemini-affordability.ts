import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AffordabilityInput {
  salary: number;
  city: string;
  budget: {
    monthlyTakeHome: number;
    expenses: {
      rent: number;
      groceries: number;
      transport: number;
      utilities: number;
      healthcare: number;
      misc: number;
      total: number;
    };
    remaining: number;
    savingsRate: number;
    verdict: "comfortable" | "tight" | "difficult";
  };
  isEstimated: boolean;
}

export async function generateAffordabilityEstimate(input: AffordabilityInput): Promise<string> {
  const { salary, city, budget, isEstimated } = input;

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  const prompt = `You are a friendly, practical financial advisor helping professionals in tech understand whether a salary offer is livable in a specific city.

## SITUATION
- City: ${city}
- Annual salary: ${fmt(salary)}
- Estimated monthly take-home pay: ${fmt(budget.monthlyTakeHome)}
- Estimated monthly expenses:
  - Rent (1BR): ${fmt(budget.expenses.rent)}
  - Groceries: ${fmt(budget.expenses.groceries)}
  - Transportation: ${fmt(budget.expenses.transport)}
  - Utilities: ${fmt(budget.expenses.utilities)}
  - Healthcare: ${fmt(budget.expenses.healthcare)}
  - Miscellaneous: ${fmt(budget.expenses.misc)}
  - Total: ${fmt(budget.expenses.total)}
- Estimated monthly remaining: ${fmt(budget.remaining)}
- Estimated savings rate: ${budget.savingsRate}%
- Overall verdict: ${budget.verdict}
${isEstimated ? "- Note: exact cost data not available for this city, estimates based on national averages" : ""}

## INSTRUCTIONS
Write 1-2 short paragraphs of warm, honest, practical commentary on this situation. Include:
1. A plain-English summary of whether this salary works in this city
2. One or two specific practical observations (e.g. "rent will be your biggest challenge", "you'd have room to save", "dining out frequently would strain this budget")
3. One concrete suggestion if the situation is tight or difficult (e.g. having a roommate, negotiating higher, looking at nearby cheaper neighborhoods)

Be honest but encouraging. Do not be preachy. Do not repeat the numbers back verbatim — synthesize them into real advice. Keep it under 100 words total. Be concise.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { temperature: 0.4, maxOutputTokens: 2048 },
  });

  return response.text ?? "Unable to generate commentary.";
}
