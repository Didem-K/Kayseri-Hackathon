export type TaskStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "done"
  | "paid";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  status: TaskStatus;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAddress?: string;
  payment: number; // ETH
  contractTaskId?: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  ownerAddress: string;
  tasks: Task[];
  totalBudget: number; // ETH
  createdAt: number;
}

export interface Contributor {
  id: string;
  name: string;
  address: string;
  skills: string[];
  reputation: number; // 0–100
  pricePerTask: number; // ETH
  completedTasks: number;
}

export interface MatchResult {
  contributor: Contributor;
  score: number; // 0–1
  reasoning: string;
}
