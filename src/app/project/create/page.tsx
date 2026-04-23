"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@/types";

interface GeneratedTask {
  title: string;
  description: string;
  requiredSkills: string[];
  payment: number;
}

export default function CreateProjectPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("0.3");
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<"form" | "tasks">("form");

  const generateTasks = async () => {
    if (!description.trim()) return alert("Please enter a project description.");
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setStep("tasks");
    } catch {
      alert("AI breakdown failed. Please try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  const updateTask = (index: number, field: keyof GeneratedTask, value: string | number | string[]) => {
    setTasks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const createProject = async () => {
    if (!title.trim()) return alert("Please enter a project title.");
    if (tasks.length === 0) return alert("You need at least one task.");

    setCreating(true);
    const ownerAddress = localStorage.getItem("walletAddress") ?? "0x0000";

    try {
      const res = await fetch("/api/project/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          ownerAddress,
          tasks,
          totalBudget: parseFloat(budget) || 0,
        }),
      });
      const data = await res.json();
      if (data.project) {
        router.push(`/project/${data.project.id}`);
      } else {
        alert("Failed to create project.");
      }
    } catch {
      alert("Error creating project.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Create Project</h1>
        <p className="text-slate-400 text-sm">
          Describe your project and let AI generate the task breakdown.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 text-sm">
        <div
          className={`flex items-center gap-1.5 ${
            step === "form" ? "text-violet-400" : "text-slate-400"
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "form" ? "bg-violet-600" : "bg-slate-600"
            }`}
          >
            1
          </span>
          Project Info
        </div>
        <div className="flex-1 h-px bg-slate-700" />
        <div
          className={`flex items-center gap-1.5 ${
            step === "tasks" ? "text-violet-400" : "text-slate-400"
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "tasks" ? "bg-violet-600" : "bg-slate-600"
            }`}
          >
            2
          </span>
          Review Tasks
        </div>
      </div>

      {step === "form" && (
        <div className="card space-y-4">
          <div>
            <label className="label">Project Title</label>
            <input
              className="input"
              placeholder="e.g. DeFi Yield Aggregator"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Project Description</label>
            <textarea
              className="input min-h-28 resize-none"
              placeholder="Describe what you want to build. Be specific — this helps AI generate better tasks."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Total Budget (ETH)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.30"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <button
            onClick={generateTasks}
            disabled={loadingAI || !description.trim()}
            className="btn-primary w-full"
          >
            {loadingAI ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating Tasks with AI...
              </span>
            ) : (
              "Generate Tasks with AI"
            )}
          </button>
        </div>
      )}

      {step === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {tasks.length} Tasks Generated
            </h2>
            <button
              onClick={() => setStep("form")}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Edit Description
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((task, i) => (
              <div key={i} className="card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <input
                    className="input text-sm font-semibold"
                    value={task.title}
                    onChange={(e) => updateTask(i, "title", e.target.value)}
                  />
                  <button
                    onClick={() => removeTask(i)}
                    className="flex-shrink-0 text-slate-500 hover:text-red-400 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>

                <textarea
                  className="input text-sm resize-none"
                  rows={2}
                  value={task.description}
                  onChange={(e) => updateTask(i, "description", e.target.value)}
                />

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {task.requiredSkills.map((s) => (
                        <span key={s} className="skill-tag">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Payment (ETH)</p>
                    <input
                      className="input text-sm w-24"
                      type="number"
                      step="0.01"
                      min="0"
                      value={task.payment}
                      onChange={(e) => updateTask(i, "payment", parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={generateTasks}
              disabled={loadingAI}
              className="btn-secondary flex-1"
            >
              {loadingAI ? "Regenerating..." : "Regenerate"}
            </button>
            <button
              onClick={createProject}
              disabled={creating || tasks.length === 0}
              className="btn-primary flex-1"
            >
              {creating ? "Creating Project..." : "Create Project"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
