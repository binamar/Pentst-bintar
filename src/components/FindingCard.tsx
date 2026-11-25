import { ChevronDown, ChevronRight, Globe, Lock, ShieldAlert, Terminal } from 'lucide-react';
import { Finding } from '../types/scan';
import { SeverityLabel } from './SeverityLabel';

interface FindingCardProps {
  finding: Finding;
  isExpanded: boolean;
  onToggle: () => void;
  diffBadge?: 'added' | 'changed' | null;
  onSelectTag?: (tag: string) => void;
}

export function FindingCard({
  finding,
  isExpanded,
  onToggle,
  diffBadge,
  onSelectTag,
}: FindingCardProps) {
  const productInfo = [finding.product, finding.version].filter(Boolean).join(' ');
  const hasTls = Boolean(finding.tls);
  const hasHttp = Boolean(finding.http);

  return (
    <article className="rounded-lg border border-slate-800 bg-[#111827] transition-colors hover:border-slate-700">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 rounded-lg"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-sm font-semibold text-slate-50 tabular-nums">
                {finding.ip}:{finding.port}
              </span>
              <span className="text-slate-600" aria-hidden="true">
                /
              </span>
              <span className="text-sm font-medium text-sky-300">
                {finding.service || 'unknown'}
              </span>
              {productInfo && (
                <>
                  <span className="text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-mono text-xs text-slate-300">{productInfo}</span>
                </>
              )}
              {diffBadge === 'added' && (
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-300">
                  New in scan
                </span>
              )}
              {diffBadge === 'changed' && (
                <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-300">
                  Modified
                </span>
              )}
            </div>

            {finding.indicator && (
              <p className="text-sm text-slate-300 leading-snug">{finding.indicator}</p>
            )}

            {finding.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-slate-400 font-mono">
                {finding.tags.map((tag, idx) => (
                  <span key={tag} className="inline-flex items-center gap-2">
                    {idx > 0 && (
                      <span className="text-slate-600" aria-hidden="true">
                        ·
                      </span>
                    )}
                    {onSelectTag ? (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTag(tag);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectTag(tag);
                          }
                        }}
                        className="hover:text-sky-300 hover:underline cursor-pointer"
                      >
                        {tag}
                      </span>
                    ) : (
                      <span>{tag}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start">
            <SeverityLabel severity={finding.severity} />
            <span className="text-slate-400">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800 px-5 py-4 space-y-5 text-sm">
          {/* Banner */}
          {finding.banner && (
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Service Banner</span>
              </div>
              <pre className="overflow-x-auto rounded-md border border-slate-800 bg-[#0b0f17] px-3.5 py-2.5 font-mono text-xs text-slate-200 whitespace-pre-wrap break-all">
                {finding.banner}
              </pre>
            </div>
          )}

          {/* Evidence */}
          {finding.evidence.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Evidence</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {finding.evidence.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-slate-500 select-none" aria-hidden="true">
                      –
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TLS & HTTP Split Grid */}
          {(hasTls || hasHttp) && (
            <div className="grid grid-cols-1 gap-6 border-t border-slate-800/80 pt-4 lg:grid-cols-2">
              {finding.tls && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Lock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      <span>TLS Certificate &amp; Transport</span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        !finding.tls.enabled
                          ? 'text-slate-400'
                          : finding.tls.expired
                            ? 'text-rose-300'
                            : finding.tls.self_signed
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                      }`}
                    >
                      {!finding.tls.enabled
                        ? 'Disabled'
                        : finding.tls.expired
                          ? 'Expired'
                          : finding.tls.self_signed
                            ? 'Self-Signed'
                            : 'Valid Chain'}
                    </span>
                  </div>

                  {finding.tls.enabled ? (
                    <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-xs">
                      <dt className="text-slate-400">Protocol</dt>
                      <dd className="font-mono text-slate-200">{finding.tls.version || '—'}</dd>

                      <dt className="text-slate-400">Cipher</dt>
                      <dd className="font-mono text-slate-200 break-all">
                        {finding.tls.cipher || '—'}
                      </dd>

                      <dt className="text-slate-400">Subject</dt>
                      <dd className="font-mono text-slate-200 break-all">
                        {finding.tls.subject || '—'}
                      </dd>

                      <dt className="text-slate-400">Issuer</dt>
                      <dd className="font-mono text-slate-200 break-all">
                        {finding.tls.issuer || '—'}
                      </dd>

                      <dt className="text-slate-400">Not After</dt>
                      <dd
                        className={`font-mono tabular-nums ${
                          finding.tls.expired ? 'text-rose-300' : 'text-slate-200'
                        }`}
                      >
                        {finding.tls.not_after || '—'}
                      </dd>

                      <dt className="text-slate-400">SANs</dt>
                      <dd className="font-mono text-slate-200">
                        {finding.tls.san.length > 0 ? finding.tls.san.join(', ') : '—'}
                      </dd>

                      <dt className="text-slate-400">Flags</dt>
                      <dd className="text-slate-200">
                        Expired: {finding.tls.expired ? 'Yes' : 'No'} · Self-signed:{' '}
                        {finding.tls.self_signed ? 'Yes' : 'No'}
                      </dd>

                      {finding.tls.error && (
                        <>
                          <dt className="text-rose-400">Error</dt>
                          <dd className="font-mono text-rose-300 break-all">{finding.tls.error}</dd>
                        </>
                      )}
                    </dl>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {finding.tls.error || 'TLS handshake not enabled on this port.'}
                    </p>
                  )}
                </div>
              )}

              {finding.http && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Globe className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      <span>HTTP Diagnostics</span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        finding.http.auth_required ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      {finding.http.auth_required ? 'Auth Required' : 'No Auth Detected'}
                    </span>
                  </div>

                  <dl className="grid grid-cols-[135px_1fr] gap-x-3 gap-y-1.5 text-xs">
                    <dt className="text-slate-400">Status Code</dt>
                    <dd className="font-mono text-slate-200 tabular-nums">
                      {finding.http.status_code ?? '—'}
                    </dd>

                    <dt className="text-slate-400">Page Title</dt>
                    <dd className="text-slate-200">{finding.http.title || '—'}</dd>

                    <dt className="text-slate-400">Server Header</dt>
                    <dd className="font-mono text-slate-200">
                      {finding.http.server_header || '—'}
                    </dd>

                    <dt className="text-slate-400">Missing Headers</dt>
                    <dd className="font-mono text-amber-300/90">
                      {finding.http.missing_security_headers.length > 0
                        ? finding.http.missing_security_headers.join(', ')
                        : 'None'}
                    </dd>
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
