import { ArrowRight, Download, FileJson, FileText, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DiffResult, Finding, LatScanReport, Severity } from '../types/scan';
import { findingKey } from '../utils/diff';
import { exportReportAsJson, exportReportAsMarkdown } from '../utils/export';
import { FindingCard } from './FindingCard';
import { SummaryCards } from './SummaryCards';

interface DashboardViewProps {
  report: LatScanReport;
  baseline: LatScanReport | null;
  diff: DiffResult;
  onOpenDiffTab: () => void;
  onOpenLoaderTab: () => void;
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const SEVERITY_OPTIONS: Array<{ value: 'all' | Severity; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
];

export function DashboardView({
  report,
  baseline,
  diff,
  onOpenDiffTab,
  onOpenLoaderTab,
}: DashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'endpoint'>('severity');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const firstCritical = report.findings.find(
      (f) => f.severity === 'critical' || f.severity === 'high'
    );
    if (firstCritical) {
      initial.add(findingKey(firstCritical));
    }
    return initial;
  });

  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    for (const f of report.findings) {
      if (f.service) set.add(f.service);
    }
    return Array.from(set).sort();
  }, [report.findings]);

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    for (const f of report.findings) {
      for (const t of f.tags) {
        set.add(t);
      }
    }
    return Array.from(set).sort();
  }, [report.findings]);

  const severityCounts = useMemo(() => {
    const counts: Record<'all' | Severity, number> = {
      all: report.findings.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    for (const f of report.findings) {
      counts[f.severity]++;
    }
    return counts;
  }, [report.findings]);

  const diffLookup = useMemo(() => {
    const map = new Map<string, 'added' | 'changed'>();
    if (diff.source === 'none') return map;
    for (const item of diff.added) {
      map.set(findingKey(item), 'added');
    }
    for (const item of diff.changed) {
      map.set(item.key, 'changed');
    }
    return map;
  }, [diff]);

  const filteredFindings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = report.findings.filter((f: Finding) => {
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (serviceFilter !== 'all' && f.service !== serviceFilter) return false;
      if (tagFilter !== 'all' && !f.tags.includes(tagFilter)) return false;

      if (q) {
        const haystack = [
          `${f.ip}:${f.port}`,
          f.ip,
          String(f.port),
          f.service,
          f.product,
          f.version,
          f.indicator,
          f.banner,
          ...f.tags,
          ...f.evidence,
          f.http?.title ?? '',
          f.tls?.subject ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'severity') {
        const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
        if (rankDiff !== 0) return rankDiff;
      }
      const ipDiff = a.ip.localeCompare(b.ip, undefined, { numeric: true });
      if (ipDiff !== 0) return ipDiff;
      return a.port - b.port;
    });
  }, [report.findings, searchQuery, severityFilter, serviceFilter, tagFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    severityFilter !== 'all' ||
    serviceFilter !== 'all' ||
    tagFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSeverityFilter('all');
    setServiceFilter('all');
    setTagFilter('all');
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedKeys(new Set(filteredFindings.map((f) => findingKey(f))));
  };

  const collapseAll = () => {
    setExpandedKeys(new Set());
  };

  const allFilteredExpanded =
    filteredFindings.length > 0 &&
    filteredFindings.every((f) => expandedKeys.has(findingKey(f)));

  return (
    <div className="space-y-6">
      {/* Report Context & Export Bar */}
      <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-[#111827] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="text-base font-semibold text-slate-50">
              {report.target || report.subnet || 'Network Diagnostic Report'}
            </h1>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="font-mono text-xs text-slate-400">
              {report.tool} {report.version}
            </span>
            {report.interrupted && (
              <>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-medium text-amber-300">Interrupted</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>
              Generated:{' '}
              <span className="font-mono text-slate-300 tabular-nums">
                {report.generated_at || report.scan_time || 'Unknown'}
              </span>
            </span>
            {report.subnet && report.subnet !== report.target && (
              <>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span>
                  Subnet: <span className="font-mono text-slate-300">{report.subnet}</span>
                </span>
              </>
            )}
            {report.note && (
              <>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-300">{report.note}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => exportReportAsJson(report, diff)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <FileJson className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => exportReportAsMarkdown(report, diff)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <FileText className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>Export Markdown</span>
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <SummaryCards report={report} filteredCount={filteredFindings.length} />

      {/* Baseline Diff Summary Strip */}
      {diff.source !== 'none' && (
        <section
          aria-label="Baseline comparison summary"
          className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-[#111827] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <span className="font-semibold text-slate-200">
              {baseline
                ? `Baseline Diff (${baseline.generated_at || baseline.scan_time || 'Baseline'})`
                : 'Embedded Report Diff'}
            </span>
            <span className="font-mono text-emerald-300 tabular-nums">
              +{diff.added.length} Added
            </span>
            <span className="font-mono text-rose-300 tabular-nums">
              -{diff.removed.length} Removed
            </span>
            <span className="font-mono text-amber-300 tabular-nums">
              {diff.changed.length} Changed
            </span>
            <span className="font-mono text-slate-400 tabular-nums">
              {diff.unchangedCount} Unchanged
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenDiffTab}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
          >
            <span>Inspect Diff</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </section>
      )}

      {/* Search and Filter Controls */}
      <section aria-label="Filter findings" className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IP, port, service, product, banner, indicator, or evidence..."
              aria-label="Search findings"
              className="w-full rounded-lg border border-slate-800 bg-[#111827] py-2 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              aria-label="Filter by service"
              className="rounded-lg border border-slate-800 bg-[#111827] px-3 py-2 text-xs font-medium text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All Services ({uniqueServices.length})</option>
              {uniqueServices.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              aria-label="Filter by tag"
              className="rounded-lg border border-slate-800 bg-[#111827] px-3 py-2 text-xs font-medium text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All Tags ({uniqueTags.length})</option>
              {uniqueTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'severity' | 'endpoint')}
              aria-label="Sort findings"
              className="rounded-lg border border-slate-800 bg-[#111827] px-3 py-2 text-xs font-medium text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="severity">Sort: Severity</option>
              <option value="endpoint">Sort: IP &amp; Port</option>
            </select>

            {filteredFindings.length > 0 && (
              <button
                type="button"
                onClick={allFilteredExpanded ? collapseAll : expandAll}
                className="rounded-lg border border-slate-800 bg-[#111827] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 whitespace-nowrap shrink-0"
              >
                {allFilteredExpanded ? 'Collapse All' : 'Expand All'}
              </button>
            )}
          </div>
        </div>

        {/* Severity Segmented Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter by severity"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-[#111827] p-1"
          >
            {SEVERITY_OPTIONS.map((opt) => {
              const active = severityFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverityFilter(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-slate-800 text-slate-50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}{' '}
                  <span className="ml-1 font-mono text-[11px] text-slate-400 tabular-nums">
                    {severityCounts[opt.value]}
                  </span>
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 whitespace-nowrap shrink-0"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </section>

      {/* Findings List */}
      <section aria-label="Diagnostic findings list" className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-[#111827] px-6 py-12 text-center">
            <Download className="mx-auto h-6 w-6 text-slate-500" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-semibold text-slate-200">
              {report.findings.length === 0
                ? 'No open services recorded in this report'
                : 'No findings match the active filters'}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {report.findings.length === 0
                ? 'Upload or paste a different mini-latscan.py JSON report to inspect services.'
                : 'Adjust your search query or clear severity, service, and tag filters.'}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLoaderTab}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                >
                  Load Diagnostic Report
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const key = findingKey(finding);
            return (
              <FindingCard
                key={key}
                finding={finding}
                isExpanded={expandedKeys.has(key)}
                onToggle={() => toggleExpand(key)}
                diffBadge={diffLookup.get(key) ?? null}
                onSelectTag={(tag) => setTagFilter(tag)}
              />
            );
          })
        )}
      </section>
    </div>
  );
}
