"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Project, Task, MatchResult } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import MatchedUsers from "@/components/MatchedUsers";
import {
  depositTask as contractDepositTask,
  assignTaskOnChain,
} from "@/lib/contract";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchingTask, setMatchingTask] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, MatchResult[]>>({});
  const [assigning, setAssigning] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/project/${id}`);
    const data = await res.json();
    setProject(data.project ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const findMatches = async (task: Task) => {
    setMatchingTask(task.id);
    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title,
          requiredSkills: task.requiredSkills,
        }),
      });
      const data = await res.json();
      setMatches((prev) => ({ ...prev, [task.id]: data.matches ?? [] }));
    } catch {
      alert("Match scoring failed.");
    } finally {
      setMatchingTask(null);
    }
  };

  const assignUser = async (task: Task, match: MatchResult) => {
    setAssigning(task.id);

    let contractTaskId: number | undefined;

    // Try blockchain deposit (optional — gracefully skip if wallet not connected)
    try {
      contractTaskId = await contractDepositTask(task.payment);
      if (contractTaskId && contractTaskId > 0) {
        await assignTaskOnChain(contractTaskId, match.contributor.address);
      }
    } catch {
      // Wallet not connected or contract not deployed — continue with off-chain only
    }

    try {
      const res = await fetch(`/api/project/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          status: "assigned",
          assigneeId: match.contributor.id,
          assigneeName: match.contributor.name,
          assigneeAddress: match.contributor.address,
          ...(contractTaskId ? { contractTaskId } : {}),
        }),
      });
      const data = await res.json();
      setProject(data.project);
      setMatches((prev) => {
        const updated = { ...prev };
        delete updated[task.id];
        return updated;
      });
    } catch {
      alert("Failed to assign task.");
    } finally {
      setAssigning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-slate-400">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 mb-4">Project not found.</p>
        <Link href="/" className="btn-primary">
          Go Home
        </Link>
      </div>
    );
  }

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter(
    (t) => t.status === "done" || t.status === "paid"
  ).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">
              Home
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 text-sm truncate">{project.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{project.title}</h1>
          <p className="text-slate-400 mt-1 max-w-xl">{project.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/board/${project.id}`} className="btn-secondary text-sm">
            Task Board
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{totalTasks}</p>
          <p className="text-slate-400 text-sm">Total Tasks</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-400">{doneTasks}</p>
          <p className="text-slate-400 text-sm">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-violet-400">{project.totalBudget} ETH</p>
          <p className="text-slate-400 text-sm">Total Budget</p>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Project Progress</span>
          <span className="text-sm font-semibold text-violet-400">{progress}%</span>
        </div>
        <div className="bg-slate-700 rounded-full h-2">
          <div
            className="bg-violet-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tasks */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">
          Tasks ({totalTasks})
        </h2>

        <div className="space-y-4">
          {project.tasks.map((task) => (
            <div key={task.id} className="card space-y-3">
              {/* Task header */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white">{task.title}</h3>
                <StatusBadge status={task.status} />
              </div>

              <p className="text-slate-400 text-sm">{task.description}</p>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5">
                {task.requiredSkills.map((s) => (
                  <span key={s} className="skill-tag">
                    {s}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 text-sm font-semibold">
                  {task.payment} ETH
                </span>
                {task.assigneeName && (
                  <span className="text-slate-400 text-xs">
                    Assigned to{" "}
                    <span className="text-violet-400 font-medium">
                      {task.assigneeName}
                    </span>
                  </span>
                )}
              </div>

              {/* Match section (only for unassigned tasks) */}
              {task.status === "pending" && (
                <div className="pt-2 border-t border-slate-700">
                  {!matches[task.id] ? (
                    <button
                      onClick={() => findMatches(task)}
                      disabled={matchingTask === task.id}
                      className="btn-primary w-full text-sm"
                    >
                      {matchingTask === task.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          AI Matching...
                        </span>
                      ) : (
                        "Find Best Matches"
                      )}
                    </button>
                  ) : (
                    <MatchedUsers
                      matches={matches[task.id]}
                      onAssign={(m) => assignUser(task, m)}
                      assigning={assigning === task.id}
                    />
                  )}
                </div>
              )}

              {/* Assigned info */}
              {task.status === "assigned" && (
                <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-slate-400">
                      Waiting for{" "}
                      <span className="text-blue-400">{task.assigneeName}</span> to start
                    </span>
                  </div>
                  <Link
                    href={`/board/${project.id}`}
                    className="text-xs text-violet-400 hover:underline"
                  >
                    View Board
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
