import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  return { ms, days, hours, minutes };
}

export function Countdown({ to, label = "Departs in", className = "" }: { to: string; label?: string; className?: string }) {
  const target = new Date(to).getTime();
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 30_000);
    return () => clearInterval(id);
  }, [target]);

  if (t.ms <= 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ${className}`}>
        <Clock className="h-3.5 w-3.5" /> Departed
      </div>
    );
  }

  const parts =
    t.days > 0
      ? `${t.days}d ${t.hours}h`
      : t.hours > 0
        ? `${t.hours}h ${t.minutes}m`
        : `${t.minutes}m`;

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold text-primary ${className}`}>
      <Clock className="h-3.5 w-3.5" />
      {label} {parts}
    </div>
  );
}
