import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SalaryEstimateInput {
  // User inputs
  jobCategory: string;        // e.g. "Software Engineer"
  jobTitle: string;           // e.g. "Senior Frontend Engineer"
  company: string;            // e.g. "Google", "early-stage startup"
  location: string;           // searched location
  seniorityLevel: string;     // "entry" | "mid" | "senior"
  yearsOfExperience: number;
  extraContext?: string;       // competing offers, special skills, etc.

  // BLS data (from /api/estimate)
  matchedLocation: string;    // e.g. "San Francisco-Oakland-Fremont, CA"
  isFallback: boolean;
  wages: {
    annual: {
      p10: number | null;
      p25: number | null;
      median: number | null;
      p75: number | null;
      p90: number | null;
      mean: number | null;
    };
    seniorityAdjusted: {
      label: string;
      targetAnnual: number | null;
      rangeAnnual: { low: number | null; high: number | null };
    };
  };
  totalEmployment: number | null;
  dataSource: string;
}

export interface SalaryEstimateOutput {
  recommendedSalary: {
    point: number;           // single recommended number
    rangeLow: number;        // reasonable ask range low
    rangeHigh: number;       // reasonable ask range high
  };
  rationale: string;         // detailed explanation
  negotiationTips: string[]; // 2-3 specific, actionable tips
  confidenceLevel: "high" | "medium" | "low";
  confidenceReason: string;
}

/**
 * Formats a dollar amount as a readable string e.g. 145000 -> "$145,000"
 */
function fmt(n: number | null): string {
  if (n === null) return "not available";
  return `$${n.toLocaleString()}`;
}

/**
 * Builds the detailed prompt for Gemini.
 * Being very explicit about the task helps produce more accurate,
 * grounded responses rather than generic salary advice.
 */
function buildPrompt(input: SalaryEstimateInput): string {
  const { wages } = input;

  return `You are an expert compensation analyst and career coach specializing in helping women and nonbinary professionals in the tech industry negotiate fair salaries. Your goal is to give specific, data-backed, actionable salary guidance — not generic advice.

## TASK
Based on the Bureau of Labor Statistics wage data and the candidate's profile below, provide a specific salary recommendation with detailed rationale. The person will use this to walk into a salary negotiation feeling confident and informed.

## CANDIDATE PROFILE
- **Job Category (BLS):** ${input.jobCategory}
- **Specific Job Title:** ${input.jobTitle}
- **Company:** ${input.company}
- **Location:** ${input.location}
- **Seniority Level:** ${input.seniorityLevel}
- **Years of Relevant Experience:** ${input.yearsOfExperience}
${input.extraContext ? `- **Additional Context:** ${input.extraContext}` : ""}  (This may include relevant details from the job description such as required skills, tech stack, or specific responsibilities.)

## BLS WAGE DATA (${input.dataSource})
This data is from the U.S. Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS) survey for **${input.matchedLocation}**${input.isFallback ? " (national data used as fallback — local data unavailable)" : ""}.

Full wage distribution for ${input.jobCategory} in this area:
- 10th percentile: ${fmt(wages.annual.p10)}/year
- 25th percentile: ${fmt(wages.annual.p25)}/year
- Median (50th percentile): ${fmt(wages.annual.median)}/year
- 75th percentile: ${fmt(wages.annual.p75)}/year
- 90th percentile: ${fmt(wages.annual.p90)}/year
- Mean: ${fmt(wages.annual.mean)}/year
- Total employed in this role in this area: ${input.totalEmployment?.toLocaleString() ?? "unknown"}

Seniority-adjusted range for ${wages.seniorityAdjusted.label}:
- Target: ${fmt(wages.seniorityAdjusted.targetAnnual)}/year
- Expected range: ${fmt(wages.seniorityAdjusted.rangeAnnual.low)} – ${fmt(wages.seniorityAdjusted.rangeAnnual.high)}/year

## INSTRUCTIONS
Using the BLS data as your foundation, analyze the candidate's profile and provide a salary recommendation. Consider:

1. **BLS data as baseline** — The percentile data reflects actual market wages. Use this as your primary anchor, not general knowledge.
2. **Seniority and experience** — ${input.yearsOfExperience} years of experience at the ${input.seniorityLevel} level. Does their experience align with the seniority-adjusted range, or does it suggest they should be targeting higher or lower?
3. **Company context** — "${input.company}" — consider whether this is likely a large tech company (typically pays above median), startup (variable, often equity-heavy), nonprofit (typically below median), or other. Adjust your recommendation accordingly.
4. **Specific job title** — "${input.jobTitle}" may command a premium or discount vs. the general BLS category. Note any relevant differences.
5. **Location** — ${input.isFallback ? "Note that only national data was available for this location, so there is more uncertainty in this estimate." : `The data is local to ${input.matchedLocation}, which is a strong signal.`}
${input.extraContext ? `6. **Additional context** — Factor in: ${input.extraContext}. This may include job description details like required skills or tech stack that could affect compensation.` : ""}

## IMPORTANT GUIDANCE FOR YOUR RESPONSE
- Be specific. Give a real number, not a range as your headline recommendation.
- The "ask" range should be the range the candidate should use in negotiation — not the full BLS range.
- Acknowledge uncertainty honestly. If data is limited, say so.
- Write the rationale as if speaking directly to the candidate — warm, empowering, and professional.
- Negotiation tips should be specific to THIS candidate's situation, not generic advice.
- Do not recommend a salary below the BLS 25th percentile unless there is a very strong reason.

## RESPONSE FORMAT
Respond with valid JSON only. No markdown, no explanation outside the JSON. Use this exact structure:
{
  "recommendedSalary": {
    "point": <number, no commas or $>,
    "rangeLow": <number>,
    "rangeHigh": <number>
  },
  "rationale": "<1-3 concise paragraphs addressed directly to the candidate with data backed explanation>",
  "negotiationTips": [
    "<specific tip 1>",
    "<specific tip 2>",
    "<specific tip 3>"
  ],
  "confidenceLevel": "<high|medium|low>",
  "confidenceReason": "<one sentence explaining confidence level>"
}`;
}

/**
 * Calls Gemini to generate a salary estimate and rationale.
 */
export async function generateSalaryEstimate(
  input: SalaryEstimateInput
): Promise<SalaryEstimateOutput> {
  const prompt = buildPrompt(input);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 0.3,      // lower = more consistent, less creative
      maxOutputTokens: 2048,
    },
  });

  const text = response.text ?? "";

  // Strip markdown code fences if Gemini adds them despite instructions
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as SalaryEstimateOutput;
    return parsed;
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${text}`);
  }
}