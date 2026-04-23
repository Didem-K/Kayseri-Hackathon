import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const FALLBACK_TASKS = (description: string) => [
  {
    title: "Project Setup & Architecture",
    description: `Set up the foundational architecture for: ${description.slice(0, 60)}`,
    requiredSkills: ["TypeScript", "Node.js", "Architecture"],
    payment: 0.04,
  },
  {
    title: "Core Feature Implementation",
    description: "Implement the main business logic and core features of the project.",
    requiredSkills: ["React", "TypeScript", "REST API"],
    payment: 0.06,
  },
  {
    title: "Smart Contract Development",
    description: "Write and deploy Solidity smart contracts for on-chain interactions.",
    requiredSkills: ["Solidity", "Hardhat", "Web3.js"],
    payment: 0.07,
  },
  {
    title: "Frontend UI Development",
    description: "Build responsive and accessible user interface components.",
    requiredSkills: ["React", "TailwindCSS", "UI/UX"],
    payment: 0.04,
  },
  {
    title: "Testing & Deployment",
    description: "Write tests, fix bugs, and deploy the final application.",
    requiredSkills: ["Testing", "CI/CD", "Docker"],
    payment: 0.03,
  },
];

export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  if (!OPENAI_API_KEY) {
    return NextResponse.json({ tasks: FALLBACK_TASKS(description) });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are a project management AI. Respond ONLY with valid JSON, no markdown or extra text.",
          },
          {
            role: "user",
            content: `Break down this project into 4-6 concrete tasks suitable for freelancers.
Project: ${description}

Return a JSON array where each element has:
- title: string (short task name)
- description: string (1-2 sentences)
- requiredSkills: string[] (3-5 skills)
- payment: number (ETH, between 0.02 and 0.12 based on complexity)

Return ONLY the JSON array.`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error("OpenAI API error");

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const tasks = JSON.parse(content);

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ tasks: FALLBACK_TASKS(description) });
  }
}
