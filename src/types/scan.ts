export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface TlsDetails {
  enabled: boolean;
  version: string;
  cipher: string;
  subject: string;
  issuer: string;
  san: string[];
  not_after: string;
  expired: boolean;
  self_signed: boolean;
  error: string | null;
}

export interface HttpDiagnostics {
  status_code: number | null;
  title: string;
  server_header: string;
  missing_security_headers: string[];
  auth_required: boolean;
}

export interface Finding {
  ip: string;
  port: number;
  service: string;
  product: string;
  version: string;
  banner: string;
  severity: Severity;
  indicator: string;
  tags: string[];
  evidence: string[];
  tls?: TlsDetails | null;
  http?: HttpDiagnostics | null;
}

export interface EmbeddedDiff {
  added?: Finding[];
  removed?: Finding[];
  changed?: Array<{
    ip?: string;
    port?: number;
    key?: string;
    before?: Partial<Finding>;
    after?: Partial<Finding>;
    baseline?: Partial<Finding>;
    current?: Partial<Finding>;
    changes?: FieldChange[];
    fields?: Record<string, { before: unknown; after: unknown }>;
  }>;
}

export interface LatScanReport {
  tool: string;
  version: string;
  generated_at: string;
  scan_time: string;
  target: string;
  subnet: string;
  hosts_scanned: number;
  ports_scanned: number;
  elapsed_seconds: number;
  duration_seconds: number;
  interrupted: boolean;
  note: string;
  findings: Finding[];
  diff?: EmbeddedDiff | null;
}

export type DiffField = 'service' | 'product' | 'version' | 'severity' | 'tags';

export interface FieldChange {
  field: DiffField;
  before: string | string[];
  after: string | string[];
}

export interface ChangedFinding {
  key: string;
  ip: string;
  port: number;
  baseline: Finding;
  current: Finding;
  changes: FieldChange[];
}

export interface DiffResult {
  source: 'computed' | 'embedded' | 'none';
  added: Finding[];
  removed: Finding[];
  changed: ChangedFinding[];
  unchangedCount: number;
}

export type ActiveTab = 'dashboard' | 'diff' | 'loader' | 'bridge';

export interface ScanBridgeRequest {
  target: string;
  ports: string;
  timeout: number;
  concurrency: number;
  rate: number;
  no_tls: boolean;
  no_http: boolean;
}
