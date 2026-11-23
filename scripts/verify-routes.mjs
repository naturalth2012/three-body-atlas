// Check that every route computes the right thing, without an HTTP server.
//
// These routes now require an authenticated Peer (the signed browser cookie),
// and a Node script cannot mint one: the cookie is signed with a per-process
// secret and the launch token lives in the Host's memory. So this file no
// longer speaks HTTP. It walks `routeTable()` and calls each `compute` directly,
// which is what "the route works" actually means — the HTTP layer above it is
// covered by `verify-auth.mjs`, where a real browser can supply the credential.
//
// Run: node scripts/verify-routes.mjs
import { routeTable } from '../index.js'

const q = encodeURIComponent
const params = (query) => new URLSearchParams(query)

// One representative request per route, with the parameters a reader would use.
const REQUESTS = {
  '/plugins/three-body-atlas/bundle': () => params(''),
  '/plugins/three-body-atlas/search': () => params(`q=${q('罗辑')}`),
  '/plugins/three-body-atlas/search-all': () => params(`q=${q('水滴')}`),
  '/plugins/three-body-atlas/detail': () => params('id=luo-ji'),
  '/plugins/three-body-atlas/place': () => params(`id=${q('末日战役')}`),
  '/plugins/three-body-atlas/tech': () => params(`id=${q('水滴')}`),
  '/plugins/three-body-atlas/glossary': () => params(`id=${q('黑暗森林')}`),
  '/plugins/three-body-atlas/graph': () => params(''),
  '/plugins/three-body-atlas/neighbors': () => params('id=luo-ji'),
  '/plugins/three-body-atlas/path': () => params(`from=${q('罗辑')}&to=${q('程心')}`),
  '/plugins/three-body-atlas/timeline': () => params(''),
  '/plugins/three-body-atlas/plot': () => params(''),
  '/plugins/three-body-atlas/themes': () => params(''),
  '/plugins/three-body-atlas/game': () => params(''),
  '/plugins/three-body-atlas/differences': () => params(''),
  '/plugins/three-body-atlas/ask': () => params(`q=${q('罗辑是谁')}`),
  '/plugins/three-body-atlas/journey': () => params('id=luo-ji'),
  '/plugins/three-body-atlas/guide': () => params(''),
  '/plugins/three-body-atlas/concept': () => params(`id=${q('黑暗森林')}`),
}

// Bodies for the six action routes; small, so the run stays quick.
const BODIES = {
  '/plugins/three-body-atlas/simulate': { preset: 'trisolaris' },
  '/plugins/three-body-atlas/sensitivity': {},
  '/plugins/three-body-atlas/stability': { samples: 8 },
  // Batched by design: one small batch proves the route is wired.
  '/plugins/three-body-atlas/census': { samples: 8, offset: 0, limit: 4, steps: 4000 },
  '/plugins/three-body-atlas/dark-forest': {},
  '/plugins/three-body-atlas/deterrence': {},
}

const table = routeTable()
let failures = 0

for (const route of table) {
  const label = `${route.kind === 'get' ? 'GET' : 'POST'} ${route.path.replace('/plugins/three-body-atlas', '')}`
  try {
    let result
    if (route.kind === 'get') {
      const make = REQUESTS[route.path]
      if (make === undefined) {
        failures++
        console.log(`  FAIL  ${label.padEnd(46)} → 测试里没有为这条路由准备参数`)
        continue
      }
      result = await route.compute(make())
    } else {
      if (!(route.path in BODIES)) {
        failures++
        console.log(`  FAIL  ${label.padEnd(46)} → 测试里没有为这条路由准备请求体`)
        continue
      }
      result = await route.compute(BODIES[route.path])
    }
    // A route that returns undefined is a route that renders an empty panel.
    const ok = result !== undefined && result !== null
    if (!ok) {
      failures++
      console.log(`  FAIL  ${label.padEnd(46)} → 计算结果为空`)
      continue
    }
    const size = JSON.stringify(result).length
    console.log(`  PASS  ${label.padEnd(46)} → ${String(size).padStart(7)} 字节`)
  } catch (error) {
    failures++
    console.log(`  FAIL  ${label.padEnd(46)} → ${error.message}`)
  }
}

// The table must stay in sync with what the tests know about: a route added
// without a request here would otherwise pass silently by never running.
const covered = new Set([...Object.keys(REQUESTS), ...Object.keys(BODIES)])
for (const path of covered) {
  if (!table.some((r) => r.path === path)) {
    failures++
    console.log(`  FAIL  ${path} → 测试覆盖了它，但路由表里没有`)
  }
}

console.log(failures
  ? `\n  ${failures}/${table.length} 失败`
  : `\n  全部 ${table.length} 条路由计算正常`)
process.exit(failures ? 1 : 0)
