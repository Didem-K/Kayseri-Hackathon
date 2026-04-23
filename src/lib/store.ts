import { Project } from "@/types";

// In-memory store that survives Next.js hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __projectStore: Map<string, Project> | undefined;
}

export const projectStore: Map<string, Project> =
  global.__projectStore ?? new Map<string, Project>();

if (process.env.NODE_ENV !== "production") {
  global.__projectStore = projectStore;
}
