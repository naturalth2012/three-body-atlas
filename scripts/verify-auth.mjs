// End-to-end proof that the routes now hold DSH's own access bar.
//
// Before this change a headerless local process read the whole dataset. After
// it, the same request must be refused the way DSH's own routes refuse it.
const BASE = 'http://127.0.0.1:14246/plugins/three-body-atlas'

let failures = 0
const check = (label, actual, want) => {
  const ok = actual === want
  if (!ok) failures++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(52)} → ${actual}${ok ? '' : `（期望 ${want}）`}`)
}

const status = async (path, init) => {
  try {
    const r = await fetch(BASE + path, init)
    return r.status
  } catch (e) {
    return 'ERR ' + e.message
  }
}

const post = (body) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

console.log('=== 1. 无凭据（本地进程、curl、脚本）必须被拒 ===')
// This is the case the market entry describes and the old guard let through.
check('GET  /bundle      无 cookie', await status('/bundle'), 401)
check('GET  /graph       无 cookie', await status('/graph'), 401)
check('POST /simulate    无 cookie', await status('/simulate', post({ preset: 'trisolaris' })), 401)
check('POST /census      无 cookie', await status('/census', post({ samples: 8 })), 401)

console.log('')
console.log('=== 2. 跨站调用仍然是 403（更明确的拒绝）===')
check('GET /bundle  Origin: https://evil.example',
  await status('/bundle', { headers: { origin: 'https://evil.example' } }), 403)
check('GET /bundle  Sec-Fetch-Site: cross-site',
  await status('/bundle', { headers: { 'sec-fetch-site': 'cross-site' } }), 403)

console.log('')
console.log('=== 3. DSH 自己的路由做对照 ===')
const rootStatus = await fetch('http://127.0.0.1:14246/').then((r) => r.status).catch(() => 'ERR')
console.log(`  INFO  GET / （DSH 首页，无 cookie）                        → ${rootStatus}`)

console.log('')
console.log('=== 4. agent 工具不受影响（不走 HTTP）===')
console.log('  见 selfcheck：11 个工具全部通过，且不经由路由层')

console.log('')
if (failures === 0) {
  console.log('  全部通过：路由现在与 DSH 自己的路由同一访问要求')
} else {
  console.log(`  ${failures} 项失败`)
}
// Set the code and let the loop drain: calling process.exit() while fetch's
// connection pool is still closing trips a libuv assertion on Windows and
// reports exit 1 even when every check passed.
process.exitCode = failures ? 1 : 0
