import { Finding, HttpDiagnostics, LatScanReport, Severity, TlsDetails } from '../types/scan';

const VALID_SEVERITIES = new Set<Severity>(['info', 'low', 'medium', 'high', 'critical']);

function normalizeSeverity(val: unknown): Severity {
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim() as Severity;
    if (VALID_SEVERITIES.has(lower)) {
      return lower;
    }
  }
  return 'info';
}

function asString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : val == null ? fallback : String(val);
}

function asNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = Number(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.map((item) => asString(item)).filter((item) => item.length > 0);
}

function normalizeTls(raw: unknown): TlsDetails | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  return {
    enabled: Boolean(obj.enabled),
    version: asString(obj.version),
    cipher: asString(obj.cipher),
    subject: asString(obj.subject),
    issuer: asString(obj.issuer),
    san: asStringArray(obj.san),
    not_after: asString(obj.not_after),
    expired: Boolean(obj.expired),
    self_signed: Boolean(obj.self_signed),
    error: obj.error == null || obj.error === '' ? null : asString(obj.error),
  };
}

function normalizeHttp(raw: unknown): HttpDiagnostics | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const statusRaw = obj.status_code;
  const statusCode =
    typeof statusRaw === 'number' && Number.isFinite(statusRaw)
      ? statusRaw
      : typeof statusRaw === 'string' && statusRaw.trim() !== '' && Number.isFinite(Number(statusRaw))
        ? Number(statusRaw)
        : null;

  return {
    status_code: statusCode,
    title: asString(obj.title),
    server_header: asString(obj.server_header),
    missing_security_headers: asStringArray(obj.missing_security_headers),
    auth_required: Boolean(obj.auth_required),
  };
}

export function normalizeFinding(raw: unknown): Finding {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    ip: asString(obj.ip, '0.0.0.0'),
    port: asNumber(obj.port, 0),
    service: asString(obj.service, 'unknown'),
    product: asString(obj.product),
    version: asString(obj.version),
    banner: asString(obj.banner),
    severity: normalizeSeverity(obj.severity),
    indicator: asString(obj.indicator),
    tags: asStringArray(obj.tags),
    evidence: asStringArray(obj.evidence),
    tls: normalizeTls(obj.tls),
    http: normalizeHttp(obj.http),
  };
}

export interface ParseReportResult {
  ok: true;
  report: LatScanReport;
}

export interface ParseReportError {
  ok: false;
  error: string;
}

export function parseLatScanJson(rawInput: string | unknown): ParseReportResult | ParseReportError {
  let data: unknown = rawInput;

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return { ok: false, error: 'Input is empty. Paste or upload a valid JSON diagnostic report.' };
    }
    try {
      data = JSON.parse(trimmed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON syntax';
      return { ok: false, error: `JSON parse error: ${message}` };
    }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'Root JSON value must be an object matching the mini-latscan.py report schema.' };
  }

  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.findings)) {
    return { ok: false, error: 'Missing required "findings" array in the JSON report.' };
  }

  const findings: Finding[] = [];
  for (let i = 0; i < obj.findings.length; i++) {
    const item = obj.findings[i];
    if (!item || typeof item !== 'object') {
      return { ok: false, error: `Finding at index ${i} must be an object.` };
    }
    const rec = item as Record<string, unknown>;
    if (!rec.ip || rec.port === undefined) {
      return { ok: false, error: `Finding at index ${i} is missing required "ip" or "port" field.` };
    }
    findings.push(normalizeFinding(item));
  }

  const elapsed = asNumber(obj.elapsed_seconds, asNumber(obj.duration_seconds, 0));
  const duration = asNumber(obj.duration_seconds, elapsed);
  const generatedAt = asString(obj.generated_at, asString(obj.scan_time));
  const scanTime = asString(obj.scan_time, generatedAt);

  const report: LatScanReport = {
    tool: asString(obj.tool, 'mini-latscan.py'),
    version: asString(obj.version, 'unknown'),
    generated_at: generatedAt,
    scan_time: scanTime,
    target: asString(obj.target, asString(obj.subnet, 'unknown')),
    subnet: asString(obj.subnet, asString(obj.target, '')),
    hosts_scanned: asNumber(obj.hosts_scanned, 0),
    ports_scanned: asNumber(obj.ports_scanned, 0),
    elapsed_seconds: elapsed,
    duration_seconds: duration,
    interrupted: Boolean(obj.interrupted),
    note: asString(obj.note),
    findings,
    diff: obj.diff && typeof obj.diff === 'object' ? (obj.diff as LatScanReport['diff']) : null,
  };

  return { ok: true, report };
}
