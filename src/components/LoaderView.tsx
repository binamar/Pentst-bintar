import { AlertCircle, CheckCircle2, FileUp, RotateCcw, Trash2 } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { SAMPLE_BASELINE_REPORT, SAMPLE_CURRENT_REPORT } from '../data/sampleReports';
import { LatScanReport } from '../types/scan';
import { parseLatScanJson } from '../utils/parser';

interface LoaderViewProps {
  currentReport: LatScanReport;
  baselineReport: LatScanReport | null;
  onApplyReports: (current: LatScanReport, baseline: LatScanReport | null) => void;
}

export function LoaderView({
  currentReport,
  baselineReport,
  onApplyReports,
}: LoaderViewProps) {
  const [currentText, setCurrentText] = useState(() =>
    JSON.stringify(currentReport, null, 2)
  );
  const [baselineText, setBaselineText] = useState(() =>
    baselineReport ? JSON.stringify(baselineReport, null, 2) : ''
  );

  const [currentError, setCurrentError] = useState<string | null>(null);
  const [baselineError, setBaselineError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    target: 'current' | 'baseline'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      if (target === 'current') {
        setCurrentText(content);
        setCurrentError(null);
      } else {
        setBaselineText(content);
        setBaselineError(null);
      }
      setStatusMessage(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApply = () => {
    setCurrentError(null);
    setBaselineError(null);
    setStatusMessage(null);

    const parsedCurrent = parseLatScanJson(currentText);
    if (!parsedCurrent.ok) {
      setCurrentError(parsedCurrent.error);
      return;
    }

    let parsedBaselineReport: LatScanReport | null = null;
    if (baselineText.trim().length > 0) {
      const parsedBaseline = parseLatScanJson(baselineText);
      if (!parsedBaseline.ok) {
        setBaselineError(parsedBaseline.error);
        return;
      }
      parsedBaselineReport = parsedBaseline.report;
    }

    onApplyReports(parsedCurrent.report, parsedBaselineReport);
    setStatusMessage(
      `Loaded ${parsedCurrent.report.findings.length} findings${
        parsedBaselineReport
          ? ` and baseline (${parsedBaselineReport.findings.length} findings)`
          : ''
      }.`
    );
  };

  const handleRestoreSamples = () => {
    const cur = JSON.stringify(SAMPLE_CURRENT_REPORT, null, 2);
    const base = JSON.stringify(SAMPLE_BASELINE_REPORT, null, 2);
    setCurrentText(cur);
    setBaselineText(base);
    setCurrentError(null);
    setBaselineError(null);
    onApplyReports(SAMPLE_CURRENT_REPORT, SAMPLE_BASELINE_REPORT);
    setStatusMessage('Sample diagnostic report and baseline restored.');
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-[#111827] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-50">
            Report &amp; Baseline Diff Loader
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Upload `.json` files or paste raw JSON output from <span className="font-mono text-slate-300">mini-latscan.py</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRestoreSamples}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <span>Restore Sample Reports</span>
        </button>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Current Report Panel */}
        <section className="flex flex-col rounded-lg border border-slate-800 bg-[#111827] p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Current Report JSON
              </h2>
              <p className="text-xs text-slate-400">Required primary scan report</p>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0">
              <FileUp className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>Upload File</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => handleFileUpload(e, 'current')}
                className="sr-only"
              />
            </label>
          </div>

          <textarea
            value={currentText}
            onChange={(e) => {
              setCurrentText(e.target.value);
              setCurrentError(null);
            }}
            spellCheck={false}
            rows={16}
            aria-label="Current report JSON input"
            placeholder='{ "tool": "mini-latscan.py", "findings": [ ... ] }'
            className="w-full rounded-lg border border-slate-800 bg-[#0b0f17] p-3.5 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />

          {currentError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{currentError}</span>
            </div>
          )}
        </section>

        {/* Optional Baseline Report Panel */}
        <section className="flex flex-col rounded-lg border border-slate-800 bg-[#111827] p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Baseline Report JSON (Optional)
              </h2>
              <p className="text-xs text-slate-400">
                Computes Added, Removed, and Changed items by (ip, port)
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {baselineText.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setBaselineText('');
                    setBaselineError(null);
                  }}
                  title="Clear baseline JSON"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Clear</span>
                </button>
              )}

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0">
                <FileUp className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => handleFileUpload(e, 'baseline')}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <textarea
            value={baselineText}
            onChange={(e) => {
              setBaselineText(e.target.value);
              setBaselineError(null);
            }}
            spellCheck={false}
            rows={16}
            aria-label="Baseline report JSON input"
            placeholder="Optional: paste a prior mini-latscan.py JSON report to compare against..."
            className="w-full rounded-lg border border-slate-800 bg-[#0b0f17] p-3.5 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />

          {baselineError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{baselineError}</span>
            </div>
          )}
        </section>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-[#111827] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs">
          {statusMessage ? (
            <span className="inline-flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{statusMessage}</span>
            </span>
          ) : (
            <span className="text-slate-400">
              Reports are parsed and compared entirely in your browser.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleApply}
          className="rounded-lg bg-sky-500 px-5 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 whitespace-nowrap shrink-0"
        >
          Apply Reports to Dashboard
        </button>
      </div>
    </div>
  );
}
