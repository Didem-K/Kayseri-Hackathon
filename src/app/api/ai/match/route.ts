import { NextRequest, NextResponse } from "next/server";
import { mockContributors } from "@/lib/mockUsers";
import { MatchResult, Contributor } from "@/types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function fallbackScore(requiredSkills: string[], contributor: Contributor): MatchResult {
  const required = requiredSkills.map((s) => s.toLowerCase());
  const userSkills = contributor.skills.map((s) => s.toLowerCase());

  const skillMatches = required.filter((s) =>
    userSkills.some((us) => us.includes(s) || s.includes(us))
  ).length;

  const skillScore = required.length > 0 ? skillMatches / required.length : 0.5;
  const repScore = contributor.reputation / 100;

  // Penalize if price is too high (above 0.08 ETH)
  const priceScore = contributor.pricePerTask <= 0.08 ? 1 : 0.7;

  const score = Math.min(0.99, skillScore * 0.6 + repScore * 0.3 + priceScore * 0.1);

  return {
    contributor,
    score: Math.round(score * 100) / 100,
    reasoning: `${skillMatches}/${required.length} skill matches, reputation ${contributor.reputation}/100`,
  };
}

export async function POST(req: NextRequest) {
  const { taskTitle, requiredSkills } = await req.json();

  if (!requiredSkills || !Array.isArray(requiredSkills)) {
    return NextResponse.json({ error: "requiredSkills array is required" }, { status: 400 });
  }

  if (!OPENAI_API_KEY) {
    const results = mockContributors
      .map((c) => fallbackScore(requiredSkills, c))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return NextResponse.json({ matches: results });
  }

  try {
    const scoringPromises = mockContributors.map(async (contributor) => {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.2,
            messages: [
              {
                role: "system",
                content:
                  "You are a task-matching AI. Score contributors for tasks. Respond ONLY with valid JSON.",
              },
              {
                role: "user",
                content: `Score this contributor for the task. Return ONLY JSON.

Task: "${taskTitle}"
Required Skills: ${JSON.stringify(requiredSkills)}

Contributor:
- Skills: ${JSON.stringify(contributor.skills)}
- Reputation: ${contributor.reputation}/100
- Price: ${contributor.pricePerTask} ETH

Return: { "score": <number 0-1>, "reasoning": "<1 sentence>" }`,
              },
            ],
          }),
        });

        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content.trim());

        return {
          contributor,
          score: Math.min(0.99, Math.max(0, Number(result.score))),
          reasoning: String(result.reasoning),
        } as MatchResult;
      } catch {
        return fallbackScore(requiredSkills, contributor);
      }
    });

    const allResults = await Promise.all(scoringPromises);
    const top3 = allResults.sort((a, b) => b.score - a.score).slice(0, 3);

    return NextResponse.json({ matches: top3 });
  } catch {
    const results = mockContributors
      .map((c) => fallbackScore(requiredSkills, c))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return NextResponse.json({ matches: results });
  }
}
