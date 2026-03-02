import { cn } from "@/lib/utils";
import { TransactionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: TransactionStatus | 'LIVE';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    PENDING: "bg-red-500/10 text-red-400 border-red-500/20",
    AWAITING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    AWAITING_CONFIRMATION: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    PAYMENT_SUBMITTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    DECLINED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    LIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  const labels: Record<string, string> = {
    PENDING: "● Pending",
    AWAITING: "● Awaiting",
    AWAITING_CONFIRMATION: "● Awaiting Confirmation",
    PAYMENT_SUBMITTED: "● Payment Submitted",
    COMPLETED: "● Completed",
    DECLINED: "● Declined",
    LIVE: "● Live",
  };

  return (
    <span className={cn(
      "text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border",
      styles[status] || styles.PENDING,
      className
    )}>
      {labels[status] || status}
    </span>
  );
}
