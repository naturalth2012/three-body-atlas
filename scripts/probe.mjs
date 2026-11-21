/**
 * Development render probe — not shipped with the plugin.
 *
 * Loads `client.js` outside the browser, stubs the module loader and fetch,
 * exposes the internal tab components, and renders every tab against the real
 * engine bundle. Catches element-tree errors without a browser.
 *
 * Run: node scripts/probe.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')

const engine = await import(new URL('../engine.js', import.meta.url).href)
const sim = await import(new URL('../sim.js', import.meta.url).href)
const DATA = engine.bundle()
const SIM = sim.simulate(sim.SIM_PRESETS[0])

/* --- A tiny React stand-in ------------------------------------------------ */
const React = {
  createElement(type, props, ...children) {
    if (type === undefined || type === null) throw new Error('createElement received ' + type)
    const kids = children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false && c !== true)
    return { type, props: props || {}, children: kids }
  },
  Fragment: 'Fragment',
  useState(init) { return [typeof init === 'function' ? init() : init, () => {}] },
  useEffect() {},
  useMemo(fn) { return fn() },
  useReducer(state) { return [state, () => {}] },
  useRef(value) { return { current: value } },
}

const requireFn = (name) => {
  if (name === 'react') return React
  throw new Error('unexpected require: ' + name)
}

/* --- Stub the browser surface -------------------------------------------- */
let spec
globalThis.window = {
  __ModuleLoader__: { load(s) { spec = s } },
  addEventListener() {},
  removeEventListener() {},
}

globalThis.fetch = async (input, init) => {
  const url = new URL(String(input), 'http://local')
  const p = url.pathname
  const q = Object.fromEntries(url.searchParams)
  let body = {}
  let payload = {}
  try { payload = init && init.body ? JSON.parse(init.body) : {} } catch { payload = {} }
  if (p.endsWith('/bundle')) body = DATA
  else if (p.endsWith('/detail')) body = engine.characterDetail(q.id, { maxTier: q.maxTier }) || { error: 'missing' }
  else if (p.endsWith('/place')) body = engine.placeDetail(q.id, { maxTier: q.maxTier }) || { error: 'missing' }
  else if (p.endsWith('/tech')) body = engine.techDetail(q.id, { maxTier: q.maxTier }) || { error: 'missing' }
  else if (p.endsWith('/glossary')) body = engine.glossaryDetail(q.id, { maxTier: q.maxTier }) || { error: 'missing' }
  else if (p.endsWith('/journey')) body = engine.characterJourney(q.id, { maxTier: q.maxTier }) || { error: 'missing' }
  else if (p.endsWith('/concept')) body = engine.conceptGraph({ id: q.id, depth: q.depth, maxTier: q.maxTier }) || { error: 'missing' }
  else if (p.endsWith('/guide')) body = { paths: engine.pathGuide({ maxTier: q.maxTier }) }
  else if (p.endsWith('/graph')) body = engine.buildGraph({})
  else if (p.endsWith('/path')) body = engine.relationPath(q.from, q.to)
  else if (p.endsWith('/search-all')) body = engine.searchAll(q.q || '')
  else if (p.endsWith('/ask')) body = { answer: 'probe', suggestions: engine.suggestions() }
  else if (p.endsWith('/simulate')) body = SIM
  else if (p.endsWith('/sensitivity')) body = sim.sensitivity({ steps: 4000, dt: 0.0015 })
  else if (p.endsWith('/stability')) body = sim.stabilityScan({ samples: 8 })
  else if (p.endsWith('/dark-forest')) body = sim.darkForest({ civs: 20, rounds: 40 })
  else if (p.endsWith('/deterrence')) body = sim.deterrence({})
  return { ok: true, json: async () => body }
}

