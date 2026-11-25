import { AlertOctagon, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Severity } from '../types/scan';

interface SeverityLabelProps {
  severity: Severity;
}

const SEVERITY_CONFIG: Record<
  Severity,
  {
    label: string;
    classes: string;
    Icon: typeof Info;
  }
> = {
  critical: {
    label: 'Critical',
    classes: 'border-rose-500/35 bg-rose-500/10 text-rose-300',
    Icon: AlertOctagon,
  },
  high: {
    label: 'High',
    classes: 'border-orange-500/35 bg-orange-500/10 text-orange-300',
    Icon: AlertTriangle,
  },
  medium: {
    label: 'Medium',
    classes: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
    Icon: ShieldAlert,
  },
  low: {
    label: 'Low',
    classes: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    Icon: Info,
  },
  info: {
    label: 'Info',
    classes: 'border-slate-700 bg-slate-800/70 text-slate-300',
    Icon: Info,
  },
};

export function SeverityLabel({ severity }: SeverityLabelProps) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;
  const Icon = cfg.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${cfg.classes}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
}
