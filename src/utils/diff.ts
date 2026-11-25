import { ChangedFinding, DiffField, DiffResult, FieldChange, Finding, LatScanReport } from '../types/scan';
import { normalizeFinding } from './parser';

export function findingKey(finding: Pick<Finding, 'ip' | 'port'>): string {
  return `${finding.ip}:${finding.port}`;
}

function tagsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((item, idx) => item === sortedB[idx]);
}

const DIFF_FIELDS: DiffField[] = ['service', 'product', 'version', 'severity', 'tags'];

export function computeFindingChanges(baseline: Finding, current: Finding): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const field of DIFF_FIELDS) {
    if (field === 'tags') {
      if (!tagsEqual(baseline.tags, current.tags)) {
        changes.push({
          field: 'tags',
          before: [...baseline.tags],
          after: [...current.tags],
        });
      }
    } else {
      const beforeVal = baseline[field] ?? '';
      const afterVal = current[field] ?? '';
      if (beforeVal !== afterVal) {
        changes.push({
          field,
          before: beforeVal,
          after: afterVal,
        });
      }
    }
  }

  return changes;
}

export function computeReportDiff(
  current: LatScanReport,
  baseline: LatScanReport | null
): DiffResult {
  if (baseline) {
    const baselineMap = new Map<string, Finding>();
    const currentMap = new Map<string, Finding>();

    for (const f of baseline.findings) {
      baselineMap.set(findingKey(f), f);
    }
    for (const f of current.findings) {
      currentMap.set(findingKey(f), f);
    }

    const added: Finding[] = [];
    const removed: Finding[] = [];
    const changed: ChangedFinding[] = [];
    let unchangedCount = 0;

    for (const [key, currFinding] of currentMap.entries()) {
      const baseFinding = baselineMap.get(key);
      if (!baseFinding) {
        added.push(currFinding);
      } else {
        const changes = computeFindingChanges(baseFinding, currFinding);
        if (changes.length > 0) {
          changed.push({
            key,
            ip: currFinding.ip,
            port: currFinding.port,
            baseline: baseFinding,
            current: currFinding,
            changes,
          });
        } else {
          unchangedCount++;
        }
      }
    }

    for (const [key, baseFinding] of baselineMap.entries()) {
      if (!currentMap.has(key)) {
        removed.push(baseFinding);
      }
    }

    return {
      source: 'computed',
      added,
      removed,
      changed,
      unchangedCount,
    };
  }

  // Fallback to embedded diff inside the current report if present
  if (current.diff) {
    const added = Array.isArray(current.diff.added)
      ? current.diff.added.map((item) => normalizeFinding(item))
      : [];
    const removed = Array.isArray(current.diff.removed)
      ? current.diff.removed.map((item) => normalizeFinding(item))
      : [];

    const changed: ChangedFinding[] = [];
    if (Array.isArray(current.diff.changed)) {
      for (const entry of current.diff.changed) {
        const rawCurr = entry.current ?? entry.after ?? {};
        const rawBase = entry.baseline ?? entry.before ?? {};
        const curr = normalizeFinding({
          ip: entry.ip ?? (rawCurr as Partial<Finding>).ip ?? (rawBase as Partial<Finding>).ip,
          port: entry.port ?? (rawCurr as Partial<Finding>).port ?? (rawBase as Partial<Finding>).port,
          ...rawCurr,
        });
        const base = normalizeFinding({
          ip: entry.ip ?? (rawBase as Partial<Finding>).ip ?? (rawCurr as Partial<Finding>).ip,
          port: entry.port ?? (rawBase as Partial<Finding>).port ?? (rawCurr as Partial<Finding>).port,
          ...rawBase,
        });

        let changes: FieldChange[] = [];
        if (Array.isArray(entry.changes) && entry.changes.length > 0) {
          changes = entry.changes;
        } else if (entry.fields && typeof entry.fields === 'object') {
          for (const [k, delta] of Object.entries(entry.fields)) {
            if (DIFF_FIELDS.includes(k as DiffField) && delta && typeof delta === 'object') {
              changes.push({
                field: k as DiffField,
                before: Array.isArray(delta.before) ? delta.before.map(String) : String(delta.before ?? ''),
                after: Array.isArray(delta.after) ? delta.after.map(String) : String(delta.after ?? ''),
              });
            }
          }
        } else {
          changes = computeFindingChanges(base, curr);
        }

        changed.push({
          key: findingKey(curr),
          ip: curr.ip,
          port: curr.port,
          baseline: base,
          current: curr,
          changes,
        });
      }
    }

    const unchangedCount = Math.max(0, current.findings.length - added.length - changed.length);
    return {
      source: 'embedded',
      added,
      removed,
      changed,
      unchangedCount,
    };
  }

  return {
    source: 'none',
    added: [],
    removed: [],
    changed: [],
    unchangedCount: current.findings.length,
  };
}
