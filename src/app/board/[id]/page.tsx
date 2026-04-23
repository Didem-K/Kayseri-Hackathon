"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Project, Task, TaskStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { completeTaskOnChain, releasePaymentOnChain } from "@/lib/contract";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "pending", label: "Pending", color: "border-slate-600" },
  { status: "assigned", label: "Assigned", color: "border-blue-600" },
  { status: "in_progress", label: "In Progress", color: "border-amber-600" },
  { status: "done", label: "Done", color: "border-emerald-600" },
  { status: "paid", label: "Paid", color: "border-violet-600" },
];

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/project/${id}`);
    const data = await res.json();
    setProject(data.project ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateTaskStatus = async (
    task: Task,
    newStatus: TaskStatus,
    chainAction?: () => Promise<void>
  ) => {
    setProcessing(task.id);
    try {
      if (chainAction) {
        try {
          await chainAction();
        } catch {
          // Wallet not connected — continue off-chain
        }
      }

      const res = await fetch(`/api/project/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, status: newStatus }),
      });
      const data = await res.json();
      setProject(data.project);
    } catch {
      alert("Failed to update task.");
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkInProgress = (task: Task) =>
    updateTaskStatus(task, "in_progress");

  const handleMarkDone = (task: Task) =>
    updateTaskStatus(
      task,
      "done",
      task.contractTaskId
        ? () => completeTaskOnChain(task.contractTaskId!)
        : undefined
    );

  const handleReleasePayment = (task: Task) =>
    updateTaskStatus(
      task,
      "paid",
      task.contractTaskId
        ? () => releasePaymentOnChain(task.contractTaskId!)
        : undefined
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-slate-400">Loading board...</div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">
              Home
            </Link>
            <span className="text-slate-600">/</span>
            <Link
              href={`/project/${project.id}`}
              className="text-slate-500 hover:text-slate-300 text-sm truncate max-w-40"
            >
              {project.title}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 text-sm">Board</span>
          </div>
          <h1 className="text-xl font-bold text-white">{project.title} — Task Board</h1>
        </div>
        <Link href={`/project/${project.id}`} className="btn-secondary text-sm">
          Project Details
        </Link>
      </div>

      {/* Legend */}
      <div className="text-xs text-slate-500 space-y-1">
        <p>
          <span className="text-blue-400 font-medium">Contributor</span>: can
          mark Assigned → In Progress → Done
        </p>
        <p>
          <span className="text-violet-400 font-medium">Owner</span>: can release
          payment on Done tasks (triggers smart contract)
        </p>
      </div>

      {/* Board columns (horizontal scroll on mobile) */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map((col) => {
            const colTasks = project.tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="w-64 flex-shrink-0">
                <div
                  className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${col.color}`}
                >
                  <span className="font-semibold text-white text-sm">{col.label}</span>
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.length === 0 && (
                    <div className="text-slate-600 text-xs text-center py-6 border border-dashed border-slate-700 rounded-lg">
                      No tasks
                    </div>
                  )}

                  {colTasks.map((task) => (
                    <div key={task.id} className="card space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-medium text-white leading-snug">
                          {task.title}
                        </h4>
                        {task.contractTaskId && (
                          <span className="text-xs text-violet-500 flex-shrink-0">
                            #{task.contractTaskId}
                          </span>
                        )}
                      </div>

                      {task.assigneeName && (
                        <p className="text-xs text-slate-400">
                          <span className="text-slate-500">by </span>
                          <span className="text-violet-400">{task.assigneeName}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {task.requiredSkills.slice(0, 3).map((s) => (
                          <span key={s} className="skill-tag text-xs">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="text-emerald-400 text-xs font-semibold">
                        {task.payment} ETH
                      </div>

                      {/* Action buttons */}
                      <div className="pt-1 space-y-1.5">
                        {task.status === "assigned" && (
                          <button
                            onClick={() => handleMarkInProgress(task)}
                            disabled={processing === task.id}
                            className="w-full text-xs bg-amber-700 hover:bg-amber-600 text-white rounded-lg py-1.5 px-2 transition-colors disabled:opacity-50"
                          >
                            {processing === task.id ? "..." : "Start Working"}
                          </button>
                        )}

                        {task.status === "in_progress" && (
                          <button
                            onClick={() => handleMarkDone(task)}
                            disabled={processing === task.id}
                            className="w-full text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg py-1.5 px-2 transition-colors disabled:opacity-50"
                          >
                            {processing === task.id ? "..." : "Mark as Done"}
                          </button>
                        )}

                        {task.status === "done" && (
                          <button
                            onClick={() => handleReleasePayment(task)}
                            disabled={processing === task.id}
                            className="w-full text-xs bg-violet-700 hover:bg-violet-600 text-white rounded-lg py-1.5 px-2 transition-colors disabled:opacity-50"
                          >
                            {processing === task.id
                              ? "Releasing..."
                              : "Release Payment"}
                          </button>
                        )}

                        {task.status === "paid" && (
                          <div className="w-full text-center text-xs text-violet-400 py-1">
                            Payment Released
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Payment Summary</h3>
        <div className="space-y-2">
          {project.tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-400 truncate flex-1">{task.title}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-slate-500 text-xs">{task.assigneeName ?? "—"}</span>
                <span className="text-emerald-400 font-medium w-20 text-right">
                  {task.payment} ETH
                </span>
                <StatusBadge status={task.status} />
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-sm font-semibold">
            <span className="text-slate-300">Total</span>
            <span className="text-emerald-400">
              {project.tasks.reduce((acc, t) => acc + t.payment, 0).toFixed(3)} ETH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
