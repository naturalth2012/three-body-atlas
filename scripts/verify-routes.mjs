// Check that every route answers 200 for a same-origin caller after the guard.
//
// The guard is fail-closed, so a mistake in it shows up as a route that no
// longer answers the panel. This walks all 24 with real parameters.
//
// Run: node scripts/verify-routes.mjs <port>
import http from 'node:http'

const port = process.argv[2]
if (!port) {
  console.error('用法: node scripts/verify-routes.mjs <port>')
  process.exit(2)
}

const get = (path) => new Promise((resolve, reject) => {
  const req = http.request({ host: '127.0.0.1', port: Number(port), path: `/plugins/three-body-atlas${path}`, method: 'GET' }, (res) => {
    const chunks = []
    res.on('data', (c) => chunks.push(c))
    res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }))
  })
  req.on('error', reject)
  req.setTimeout(60_000, () => { req.destroy(new Error('timeout')) })
  req.end()
})

const post = (path, payload) => new Promise((resolve, reject) => {
  const body = JSON.stringify(payload)
  const req = http.request({
    host: '127.0.0.1', port: Number(port), path: `/plugins/three-body-atlas${path}`, method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
  }, (res) => {
    const chunks = []
    res.on('data', (c) => chunks.push(c))
    res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }))
  })
  req.on('error', reject)
  req.setTimeout(120_000, () => { req.destroy(new Error('timeout')) })
  req.write(body)
  req.end()
})

const q = encodeURIComponent
const routes = [
  ['GET', `/bundle`, undefined],
  ['GET', `/search?q=${q('罗辑')}`, undefined],
  ['GET', `/search-all?q=${q('水滴')}`, undefined],
  ['GET', `/detail?id=luo-ji`, undefined],
  ['GET', `/place?id=${q('末日战役')}`, undefined],
  ['GET', `/tech?id=${q('水滴')}`, undefined],
  ['GET', `/glossary?id=${q('黑暗森林')}`, undefined],
  ['GET', `/graph`, undefined],
  ['GET', `/neighbors?id=luo-ji`, undefined],
  ['GET', `/path?from=${q('罗辑')}&to=${q('程心')}`, undefined],
  ['GET', `/timeline`, undefined],
  ['GET', `/plot`, undefined],
  ['GET', `/themes`, undefined],
  ['GET', `/game`, undefined],
  ['GET', `/differences`, undefined],
  ['GET', `/ask?q=${q('罗辑是谁')}`, undefined],
  ['GET', `/journey?id=luo-ji`, undefined],
  ['GET', `/guide`, undefined],
  ['GET', `/concept?id=${q('黑暗森林')}`, undefined],
  ['POST', `/simulate`, { preset: 'trisolaris' }],
  ['POST', `/sensitivity`, {}],
  ['POST', `/stability`, { samples: 8 }],
  ['POST', `/dark-forest`, {}],
  ['POST', `/deterrence`, {}],
]

let failures = 0
for (const [method, path, payload] of routes) {
  const label = `${method.padEnd(4)} ${path}`
  try {
    const r = method === 'GET' ? await get(path) : await post(path, payload)
    const ok = r.status === 200
    let note = ''
    if (!ok) {
      failures++
      note = '  ' + (r.body || '').slice(0, 100)
    } else if (!/^\s*[[{]/.test(r.body)) {
      failures++
      note = '  响应不是 JSON'
    }
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(46)} → ${r.status}${note}`)
  } catch (error) {
    failures++
    console.log(`  FAIL  ${label.padEnd(46)} → ${error.message}`)
  }
}

console.log(failures ? `\n  ${failures}/${routes.length} 失败` : `\n  全部 ${routes.length} 条路由正常`)
process.exit(failures ? 1 : 0)