/* --- Load the client with a probe appended ------------------------------- */
let source = fs.readFileSync(path.join(root, 'client.js'), 'utf8').replace(/\r\n/g, '\n')
const probe = '\n    globalThis.__TBA_PROBE__ = { OverviewTab, PlotTab, CharactersTab, GraphTab, TimelineTab, GameTab, SimTab, OrbitStage, EraStrip, TechTab, PlacesTab, LoreTab, ThemesTab, DiffTab, AskTab, Drawer, AtlasPage, PathFinder, OrbitPanel, SensPanel, ScanPanel, ForestPanel, DeterrencePanel, LineChart, PhasePortrait, FluxChart, CatastrophePanel, ReadingPanel, GuideTab, JourneyTab, ConceptTab, TierPicker, Locked }\n'
const anchor = "\n    return {\n      inject: ['slots'],"
if (!source.includes(anchor)) {
  console.error('probe anchor not found — client.js structure changed')
  process.exit(2)
}
source = source.replace(anchor, probe + anchor)
new Function('window', 'require', source)(globalThis.window, requireFn)

const mod = spec.factory(requireFn)
const T = globalThis.__TBA_PROBE__

/* --- Translator from the module's own ZH strings ------------------------- */
const zhBlock = source.match(/const ZH = \{([\s\S]*?)\n    \}\n\n    const EN/)
const ZH = {}
if (zhBlock) {
  for (const m of zhBlock[1].matchAll(/([A-Za-z][A-Za-z0-9]*):\s*'((?:[^'\\]|\\.)*)'/g)) ZH[m[1]] = m[2]
}
const t = (key, vars) => {
  let s = Object.prototype.hasOwnProperty.call(ZH, key) ? ZH[key] : key
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]))
  return s
}

/* --- Recursive render ---------------------------------------------------- */
let rendered = 0
const errors = []
const seen = new Set()

function render(node, trail) {
  if (node === null || node === undefined || typeof node === 'boolean') return
  if (typeof node === 'string' || typeof node === 'number') return
  if (Array.isArray(node)) { node.forEach((n, i) => render(n, trail + '[' + i + ']')); return }
  if (typeof node.type === 'function') {
    const name = node.type.name || 'Anonymous'
    let out
    try {
      out = node.type(node.props)
    } catch (error) {
      errors.push(trail + ' > ' + name + ' :: ' + error.message)
      return
    }
    rendered++
    seen.add(name)
    if (trail.length > 6000) return
    render(out, trail + ' > ' + name)
    return
  }
  if (node.type === 'Fragment') { render(node.children, trail); return }
  if (typeof node.type === 'string') { render(node.children, trail + ' > ' + node.type); return }
  errors.push(trail + ' :: unknown element type ' + String(node.type))
}

const tabs = [
  'OverviewTab', 'PlotTab', 'CharactersTab', 'GraphTab', 'TimelineTab', 'GameTab',
  'SimTab', 'TechTab', 'PlacesTab', 'LoreTab', 'ThemesTab', 'DiffTab', 'AskTab',
  'GuideTab', 'JourneyTab', 'ConceptTab',
]
for (const name of tabs) {
  const Comp = T[name]
  if (!Comp) { errors.push('missing component: ' + name); continue }
  render(React.createElement(Comp, { data: DATA, t, go() {}, open() {}, onBack() {} }), name)
}

// The simulation sub-panels, with a real integration result in hand.
render(React.createElement(T.OrbitPanel, { presets: DATA.simPresets, t }), 'OrbitPanel')
render(React.createElement(T.SensPanel, { presets: DATA.simPresets, t }), 'SensPanel')
render(React.createElement(T.ScanPanel, { t }), 'ScanPanel')
render(React.createElement(T.ForestPanel, { t }), 'ForestPanel')
render(React.createElement(T.DeterrencePanel, { t }), 'DeterrencePanel')
render(React.createElement(T.OrbitStage, { result: SIM, preset: DATA.simPresets[0], t }), 'OrbitStage')
render(React.createElement(T.EraStrip, { eras: SIM.eras, t }), 'EraStrip')
render(React.createElement(T.PathFinder, { t }), 'PathFinder')

