import { DiffResult, Finding, LatScanReport, Severity } from '../types/scan';

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function safeTimestampSlug(report: LatScanReport): string {
  const raw = report.generated_at || report.scan_time || new Date().toISOString();
  return raw.replace(/[:.]/g, '-').slice(0, 19);
}

export function exportReportAsJson(report: LatScanReport, diff: DiffResult) {
  const payload: LatScanReport = {
    ...report,
    ...(diff.source !== 'none'
      ? {
          diff: {
            added: diff.added,
            removed: diff.removed,
            changed: diff.changed.map((c) => ({
              ip: c.ip,
              port: c.port,
              baseline: c.baseline,
              current: c.current,
              changes: c.changes,
            })),
          },
        }
      : {}),
  };

  const filename = `latscan-report-${safeTimestampSlug(report)}.json`;
  triggerDownload(filename, JSON.stringify(payload, null, 2), 'application/json');
}

function formatFindingMarkdown(f: Finding): string {
  const lines: string[] = [];
  const productVer = [f.product, f.version].filter(Boolean).join(' ');
  lines.push(`### ${f.ip}:${f.port} — ${f.service || 'unknown'}${productVer ? ` (${productVer})` : ''}`);
  lines.push('');
  lines.push(`- **Severity:** ${f.severity.toUpperCase()}`);
  if (f.indicator) lines.push(`- **Indicator:** ${f.indicator}`);
  if (f.tags.length > 0) lines.push(`- **Tags:** ${f.tags.map((t) => `\`${t}\``).join(', ')}`);
  if (f.banner) {
    lines.push(`- **Banner:** \`${f.banner}\``);
  }

  if (f.tls && f.tls.enabled) {
    lines.push('- **TLS Details:**');
    lines.push(`  - Version / Cipher: ${f.tls.version || 'N/A'} / ${f.tls.cipher || 'N/A'}`);
    if (f.tls.subject) lines.push(`  - Subject: \`${f.tls.subject}\``);
    if (f.tls.issuer) lines.push(`  - Issuer: \`${f.tls.issuer}\``);
    if (f.tls.san.length > 0) lines.push(`  - SANs: ${f.tls.san.map((s) => `\`${s}\``).join(', ')}`);
    if (f.tls.not_after) lines.push(`  - Expires: ${f.tls.not_after}`);
    lines.push(`  - Flags: Expired=${f.tls.expired ? 'yes' : 'no'}, Self-Signed=${f.tls.self_signed ? 'yes' : 'no'}`);
    if (f.tls.error) lines.push(`  - TLS Error: ${f.tls.error}`);
  }

  if (f.http) {
    lines.push('- **HTTP Diagnostics:**');
    if (f.http.status_code !== null) lines.push(`  - Status Code: ${f.http.status_code}`);
    if (f.http.title) lines.push(`  - Page Title: ${f.http.title}`);
    if (f.http.server_header) lines.push(`  - Server Header: \`${f.http.server_header}\``);
    lines.push(`  - Auth Required: ${f.http.auth_required ? 'Yes' : 'No'}`);
    if (f.http.missing_security_headers.length > 0) {
      lines.push(
        `  - Missing Security Headers: ${f.http.missing_security_headers.map((h) => `\`${h}\``).join(', ')}`
      );
    }
  }

  if (f.evidence.length > 0) {
    lines.push('- **Evidence:**');
    for (const item of f.evidence) {
      lines.push(`  - ${item}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

export function exportReportAsMarkdown(report: LatScanReport, diff: DiffResult) {
  const sortedFindings = [...report.findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.ip.localeCompare(b.ip) || a.port - b.port
  );

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

  const lines: string[] = [
    `# Network Diagnostic Report — ${report.target || report.subnet || 'Local Scan'}`,
    '',
    '## Scan Metadata',
    '',
    `| Field | Value |`,
    `| --- | --- |`,
    `| Tool | ${report.tool} (${report.version}) |`,
    `| Target / Subnet | ${report.target}${report.subnet && report.subnet !== report.target ? ` (${report.subnet})` : ''} |`,
    `| Generated At | ${report.generated_at || report.scan_time || 'N/A'} |`,
    `| Hosts Scanned | ${report.hosts_scanned} |`,
    `| Ports Scanned | ${report.ports_scanned} |`,
    `| Open Services | ${report.findings.length} |`,
    `| Duration | ${duration.toFixed(2)}s |`,
    `| Interrupted | ${report.interrupted ? 'Yes' : 'No'} |`,
  ];

  if (report.note) {
    lines.push(`| Note | ${report.note.replace(/\|/g, '\\|')} |`);
  }

  lines.push(
    '',
    '## Severity Summary',
    '',
    `- Critical: ${counts.critical}`,
    `- High: ${counts.high}`,
    `- Medium: ${counts.medium}`,
    `- Low: ${counts.low}`,
    `- Info: ${counts.info}`,
    ''
  );

  if (diff.source !== 'none') {
    lines.push('## Baseline Diff Summary', '');
    lines.push(`- Added: ${diff.added.length}`);
    lines.push(`- Removed: ${diff.removed.length}`);
    lines.push(`- Changed: ${diff.changed.length}`);
    lines.push(`- Unchanged: ${diff.unchangedCount}`);
    lines.push('');

    if (diff.added.length > 0) {
      lines.push('### Added Services', '');
      for (const f of diff.added) {
        lines.push(`- \`${f.ip}:${f.port}\` — ${f.service} ${[f.product, f.version].filter(Boolean).join(' ')} (${f.severity.toUpperCase()})`);
      }
      lines.push('');
    }

    if (diff.removed.length > 0) {
      lines.push('### Removed Services', '');
      for (const f of diff.removed) {
        lines.push(`- \`${f.ip}:${f.port}\` — ${f.service} ${[f.product, f.version].filter(Boolean).join(' ')} (${f.severity.toUpperCase()})`);
      }
      lines.push('');
    }

    if (diff.changed.length > 0) {
      lines.push('### Changed Services', '');
      for (const c of diff.changed) {
        const deltaText = c.changes
          .map((ch) => {
            const beforeStr = Array.isArray(ch.before) ? ch.before.join(', ') : ch.before || '(empty)';
            const afterStr = Array.isArray(ch.after) ? ch.after.join(', ') : ch.after || '(empty)';
            return `${ch.field}: \`${beforeStr}\` -> \`${afterStr}\``;
          })
          .join('; ');
        lines.push(`- \`${c.ip}:${c.port}\` — ${deltaText}`);
      }
      lines.push('');
    }
  }

  lines.push('## Detailed Findings', '');
  if (sortedFindings.length === 0) {
    lines.push('No open services recorded in this scan.', '');
  } else {
    for (const finding of sortedFindings) {
      lines.push(formatFindingMarkdown(finding));
    }
  }

  const filename = `latscan-report-${safeTimestampSlug(report)}.md`;
  triggerDownload(filename, lines.join('\n'), 'text/markdown;charset=utf-8');
}
