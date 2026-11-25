import { useMemo, useState } from 'react';
import { BridgeView } from './components/BridgeView';
import { DashboardView } from './components/DashboardView';
import { DiffView } from './components/DiffView';
import { LoaderView } from './components/LoaderView';
import { TopBar } from './components/TopBar';
import { SAMPLE_BASELINE_REPORT, SAMPLE_CURRENT_REPORT } from './data/sampleReports';
import { ActiveTab, LatScanReport } from './types/scan';
import { computeReportDiff } from './utils/diff';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentReport, setCurrentReport] = useState<LatScanReport>(SAMPLE_CURRENT_REPORT);
  const [baselineReport, setBaselineReport] = useState<LatScanReport | null>(
    SAMPLE_BASELINE_REPORT
  );

  const diff = useMemo(
    () => computeReportDiff(currentReport, baselineReport),
    [currentReport, baselineReport]
  );

  const handleApplyReports = (nextCurrent: LatScanReport, nextBaseline: LatScanReport | null) => {
    setCurrentReport(nextCurrent);
    setBaselineReport(nextBaseline);
    setActiveTab('dashboard');
  };

  const handleScanCompleted = (newReport: LatScanReport, keepCurrentAsBaseline: boolean) => {
    if (keepCurrentAsBaseline) {
      setBaselineReport(currentReport);
    }
    setCurrentReport(newReport);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenLoader={() => setActiveTab('loader')}
      />

      <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            report={currentReport}
            baseline={baselineReport}
            diff={diff}
            onOpenDiffTab={() => setActiveTab('diff')}
            onOpenLoaderTab={() => setActiveTab('loader')}
          />
        )}

        {activeTab === 'diff' && (
          <DiffView
            currentReport={currentReport}
            baselineReport={baselineReport}
            diff={diff}
            onOpenLoader={() => setActiveTab('loader')}
            onLoadSampleBaseline={() => setBaselineReport(SAMPLE_BASELINE_REPORT)}
            onClearBaseline={() => setBaselineReport(null)}
          />
        )}

        {activeTab === 'loader' && (
          <LoaderView
            key={`${currentReport.generated_at}-${baselineReport?.generated_at ?? 'none'}`}
            currentReport={currentReport}
            baselineReport={baselineReport}
            onApplyReports={handleApplyReports}
          />
        )}

        {activeTab === 'bridge' && (
          <BridgeView onScanCompleted={handleScanCompleted} />
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-4 px-4 sm:px-6">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>LatScan Diagnostic Viewer — client-side JSON report inspector for mini-latscan.py</span>
          <span>For authorized local network diagnostics only</span>
        </div>
      </footer>
    </div>
  );
}
