// End-to-end check of the cross-site guard against the running Host.
//
// Run after restarting DSH: node scripts/verify-guard.mjs [port]
import { execFileSync } from 'node:child_process'

const port = process.argv[2] || process.env.PORT || '5894'
const base = `http://127.0.0.1:${port}/plugins/three-body-atlas`

function request(url, { method = 'GET', headers = {}, body } = {}) {
  const args = ['-s', '-o', '-', '-w', '\n__STATUS__%{http_code}', '-X', method, url]
  for (const [k, v] of Object.entries(headers)) args.push('-H', `${k}: ${v}`)
  if (body !== undefined) args.push('--data', body)
  const out = execFileSync('curl.exe', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const at = out.lastIndexOf('__STATUS__')
  return { status: Number(out.slice(at + 10).trim()), body: out.slice(0, at).trim() }
}

const cases = [
  // label, request, expected status
  ['same-origin GET /bundle', { url: `${base}/bundle` }, 200],
  ['cross-site GET /bundle', { url: `${base}/bundle`, headers: { 'sec-fetch-site': 'cross-site' } }, 403],
  ['foreign Origin GET /bundle', { url: `${base}/bundle`, headers: { origin: 'https://evil.example' } }, 403],
  ['opaque Origin GET /bundle', { url: `${base}/bundle`, headers: { origin: 'null' } }, 403],
  ['DNS rebinding GET /bundle', { url: `${base}/bundle`, headers: { host: 'evil.example', origin: 'http://evil.example' } }, 403],
  ['rebound Host only GET /bundle', { url: `${base}/bundle`, headers: { host: 'evil.example' } }, 403],
  ['same-origin GET /detail', { url: `${base}/detail?id=luo-ji` }, 200],
  ['cross-site GET /detail', { url: `${base}/detail?id=luo-ji`, headers: { 'sec-fetch-site': 'cross-site' } }, 403],
  ['same-origin POST /simulate', { url: `${base}/simulate`, method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"preset":"trisolaris"}' }, 200],
  ['cross-site POST /simulate', { url: `${base}/simulate`, method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' }, body: '{"preset":"trisolaris"}' }, 403],
  ['DNS rebinding POST /simulate', { url: `${base}/simulate`, method: 'POST', headers: { 'content-type': 'application/json', host: 'evil.example' }, body: '{"preset":"trisolaris"}' }, 403],
  ['same-origin POST /stability', { url: `${base}/stability`, method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"samples":8}' }, 200],
  ['cross-site POST /stability', { url: `${base}/stability`, method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: '{"samples":8}' }, 403],
]

let failures = 0
for (const [label, req, want] of cases) {
  let got, note = ''
  try {
    const r = request(req.url, req)
    got = r.status
    if (got === 403 && r.body) note = '  ' + r.body.slice(0, 60)
  } catch (error) {
    got = 'ERR'
    note = '  ' + String(error.message).slice(0, 80)
  }
  const pass = got === want
  if (!pass) failures++
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label.padEnd(30)} → ${got} (期望 ${want})${note}`)
}

console.log(failures ? `\n失败 ${failures} 项` : '\n全部通过：跨站被拒、同源正常')
process.exit(failures ? 1 : 0)
