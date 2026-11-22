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

  // ---- must be admitted: the panel's own calls ----
  ['same-origin GET, no Origin', { host: '127.0.0.1:7091' }, false],
  ['same-origin POST', { host: '127.0.0.1:7091', origin: 'http://127.0.0.1:7091' }, false],
  ['sec-fetch-site: same-origin', { host: '127.0.0.1:7091', 'sec-fetch-site': 'same-origin' }, false],
  ['sec-fetch-site: none', { host: '127.0.0.1:7091', 'sec-fetch-site': 'none' }, false],
  ['localhost', { host: 'localhost:7091' }, false],
  ['localhost no port', { host: 'localhost' }, false],
  ['IPv4 loopback no port', { host: '127.0.0.1' }, false],
  ['IPv6 loopback', { host: '[::1]:7091' }, false],
  ['IPv6 loopback no port', { host: '[::1]' }, false],
  ['LAN IP literal', { host: '192.168.1.5:7091' }, false],
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
