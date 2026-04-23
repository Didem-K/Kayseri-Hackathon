import { TaskStatus } from "@/types";

const CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-slate-700 text-slate-300 border-slate-600",
  },
  assigned: {
    label: "Assigned",
    className: "bg-blue-900/50 text-blue-300 border-blue-700",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-900/50 text-amber-300 border-amber-700",
  },
  done: {
    label: "Done",
    className: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  },
  paid: {
    label: "Paid",
    className: "bg-violet-900/50 text-violet-300 border-violet-700",
  },
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${className}`}>
      {label}
    </span>
  );
}
