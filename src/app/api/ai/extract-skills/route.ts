import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  if (!OPENAI_API_KEY) {
    const words = description.split(" ").slice(0, 3).map((w: string) => w.replace(/\W/g, ""));
    return NextResponse.json({ skills: ["TypeScript", "React", ...words].slice(0, 4) });
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
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "You extract technical skills from task descriptions. Respond ONLY with a JSON array of skill strings.",
          },
          {
            role: "user",
            content: `Extract 3-6 required technical skills from this task description:
"${description}"

Return ONLY a JSON array of skill strings, e.g. ["React", "TypeScript", "Node.js"]`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error("OpenAI API error");

    const data = await response.json();
    const skills = JSON.parse(data.choices[0].message.content.trim());

    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ skills: ["JavaScript", "TypeScript", "Node.js"] });
  }
}
