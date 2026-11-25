import { AlertTriangle, CheckCircle2, Play, Server, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { LatScanReport, ScanBridgeRequest } from '../types/scan';
import { parseLatScanJson } from '../utils/parser';

interface BridgeViewProps {
  onScanCompleted: (report: LatScanReport, keepCurrentAsBaseline: boolean) => void;
}

const PORT_PRESETS: Record<string, { label: string; value: string }> = {
  'top-100': {
    label: 'Top 100 Common Ports',
    value: 'top-100',
  },
  web: {
    label: 'Web & Proxy (80, 443, 3000, 8000, 8080, 8443)',
    value: '80,443,3000,8000,8080,8443',
  },
  infra: {
    label: 'Infrastructure & DB (22, 53, 443, 1883, 5432, 6379, 9100)',
    value: '22,53,443,1883,5432,6379,9100',
  },
  'top-1000': {
    label: 'Top 1000 Ports',
    value: 'top-1000',
  },
  custom: {
    label: 'Custom Port List / Range',
    value: '',
  },
};

export function BridgeView({ onScanCompleted }: BridgeViewProps) {
  const [endpointUrl, setEndpointUrl] = useState('http://127.0.0.1:8000');
  const [authorized, setAuthorized] = useState(false);

  const [target, setTarget] = useState('192.168.10.0/24');
  const [portsPreset, setPortsPreset] = useState<string>('top-100');
  const [customPorts, setCustomPorts] = useState('22,80,443,5432,6379,8080,8443');
  const [timeoutSec, setTimeoutSec] = useState('1.5');
  const [concurrency, setConcurrency] = useState('128');
  const [rateLimit, setRateLimit] = useState('0');
  const [noTls, setNoTls] = useState(false);
  const [noHttp, setNoHttp] = useState(false);
  const [keepAsBaseline, setKeepAsBaseline] = useState(true);

  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resolvedPorts =
    portsPreset === 'custom'
      ? customPorts.trim()
      : PORT_PRESETS[portsPreset]?.value || 'top-100';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authorized || isScanning) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanedBase = endpointUrl.trim().replace(/\/+$/, '');
    if (!cleanedBase) {
      setErrorMsg('Please provide a valid local bridge endpoint URL.');
      return;
    }

    if (!target.trim()) {
      setErrorMsg('Target CIDR or host is required.');
      return;
    }

    if (!resolvedPorts) {
      setErrorMsg('Please specify a port preset or custom port list.');
      return;
    }

    const payload: ScanBridgeRequest = {
      target: target.trim(),
      ports: resolvedPorts,
      timeout: Math.max(0.1, Number(timeoutSec) || 1.5),
      concurrency: Math.max(1, Math.round(Number(concurrency) || 128)),
      rate: Math.max(0, Number(rateLimit) || 0),
      no_tls: noTls,
      no_http: noHttp,
    };

    setIsScanning(true);
    const controller = new AbortController();
    const requestTimeout = window.setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${cleanedBase}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let serverDetail = '';
        try {
          const text = await response.text();
          serverDetail = text ? `: ${text.slice(0, 200)}` : '';
        } catch {
          // ignore body read error
        }
        throw new Error(`Bridge returned HTTP ${response.status}${serverDetail}`);
      }

      const json = await response.json();
      const parsed = parseLatScanJson(json);
      if (!parsed.ok) {
        throw new Error(`Invalid report schema from local bridge: ${parsed.error}`);
      }

      onScanCompleted(parsed.report, keepAsBaseline);
      setSuccessMsg(
        `Scan completed (${parsed.report.findings.length} open services) and loaded into the dashboard.`
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorMsg(
          'Request timed out after 30s waiting for the local scan bridge. Check if the scan is still running locally or narrow the port/CIDR scope.'
        );
      } else if (err instanceof TypeError) {
        setErrorMsg(
          `Unable to connect to ${cleanedBase}/scan. Ensure your local mini-latscan.py HTTP bridge is running on your machine with CORS enabled for browser requests.`
        );
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Unexpected local bridge error.');
      }
    } finally {
      window.clearTimeout(requestTimeout);
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-800 bg-[#111827] px-5 py-4">
        <div className="flex items-start gap-3">
          <Server className="mt-0.5 h-5 w-5 text-sky-400 shrink-0" aria-hidden="true" />
          <div>
            <h1 className="text-base font-semibold text-slate-50">
              Optional Local API Bridge Settings
            </h1>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Connect to a local <span className="font-mono text-slate-300">mini-latscan.py</span>{' '}
              HTTP wrapper running on your workstation to trigger authorized LAN scans and load the
              resulting JSON report directly into the dashboard.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-800 bg-[#111827] p-5 space-y-5"
        >
          <div className="space-y-1.5">
            <label htmlFor="bridge-url" className="block text-xs font-medium text-slate-300">
              Local Endpoint URL
            </label>
            <input
              id="bridge-url"
              type="url"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="http://127.0.0.1:8000"
              className="w-full rounded-lg border border-slate-800 bg-[#0b0f17] px-3.5 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <p className="text-xs text-slate-500">
              POST requests are sent to <span className="font-mono">{endpointUrl.replace(/\/+$/, '')}/scan</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="scan-target" className="block text-xs font-medium text-slate-300">
                Target CIDR / Host
              </label>
              <input
                id="scan-target"
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="192.168.10.0/24"
                className="w-full rounded-lg border border-slate-800 bg-[#0b0f17] px-3.5 py-2 font-mono text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ports-preset" className="block text-xs font-medium text-slate-300">
                Ports Preset
              </label>
              <select
                id="ports-preset"
                value={portsPreset}
                onChange={(e) => setPortsPreset(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0b0f17] px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {Object.entries(PORT_PRESETS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {portsPreset === 'custom' && (
            <div className="space-y-1.5">
              <label htmlFor="custom-ports" className="block text-xs font-medium text-slate-300">
                Custom Ports (comma-separated or ranges)
              </label>
              <input
                id="custom-ports"
                type="text"
                value={customPorts}
                onChange={(e) => setCustomPorts(e.target.value)}
                placeholder="22,80,443,5432,6379,8000-8100"
                className="w-full rounded-lg border border-slate-800 bg-[#0b0f17] px-3.5 py-2 font-mono text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="scan-timeout" className="block text-xs font-medium text-slate-300">
                Timeout (seconds)
              </label>
              <input
                id="scan-timeout"
                type="number"
                step="0.1"
                min="0.1"
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0b0f17] px-3.5 py-2 font-mono text-sm text-slate-100 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="scan-concurrency" className="block text-xs font-medium text-slate-300">
                Concurrency
              </label>
              <input
                id="scan-concurrency"
                type="number"
                min="1"
                max="2048"
                value={concurrency}
                onChange={(e) => setConcurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0b0f17] px-3.5 py-2 font-mono text-sm text-slate-100 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="scan-rate" className="block text-xs font-medium text-slate-300">
                Rate Limit (pps, 0 = off)
              </label>
              <input
                id="scan-rate"
                type="number"
                min="0"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0b0f17] px-3.5 py-2 font-mono text-sm text-slate-100 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={noTls}
                onChange={(e) => setNoTls(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-[#0b0f17] text-sky-500 focus:ring-sky-500"
              />
              <span>Skip TLS Inspection (<span className="font-mono">no_tls</span>)</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={noHttp}
                onChange={(e) => setNoHttp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-[#0b0f17] text-sky-500 focus:ring-sky-500"
              />
              <span>Skip HTTP Diagnostics (<span className="font-mono">no_http</span>)</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={keepAsBaseline}
                onChange={(e) => setKeepAsBaseline(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-[#0b0f17] text-sky-500 focus:ring-sky-500"
              />
              <span>Keep current report as baseline for diff</span>
            </label>
          </div>

          {/* Explicit Authorization Confirmation */}
          <div className="rounded-lg border border-slate-800 bg-[#0b0f17] p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={authorized}
                onChange={(e) => setAuthorized(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-[#111827] text-sky-500 focus:ring-sky-500 shrink-0"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                <strong className="font-semibold text-slate-100">
                  Explicit Authorization Confirmation:
                </strong>{' '}
                I confirm that I own or have explicit written authorization to perform active
                network diagnostics against <span className="font-mono text-sky-300">{target || 'the target network'}</span>.
              </span>
            </label>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-400 shrink-0" aria-hidden="true" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={!authorized || isScanning}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isScanning ? 'Running Local Scan...' : 'Send POST /scan'}</span>
            </button>
          </div>
        </form>

        {/* Request Payload Preview & Bridge Contract */}
        <aside className="rounded-lg border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <ShieldCheck className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>Bridge Request Payload</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The dashboard sends the JSON payload below via <span className="font-mono text-slate-300">POST /scan</span>{' '}
            and expects a valid <span className="font-mono text-slate-300">mini-latscan.py</span> report object in response.
          </p>

          <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0b0f17] p-3.5 font-mono text-xs text-slate-300">
            {JSON.stringify(
              {
                target: target.trim(),
                ports: resolvedPorts,
                timeout: Number(timeoutSec) || 1.5,
                concurrency: Math.round(Number(concurrency) || 128),
                rate: Number(rateLimit) || 0,
                no_tls: noTls,
                no_http: noHttp,
              },
              null,
              2
            )}
          </pre>

          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs text-slate-400">
            <p className="font-medium text-slate-300">Offline / Fallback Behavior</p>
            <p className="leading-relaxed">
              If no local server is listening on <span className="font-mono text-slate-300">{endpointUrl}</span>, the
              dashboard catches the connection failure cleanly without disrupting your loaded
              reports. You can still generate reports via CLI and import them in{' '}
              <span className="text-slate-200">Report Loader</span>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
