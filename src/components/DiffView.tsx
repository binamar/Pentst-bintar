import { ArrowRight, GitCompare, MinusCircle, PlusCircle, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ChangedFinding, DiffResult, LatScanReport } from '../types/scan';
import { findingKey } from '../utils/diff';
import { FindingCard } from './FindingCard';
import { SeverityLabel } from './SeverityLabel';

interface DiffViewProps {
  currentReport: LatScanReport;
  baselineReport: LatScanReport | null;
  diff: DiffResult;
  onOpenLoader: () => void;
  onLoadSampleBaseline: () => void;
  onClearBaseline: () => void;
}

type DiffFilter = 'all' | 'added' | 'removed' | 'changed';

function formatFieldValue(val: string | string[]): string {
  if (Array.isArray(val)) {
    return val.length > 0 ? val.join(', ') : '(none)';
  }
  return val || '(empty)';
}

export function DiffView({
  currentReport,
  baselineReport,
  diff,
  onOpenLoader,
  onLoadSampleBaseline,
  onClearBaseline,
}: DiffViewProps) {
  const [filter, setFilter] = useState<DiffFilter>('all');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalChanges = useMemo(
    () => diff.added.length + diff.removed.length + diff.changed.length,
    [diff]
  );

  if (diff.source === 'none') {
    return (
      <section className="rounded-lg border border-slate-800 bg-[#111827] px-6 py-14 text-center">
        <GitCompare className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
        <h1 className="mt-3 text-base font-semibold text-slate-100">
          No Baseline Report Loaded
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-400">
          Upload or paste a baseline JSON report to compare Added, Removed, and Changed services
          by endpoint (ip, port) and metadata fields.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onOpenLoader}
            className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
          >
            Upload Baseline JSON
          </button>
          <button
            type="button"
            onClick={onLoadSampleBaseline}
            className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            Load Sample Baseline
          </button>
        </div>
      </section>
    );
  }

  const showAdded = filter === 'all' || filter === 'added';
  const showRemoved = filter === 'all' || filter === 'removed';
  const showChanged = filter === 'all' || filter === 'changed';

  return (
    <div className="space-y-6">
      {/* Header & Baseline Metadata */}
      <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-[#111827] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-slate-50">
            Baseline Comparison
          </h1>
          <p className="text-xs text-slate-400">
            Comparing{' '}
            <span className="font-mono text-slate-200">
              {currentReport.generated_at || currentReport.scan_time || 'Current Scan'}
            </span>{' '}
            against{' '}
            <span className="font-mono text-slate-200">
              {baselineReport
                ? baselineReport.generated_at || baselineReport.scan_time || 'Baseline Scan'
                : 'Embedded Report Diff'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenLoader}
            className="rounded-lg border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            Change Baseline
          </button>
          {baselineReport && (
            <button
              type="button"
              onClick={onClearBaseline}
              className="rounded-lg border border-slate-800 bg-transparent px-3.5 py-2 text-xs font-medium text-slate-400 hover:border-slate-700 hover:text-slate-200 whitespace-nowrap shrink-0"
            >
              Clear Baseline
            </button>
          )}
        </div>
      </section>

      {/* Diff Counters */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-[#111827] px-5 py-4">
          <p className="text-xs font-medium text-emerald-300">Added Services</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-50 tabular-nums">
            {diff.added.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">New (ip, port) endpoints</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#111827] px-5 py-4">
          <p className="text-xs font-medium text-rose-300">Removed Services</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-50 tabular-nums">
            {diff.removed.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">No longer open in current scan</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#111827] px-5 py-4">
          <p className="text-xs font-medium text-amber-300">Changed Services</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-50 tabular-nums">
            {diff.changed.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Service, version, severity, or tags</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#111827] px-5 py-4">
          <p className="text-xs font-medium text-slate-400">Unchanged</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-50 tabular-nums">
            {diff.unchangedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Identical across tracked fields</p>
        </div>
      </section>

      {/* Diff Filter Tabs */}
      <div
        role="group"
        aria-label="Filter diff categories"
        className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-[#111827] p-1"
      >
        {(
          [
            { id: 'all', label: 'All Changes', count: totalChanges },
            { id: 'added', label: 'Added', count: diff.added.length },
            { id: 'removed', label: 'Removed', count: diff.removed.length },
            { id: 'changed', label: 'Changed', count: diff.changed.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              filter === tab.id
                ? 'bg-slate-800 text-slate-50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}{' '}
            <span className="ml-1 font-mono text-[11px] text-slate-400 tabular-nums">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {totalChanges === 0 && (
        <div className="rounded-lg border border-slate-800 bg-[#111827] px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-200">
            No differences detected between the current report and baseline.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            All {diff.unchangedCount} services match across (ip, port), service, product, version,
            severity, and tags.
          </p>
        </div>
      )}

      {/* Changed Section */}
      {showChanged && diff.changed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <h2>Changed Services ({diff.changed.length})</h2>
          </div>

          <div className="space-y-3">
            {diff.changed.map((entry: ChangedFinding) => {
              const expKey = `changed:${entry.key}`;
              const isExpanded = expandedKeys.has(expKey);
              return (
                <div
                  key={entry.key}
                  className="rounded-lg border border-slate-800 bg-[#111827] overflow-hidden"
                >
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-sm font-semibold text-slate-50 tabular-nums">
                        {entry.ip}:{entry.port}
                      </span>
                      <span className="text-slate-600" aria-hidden="true">
                        /
                      </span>
                      <span className="text-sm text-sky-300">{entry.current.service}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <SeverityLabel severity={entry.current.severity} />
                      <button
                        type="button"
                        onClick={() => toggleKey(expKey)}
                        className="text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap"
                      >
                        {isExpanded ? 'Hide Details' : 'Full Finding'}
                      </button>
                    </div>
                  </div>

                  <div className="px-5 py-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800/70 text-slate-400">
                          <th className="py-2 pr-4 font-medium w-28">Field</th>
                          <th className="py-2 pr-4 font-medium">Baseline</th>
                          <th className="py-2 pr-2 font-medium w-6" aria-hidden="true" />
                          <th className="py-2 font-medium">Current</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {entry.changes.map((ch) => (
                          <tr key={ch.field}>
                            <td className="py-2 pr-4 font-mono font-medium text-slate-300">
                              {ch.field}
                            </td>
                            <td className="py-2 pr-4 font-mono text-rose-300/90 break-all">
                              {formatFieldValue(ch.before)}
                            </td>
                            <td className="py-2 pr-2 text-slate-500">
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </td>
                            <td className="py-2 font-mono text-emerald-300 break-all">
                              {formatFieldValue(ch.after)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-[#0d131f] p-4">
                      <FindingCard
                        finding={entry.current}
                        isExpanded={true}
                        onToggle={() => toggleKey(expKey)}
                        diffBadge="changed"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Added Section */}
      {showAdded && diff.added.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <h2>Added Services ({diff.added.length})</h2>
          </div>

          <div className="space-y-3">
            {diff.added.map((f) => {
              const key = `added:${findingKey(f)}`;
              return (
                <FindingCard
                  key={key}
                  finding={f}
                  isExpanded={expandedKeys.has(key)}
                  onToggle={() => toggleKey(key)}
                  diffBadge="added"
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Removed Section */}
      {showRemoved && diff.removed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-300">
            <MinusCircle className="h-4 w-4" aria-hidden="true" />
            <h2>Removed Services ({diff.removed.length})</h2>
          </div>

          <div className="space-y-3 opacity-90">
            {diff.removed.map((f) => {
              const key = `removed:${findingKey(f)}`;
              return (
                <FindingCard
                  key={key}
                  finding={f}
                  isExpanded={expandedKeys.has(key)}
                  onToggle={() => toggleKey(key)}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
