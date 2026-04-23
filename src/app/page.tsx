"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project } from "@/types";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const taskStats = (p: Project) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === "done" || t.status === "paid").length;
    return { total, done };
  };

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <div className="inline-flex items-center gap-2 bg-violet-900/30 border border-violet-700/50 rounded-full px-4 py-1.5 text-violet-300 text-sm">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></span>
          AI + Blockchain Task Matching
        </div>

        <h1 className="text-5xl font-bold text-white leading-tight">
          Match Work. <span className="text-violet-400">Get Paid.</span>
          <br />
          <span className="text-slate-400">On-Chain.</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Create a project, let AI break it into tasks, match the best contributors
          automatically, and release payments via smart contract.
        </p>

        <div className="flex justify-center gap-4 pt-2">
          <Link href="/project/create" className="btn-primary text-base px-6 py-3">
            Create Project
          </Link>
          <a
            href="#how-it-works"
            className="btn-secondary text-base px-6 py-3"
          >
            How It Works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works">
        <h2 className="text-xl font-bold text-white mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              title: "Create Project",
              desc: "Describe your project. AI breaks it into concrete tasks with required skills.",
              icon: "📋",
            },
            {
              step: "02",
              title: "AI Matches Contributors",
              desc: "Our AI scores each contributor based on skills, reputation and price.",
              icon: "🤖",
            },
            {
              step: "03",
              title: "Pay On-Chain",
              desc: "Funds are locked in a smart contract and released automatically on completion.",
              icon: "⛓️",
            },
          ].map((item) => (
            <div key={item.step} className="card text-center space-y-3">
              <div className="text-3xl">{item.icon}</div>
              <div className="text-violet-400 text-xs font-bold tracking-widest">
                STEP {item.step}
              </div>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="text-slate-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Projects</h2>
          <Link href="/project/create" className="btn-primary text-sm py-1.5 px-3">
            + New Project
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12 space-y-3">
            <p className="text-slate-400">No projects yet.</p>
            <Link href="/project/create" className="btn-primary text-sm inline-block">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const { total, done } = taskStats(p);
              return (
                <Link
                  key={p.id}
                  href={`/project/${p.id}`}
                  className="card hover:border-violet-600 transition-colors group block"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                      {p.title}
                    </h3>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-3">{p.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {done}/{total} tasks done
                    </span>
                    <span className="text-emerald-400 font-medium">
                      {p.totalBudget} ETH
                    </span>
                  </div>
                  <div className="mt-2 bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-violet-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
