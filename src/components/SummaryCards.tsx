import { LatScanReport, Severity } from '../types/scan';

interface SummaryCardsProps {
  report: LatScanReport;
  filteredCount: number;
}

export function SummaryCards({ report, filteredCount }: SummaryCardsProps) {
  const duration = report.duration_seconds || report.elapsed_seconds || 0;
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const f of report.findings) {
    counts[f.severity]++;
  }

  const highRiskCount = counts.critical + counts.high;
  const uniqueHostsWithFindings = new Set(report.findings.map((f) => f.ip)).size;

  const cards = [
    {
      label: 'Open Services',
      value: report.findings.length.toLocaleString(),
      subtext:
        filteredCount !== report.findings.length
          ? `${filteredCount} matching active filters`
          : highRiskCount > 0
            ? `${highRiskCount} critical or high severity`
            : `${uniqueHostsWithFindings} active hosts responding`,
    },
    {
      label: 'Hosts Scanned',
      value: report.hosts_scanned.toLocaleString(),
      subtext: `${uniqueHostsWithFindings} hosts with open ports`,
    },
    {
      label: 'Ports Scanned',
      value: report.ports_scanned.toLocaleString(),
      subtext: report.subnet || report.target || 'Target scope',
    },
    {
      label: 'Duration',
      value: `${duration.toFixed(2)}s`,
      subtext: report.interrupted ? 'Scan interrupted early' : 'Completed cleanly',
    },
  ];

  return (
    <section aria-label="Scan summary metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-slate-800 bg-[#111827] px-5 py-4"
        >
          <p className="text-xs font-medium text-slate-400">{card.label}</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-slate-50 tabular-nums">
            {card.value}
          </p>
          <p className="mt-1 text-xs text-slate-400 truncate">{card.subtext}</p>
        </div>
      ))}
    </section>
  );
}
