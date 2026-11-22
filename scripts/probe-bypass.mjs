// Adversarial probe of the cross-site guard: try to get past it.
//
// This is a read-only check against the pure predicate, so it needs no running
// Host and no restart. Run: node scripts/probe-bypass.mjs
import { isCrossSiteRequest, isForeignHostHeader } from '../index.js'

const rejected = (headers) => isCrossSiteRequest({ headers })

// Each case: [label, headers, expectedRejection]
// expectedRejection true  = the guard must refuse it
// expectedRejection false = the guard must admit it
const cases = [
  // ---- must be refused: ordinary cross-site shapes ----
  ['sec-fetch-site: cross-site', { host: '127.0.0.1:7091', 'sec-fetch-site': 'cross-site' }, true],
  ['sec-fetch-site: same-site', { host: '127.0.0.1:7091', 'sec-fetch-site': 'same-site' }, true],
  ['foreign Origin', { host: '127.0.0.1:7091', origin: 'https://evil.example' }, true],
  ['Origin null', { host: '127.0.0.1:7091', origin: 'null' }, true],

  // ---- must be refused: DNS rebinding shapes ----
  ['rebind: Host=Origin=domain', { host: 'evil.example', origin: 'http://evil.example' }, true],
  ['rebind: Host domain, no Origin', { host: 'evil.example' }, true],
  ['rebind: domain with port', { host: 'evil.example:7091' }, true],
  ['rebind: uppercase domain', { host: 'EVIL.EXAMPLE' }, true],
  ['rebind: trailing-dot domain', { host: 'evil.example.' }, true],
  ['rebind: subdomain of localhost', { host: 'localhost.evil.example' }, true],
  ['rebind: hex IP 0x7f000001', { host: '0x7f000001' }, true],
  ['rebind: decimal IP 2130706433', { host: '2130706433' }, true],
  ['rebind: octal IP 0177.0.0.1', { host: '0177.0.0.1' }, true],

  // ---- must be refused: non-loopback literals ----
  // webServer only refuses a *wildcard* bind, so binding a LAN address is
  // legitimate; admitting every IP literal would then admit the whole subnet.
  ['LAN IP 192.168.1.5', { host: '192.168.1.5:7091' }, true],
  ['routable IP 1.2.3.4', { host: '1.2.3.4:7091' }, true],
  ['wildcard 0.0.0.0', { host: '0.0.0.0:7091' }, true],
  ['wildcard [::]', { host: '[::]:7091' }, true],
  ['link-local [fe80::1]', { host: '[fe80::1]:7091' }, true],

  // ---- must be refused: a missing Host must not switch the Origin check off ----
  ['no Host, foreign Origin', { origin: 'https://evil.example' }, true],

  // ---- must be admitted: the panel's own calls ----
  ['same-origin GET, no Origin', { host: '127.0.0.1:7091' }, false],
  ['same-origin POST', { host: '127.0.0.1:7091', origin: 'http://127.0.0.1:7091' }, false],
  ['sec-fetch-site: same-origin', { host: '127.0.0.1:7091', 'sec-fetch-site': 'same-origin' }, false],
  ['sec-fetch-site: none', { host: '127.0.0.1:7091', 'sec-fetch-site': 'none' }, false],
  ['localhost', { host: 'localhost:7091' }, false],
  ['localhost no port', { host: 'localhost' }, false],
  ['localhost uppercase', { host: 'LOCALHOST:7091', origin: 'http://localhost:7091' }, false],
  ['localhost trailing dot', { host: 'localhost.:7091', origin: 'http://localhost:7091' }, false],
  ['IPv4 loopback no port', { host: '127.0.0.1' }, false],
  ['loopback range 127.5.5.5', { host: '127.5.5.5:7091' }, false],
  ['IPv6 loopback', { host: '[::1]:7091' }, false],
  ['IPv6 loopback no port', { host: '[::1]' }, false],
  ['IPv4-mapped loopback', { host: '[::ffff:127.0.0.1]:7091' }, false],
  ['default port 80 vs none', { host: '127.0.0.1:80', origin: 'http://127.0.0.1' }, false],
  ['no Host at all', {}, false],
]

let failures = 0
const rows = []
for (const [label, headers, want] of cases) {
  const got = rejected(headers)
  const pass = got === want
  if (!pass) failures++
  rows.push({ label, got, want, pass })
}

const width = Math.max(...rows.map((r) => r.label.length))
for (const r of rows) {
  const verdict = r.pass ? 'PASS' : 'FAIL'
  const expect = r.want ? '拒绝' : '放行'
  console.log(`  ${verdict}  ${r.label.padEnd(width)}  → ${r.got ? '拒绝' : '放行'}（期望${expect}）`)
}

console.log('')
console.log(failures ? `  ${failures} 项不符合预期` : '  全部符合预期')
if (failures) {
  console.log('')
  console.log('  不符合预期的用例说明防护的判定与预期不一致：')
  for (const r of rows.filter((x) => !x.pass)) {
    console.log(`    - ${r.label}: 实际${r.got ? '拒绝' : '放行'}，期望${r.want ? '拒绝' : '放行'}`)
  }
}
process.exit(failures ? 1 : 0)