// Analysis charts against a real run: these must render with live data, not
// only in their empty branch.
render(React.createElement(T.LineChart, {
  points: SIM.energyCurve, xOf: (p) => p.t, yOf: (p) => p.drift,
  stroke: 'var(--dsw-alias-state-warn-primary)', labelX: 't = 0', labelY: 'peak',
}), 'LineChart')
render(React.createElement(T.FluxChart, { track: SIM.track, eras: SIM.eras, t }), 'FluxChart')
render(React.createElement(T.PhasePortrait, { phase: SIM.phase, t }), 'PhasePortrait')
render(React.createElement(T.CatastrophePanel, { result: SIM, t, onSeek() {} }), 'CatastrophePanel')
render(React.createElement(T.ReadingPanel, { result: SIM, t }), 'ReadingPanel')

// Journey and concept views depend on fetched payloads, which the stubbed
// effect never resolves. Exercise their render paths directly instead.
const journeyOpen = engine.characterJourney('cheng-xin', { maxTier: 3 })
const journeyLocked = engine.characterJourney('cheng-xin', { maxTier: 1 })
const journeyEmpty = engine.characterJourney('qin-shi-huang')
for (const [label, payload] of [['open', journeyOpen], ['locked', journeyLocked], ['empty', journeyEmpty]]) {
  if (!payload) { errors.push('journey payload missing: ' + label); continue }
  const nodes = payload.nodes || []
  const hasChapter = nodes.some((n) => n.workTitle)
  if (!hasChapter && nodes.length) errors.push('journey nodes lost their work heading: ' + label)
}
const conceptOpen = engine.conceptGraph({ id: 'dark-forest', depth: 3, maxTier: 3 })
const conceptLocked = engine.conceptGraph({ id: 'dark-forest', depth: 3, maxTier: 0 })
const conceptOverview = engine.conceptGraph({})
if (!conceptOpen || !conceptLocked || !conceptOverview) errors.push('concept payload missing')
else {
  if (conceptLocked.nodes.filter((n) => n.locked).length === 0) {
    errors.push('concept graph did not lock anything at tier 0')
  }
  if (conceptOverview.root !== null) errors.push('concept overview should have no root')
}

// The page shell in its empty branch.
render(React.createElement(T.AtlasPage, { t, onBack() {} }), 'AtlasPage')

// Drawers for each dossier kind.
const dossierCases = [
  ['character', 'luo-ji'], ['character', 'ye-wenjie'], ['character', 'cheng-xin'],
  ['place', 'trisolaris'], ['tech', 'sophon'], ['glossary', 'dark-forest'],
]
for (const [kind, id] of dossierCases) {
  try {
    render(T.Drawer({ kind, id, data: DATA, t, tier: 3, onClose() {}, onOpen() {} }), 'Drawer(' + kind + ':' + id + ')')
  } catch (error) {
    errors.push('Drawer(' + kind + ':' + id + ') :: ' + error.message)
  }
}

// The locked branch is a different element tree, so render it too: a reader
// who set an early tier must not hit a crash where the full dossier worked.
for (const [kind, id] of dossierCases) {
  try {
    render(T.Drawer({ kind, id, data: DATA, t, tier: 1, onClose() {}, onOpen() {} }), 'DrawerLocked(' + kind + ':' + id + ')')
  } catch (error) {
    errors.push('DrawerLocked(' + kind + ':' + id + ') :: ' + error.message)
  }
}

// Spoiler picker at both ends of its range.
for (const value of [0, 1, 2, 3]) {
  render(React.createElement(T.TierPicker, { tiers: DATA.tiers, value, onChange() {}, t }), 'TierPicker(' + value + ')')
}

// The masked block, with and without a reveal handler.
render(React.createElement(T.Locked, { tier: 3, t }, 'hidden'), 'Locked')
render(React.createElement(T.Locked, { tier: 2, t, onReveal() {} }, 'hidden'), 'Locked(onReveal)')

console.log('function components rendered:', rendered)
console.log('distinct components:', [...seen].sort().join(', '))
console.log('errors:', errors.length)
errors.slice(0, 25).forEach((e) => console.log('  ' + e))
process.exit(errors.length ? 1 : 0)
