import { LatScanReport } from '../types/scan';

export const SAMPLE_BASELINE_REPORT: LatScanReport = {
  tool: 'mini-latscan.py',
  version: '1.4.2',
  generated_at: '2026-11-24T18:10:04Z',
  scan_time: '2026-11-24T18:09:41Z',
  target: '192.168.10.0/24',
  subnet: '192.168.10.0/24',
  hosts_scanned: 254,
  ports_scanned: 1000,
  elapsed_seconds: 23.18,
  duration_seconds: 23.18,
  interrupted: false,
  note: 'Weekly authorized lab subnet baseline sweep.',
  findings: [
    {
      ip: '192.168.10.1',
      port: 443,
      service: 'https',
      product: 'nginx',
      version: '1.24.0',
      banner: 'HTTP/1.1 200 OK\\r\\nServer: nginx/1.24.0',
      severity: 'low',
      indicator: 'Self-signed gateway management TLS certificate',
      tags: ['gateway', 'tls', 'self-signed', 'web-admin'],
      evidence: [
        'TLS handshake succeeded using TLSv1.3 (TLS_AES_256_GCM_SHA384)',
        'Certificate issuer equals subject (CN=gw.lan.internal)',
        'Missing HSTS and Content-Security-Policy response headers'
      ],
      tls: {
        enabled: true,
        version: 'TLSv1.3',
        cipher: 'TLS_AES_256_GCM_SHA384',
        subject: 'CN=gw.lan.internal, O=Internal Lab',
        issuer: 'CN=gw.lan.internal, O=Internal Lab',
        san: ['gw.lan.internal', '192.168.10.1'],
        not_after: '2027-06-15T23:59:59Z',
        expired: false,
        self_signed: true,
        error: null
      },
      http: {
        status_code: 200,
        title: 'Edge Router Admin Console',
        server_header: 'nginx/1.24.0',
        missing_security_headers: ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Frame-Options'],
        auth_required: true
      }
    },
    {
      ip: '192.168.10.12',
      port: 22,
      service: 'ssh',
      product: 'OpenSSH',
      version: '8.9p1 Ubuntu',
      banner: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6',
      severity: 'info',
      indicator: 'Standard SSH service banner observed',
      tags: ['ssh', 'remote-access', 'linux'],
      evidence: [
        'Protocol 2.0 banner returned in 4.2ms',
        'No legacy SSHv1 fallback detected'
      ],
      tls: null,
      http: null
    },
    {
      ip: '192.168.10.20',
      port: 5432,
      service: 'postgresql',
      product: 'PostgreSQL',
      version: '15.4',
      banner: 'PostgreSQL wire protocol v3 (SSLRequest supported)',
      severity: 'medium',
      indicator: 'Database port reachable across local subnet',
      tags: ['database', 'postgres', 'internal-service'],
      evidence: [
        'TCP SYN/ACK on port 5432',
        'SSLRequest packet acknowledged with S'
      ],
      tls: {
        enabled: true,
        version: 'TLSv1.2',
        cipher: 'ECDHE-RSA-AES256-GCM-SHA384',
        subject: 'CN=db01.lan.internal',
        issuer: 'CN=Lab Root CA',
        san: ['db01.lan.internal'],
        not_after: '2027-01-10T00:00:00Z',
        expired: false,
        self_signed: false,
        error: null
      },
      http: null
    },
    {
      ip: '192.168.10.35',
      port: 8080,
      service: 'http',
      product: 'Apache Tomcat',
      version: '9.0.82',
      banner: 'HTTP/1.1 200 OK\\r\\nServer: Apache-Coyote/1.1',
      severity: 'medium',
      indicator: 'Unencrypted internal CI dashboard without TLS',
      tags: ['http', 'cleartext', 'ci-cd'],
      evidence: [
        'Plaintext HTTP response 200 OK on 8080',
        'Page title: Build Runner Status'
      ],
      tls: {
        enabled: false,
        version: '',
        cipher: '',
        subject: '',
        issuer: '',
        san: [],
        not_after: '',
        expired: false,
        self_signed: false,
        error: 'TLS disabled on plaintext HTTP port'
      },
      http: {
        status_code: 200,
        title: 'Build Runner Status',
        server_header: 'Apache-Coyote/1.1',
        missing_security_headers: ['Content-Security-Policy', 'X-Content-Type-Options'],
        auth_required: false
      }
    },
    {
      ip: '192.168.10.42',
      port: 8443,
      service: 'https',
      product: 'Caddy',
      version: '2.7.5',
      banner: 'HTTP/1.1 302 Found\\r\\nServer: Caddy',
      severity: 'low',
      indicator: 'Internal NAS management portal',
      tags: ['nas', 'tls', 'storage'],
      evidence: [
        'Valid internal CA certificate chain',
        'Redirects unauthenticated requests to /login'
      ],
      tls: {
        enabled: true,
        version: 'TLSv1.3',
        cipher: 'TLS_CHACHA20_POLY1305_SHA256',
        subject: 'CN=nas01.lan.internal',
        issuer: 'CN=Lab Root CA',
        san: ['nas01.lan.internal', '192.168.10.42'],
        not_after: '2026-10-01T00:00:00Z',
        expired: false,
        self_signed: false,
        error: null
      },
      http: {
        status_code: 302,
        title: 'NAS Storage Login',
        server_header: 'Caddy',
        missing_security_headers: ['Permissions-Policy'],
        auth_required: true
      }
    },
    {
      ip: '192.168.10.88',
      port: 9100,
      service: 'jetdirect',
      product: 'HP JetDirect',
      version: 'unknown',
      banner: 'PCL/PJL network print spooler ready',
      severity: 'info',
      indicator: 'Network printer raw print port exposed',
      tags: ['printer', 'iot', 'raw-tcp'],
      evidence: ['TCP port 9100 open and accepting PJL status query'],
      tls: null,
      http: null
    }
  ]
};

