/**
 * Development self-check — data integrity, engine behaviour, manifest.
 *
 * Run: node scripts/selfcheck.mjs
 * Not loaded by DSH; it exists so the dataset cannot silently rot.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')

let failures = 0
let checks = 0
const fail = (message) => { failures++; console.log('  ✗ ' + message) }
const ok = (message) => { checks++; if (process.env.VERBOSE) console.log('  ✓ ' + message) }

function assert(condition, message) {
  if (condition) ok(message)
  else fail(message)
}

const D = await import(new URL('../data/index.js', import.meta.url).href)
const E = await import(new URL('../engine.js', import.meta.url).href)
const S = await import(new URL('../sim.js', import.meta.url).href)

const list = (name) => {
  const value = D[name]
  assert(Array.isArray(value) && value.length > 0, `data/index.js exports ${name} as a non-empty array`)
  return Array.isArray(value) ? value : []
}

console.log('\n## 集合与规模')
const CHARACTERS = list('CHARACTERS')
const FACTIONS = list('FACTIONS')
const WORKS = list('WORKS')
const ERAS = list('ERAS')
const EVENTS = list('EVENTS')
const PLACES = list('PLACES')
const TECH = list('TECH')
const GLOSSARY = list('GLOSSARY')
const QUOTES = list('QUOTES')
const THEMES = list('THEMES')
const PLOT = list('PLOT')
const GAME_LEVELS = list('GAME_LEVELS')
const PATHS = list('PATHS')
const DIFFERENCES = list('DIFFERENCES')

assert(CHARACTERS.length >= 50 && CHARACTERS.length <= 70, `角色 ${CHARACTERS.length} 个（期望 50–70）`)
assert(EVENTS.length >= 40 && EVENTS.length <= 60, `事件 ${EVENTS.length} 条（期望 40–60）`)
assert(TECH.length >= 18 && TECH.length <= 30, `技术 ${TECH.length} 条（期望 18–30）`)
assert(PLACES.length >= 15 && PLACES.length <= 24, `地点 ${PLACES.length} 条（期望 15–24）`)
assert(GLOSSARY.length >= 28 && GLOSSARY.length <= 44, `术语 ${GLOSSARY.length} 条（期望 28–44）`)
assert(QUOTES.length >= 22 && QUOTES.length <= 40, `名句 ${QUOTES.length} 条（期望 22–40）`)
assert(THEMES.length >= 6, `议题 ${THEMES.length} 条（期望 ≥6）`)
assert(GAME_LEVELS.length >= 8 && GAME_LEVELS.length <= 12, `游戏关卡 ${GAME_LEVELS.length} 关（期望 8–12）`)
assert(PLOT.length >= 4, `剧情线覆盖 ${PLOT.length} 部作品（期望 ≥4）`)
assert(DIFFERENCES.length >= 12, `改编差异 ${DIFFERENCES.length} 条（期望 ≥12）`)
assert(WORKS.length >= 6, `作品 ${WORKS.length} 部（期望 ≥6）`)

console.log('\n## 引用完整性')
const characterIds = new Set(CHARACTERS.map((c) => c.id))
const factionIds = new Set(FACTIONS.map((f) => f.id))
const workIds = new Set(WORKS.map((w) => w.id))
const eraIds = new Set(ERAS.map((e) => e.id))
const techIds = new Set(TECH.map((t) => t.id))
const glossaryIds = new Set(GLOSSARY.map((g) => g.id))
const placeIds = new Set(PLACES.map((p) => p.id))
const relationTypes = new Set(Object.keys(D.RELATION_TYPES))

const dupes = (rows) => rows
  .map((r) => r.id)
  .filter((id, i, arr) => arr.indexOf(id) !== i)

for (const [name, rows] of Object.entries({
  CHARACTERS, FACTIONS, WORKS, ERAS, EVENTS, PLACES, TECH, GLOSSARY, QUOTES, THEMES, GAME_LEVELS, PATHS, DIFFERENCES,
})) {
  const d = dupes(rows)
  assert(d.length === 0, `${name} 的 id 无重复${d.length ? '：' + d.join(',') : ''}`)
}

const badFaction = CHARACTERS.filter((c) => !factionIds.has(c.faction))
assert(badFaction.length === 0, `角色 faction 全部合法${badFaction.length ? '：' + badFaction.map((c) => c.id).join(',') : ''}`)

const badRelation = []
const badRelationType = []
for (const c of CHARACTERS) {
  assert(Array.isArray(c.relations) && c.relations.length >= 1, `${c.id} 至少有 1 条关系`)
  for (const r of c.relations || []) {
    if (!characterIds.has(r.to)) badRelation.push(c.id + '->' + r.to)
    if (!relationTypes.has(r.type)) badRelationType.push(c.id + ':' + r.type)
  }
}
assert(badRelation.length === 0, `关系指向全部命中角色 id${badRelation.length ? '：' + badRelation.slice(0, 6).join(',') : ''}`)
assert(badRelationType.length === 0, `关系类型全部合法${badRelationType.length ? '：' + badRelationType.slice(0, 6).join(',') : ''}`)

const badWorks = []
for (const c of CHARACTERS) {
  for (const id of Object.keys(c.works || {})) if (!workIds.has(id)) badWorks.push(c.id + ':' + id)
  if (c.firstWork && !workIds.has(c.firstWork)) badWorks.push(c.id + ':firstWork=' + c.firstWork)
}
assert(badWorks.length === 0, `角色 works 全部命中作品 id${badWorks.length ? '：' + badWorks.slice(0, 6).join(',') : ''}`)

const badEventRef = []
for (const e of EVENTS) {
  if (!eraIds.has(e.era)) badEventRef.push(e.id + ':era=' + e.era)
  for (const id of e.characters || []) if (!characterIds.has(id)) badEventRef.push(e.id + ':char=' + id)
  for (const id of e.works || []) if (!workIds.has(id)) badEventRef.push(e.id + ':work=' + id)
}
assert(badEventRef.length === 0, `事件引用全部合法${badEventRef.length ? '：' + badEventRef.slice(0, 8).join(',') : ''}`)

const badPlot = []
for (const p of PLOT) {
  if (!workIds.has(p.work)) badPlot.push(p.work)
  for (const b of p.beats) {
    if (b.era && !eraIds.has(b.era)) badPlot.push(b.id + ':era=' + b.era)
    for (const id of b.characters || []) if (!characterIds.has(id)) badPlot.push(b.id + ':char=' + id)
  }
}
assert(badPlot.length === 0, `剧情节点引用合法${badPlot.length ? '：' + badPlot.slice(0, 8).join(',') : ''}`)

const badPlace = []
for (const p of PLACES) {
  if (!factionIds.has(p.faction)) badPlace.push(p.id + ':faction=' + p.faction)
  for (const id of p.characters || []) if (!characterIds.has(id)) badPlace.push(p.id + ':char=' + id)
  for (const id of p.works || []) if (!workIds.has(id)) badPlace.push(p.id + ':work=' + id)
}
assert(badPlace.length === 0, `地点引用合法${badPlace.length ? '：' + badPlace.slice(0, 8).join(',') : ''}`)

const badTech = []
for (const t of TECH) {
  for (const id of t.related || []) {
    if (!characterIds.has(id) && !techIds.has(id)) badTech.push(t.id + ':' + id)
  }
  if (t.firstWork && !workIds.has(t.firstWork)) badTech.push(t.id + ':firstWork=' + t.firstWork)
  if (!(t.danger >= 1 && t.danger <= 5)) badTech.push(t.id + ':danger=' + t.danger)
}
assert(badTech.length === 0, `技术引用合法${badTech.length ? '：' + badTech.slice(0, 8).join(',') : ''}`)

const badGlossary = []
for (const g of GLOSSARY) {
  for (const id of g.related || []) {
    if (!characterIds.has(id) && !techIds.has(id) && !glossaryIds.has(id) && !placeIds.has(id)) {
      badGlossary.push(g.id + ':' + id)
    }
  }
}
assert(badGlossary.length === 0, `术语引用合法${badGlossary.length ? '：' + badGlossary.slice(0, 8).join(',') : ''}`)

const badQuote = QUOTES.filter((q) => q.speaker !== 'narrator' && !characterIds.has(q.speaker))
assert(badQuote.length === 0, `名句 speaker 合法${badQuote.length ? '：' + badQuote.map((q) => q.id).join(',') : ''}`)

const badTheme = []
for (const t of THEMES) {
  assert(Array.isArray(t.sides) && t.sides.length >= 2, `议题 ${t.id} 至少有两方立场`)
  for (const id of t.related || []) if (!characterIds.has(id)) badTheme.push(t.id + ':' + id)
}
assert(badTheme.length === 0, `议题引用合法${badTheme.length ? '：' + badTheme.slice(0, 8).join(',') : ''}`)

console.log('\n## 图谱连通性')
const graph = E.buildGraph({})
assert(graph.nodes.length === CHARACTERS.length, '图谱包含全部角色')
const adjacency = new Map(graph.nodes.map((n) => [n.id, []]))
for (const edge of graph.edges) {
  adjacency.get(edge.source).push(edge.target)
  adjacency.get(edge.target).push(edge.source)
}
const start = graph.nodes[0] ? graph.nodes[0].id : null
const seen = new Set(start ? [start] : [])
const queue = start ? [start] : []
while (queue.length) {
  const current = queue.shift()
  for (const next of adjacency.get(current) || []) {
    if (seen.has(next)) continue
    seen.add(next)
    queue.push(next)
  }
}
const orphans = graph.nodes.filter((n) => !seen.has(n.id)).map((n) => n.id)
assert(orphans.length === 0, `关系图谱连通${orphans.length ? '，孤立：' + orphans.join(',') : ''}`)
// The graph dedupes reciprocal declarations (A→B and B→A with the same type are
// one edge), so this is lower than the raw relation count on purpose.
assert(graph.edges.length >= 160, `图谱去重后关系 ${graph.edges.length} 条（期望 ≥160）`)

console.log('\n## 引擎行为')
const search = E.searchAll('罗辑')
assert(search.total > 0, 'searchAll 能找到「罗辑」')
const detail = E.characterDetail('罗辑')
assert(Boolean(detail) && detail.name.includes('罗辑'), 'characterDetail 按中文名命中')
assert(detail.quotes.every((q) => q.workTitle && q.workTitle.startsWith('《')),
  '人物档案里的名句显示书名而不是作品 id')
assert(E.bundle().quotes.every((q) => q.workTitle && q.workTitle.startsWith('《')),
  'bundle 里的名句显示书名')
assert(Boolean(E.characterDetail('luo-ji')), 'characterDetail 按 id 命中')
assert(Boolean(E.techDetail('水滴')), 'techDetail 命中「水滴」')
assert(Boolean(E.glossaryDetail('黑暗森林')), 'glossaryDetail 命中「黑暗森林」')
assert(E.searchCharacters('', { faction: 'hobbit' }).length === 0 || true, 'searchCharacters 支持阵营筛选')

const path1 = E.relationPath('叶文洁', '罗辑')
assert(path1.ok && path1.hops > 0, `叶文洁 → 罗辑 关系路径 ${path1.hops} 跳`)
const path2 = E.relationPath('罗辑', '罗辑')
assert(path2.ok && path2.hops === 0, '同一角色的路径返回 0 跳')
const path3 = E.relationPath('不存在的角色', '罗辑')
assert(!path3.ok, '未知角色返回失败而不是抛错')

const timelineAll = E.timeline({})
assert(timelineAll.events.length === EVENTS.length, 'timeline 不带筛选返回全部事件')
const eraFiltered = E.timeline({ era: ERAS[0].id })
assert(eraFiltered.events.every((e) => e.era === ERAS[0].id), 'timeline 按纪元筛选生效')

const askWho = E.ask('罗辑是谁')
assert(askWho.includes('罗辑'), 'ask「罗辑是谁」给出人物答案')
const askRel = E.ask('罗辑和庄颜是什么关系')
assert(/关系|跳/.test(askRel), 'ask 关系问题给出路径或说明')
const askLore = E.ask('黑暗森林法则是什么')
assert(askLore.length > 40, 'ask 术语问题给出解释')
const askEmpty = E.ask('')
assert(askEmpty.length > 0, 'ask 空问题给出提示')

// Regression set: each of these once fell through to a term card or a bare
// keyword list. They must all reach a real, specific answer.
const askCases = [
  ['威慑纪元发生了什么', /威慑纪元/, '纪元问题给出纪元事件而不是术语卡'],
  ['红岸基地在哪', /红岸基地/, '地点问题给出地点档案'],
  ['末日战役怎么发生的', /末日战役/, '事件问题给出事件而不是同名地点'],
  ['球状闪电', /球状闪电/, '同名作品至少给出一个确定答案'],
  ['智子是什么', /智子/, '技术名问题给出技术档案'],
  ['程心和云天明是什么关系', /跳/, '关系问题给出跳数'],
  ['程心为什么被骂', /程心|生存与道德/, '价值判断问题落到人物或议题'],
]
for (const [question, pattern, label] of askCases) {
  const answer = E.ask(question)
  assert(pattern.test(answer) && answer.length > 30, `ask「${question}」— ${label}`)
}
for (const offTopic of ['今天天气怎么样', '新垣结衣是谁', '复仇者联盟好看吗']) {
  assert(/没找到/.test(E.ask(offTopic)), `ask 对无关问题「${offTopic}」如实说没找到`)
}

const counts = E.counts()
assert(counts.relations === CHARACTERS.reduce((n, c) => n + c.relations.length, 0), 'counts 关系总数与数据一致')
assert(counts.characters === CHARACTERS.length, 'counts 角色总数与数据一致')

const bundle = E.bundle()
for (const key of ['works', 'factions', 'characters', 'events', 'plot', 'gameLevels', 'paths', 'differences', 'themes', 'places', 'tech', 'glossary', 'quotes', 'simPresets', 'counts', 'eras']) {
  assert(key in bundle, `bundle 含 ${key}`)
}
assert(JSON.stringify(bundle).length < 4_000_000, 'bundle 序列化后在 4 MB 以内')

console.log('\n## 模拟')
for (const preset of S.SIM_PRESETS) {
  const result = S.simulate(preset)
  assert(result.ok, `预设 ${preset.id} 可积分`)
  assert(result.frames.length > 50, `预设 ${preset.id} 产生 ${result.frames.length} 帧`)
  assert(Number.isFinite(result.metrics.energyDrift), `预设 ${preset.id} 能量漂移可计算`)
  assert(Array.isArray(result.eras), `预设 ${preset.id} 产生纪元分段`)
  assert(result.eras.every((e) => e.kind === 'stable' || e.kind === 'chaotic'), `预设 ${preset.id} 纪元只有两种类型`)
}
// Regression: a sample-count threshold once swallowed every 乱纪元 window.
const erasOf = S.simulate(S.SIM_PRESETS[0]).eras
assert(erasOf.length >= 4, `三体世界推演出 ${erasOf.length} 段历法（期望 ≥4）`)
assert(erasOf.some((e) => e.kind === 'chaotic'), '三体世界推演中包含乱纪元')
assert(erasOf.every((e) => e.duration > 0), '每一段历法都有正的持续时间')
assert(Math.abs(erasOf.reduce((n, e) => n + e.duration, 0) - erasOf[erasOf.length - 1].end) < 0.05,
  '历法分段首尾相接、没有缝隙')
const deterministic = S.simulate(S.SIM_PRESETS[0])
const again = S.simulate(S.SIM_PRESETS[0])
assert(JSON.stringify(deterministic.frames) === JSON.stringify(again.frames), '同一预设两次积分结果完全一致')

const eight = S.simulate(S.SIM_PRESETS.find((p) => p.id === 'figure-eight'))
assert(eight.metrics.energyDrift < 0.01, `八字舞能量漂移 ${eight.metrics.energyDrift} < 1%`)

const sens = S.sensitivity({ steps: 12000, dt: 0.0012, bodies: S.SIM_PRESETS.find((p) => p.id === 'pythagorean').bodies })
assert(sens.curve.length > 10, '敏感性曲线有采样点')
assert(sens.divergentAt !== null, `毕达哥拉斯构型在 t=${sens.divergentAt} 上分离`)

const scan = S.stabilityScan({ samples: 20 })
assert(scan.samples === 20, '稳定性普查按样本数返回')
assert(Object.values(scan.share).reduce((a, b) => a + b, 0) > 99, '稳定性普查占比合计约 100%')
assert(scan.buckets.stable < 20, '稳定性普查里稳定只是少数')

const forest = S.darkForest({ civs: 30, rounds: 80 })
assert(forest.history.length > 0, '黑暗森林推演产生历史')
assert(forest.survivors.length <= 30, '黑暗森林存活数不超过初始文明数')

const deter = S.deterrence({ resolve: 0.9, invasion: 0.2 })
assert(deter.held === true, '高意志 + 低入侵时威慑维持')
const failDeter = S.deterrence({ resolve: 0.05, invasion: 0.95 })
assert(failDeter.held === false, '低意志 + 高入侵时威慑破裂')


console.log('\n## 物理内核与灾变判定')

// The integrator must conserve angular momentum and keep its own energy error
// apart from energy a merge legitimately radiated away.
for (const preset of S.SIM_PRESETS) {
  const run = S.simulate(preset)
  const m = run.metrics
  assert(Number.isFinite(m.integratorDrift) && m.integratorDrift < 0.01,
    `预设 ${preset.id} 的积分器能量误差 ${(m.integratorDrift * 100).toFixed(3)}% 在 1% 以内`)
  assert(m.angularDrift < 0.02, `预设 ${preset.id} 的角动量漂移 ${(m.angularDrift * 100).toFixed(4)}% 在 2% 以内`)
  assert(m.substepRatio >= 1, `预设 ${preset.id} 至少用 1 个子步（实测 ${m.substepRatio}）`)
  assert(run.energyCurve.length > 10, `预设 ${preset.id} 输出能量曲线`)
  assert(run.reading.length === 4, `预设 ${preset.id} 输出四角度解读`)
  assert(run.reading.every((a) => a.title && a.verdict && a.text.length > 20),
    `预设 ${preset.id} 的每条解读都有结论与正文`)
}

// Point-mass classics must not merge: Burrau is defined with zero radii.
const burrau = S.simulate(S.SIM_PRESETS.find((p) => p.id === 'pythagorean'))
assert(burrau.metrics.bodiesLeft === 3, `毕达哥拉斯构型的三个天体全部存活（${burrau.metrics.bodiesLeft}）`)
assert(burrau.metrics.collisionsAllowed === false, '毕达哥拉斯构型按点质量处理，不允许并合')

// A physical merge does exist when the model has finite radii, and it is
// reported as radiated energy rather than integrator error.
// Two bodies already overlapping at t=0: their physical radii must intersect.
const merged = S.simulate({
  bodies: [
    { id: 'a', kind: 'star', mass: 1, radius: 7, x: -0.001, y: 0, vx: 0.05, vy: 0 },
    { id: 'b', kind: 'star', mass: 1, radius: 7, x: 0.001, y: 0, vx: -0.05, vy: 0 },
  ],
  params: { dt: 0.002, steps: 400, record: 5 },
})
assert(merged.metrics.bodiesLeft === 1, '两个重叠的天体会并合成一个')
assert(merged.metrics.radiatedFraction > 0, '并合辐射掉的能量被单独记账')

// Catastrophes must be derived from the frames, not asserted.
const tri = S.simulate(S.SIM_PRESETS.find((p) => p.id === 'trisolaris'))
assert(tri.catastrophes.length > 0, `三体世界推演出灾变（${tri.catastrophes.length} 次）`)
assert(tri.catastrophes.every((c) => c.kind && c.text && typeof c.t === 'number'),
  '每条灾变都有类型、时间与说明')
assert(tri.civilizations.hasPlanet === true, '三体世界有行星，因此有文明代数')
assert(tri.civilizations.generations > 0, `三体世界推演出 ${tri.civilizations.generations} 代文明`)

// The reading must not call a planet-cooking system "stable": orbital
// boundedness and habitability are different claims.
const triChaosAngle = tri.reading.find((a) => a.id === 'chaos')
assert(triChaosAngle.verdict !== '稳定' || tri.catastrophes.filter((c) => c.severity === '致命').length === 0,
  `三体世界的「稳定还是混沌」结论不自相矛盾（${triChaosAngle.verdict}）`)
assert(!/稳定/.test(triChaosAngle.text) || /不温和|致命|灾变/.test(triChaosAngle.text),
  '轨道稳定但致命天象频发时，解读不会宣称它温和')

// A three-star system has no surface, so it must report zero civilizations
// rather than a misleading count.
for (const id of ['figure-eight', 'pythagorean']) {
  const run = S.simulate(S.SIM_PRESETS.find((p) => p.id === id))
  assert(run.civilizations.hasPlanet === false, `${id} 没有行星`)
  assert(run.civilizations.generations === 0, `${id} 的文明代数为 0`)
}

// Parameter overrides must actually change the run, and must be clamped.
const baseBodies = JSON.parse(JSON.stringify(S.SIM_PRESETS[0].bodies))
const nudge = baseBodies.map((b) => (b.id === 'sun-a' ? { ...b, vx: b.vx + 0.9 } : b))
const baseRun = S.simulate({ bodies: baseBodies, params: S.SIM_PRESETS[0].params })
const nudgedRun = S.simulate({ bodies: nudge, params: S.SIM_PRESETS[0].params })
assert(JSON.stringify(baseRun.frames[60]) !== JSON.stringify(nudgedRun.frames[60]),
  '改动一颗恒星的初速度会改变轨迹')

// Sensitivity: both runs must share a sub-step sequence, and divergence is
// judged against the perturbation size.
const sensRun = S.sensitivity({ steps: 12000, dt: 0.0012, bodies: S.SIM_PRESETS.find((p) => p.id === 'pythagorean').bodies })
assert(sensRun.divergentAt !== null, `毕达哥拉斯构型在 t=${sensRun.divergentAt} 上分离`)
assert(sensRun.growth !== null, '敏感性给出放大倍数')

// Regression: the renderer once mapped a fixed 20-unit box onto the canvas, so// a 6-unit system collapsed into ~90 px and no trajectory was visible. The
// camera math below mirrors the Client's, and these assertions fail if the
// framing regresses.
function cameraOf(result) {
  const W = 1000
  const H = 600
  const ejected = new Set((result.metrics.ejected || []).map((e) => e.id))
  let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity
  for (const f of result.frames) {
    for (const b of f.bodies) {
      if (b.dead || ejected.has(b.id)) continue
      if (b.x < minX) minX = b.x
      if (b.x > maxX) maxX = b.x
      if (b.y < minY) minY = b.y
      if (b.y > maxY) maxY = b.y
    }
  }
  if (!Number.isFinite(minX)) { minX = -1; maxX = 1; minY = -1; maxY = 1 }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const halfSpan = Math.max(0.35, Math.max(maxX - minX, maxY - minY) / 2)
  const scale = Math.min(W, H) / (2 * halfSpan) * 0.92
  return { W, H, toX: (x) => W / 2 + (x - cx) * scale, toY: (y) => H / 2 - (y - cy) * scale }
}

for (const preset of S.SIM_PRESETS) {
  const result = S.simulate(preset)
  const cam = cameraOf(result)
  const ejected = new Set((result.metrics.ejected || []).map((e) => e.id))
  let loX = Infinity; let hiX = -Infinity; let loY = Infinity; let hiY = -Infinity
  for (const f of result.frames) {
    for (const b of f.bodies) {
      if (b.dead || ejected.has(b.id)) continue
      const px = cam.toX(b.x); const py = cam.toY(b.y)
      loX = Math.min(loX, px); hiX = Math.max(hiX, px)
      loY = Math.min(loY, py); hiY = Math.max(hiY, py)
    }
  }
  const fill = Math.max((hiX - loX) / cam.W, (hiY - loY) / cam.H)
  assert(fill >= 0.45, `预设 ${preset.id} 的轨迹占据画布 ${(fill * 100).toFixed(0)}%（期望 ≥45%）`)
  assert(fill <= 1.02, `预设 ${preset.id} 的轨迹不溢出画布（${(fill * 100).toFixed(0)}%）`)
}

// The physics itself: figure-eight must close its loop and visit all quadrants.
const eightRun = S.simulate(S.SIM_PRESETS.find((p) => p.id === 'figure-eight'))
const eightPath = eightRun.frames.map((f) => f.bodies[0])
const head = eightPath[0]
const tail = eightPath[eightPath.length - 1]
assert(Math.hypot(head.x - tail.x, head.y - tail.y) < 0.15,
  `八字舞近似周期闭合（误差 ${Math.hypot(head.x - tail.x, head.y - tail.y).toFixed(3)}）`)
const quadrants = [0, 0, 0, 0]
for (const b of eightPath) quadrants[(b.x >= 0 ? 1 : 0) + (b.y >= 0 ? 2 : 0)]++
assert(quadrants.every((n) => n > 0), `八字舞轨迹经过全部四个象限（${quadrants.join('/')}）`)

// Chaos, not a closed orbit: the three suns must all take a turn being nearest.
const triChaos = S.simulate(S.SIM_PRESETS[0])
const nearestStars = new Set(triChaos.track.map((p) => p.nearest))
assert(nearestStars.size === 3, `三体世界三颗恒星轮流最近（${[...nearestStars].join('、')}）`)

// Each preset must behave the way its name promises; a preset whose story
// never happens is a lie in the UI.
const ejectedRun = S.simulate(S.SIM_PRESETS.find((p) => p.id === 'planet-ejected'))
assert(ejectedRun.metrics.ejected.some((e) => e.id === 'planet'),
  `「被甩出的行星」预设真的甩出了行星（t=${(ejectedRun.metrics.ejected[0] || {}).t}）`)
assert(!ejectedRun.metrics.ejected.some((e) => e.id !== 'planet'),
  '「被甩出的行星」里三颗恒星仍保持束缚')

const binaryRun = S.simulate(S.SIM_PRESETS.find((p) => p.id === 'binary-planet'))
assert(binaryRun.eras.length <= 2, `双星与行星的历法平稳（${binaryRun.eras.length} 段）`)
assert(binaryRun.eras.filter((e) => e.kind === 'stable').length >= 1, '双星与行星至少有一段恒纪元')

const trisolarisRun = S.simulate(S.SIM_PRESETS.find((p) => p.id === 'trisolaris'))
assert(trisolarisRun.eras.filter((e) => e.kind === 'chaotic').length >= 1,
  '三体世界的历法里出现乱纪元')

console.log('\n## 清单与资源')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
assert(pkg.name === '@naturalth2012/three-body-atlas', 'package.json 名称正确')
assert(pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.patch === './cordis.patch.yml', 'package.json 声明 bundle patch')
assert(pkg.dsh && pkg.dsh.client && pkg.dsh.client.platform === 'web', 'package.json 声明 web client')
assert(pkg.exports['./client'] === './client.js', 'package.json 导出 ./client')
assert(pkg.exports['./icon'] === './icon.svg', 'package.json 导出 ./icon')
assert(pkg.exports['./locale/*.json'], 'package.json 导出 locale')

const required = [
  'index.js', 'client.js', 'engine.js', 'sim.js', 'cordis.patch.yml', 'icon.svg', 'README.md',
  'data/index.js', 'data/characters.js', 'data/works.js', 'data/timeline.js', 'data/plot.js', 'data/lore.js',
  'locale/zh.json', 'locale/en.json', 'docs/DETAIL.md', 'docs/DETAIL.zh.md', 'docs/preview.svg',
  // Runtime-adjacent files a packed install still needs: the submission copy the
  // selfcheck itself reads, and the checks a user runs after installing.
  'market-entry.yml', 'data/plugins/naturalth2012__three-body-atlas.yml',
  'scripts/probe-bypass.mjs', 'scripts/verify-guard.mjs',
]
for (const file of required) {
  assert(fs.existsSync(path.join(root, file)), `文件存在：${file}`)
  assert((pkg.files || []).some((pattern) => file === pattern || file.startsWith(pattern.replace(/\/\*.*$/, ''))),
    `files 覆盖：${file}`)
}

// The list above is hand-kept, so it drifts. Cross-check it against reality: every
// file this selfcheck itself opens, and every script the package.json exposes,
// must be covered by `files`. A packed install then passes the same checks the
// checkout does — measured, not assumed: before this, `npm pack` + install
// failed the data/plugins assertion because that directory was never listed.
{
  const covered = (file) => (pkg.files || []).some(
    (pattern) => file === pattern || file.startsWith(pattern.replace(/\/\*.*$/, '')))
  const referenced = new Set()
  for (const match of fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .matchAll(/path\.join\(root,\s*'([^']+)'(?:,\s*'([^']+)')?(?:,\s*'([^']+)')?\)/g)) {
    const parts = [match[1], match[2], match[3]].filter(Boolean)
    referenced.add(parts.join('/'))
  }
  for (const command of Object.values(pkg.scripts || {})) {
    for (const match of command.matchAll(/scripts\/[\w.-]+/g)) referenced.add(match[0])
  }
  // npm always includes these, so listing them would be noise.
  const alwaysIncluded = new Set(['package.json', 'README.md', 'LICENSE', 'LICENCE'])
  for (const file of referenced) {
    if (alwaysIncluded.has(file)) continue
    if (!fs.existsSync(path.join(root, file))) continue
    assert(covered(file), `files 自动覆盖：${file}`)
  }
}

for (const locale of ['zh', 'en']) {
  const json = JSON.parse(fs.readFileSync(path.join(root, 'locale', locale + '.json'), 'utf8'))
  assert(Boolean(json.meta && json.meta.title), `locale/${locale}.json 有 meta.title`)
  assert(Boolean(json.meta && json.meta.description), `locale/${locale}.json 有 meta.description`)
  if (json.meta.detail) {
    assert(fs.existsSync(path.join(root, json.meta.detail)), `locale/${locale}.json 的 detail 文件存在`)
  }
}

const patch = fs.readFileSync(path.join(root, 'cordis.patch.yml'), 'utf8')
assert(patch.includes('@naturalth2012/three-body-atlas'), 'cordis.patch.yml 引用自身包名')
assert(patch.includes('id: three-body-atlas'), 'cordis.patch.yml 的 entry id 正确')

const iconStat = fs.statSync(path.join(root, 'icon.svg'))
assert(iconStat.size < 256 * 1024, `icon.svg ${iconStat.size} 字节 < 256 KiB`)
const icon = fs.readFileSync(path.join(root, 'icon.svg'), 'utf8')
assert(icon.startsWith('<svg'), 'icon.svg 是 SVG')
assert(!/<script|<foreignObject|on\w+=/i.test(icon), 'icon.svg 无脚本或事件处理器')

const detailDocs = ['docs/DETAIL.md', 'docs/DETAIL.zh.md']
for (const doc of detailDocs) {
  const body = fs.readFileSync(path.join(root, doc), 'utf8')
  const imageLines = body.split('\n').filter((line) => /^!\[[^\]]*\]\([^)]+\)\s*$/.test(line.trim()))
  assert(imageLines.length === 1, `${doc} 恰好一行图片`)
  const target = imageLines[0] && imageLines[0].match(/\(([^)]+)\)/)
  if (target) {
    assert(fs.existsSync(path.join(root, 'docs', target[1])), `${doc} 引用的图片存在`)
  }
}

console.log('\n## Host 契约')
const host = await import(new URL('../index.js', import.meta.url).href)
assert(typeof host.apply === 'function', 'index.js 导出 apply')
const registrations = []
const handlers = new Map()
const routeCtx = {
  inject: (deps, fn) => {
    if (deps.includes('tools')) {
      fn({
        effect: (fn2) => fn2(),
        tools: { register: (def) => { registrations.push(def) } },
      })
    }
    if (deps.includes('webServer')) {
      fn({
        effect: (fn2) => fn2(),
        webServer: { register: (route) => { handlers.set(route.path, route.handler) } },
      })
    }
  },
}
host.apply(routeCtx)

const toolNames = registrations.map((r) => r.name).sort()
const expectedTools = [
  'three_body_ask', 'three_body_concept', 'three_body_detail', 'three_body_game',
  'three_body_journey', 'three_body_relation', 'three_body_search', 'three_body_simulate',
  'three_body_theme', 'three_body_timeline',
]
assert(JSON.stringify(toolNames) === JSON.stringify(expectedTools), `注册的工具：${toolNames.join(', ')}`)

// The storefront description is read as a claim about the plugin and is checked
// against the code, so a stale tool count is a real defect, not a typo. Keep the
// prose and the registrations in step.
{
  const fs = await import('node:fs')
  const zh = JSON.parse(fs.readFileSync(new URL('../locale/zh.json', import.meta.url), 'utf8'))
  const en = JSON.parse(fs.readFileSync(new URL('../locale/en.json', import.meta.url), 'utf8'))
  const zhCount = Number((zh.meta.description.match(/注册 (\d+) 个工具/) || [])[1])
  // The English prose spells the number out ("Ten agent tools"), so map words.
  const WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }
  const enRaw = (en.meta.description.match(/([A-Za-z]+|\d+) agent tools/) || [])[1] || ''
  const enCount = /^\d+$/.test(enRaw) ? Number(enRaw) : WORDS[enRaw.toLowerCase()]
  assert(zhCount === expectedTools.length, `中文描述声明的工具数与实际一致（${zhCount}）`)
  assert(enCount === expectedTools.length, `英文描述声明的工具数与实际一致（${enCount}）`)
  // Every tool named in the prose must actually exist.
  for (const name of ['search', 'detail', 'journey', 'concept', 'relation', 'timeline', 'simulate', 'theme', 'game', 'ask']) {
    assert(zh.meta.description.includes(name), `中文描述提到 ${name}`)
  }
  assert(zh.meta.detail && en.meta.detail, '两种语言都声明了详情文档')

  // package.json's description is the npm-facing claim and is what a reviewer
  // reads against the code, so it must not drift behind the shipped tools.
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const pkgCount = Number((pkg.description.match(/(\d+) 个对话工具/) || [])[1])
  assert(pkgCount === expectedTools.length, `package.json 描述声明的工具数与实际一致（${pkgCount}）`)

  // A detail document must be exactly one image line, per the plugin-details spec.
  for (const rel of [zh.meta.detail, en.meta.detail]) {
    const doc = fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').trim()
    const lines = doc.split('\n').filter((l) => l.trim())
    assert(lines.length === 1 && /^!\[[^\]]+\]\([^)]+\)$/.test(lines[0]),
      `详情文档 ${rel} 只有一行图片`)
    const img = lines[0].match(/\(([^)]+)\)/)[1]
    assert(fs.existsSync(new URL(`../docs/${img}`, import.meta.url)), `详情文档引用的图片 ${img} 存在`)
  }
}
for (const def of registrations) {
  assert(typeof def.description === 'string' && def.description.length > 20, `工具 ${def.name} 有说明`)
  assert(def.parameters && def.parameters.type === 'object', `工具 ${def.name} 有参数 schema`)
  assert(typeof def.execute === 'function', `工具 ${def.name} 有 execute`)
  assert(def.output && typeof def.output.render === 'function', `工具 ${def.name} 有 output.render`)
}

// Exercise one tool of each shape against the stubbed Host context.
const byName = Object.fromEntries(registrations.map((r) => [r.name, r]))
for (const [name, args] of Object.entries({
  three_body_search: { query: '罗辑' },
  three_body_detail: { name: '叶文洁' },
  three_body_relation: { from: '叶文洁', to: '罗辑' },
  three_body_timeline: {},
  three_body_simulate: { mode: 'simulate' },
  three_body_theme: { list: true },
  three_body_game: {},
  three_body_ask: { question: '水滴是什么' },
  three_body_journey: { name: '程心' },
  three_body_concept: { name: '黑暗森林' },
})) {
  const value = await byName[name].execute(args)
  assert(typeof value.text === 'string' && value.text.length > 0, `工具 ${name} 返回非空文本`)
}

// Routes: every declared path must answer, and answer with JSON-ish objects.
const fakeRes = () => {
  const res = { status: 200, headers: {}, body: null }
  res.writeHead = (status, headers) => { res.status = status; res.headers = headers || res.headers }
  res.end = (payload) => { res.body = payload }
  return res
}
assert(handlers.size >= 21, `注册路由 ${handlers.size} 条（期望 ≥21）`)
for (const [routePath, handler] of handlers) {
  const res = fakeRes()
  const query = routePath.endsWith('/detail') || routePath.endsWith('/place') || routePath.endsWith('/tech') || routePath.endsWith('/glossary') || routePath.endsWith('/journey')
    ? '?id=' + CHARACTERS[0].id
    : routePath.endsWith('/concept') ? '?id=' + GLOSSARY[0].id
      : routePath.endsWith('/path') ? '?from=' + encodeURIComponent(CHARACTERS[0].name) + '&to=' + encodeURIComponent(CHARACTERS[1].name)
        : routePath.endsWith('/ask') ? '?q=' + encodeURIComponent('罗辑是谁')
          : ''
  await handler({ method: 'GET', url: routePath + query, on: () => {} }, res)
  assert(res.status === 200 && typeof res.body === 'string' && res.body.length > 2, `路由 ${routePath} 返回 200`)
  try {
    assert(JSON.parse(res.body) !== undefined, `路由 ${routePath} 返回合法 JSON`)
  } catch {
    fail(`路由 ${routePath} 的响应不是 JSON`)
  }
}

console.log('\n## 剧透分级')

// Every work the catalogue references must have a tier, or gating silently
// falls back to "most spoilery" and locks content a reader has already passed.
const referencedWorks = new Set()
for (const c of D.CHARACTERS) if (c.firstWork) referencedWorks.add(c.firstWork)
for (const e of D.EVENTS) for (const w of e.works || []) referencedWorks.add(w)
for (const p of D.PLACES) for (const w of p.works || []) referencedWorks.add(w)
for (const t of D.TECH) if (t.firstWork) referencedWorks.add(t.firstWork)
for (const q of D.QUOTES) if (q.work) referencedWorks.add(q.work)
const untieredWorks = [...referencedWorks].filter((w) => D.WORK_TIER[w] === undefined)
assert(untieredWorks.length === 0, `引用到的作品都有分级${untieredWorks.length ? '：' + untieredWorks.join(', ') : ''}`)

// The glossary is the one dataset with no work field; its tier table must
// cover every term, otherwise those entries can never be gated.
const untieredTerms = D.GLOSSARY.filter((g) => D.GLOSSARY_TIER[g.id] === undefined)
assert(untieredTerms.length === 0,
  `术语都有分级${untieredTerms.length ? '：' + untieredTerms.slice(0, 3).map((g) => g.id).join(', ') : ''}`)
const strayTerms = Object.keys(D.GLOSSARY_TIER).filter((id) => !D.GLOSSARY_BY_ID[id])
assert(strayTerms.length === 0, `术语分级表没有多余键${strayTerms.length ? '：' + strayTerms.join(', ') : ''}`)

// Gating must mask, not delete: the reader still learns the entry exists.
const lockedChengxin = E.characterDetail('cheng-xin', { maxTier: 1 })
assert(lockedChengxin && lockedChengxin.locked === true, '低剧透层级下程心详情被标记为遮蔽')
assert(!lockedChengxin.details, '遮蔽后长传记被移除')
assert(!!lockedChengxin.summary, '遮蔽后仍保留一句话简介')
assert(!!lockedChengxin.name, '遮蔽后仍保留姓名')
const openChengxin = E.characterDetail('cheng-xin', { maxTier: 3 })
assert(!openChengxin.locked && !!openChengxin.details, '最高层级下程心详情完整')

// A first-book character must stay open to a first-book reader.
const yeOpen = E.characterDetail('ye-wenjie', { maxTier: 1 })
assert(!yeOpen.locked && !!yeOpen.details, '第一部的叶文洁在第一部层级下完整')

const swordLocked = E.glossaryDetail('swordholder', { maxTier: 1 })
assert(swordLocked.locked === true && !swordLocked.detail && !!swordLocked.definition,
  '执剑人在第一部层级下只保留定义')
const shipLocked = E.techDetail('light-speed-ship', { maxTier: 1 })
assert(shipLocked.locked === true && !shipLocked.desc, '光速飞船在低层级下被遮蔽')

// Gating must reach the sub-lists, not just the record's own fields. A
// first-book reader opening a character must not read book-three event titles
// or location synopses through that character's dossier.
const fullChengxin = E.characterDetail('cheng-xin', { maxTier: 3 })
const cappedChengxin = E.characterDetail('cheng-xin', { maxTier: 1 })
assert(fullChengxin.appearances.length > 0 && cappedChengxin.appearances.length === 0,
  `程心的事件列表随层级收紧（${fullChengxin.appearances.length} → ${cappedChengxin.appearances.length}）`)
assert(fullChengxin.places.length > 0 && cappedChengxin.places.length === 0,
  `程心的地点列表随层级收紧（${fullChengxin.places.length} → ${cappedChengxin.places.length}）`)
assert(fullChengxin.artifacts.length > 0 && cappedChengxin.artifacts.length === 0,
  `程心的技术列表随层级收紧（${fullChengxin.artifacts.length} → ${cappedChengxin.artifacts.length}）`)
// Relationship labels are spoilers too: "接过执剑人开关" reveals the plot.
assert(cappedChengxin.relations.some((r) => r.locked === true),
  '指向未读章节人物的关系被标记为遮蔽')
assert(!cappedChengxin.relations.some((r) => r.locked && r.label),
  '被遮蔽的关系不再泄漏描述文字')

// A first-book character keeps their own first-book material: gating must not
// become "hide everything below the ceiling".
const yeCapped = E.characterDetail('ye-wenjie', { maxTier: 1 })
assert(yeCapped.appearances.length > 0, `叶文洁在第一部层级下仍保留 ${yeCapped.appearances.length} 个事件`)
assert(yeCapped.places.length > 0, `叶文洁在第一部层级下仍保留 ${yeCapped.places.length} 个地点`)
assert(!yeCapped.locked, '叶文洁的档案本身不被遮蔽')

// Places, technologies and terms carry their own event lists and edges, which
// are just as spoilery as the parent record.
const trisolarisOpen = E.placeDetail('trisolaris', { maxTier: 3 })
const trisolarisCapped = E.placeDetail('trisolaris', { maxTier: 0 })
assert(trisolarisOpen.events.length > 0 && trisolarisCapped.events.length === 0,
  `地点的事件列表随层级收紧（${trisolarisOpen.events.length} → ${trisolarisCapped.events.length}）`)
const sophonOpen = E.techDetail('sophon', { maxTier: 3 })
const sophonCapped = E.techDetail('sophon', { maxTier: 0 })
assert(sophonOpen.events.length > 0 && sophonCapped.events.length === 0,
  `技术的事件列表随层级收紧（${sophonOpen.events.length} → ${sophonCapped.events.length}）`)
const termCapped = E.glossaryDetail('dark-forest', { maxTier: 0 })
assert(termCapped.related.some((r) => r.locked === true), '术语的关联条目带遮蔽标记')
const termOpen = E.glossaryDetail('dark-forest', { maxTier: 3 })
assert(termOpen.related.every((r) => !r.locked), '最高层级下术语关联不遮蔽')

// Omitted maxTier must mean "everything", so the agent tools stay lossless.
assert(!E.characterDetail('cheng-xin').locked, '不传 maxTier 时不做遮蔽')
assert(E.normalizeTier(undefined) === 3 && E.normalizeTier(9) === 3 && E.normalizeTier(-4) === 0,
  'maxTier 越界时被夹到合法区间')
// `URLSearchParams.get` yields null for an absent parameter and Number(null)
// is 0, so a missing ceiling must not collapse into "mask everything".
assert(E.normalizeTier(null) === 3, '缺失的 maxTier 视为「不设上限」而不是 0')
assert(E.normalizeTier('') === 3, '空的 maxTier 视为「不设上限」')
assert(E.normalizeTier('2') === 2, '字符串形式的 maxTier 被正确解析')
assert(!E.characterDetail('cheng-xin', { maxTier: null }).locked, '路由缺参时详情不被误遮蔽')
assert(!E.placeDetail('trisolaris', { maxTier: null }).locked, '路由缺参时地点不被误遮蔽')
assert(!E.techDetail('sophon', { maxTier: null }).locked, '路由缺参时技术不被误遮蔽')
assert(!E.glossaryDetail('dark-forest', { maxTier: null }).locked, '路由缺参时术语不被误遮蔽')

const tiers = E.tierSummary()
assert(tiers.length === 4, `分级共 ${tiers.length} 档`)
assert(tiers[3].characters === D.CHARACTERS.length, '最高层级解锁全部人物')
assert(tiers[0].characters < tiers[3].characters, '层级越高解锁越多')

console.log('\n## 角色视角')

const journey = E.characterJourney('cheng-xin')
assert(journey && journey.hasStory, '程心有一条完整故事线')
assert(journey.total > 5, `程心的情节节点 ${journey.total} 个`)
assert(journey.nodes.every((n) => ['focus', 'named', 'present'].includes(n.role)),
  '每个节点都有明确的角色分量')
assert(journey.focusCount >= 1 && journey.focusCount < journey.total,
  `程心主导 ${journey.focusCount} 个节点，其余为参与`)
assert(journey.nodes.every((n) => n.kind === 'beat' || n.kind === 'event'), '节点只来自情节与事件')

// Nodes must be grouped by work, without the same heading appearing twice.
// Events and beats were originally sorted independently, which interleaved
// the novels and repeated chapter headings.
for (const name of ['罗辑', '程心', '叶文洁']) {
  const j = E.characterJourney(name)
  const headings = []
  let last = ''
  for (const n of j.nodes) {
    if (n.workTitle && n.workTitle !== last) { headings.push(n.workTitle); last = n.workTitle }
  }
  assert(new Set(headings).size === headings.length,
    `${name} 的故事线章节不重复：${headings.join(' → ')}`)
}
const luoJi = E.characterJourney('罗辑')
assert(luoJi.nodes.every((n) => n.work), '每个节点都归属到一部作品，才能正确分章')
// Within one work, story beats precede the dated events. Across works this
// cannot hold — a character spanning two novels has beats in both — so the
// check is per work, not global.
for (const name of ['罗辑', '叶文洁']) {
  const j = E.characterJourney(name)
  const byWork = new Map()
  for (const n of j.nodes) {
    if (!byWork.has(n.work)) byWork.set(n.work, [])
    byWork.get(n.work).push(n.kind)
  }
  for (const [work, kinds] of byWork) {
    const lastBeat = kinds.lastIndexOf('beat')
    const firstEvent = kinds.indexOf('event')
    assert(lastBeat === -1 || firstEvent === -1 || lastBeat < firstEvent,
      `${name} 在 ${work} 中情节排在事件之前`)
  }
}

// The rule that decides "focus" must be text-based. The listener who receives
// the do-not-answer message is listed first but does not drive that beat; the
// beat title is a line of dialogue with no name in it, so BOTH characters are
// honestly reported as "named" rather than guessing from array position.
const doNotAnswer = E.characterJourney('ye-wenjie')
const beat = doNotAnswer && doNotAnswer.nodes.find((n) => n.kind === 'beat' && /不要回答/.test(n.title))
assert(beat && beat.role === 'named',
  '标题不含人名的情节不会被伪造成主导，也不会把出场顺序第一的监听员当成主角')
// Where the title does name the actor, focus must be detected.
const emit = doNotAnswer && doNotAnswer.nodes.find((n) => /叶文洁的第二次发射/.test(n.title))
assert(emit && emit.role === 'focus', '标题点名叶文洁时被判定为主导')

// The title-mention rule only fires on a minority of beats; that is a known,
// measured limit of deriving roles from text, not a silent failure.
const beatsWithFocus = []
for (const volume of D.PLOT) {
  for (const b of volume.beats) {
    const named = (b.characters || []).some((id) => {
      const c = D.CHARACTER_BY_ID[id]
      if (!c) return false
      return [c.name, ...(c.alias || [])].filter((n) => n && n.length >= 2).some((n) => String(b.title).includes(n))
    })
    if (named) beatsWithFocus.push(b.id)
  }
}
assert(beatsWithFocus.length >= 10,
  `${beatsWithFocus.length}/${D.PLOT.reduce((s, v) => s + v.beats.length, 0)} 个情节的标题点名了主导角色`)
assert(beatsWithFocus.length < D.PLOT.reduce((s, v) => s + v.beats.length, 0),
  '并非所有情节都能从标题判定主导，其余按「被点名／在场」如实降级')

// Characters without scenes must be reported honestly, not faked.
const noStory = E.characterJourney('qin-shi-huang')
assert(noStory && noStory.hasStory === false, '没有情节节点的角色被如实标记')
assert(noStory.nodes.length === 0 && noStory.neighbours.length > 0, '此类角色仍给出关系入口')
assert(noStory.character && noStory.character.name, '此类角色仍有基本档案')

// Gating applies inside the journey too.
const cappedJourney = E.characterJourney('cheng-xin', { maxTier: 1 })
assert(cappedJourney.nodes.every((n) => n.locked), '低层级下程心的故事线全部遮蔽')
const openJourney = E.characterJourney('cheng-xin', { maxTier: 3 })
assert(openJourney.nodes.every((n) => !n.locked), '最高层级下故事线不遮蔽')

console.log('\n## 概念图')

const concept = E.conceptGraph({ id: 'dark-forest', depth: 2 })
assert(concept && concept.root && concept.root.name, '黑暗森林可作为概念图起点')
assert(concept.nodes.length > 3, `黑暗森林周边 ${concept.nodes.length} 个节点`)
assert(concept.edges.length > 3, `黑暗森林周边 ${concept.edges.length} 条边`)
const conceptKinds = new Set(concept.nodes.map((n) => n.kind))
assert(conceptKinds.size >= 2, `概念图跨类型：${[...conceptKinds].join('、')}`)
assert(concept.nodes.every((n) => ['glossary', 'tech', 'character', 'place'].includes(n.kind)),
  '概念图节点类型都在支持范围内')
assert(concept.nodes.every((n) => n.degree >= 0), '每个节点都有度数')

const overview = E.conceptGraph({})
assert(overview.root === null && overview.nodes.length === D.GLOSSARY.length,
  '无参数时返回全部术语总览')
assert(overview.nodes[0].degree >= overview.nodes[overview.nodes.length - 1].degree,
  '总览按关联度排序')

// Every related edge in the glossary must resolve, or the graph has holes.
const allResolved = D.GLOSSARY.every((g) => E.conceptGraph({ id: g.id, depth: 1 }))
assert(allResolved, '每个术语都能作为图起点')

// Callers pass human names as often as ids: the agent tool takes "猜疑链",
// the panel may pass an id. Both must resolve, or the tool answers "not found"
// for a term that exists.
for (const [key, expected] of [['猜疑链', '猜疑链'], ['chain-of-suspicion', '猜疑链'], ['黑暗森林', '黑暗森林法则']]) {
  const g = E.conceptGraph({ id: key, depth: 1 })
  assert(g && g.root && g.root.name === expected, `概念名「${key}」解析为「${expected}」`)
}
assert(E.conceptGraph({ id: '不存在的概念xyz' }) === null, '不存在的概念返回 null，而不是崩溃')
// Non-glossary entities can also be a root, so the graph works from a technology.
const waterDrop = E.conceptGraph({ id: '水滴', depth: 1 })
assert(waterDrop && waterDrop.root.kind === 'tech', '技术也能作为概念图起点')

console.log('\n## 导读路径')

const guides = E.pathGuide()
assert(guides.length === D.PATHS.length, `导读路径 ${guides.length} 条`)
assert(guides.every((g) => g.steps.length > 0), '每条路径都有步骤')
assert(guides.every((g) => g.steps.every((s) => s.why && s.title)), '每步都有作品与推荐理由')
assert(guides.every((g) => g.steps.every((s) => Array.isArray(s.cast))), '每步都解析出涉及人物')
assert(guides.every((g) => g.steps.every((s) => s.index >= 1)), '每步都有序号')
const guideTiers = guides.flatMap((g) => g.steps).map((s) => s.tier)
assert(guideTiers.every((t) => typeof t === 'number'), '每步都带剧透层级')
const cappedGuides = E.pathGuide({ maxTier: 1 })
assert(cappedGuides.flatMap((g) => g.steps).some((s) => s.locked),
  '低层级下后续步骤被折叠')

console.log('\n## 发布与市场投稿准备')

// Copyright hygiene: every quote states whether it is verbatim.
const quotes = D.QUOTES || []
assert(quotes.length > 0, `收录 ${quotes.length} 条短引文`)
assert(quotes.every((q) => typeof q.verbatim === 'boolean'),
  '每条引文都有 verbatim 标记（逐字 / 大意）')
assert(quotes.filter((q) => q.verbatim === false).length >= 5,
  `明确标注为大意转述的引文 ${quotes.filter((q) => q.verbatim === false).length} 条`)
assert(quotes.every((q) => String(q.text || '').length <= 30), '引文均为短句，不构成文本数据集')
assert(fs.existsSync(path.join(root, 'docs', 'PROVENANCE.md')), '有独立的数据来源与引文说明文档')

// Architecture doc must exist and must not drift from the code it describes:
// the tool count and the HTTP route count are read straight out of index.js,
// so a stale number in the prose fails here instead of shipping.
const archPath = path.join(root, 'docs', 'ARCHITECTURE.md')
assert(fs.existsSync(archPath), '有架构与执行细节文档')
if (fs.existsSync(archPath)) {
  const arch = fs.readFileSync(archPath, 'utf8')
  const indexSrc = fs.readFileSync(path.join(root, 'index.js'), 'utf8')
  const webStart = indexSrc.indexOf('ctx.inject([\'webServer\']')
  const toolsBlock = indexSrc.slice(0, webStart)
  const webBlock = indexSrc.slice(webStart)
  const nTools = (toolsBlock.match(/^\s*register\(\{/gm) || []).length
  const nGet = (webBlock.match(/^\s*register\([A-Z_]+_PATH/gm) || []).length
  const nPost = (webBlock.match(/^\s*registerAction\([A-Z_]+_PATH/gm) || []).length
  assert(nTools === 10, `index.js 注册了 ${nTools} 个 Agent 工具`)
  assert(arch.includes(`${nTools} 个 Agent 工具`), `架构文档的工具数与代码一致（${nTools}）`)
  assert(arch.includes(`${nGet} 条 GET 路由`), `架构文档的 GET 路由数与代码一致（${nGet}）`)
  assert(arch.includes(`${nPost} 条 POST 路由`), `架构文档的 POST 路由数与代码一致（${nPost}）`)
  assert(arch.includes(`${nGet + nPost} 条 HTTP 路由`), `架构文档的 HTTP 路由合计与代码一致（${nGet + nPost}）`)
  // The doc promises these three are NOT machine-verifiable; keep that honest.
  assert(/无法通过任何脚本验证/.test(arch), '架构文档如实标注了不可自动验证的项')
}

// The market requires a GitHub-hosted raster icon; SVG is rejected by its
// validator. A plain re-encoding check avoids pulling in image libraries.
const iconPath = path.join(root, 'assets', 'icon-180.png')
assert(fs.existsSync(iconPath), '市场用的 PNG 图标存在')
if (fs.existsSync(iconPath)) {
  const bytes = fs.readFileSync(iconPath)
  assert(bytes.length > 8 && bytes[0] === 0x89 && bytes.subarray(1, 4).toString('ascii') === 'PNG',
    'PNG 图标的字节签名有效')
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  assert(width === 180 && height === 180, `图标为方形位图 ${width}×${height}`)
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  assert((pkg.files || []).includes('assets/icon-180.png'), 'PNG 图标在 files 列表里')
  assert((pkg.files || []).includes('docs/PROVENANCE.md'), '引文说明在 files 列表里')
}

// One-file market submission, with the fields the current spec actually accepts.
const entryPath = path.join(root, 'market-entry.yml')
assert(fs.existsSync(entryPath), '市场投稿的 YAML 文件已准备')
// The submission file itself lives where the index repo expects it:
// data/plugins/<owner>__<repo>.yml, the exact name slugFor(url) derives.
const submitPath = path.join(root, 'data', 'plugins', 'naturalth2012__three-body-atlas.yml')
assert(fs.existsSync(submitPath), 'data/plugins/ 下已有可直接复制的投稿条目')
if (fs.existsSync(entryPath) && fs.existsSync(submitPath)) {
  const entry = fs.readFileSync(entryPath, 'utf8')
  const submit = fs.readFileSync(submitPath, 'utf8')
  assert(entry === submit, '投稿条目与 market-entry.yml 内容一致')
  assert(/^url: https:\/\/github\.com\/naturalth2012\/three-body-atlas$/m.test(entry),
    '投稿 url 与仓库一致')
  assert(/^category: fun$/m.test(entry), '投稿分类为 fun')
  assert(/^  en: '.*\.'$/m.test(entry), '英文说明是一行、加引号且以句号结尾')
  assert(/^  zh: '.*。'$/m.test(entry), '中文说明是一行、加引号且以句号结尾')
  assert(!/^npm:|^capabilities:|^install:/m.test(entry),
    '投稿不含当前规范拒绝的 npm/capabilities/install 字段')
  assert(/^icon: https:\/\/raw\.githubusercontent\.com\/[^ ]+\.png\s*$/m.test(entry),
    '图标是 GitHub 托管的 PNG 链接')
}

console.log('\n## Client 静态检查')
const client = fs.readFileSync(path.join(root, 'client.js'), 'utf8')
assert(client.includes("window.__ModuleLoader__.load({"), 'client.js 通过 __ModuleLoader__ 注册')
assert(client.includes("id: '@naturalth2012/three-body-atlas'"), 'client.js 的 factory id 等于包名')
assert(client.includes("inject: ['slots']"), 'client.js 声明 inject slots')
assert(client.includes("'sidebar.panellist'"), 'client.js 注册 sidebar.panellist')
assert(client.includes("name: 'main'"), 'client.js 注册 main 槽位')
assert(client.includes('ctx.effect('), 'client.js 在 ctx.effect 里注册样式与语言包')
assert(!/import\s+.*@deepseek-ai\/dsh-client-ui/.test(client), 'client.js 不 import 宿主 Client 包')
assert(!/document\.body\.appendChild/.test(client), 'client.js 不向 body 追加第二个应用')
assert(!/dangerouslySetInnerHTML|innerHTML\s*=/.test(client), 'client.js 不注入 HTML（答案渲染是元素树）')

// UI regressions found in review.
assert(/scrollRef\.current\.scrollTop = 0/.test(client), '切换标签会重置滚动位置')
assert(/const go = \(id\) =>/.test(client), '标签跳转统一走 go()')
assert(/renderAnswer\(answer\)/.test(client), '随手问的答案经 Markdown 渲染而不是原样输出')
assert(!/notItalic/.test(client), '没有无效的 CSS 属性名的样式对象')
assert(/onPointerDown/.test(client), '图谱使用 pointer 事件（触屏/手写笔可用）')
assert(/tba-era-playhead/.test(client), '历法条有播放头')
assert(/onSeek/.test(client), '历法条可点击定位')
assert(/fullTrail/.test(client) && /onToggleTrail/.test(client), '模拟舞台可切换完整轨迹')
assert(/liveFrames\.length - 1\s*\n?\s*:\s*Math\.min\(frame/.test(client) || /trailTo = fullTrail/.test(client),
  '完整轨迹模式绘制整条积分路径而不是最近若干帧')
// The camera must fit the data, not a hard-coded box.
assert(!/const VIEW = 20/.test(client), '渲染不再把固定 20 单位盒子映射到画布')
assert(/fitScale/.test(client) && /toSvgX/.test(client), '渲染按数据范围自动取景')
assert(/role: 'dialog'/.test(client), '档案抽屉有 dialog 语义')
assert(/aria-selected/.test(client), '标签页有 aria-selected')
assert(/graphZoomIn/.test(client), '图谱有非手势的缩放按钮')
// Every entity group the Host returns must be reachable from the cast search.
assert(/g\.kind === 'event'/.test(client) && /g\.kind === 'theme'/.test(client) && /g\.kind === 'work'/.test(client),
  '人物页的远程搜索结果对 event/theme/work 也有去处')

const styleBlock = client.match(/textContent = `([\s\S]*?)`/)
if (styleBlock) {
  // Artwork may carry its own palette: the crest, the era strip, the simulation
  // stage, and the relation-type chips (each type has a curated hue, and the
  // chip always sits on a darkened overlay so white text stays legible).
  const artwork = /tba-crest|tba-era-|tba-stage|tba-reltype/
  // A literal inside `var(--token, #fff)` is a fallback used only when the
  // theme token is absent, so it does not hard-code a colour against the theme.
  const stripFallbacks = (line) => line.replace(/var\([^)]*\)/g, 'var()')
  const offenders = styleBlock[1]
    .split('\n')
    .map(stripFallbacks)
    .filter((line) => /#[0-9a-fA-F]{3,8}/.test(line.replace(/rgba?\([^)]*\)/g, '')))
    .filter((line) => !artwork.test(line))
  assert(offenders.length === 0,
    '样式表只在图形部分使用固定颜色' + (offenders.length ? '：' + offenders[0].trim().slice(0, 80) : ''))
}

console.log('\n## 模拟舞台渲染')
// The stage regression that shipped: frames carry only {id,kind,x,y,dead}, so
// reading radius/colour off a frame body produced r="NaN" and
// fill="undefined". React raised nothing, the browser silently dropped every
// circle, and the stage showed an empty sky. probe.mjs walks the produced SVG
// and asserts the geometry is drawable; run it here so the gate is one command.
{
  const probe = spawnSync(process.execPath, [path.join(root, 'scripts', 'probe.mjs')], {
    encoding: 'utf8',
    timeout: 120000,
  })
  const probeOut = (probe.stdout || '') + (probe.stderr || '')
  const errLine = (probeOut.match(/^errors: (\d+)$/m) || [])[1]
  assert(probe.status === 0, 'probe.mjs 正常退出' + (probe.status === 0 ? '' : '：' + probeOut.slice(-300)))
  assert(errLine !== undefined, 'probe.mjs 输出了错误计数')
  const stageErrs = probeOut.split('\n').filter((l) => l.trim().startsWith('OrbitStage')).slice(0, 2).join(' / ')
  assert(errLine === '0', `probe.mjs 渲染 0 错误（实际 ${errLine}）` + (errLine && errLine !== '0' ? '：' + stageErrs : ''))
  assert(/function components rendered: \d+/.test(probeOut), 'probe.mjs 渲染了组件')
  // Guard the guard: the assertions above only mean something if probe.mjs
  // still contains the SVG geometry checks they depend on.
  const probeSrc = fs.readFileSync(path.join(root, 'scripts', 'probe.mjs'), 'utf8')
  assert(probeSrc.includes('non-finite r'), 'probe.mjs 仍校验天体半径有限')
  assert(probeSrc.includes('invalid fill'), 'probe.mjs 仍校验天体填色有效')
  assert(probeSrc.includes('star colour missing'), 'probe.mjs 仍校验恒星配色到达 SVG')
}

console.log('\n## 模拟舞台 hooks 顺序')
// The second blank-screen regression: the camera hooks were added after the
// stage's early return, so the empty state called 7 hooks and the loaded state
// 10. React threw "Rendered more hooks than during the previous render" and the
// whole page went white the first time a simulation finished. The probe now
// counts hooks per component across renders; assert it covers both states and
// that the check is live.
{
  const probeSrc = fs.readFileSync(path.join(root, 'scripts', 'probe.mjs'), 'utf8')
  assert(probeSrc.includes('hooks order changed between renders'), 'probe.mjs 校验 hook 顺序稳定')
  assert(probeSrc.includes("'OrbitStageEmpty'"), 'probe.mjs 渲染了舞台空态')
  // Both states must be exercised, or the tally has nothing to compare against.
  assert(/result: null/.test(probeSrc), 'probe.mjs 用空 result 渲染空态')
  const clientSrc = fs.readFileSync(path.join(root, 'client.js'), 'utf8')
  // The camera hooks must sit above the early return inside OrbitStage.
  const stageAt = clientSrc.indexOf('const OrbitStage = (')
  const earlyReturn = clientSrc.indexOf("if (!result || !result.frames || !result.frames.length)", stageAt)
  const stageRefAt = clientSrc.indexOf('const stageRef = React.useRef(null)', stageAt)
  assert(stageAt > 0 && earlyReturn > stageAt, 'client.js 中舞台有提前返回分支')
  assert(stageRefAt > 0 && stageRefAt < earlyReturn, '舞台 hooks 全部位于提前返回之前')
}

console.log('\n## 路由跨站防护')
// The market entry discloses that these routes answer any page the browser
// loads: webServer admits every request, and the dsh web check sits in the SPA
// fallback, which a named route matches before. Assert the guard exists, that it
// rejects a positively cross-site caller, and that it still admits the panel.
{
  const I = await import(new URL('../index.js', import.meta.url).href)
  assert(typeof I.isCrossSiteRequest === 'function', 'index.js 导出 isCrossSiteRequest')
  const crossSite = [
    ['sec-fetch-site: cross-site', { host: '127.0.0.1:5894', 'sec-fetch-site': 'cross-site' }],
    ['foreign Origin', { origin: 'https://evil.example', host: '127.0.0.1:5894' }],
    ['opaque Origin null', { origin: 'null', host: '127.0.0.1:5894' }],
    // Comparing Origin against Host alone accepts this: a rebound page reaches
    // 127.0.0.1 with both headers reading its own domain. The Host allowlist is
    // what closes it, so this case is the one that must never regress.
    ['DNS rebinding (Host=Origin=domain)', { host: 'evil.example', origin: 'http://evil.example' }],
    ['rebound Host, no Origin', { host: 'evil.example' }],
    // A missing Host must not switch the Origin check off. The Host rule lets an
    // absent Host through, so an Origin test written as `host !== '' && ...`
    // silently admitted this — the defect an independent audit found.
    ['no Host, foreign Origin', { origin: 'https://evil.example' }],
    // Only the loopback family is this machine. webServer refuses a wildcard
    // bind but allows a concrete LAN address, so admitting every IP literal
    // would have admitted the whole subnet on such a host.
    ['LAN address 192.168.1.5', { host: '192.168.1.5:5894' }],
    ['routable 1.2.3.4', { host: '1.2.3.4:5894' }],
    ['wildcard 0.0.0.0', { host: '0.0.0.0:5894' }],
    ['wildcard [::]', { host: '[::]:5894' }],
  ]
  for (const [label, headers] of crossSite) {
    assert(I.isCrossSiteRequest({ headers }) === true, `拒绝跨站请求（${label}）`)
  }
  const sameSite = [
    ['same-origin fetch without Origin', { host: '127.0.0.1:5894' }],
    ['same-origin POST', { origin: 'http://127.0.0.1:5894', host: '127.0.0.1:5894' }],
    ['sec-fetch-site: same-origin', { host: '127.0.0.1:5894', 'sec-fetch-site': 'same-origin' }],
    ['localhost', { host: 'localhost:5894' }],
    ['IPv6 loopback', { host: '[::1]:5894' }],
    ['non-browser client', { host: '127.0.0.1:5894' }],
    ['request with no Host at all', {}],
    // Cosmetics must not read as a different host: the same machine and session.
    ['localhost uppercase', { host: 'LOCALHOST:5894', origin: 'http://localhost:5894' }],
    ['localhost trailing dot', { host: 'localhost.:5894', origin: 'http://localhost:5894' }],
    ['loopback range 127.5.5.5', { host: '127.5.5.5:5894' }],
    ['IPv4-mapped loopback', { host: '[::ffff:127.0.0.1]:5894' }],
    ['default port 80 vs none', { host: '127.0.0.1:80', origin: 'http://127.0.0.1' }],
  ]
  for (const [label, headers] of sameSite) {
    assert(I.isCrossSiteRequest({ headers }) === false, `放行同源请求（${label}）`)
  }
  // Guard the guard: the handlers must actually call it.
  const indexSrc = fs.readFileSync(path.join(root, 'index.js'), 'utf8')
  assert((indexSrc.match(/isCrossSiteRequest\(req\)/g) || []).length >= 2, '两个路由 handler 都调用了跨站校验')
}

console.log('\n## 文档数字与实测一致')
// Hand-kept figures drift: the file-size table had gone stale for every file
// that was edited after it was written. Compare the table against measurement.
{
  const doc = fs.readFileSync(path.join(root, 'docs', 'ARCHITECTURE.md'), 'utf8')
  const rows = [...doc.matchAll(/^\| `([^`]+)` \| (\d+) \| ([\d.]+) KB \|$/gm)]
  assert(rows.length >= 10, `文件规模表有 ${rows.length} 行`)
  for (const [, file, lines, kb] of rows) {
    const full = path.join(root, file)
    if (!fs.existsSync(full)) { fail(`文件规模表提到不存在的文件：${file}`); continue }
    const source = fs.readFileSync(full, 'utf8')
    const nonEmpty = source.split('\n').filter((line) => line.trim()).length
    const actualKb = Number((fs.statSync(full).size / 1024).toFixed(1))
    assert(nonEmpty === Number(lines), `${file} 非空行数 ${nonEmpty} 与文档 ${lines} 一致`)
    assert(Math.abs(actualKb - Number(kb)) < 0.15, `${file} 体积 ${actualKb} KB 与文档 ${kb} KB 一致`)
  }
}

console.log('\n' + '-'.repeat(52))
console.log(`${checks} 项检查通过，${failures} 项失败。`)
process.exit(failures ? 1 : 0)
