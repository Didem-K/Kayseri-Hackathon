"use client";

import { MatchResult } from "@/types";

interface Props {
  matches: MatchResult[];
  onAssign: (match: MatchResult) => void;
  assigning: boolean;
}

export default function MatchedUsers({ matches, onAssign, assigning }: Props) {
  if (matches.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Top Matches
      </p>
      {matches.map((m, i) => (
        <div
          key={m.contributor.id}
          className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center gap-3"
        >
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold">
            {i + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-white truncate">
                {m.contributor.name}
              </span>
              <span className="text-xs text-slate-500">
                {m.contributor.pricePerTask} ETH
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-700 rounded-full h-1.5 max-w-24">
                <div
                  className="bg-violet-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${m.score * 100}%` }}
                />
              </div>
              <span className="text-xs text-violet-400 font-semibold">
                {Math.round(m.score * 100)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{m.reasoning}</p>
          </div>

          <button
            onClick={() => onAssign(m)}
            disabled={assigning}
            className="flex-shrink-0 btn-primary text-xs py-1 px-3"
          >
            Assign
          </button>
        </div>
      ))}
    </div>
  );
}
