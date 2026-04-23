import { NextResponse } from "next/server";
import { projectStore } from "@/lib/store";

export async function GET() {
  const projects = Array.from(projectStore.values()).sort(
    (a, b) => b.createdAt - a.createdAt
  );
  return NextResponse.json({ projects });
}
