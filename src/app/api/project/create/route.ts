import { NextRequest, NextResponse } from "next/server";
import { projectStore } from "@/lib/store";
import { Project, Task } from "@/types";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, ownerAddress, tasks, totalBudget } = body;

  if (!title || !description || !tasks || !Array.isArray(tasks)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const projectId = randomUUID();

  const projectTasks: Task[] = tasks.map((t: Omit<Task, "id" | "projectId" | "status">) => ({
    id: randomUUID(),
    projectId,
    title: t.title,
    description: t.description,
    requiredSkills: t.requiredSkills ?? [],
    status: "pending",
    payment: t.payment ?? 0.05,
  }));

  const project: Project = {
    id: projectId,
    title,
    description,
    ownerAddress: ownerAddress ?? "0x0000",
    tasks: projectTasks,
    totalBudget: totalBudget ?? 0,
    createdAt: Date.now(),
  };

  projectStore.set(projectId, project);

  return NextResponse.json({ project });
}
