import { Task } from "@/types";
import StatusBadge from "./StatusBadge";

interface Props {
  task: Task;
  children?: React.ReactNode;
}

export default function TaskCard({ task, children }: Props) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white text-sm leading-snug">{task.title}</h3>
        <StatusBadge status={task.status} />
      </div>

      <p className="text-slate-400 text-sm leading-relaxed">{task.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {task.requiredSkills.map((skill) => (
          <span key={skill} className="skill-tag">
            {skill}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-emerald-400 text-sm font-semibold">
          {task.payment} ETH
        </span>
        {task.assigneeName && (
          <span className="text-slate-400 text-xs">
            Assigned to{" "}
            <span className="text-violet-400 font-medium">{task.assigneeName}</span>
          </span>
        )}
      </div>

      {children && <div className="pt-1 border-t border-slate-700">{children}</div>}
    </div>
  );
}
