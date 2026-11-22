// End-to-end check of the cross-site guard against the running Host.
//
// Run after restarting DSH: node scripts/verify-guard.mjs <port>
//
// Uses node:http rather than curl so a 600 KB body can be sent without hitting a
// command-line length limit, and so no external binary is required.
import http from 'node:http'

const port = process.argv[2] || process.env.PORT
if (!port) {
  console.error('用法: node scripts/verify-guard.mjs <port>')
  console.error('端口见 GUI 地址栏，或 Get-NetTCPConnection 里 DeepSeek Harness 的监听端口。')
  process.exit(2)
}
const base = `/plugins/three-body-atlas`

function request(path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : Buffer.from(body, 'utf8')
    const req = http.request({ host: '127.0.0.1', port: Number(port), path, method, headers }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve({
        status: res.statusCode,
        body: Buffer.concat(chunks).toString('utf8').trim(),
      }))
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

const cases = [
  // label, request, expected status
  ['same-origin GET /bundle', { url: '/bundle' }, 200],
  ['cross-site GET /bundle', { url: '/bundle', headers: { 'sec-fetch-site': 'cross-site' } }, 403],
  ['foreign Origin GET /bundle', { url: '/bundle', headers: { origin: 'https://evil.example' } }, 403],
  ['opaque Origin GET /bundle', { url: '/bundle', headers: { origin: 'null' } }, 403],
  ['DNS rebinding GET /bundle', { url: '/bundle', headers: { host: 'evil.example', origin: 'http://evil.example' } }, 403],
  ['rebound Host only GET /bundle', { url: '/bundle', headers: { host: 'evil.example' } }, 403],
  ['LAN address GET /bundle', { url: '/bundle', headers: { host: '192.168.1.5:7091' } }, 403],
  ['same-origin GET /detail', { url: '/detail?id=luo-ji' }, 200],
  ['cross-site GET /detail', { url: '/detail?id=luo-ji', headers: { 'sec-fetch-site': 'cross-site' } }, 403],
  ['same-origin POST /simulate', { url: '/simulate', method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"preset":"trisolaris"}' }, 200],
  ['cross-site POST /simulate', { url: '/simulate', method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' }, body: '{"preset":"trisolaris"}' }, 403],
  ['DNS rebinding POST /simulate', { url: '/simulate', method: 'POST', headers: { 'content-type': 'application/json', host: 'evil.example' }, body: '{"preset":"trisolaris"}' }, 403],
  ['same-origin POST /stability', { url: '/stability', method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"samples":8}' }, 200],
  ['cross-site POST /stability', { url: '/stability', method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: '{"samples":8}' }, 403],

  // Body handling: each of these used to answer 200 and run with defaults, or
  // destroy the socket before the error could be written.
  ['POST non-JSON content type', { url: '/simulate', method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{"preset":"trisolaris"}' }, 415],
  ['POST malformed JSON', { url: '/simulate', method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json' }, 400],
  ['POST oversized body', { url: '/simulate', method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"x":"' + 'a'.repeat(600 * 1024) + '"}' }, 413],
]

let failures = 0
for (const [label, req, want] of cases) {
  let got, note = ''
  try {
    const r = await request(base + req.url, req)
    got = r.status
    if (got >= 400 && r.body) note = '  ' + r.body.slice(0, 60)
  } catch (error) {
    got = 'ERR'
    note = '  ' + String(error.message).slice(0, 80)
  }
  const pass = got === want
  if (!pass) failures++
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label.padEnd(30)} → ${got} (期望 ${want})${note}`)
}

console.log(failures ? `\n失败 ${failures} 项` : '\n全部通过：跨站被拒、同源正常、异常输入有明确错误')
process.exit(failures ? 1 : 0)