export const SAMPLE_CURRENT_REPORT: LatScanReport = {
  tool: 'mini-latscan.py',
  version: '1.4.2',
  generated_at: '2026-11-25T09:15:22Z',
  scan_time: '2026-11-25T09:14:57Z',
  target: '192.168.10.0/24',
  subnet: '192.168.10.0/24',
  hosts_scanned: 254,
  ports_scanned: 1000,
  elapsed_seconds: 24.86,
  duration_seconds: 24.86,
  interrupted: false,
  note: 'Morning verification sweep after staging container & NAS maintenance.',
  findings: [
    {
      ip: '192.168.10.1',
      port: 443,
      service: 'https',
      product: 'nginx',
      version: '1.26.1',
      banner: 'HTTP/1.1 200 OK\\r\\nServer: nginx/1.26.1',
      severity: 'low',
      indicator: 'Self-signed gateway management TLS certificate',
      tags: ['gateway', 'tls', 'self-signed', 'web-admin'],
      evidence: [
        'TLS handshake succeeded using TLSv1.3 (TLS_AES_256_GCM_SHA384)',
        'Certificate issuer equals subject (CN=gw.lan.internal)',
        'Server upgraded from nginx/1.24.0 to nginx/1.26.1'
      ],
      tls: {
        enabled: true,
        version: 'TLSv1.3',
        cipher: 'TLS_AES_256_GCM_SHA384',
        subject: 'CN=gw.lan.internal, O=Internal Lab',
        issuer: 'CN=gw.lan.internal, O=Internal Lab',
        san: ['gw.lan.internal', '192.168.10.1'],
        not_after: '2027-06-15T23:59:59Z',
        expired: false,
        self_signed: true,
        error: null
      },
      http: {
        status_code: 200,
        title: 'Edge Router Admin Console',
        server_header: 'nginx/1.26.1',
        missing_security_headers: ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Frame-Options'],
        auth_required: true
      }
    },
    {
      ip: '192.168.10.12',
      port: 22,
      service: 'ssh',
      product: 'OpenSSH',
      version: '8.9p1 Ubuntu',
      banner: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6',
      severity: 'info',
      indicator: 'Standard SSH service banner observed',
      tags: ['ssh', 'remote-access', 'linux'],
      evidence: [
        'Protocol 2.0 banner returned in 3.9ms',
        'No legacy SSHv1 fallback detected'
      ],
      tls: null,
      http: null
    },
    {
      ip: '192.168.10.20',
      port: 5432,
      service: 'postgresql',
      product: 'PostgreSQL',
      version: '15.4',
      banner: 'PostgreSQL wire protocol v3 (SSLRequest supported)',
      severity: 'medium',
      indicator: 'Database port reachable across local subnet',
      tags: ['database', 'postgres', 'internal-service'],
      evidence: [
        'TCP SYN/ACK on port 5432',
        'SSLRequest packet acknowledged with S'
      ],
      tls: {
        enabled: true,
        version: 'TLSv1.2',
        cipher: 'ECDHE-RSA-AES256-GCM-SHA384',
        subject: 'CN=db01.lan.internal',
        issuer: 'CN=Lab Root CA',
        san: ['db01.lan.internal'],
        not_after: '2027-01-10T00:00:00Z',
        expired: false,
        self_signed: false,
        error: null
      },
      http: null
    },
    {
      ip: '192.168.10.42',
      port: 8443,
      service: 'https',
      product: 'Caddy',
      version: '2.7.5',
      banner: 'HTTP/1.1 302 Found\\r\\nServer: Caddy',
      severity: 'high',
      indicator: 'Expired TLS certificate on NAS management portal',
      tags: ['nas', 'tls', 'storage', 'expired-cert'],
      evidence: [
        'Certificate not_after timestamp (2026-10-01T00:00:00Z) is in the past',
        'TLS handshake completes only when certificate verification is skipped'
      ],
      tls: {
        enabled: true,
        version: 'TLSv1.3',
        cipher: 'TLS_CHACHA20_POLY1305_SHA256',
        subject: 'CN=nas01.lan.internal',
        issuer: 'CN=Lab Root CA',
        san: ['nas01.lan.internal', '192.168.10.42'],
        not_after: '2026-10-01T00:00:00Z',
        expired: true,
        self_signed: false,
        error: 'x509: certificate has expired or is not yet valid'
      },
      http: {
        status_code: 302,
        title: 'NAS Storage Login',
        server_header: 'Caddy',
        missing_security_headers: ['Strict-Transport-Security', 'Permissions-Policy'],
        auth_required: true
      }
    },
    {
      ip: '192.168.10.51',
      port: 6379,
      service: 'redis',
      product: 'Redis',
      version: '7.2.4',
      banner: '+PONG\\r\\nredis_version:7.2.4\\r\\nos:Linux 6.8.0',
      severity: 'critical',
      indicator: 'Unauthenticated Redis instance responding to PING/INFO',
      tags: ['redis', 'unauthenticated', 'cache', 'plaintext'],
      evidence: [
        'PING command returned +PONG without AUTH challenge',
        'INFO server disclosed redis_version:7.2.4 and tcp_port:6379',
        'Bound to 0.0.0.0 across local LAN'
      ],
      tls: {
        enabled: false,
        version: '',
        cipher: '',
        subject: '',
        issuer: '',
        san: [],
        not_after: '',
        expired: false,
        self_signed: false,
        error: null
      },
      http: null
    },
    {
      ip: '192.168.10.64',
      port: 8000,
      service: 'http',
      product: 'Uvicorn',
      version: '0.30.1',
      banner: 'HTTP/1.1 200 OK\\r\\nServer: uvicorn',
      severity: 'medium',
      indicator: 'Unauthenticated internal FastAPI diagnostics endpoint',
      tags: ['http', 'api', 'unauthenticated', 'cleartext'],
      evidence: [
        'GET / returned 200 OK without Authorization header',
        'OpenAPI schema exposed at /docs'
      ],
      tls: null,
      http: {
        status_code: 200,
        title: 'Staging Telemetry API — Swagger UI',
        server_header: 'uvicorn',
        missing_security_headers: [
          'Content-Security-Policy',
          'X-Content-Type-Options',
          'X-Frame-Options'
        ],
        auth_required: false
      }
    },
    {
      ip: '192.168.10.77',
      port: 1883,
      service: 'mqtt',
      product: 'Eclipse Mosquitto',
      version: '2.0.18',
      banner: 'MQTT CONNACK return_code=0 (Connection Accepted)',
      severity: 'high',
      indicator: 'Anonymous MQTT broker accepting unencrypted connections',
      tags: ['mqtt', 'iot', 'unauthenticated', 'cleartext'],
      evidence: [
        'MQTT v3.1.1 CONNECT packet without username/password accepted (CONNACK 0x00)',
        'Cleartext TCP listener on port 1883'
      ],
      tls: null,
      http: null
    },
    {
      ip: '192.168.10.88',
      port: 9100,
      service: 'jetdirect',
      product: 'HP JetDirect',
      version: 'unknown',
      banner: 'PCL/PJL network print spooler ready',
      severity: 'info',
      indicator: 'Network printer raw print port exposed',
      tags: ['printer', 'iot', 'raw-tcp'],
      evidence: ['TCP port 9100 open and accepting PJL status query'],
      tls: null,
      http: null
    }
  ]
};
