import { NextRequest, NextResponse } from "next/server";
import { projectStore } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = projectStore.get(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = projectStore.get(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();
  const { taskId, status, assigneeId, assigneeName, assigneeAddress, contractTaskId } = body;

  const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const task = project.tasks[taskIndex];

  if (status) task.status = status;
  if (assigneeId !== undefined) task.assigneeId = assigneeId;
  if (assigneeName !== undefined) task.assigneeName = assigneeName;
  if (assigneeAddress !== undefined) task.assigneeAddress = assigneeAddress;
  if (contractTaskId !== undefined) task.contractTaskId = contractTaskId;

  project.tasks[taskIndex] = task;
  projectStore.set(id, project);

  return NextResponse.json({ project });
}
