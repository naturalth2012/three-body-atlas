/**
 * Three-Body Atlas — deterministic simulation core.
 *
 * Three things can be simulated here, all without a browser:
 *  1. `simulate()` — a real Three-Body problem integration: three suns and a
 *     planet, with 恒纪元 / 乱纪元 segmentation derived from the radiation
 *     flux the planet receives. Same numbers feed the animated view and the
 *     textual summary.
 *  2. `sensitivity()` — two runs that differ by 1e-6 in one initial velocity,
 *     measured until they diverge. The butterfly effect, quantified.
 *  3. `darkForest()` — a tiny agent model of the Dark Forest law: every
 *     civilization grows, detects, and decides whether to strike. The
 *     parameters are the ones the novel argues about (猜疑, 技术爆炸, 代价).
 *
 * Everything is seeded, so a run is reproducible from its parameters.
 */

/* ------------------------------------------------------------------ *
 * Seeded randomness
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Display labels for stable identifiers
 *
 * Every severity / catastrophe kind / reading verdict is a *stable id* in the
 * data and a *label* on screen. Keeping them apart is what lets the filters in
 * `readingOf` and the `[data-severity]` CSS rules keep working after the label
 * is translated — matching on prose would break silently.
 * ------------------------------------------------------------------ */

const SEVERITY_LABELS = {
  // catastrophe severities
  lethal: { zh: '致命', en: 'Lethal' },
  scorching: { zh: '灼热', en: 'Scorching' },
  extreme: { zh: '极端', en: 'Extreme' },
  devastating: { zh: '毁灭', en: 'Devastating' },
  // reading verdicts
  credible: { zh: '可信', en: 'Credible' },
  acceptable: { zh: '可接受', en: 'Acceptable' },
  cautious: { zh: '需要谨慎', en: 'Treat with care' },
  'stable-with-catastrophes': { zh: '轨道稳定但有灾变', en: 'Stable but catastrophic' },
  stable: { zh: '稳定', en: 'Stable' },
  ejected: { zh: '飞散', en: 'Ejected' },
  merged: { zh: '并合', en: 'Merged' },
  grazing: { zh: '近距离交会', en: 'Close encounter' },
  chaotic: { zh: '混沌', en: 'Chaotic' },
  'no-planet': { zh: '无行星', en: 'No planet' },
  // Distinct from `ejected` on purpose: the chaos angle reports the system
  // ("飞散"), the planet angle reports the planet itself ("已飞散").
  'planet-ejected': { zh: '已飞散', en: 'Ejected' },
  'barely-habitable': { zh: '勉强宜居', en: 'Barely habitable' },
  uninhabitable: { zh: '不宜居', en: 'Uninhabitable' },
  'rebuilt-repeatedly': { zh: '文明反复重建', en: 'Civilization rebuilt' },
  'civilization-exiled': { zh: '文明被放逐', en: 'Civilization exiled' },
  'single-generation': { zh: '单代文明', en: 'Single generation' },
  'no-civilization': { zh: '没有文明', en: 'No civilization' },
}

const CATASTROPHE_LABELS = {
  'tri-solar-day': { zh: '三日凌空', en: 'Tri-Solar Day' },
  'tri-solar-appearance': { zh: '三日同现', en: 'Three Suns Up' },
  syzygy: { zh: '三日连珠', en: 'Syzygy' },
  'planet-devoured': { zh: '行星被吞噬', en: 'Planet Devoured' },
  'tidal-disruption': { zh: '潮汐撕裂', en: 'Tidal Disruption' },
}

/** Resolve a stable severity/verdict id to a display label. */
export function severityLabel(key, lang) {
  const entry = SEVERITY_LABELS[key]
  if (!entry) return String(key ?? '')
  return lang === 'en' ? entry.en : entry.zh
}

/** Resolve a stable catastrophe-kind id to a display label. */
export function catastropheLabel(key, lang) {
  const entry = CATASTROPHE_LABELS[key]
  if (!entry) return String(key ?? '')
  return lang === 'en' ? entry.en : entry.zh
}

/** The catastrophe prose for a given event, in the requested language. */
export function catastropheText(event, lang) {
  if (!event) return ''
  const en = lang === 'en'
  const key = event.textKey
  const map = {
    'tri-solar-day': {
      zh: '三颗恒星同时高悬，且都离得很近：地表温度失控，岩石熔化，文明被烤成焦土。',
      en: 'All three suns hang overhead at once and all of them are close: the surface temperature runs away, '
        + 'rock melts, and civilization is burned to slag.',
    },
    'tri-solar-appearance': {
      zh: '三颗恒星同时升上天空。日照翻了几倍，但还不是灭顶之灾——地表的文明必须躲进地下。',
      en: 'All three suns rise at once. Insolation multiplies several-fold, but it is not yet the end — '
        + 'a surface civilization has to go underground.',
    },
    'tri-solar-day-persisting': {
      zh: '行星同时被三颗恒星近距离照射，一直持续到推演结束。',
      en: 'The planet is irradiated by all three suns at close range, and it lasts until the run ends.',
    },
    'tri-solar-appearance-persisting': {
      zh: '三颗恒星同时挂在天上，一直持续到推演结束。',
      en: 'All three suns stay in the sky until the run ends.',
    },
    syzygy: {
      zh: '三颗恒星排成一线、行星正好在这条线上：引力叠加撕扯地壳，日照同时推到致命的量级。',
      en: 'The three suns line up and the planet sits on that line: the superimposed gravity tears at the '
        + 'crust while insolation is driven to a lethal level.',
    },
    'planet-devoured': {
      zh: '行星坠入恒星，整个文明在几分钟内汽化。',
      en: 'The planet falls into a star, and the whole civilization is vaporized within minutes.',
    },
    'tidal-disruption': {
      zh: '恒星的潮汐力超过行星自身的引力束缚：地壳被撕开，岩浆喷向太空。',
      en: 'A star\'s tidal force exceeds the planet\'s own gravitational binding: the crust is torn open '
        + 'and magma sprays into space.',
    },
    'tri-solar-day-detail': {
      zh: '最近的一颗恒星距行星 ',
      en: 'The nearest star is ',
    },
    'tri-solar-day-detail-suffix': {
      zh: ' 个距离单位。',
      en: ' distance units from the planet.',
    },
    'syzygy-detail': {
      zh: '三颗恒星的连线偏差 ',
      en: 'The alignment deviation of the three suns is ',
    },
    'syzygy-detail-mid': {
      zh: '，行星偏离这条线 ',
      en: ', and the planet is ',
    },
    'syzygy-detail-suffix': {
      zh: '。',
      en: ' off that line.',
    },
    'tidal-detail-mid': {
      zh: ' 掠过时距离仅 ',
      en: ' passed at a distance of only ',
    },
    'tidal-detail-mid2': {
      zh: '，罗希极限为 ',
      en: ', with a Roche limit of ',
    },
    'persisting-detail': {
      zh: '这场凌空没有结束——对地表文明来说，这意味着结局。',
      en: 'This Tri-Solar Day never ended — for a surface civilization, that means the end.',
    },
  }
  const pick = (k) => (map[k] ? (en ? map[k].en : map[k].zh) : '')
  if (key) {
    // Composite keys carry their own numeric detail, built by the caller.
    return pick(key)
  }
  return en ? '' : (event.text || '')
}

/** The civilization headline, in the requested language. */
export function civilizationsText(civ, lang) {
  if (!civ) return ''
  if (lang === 'en' && civ.headlineEn) return civ.headlineEn
  return civ.headline || ''
}

export function rng(seed) {
  let s = (Number(seed) || 1) >>> 0
  if (s === 0) s = 0x9e3779b9
  return function next() {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

/* ------------------------------------------------------------------ *
 * Presets
 * ------------------------------------------------------------------ */

const SUN_COLORS = ['#f2c14e', '#eb8f3c', '#e0563b']

/**
 * Presets differ only in initial conditions, which is the whole point of the
 * three-body problem: tiny changes produce entirely different stories.
 *
 * `nameEn` / `descEn` exist because body names end up inside the narrative
 * ("X was ejected from the system"), so leaving them Chinese would put CJK back
 * into an otherwise English report.
 */
export const SIM_PRESETS = [
  {
    id: 'trisolaris',
    name: '三体世界',
    nameEn: 'Trisolaris',
    desc: '一颗行星绕着三颗恒星运行——原著里那个被三日凌空反复焚毁的世界。',
    descEn: 'One planet orbiting three suns — the world the novel burns over and over with Tri-Solar Days.',
    params: { dt: 0.0016, steps: 5200, record: 10, escape: 14 },
    bodies: [
      { id: 'sun-a', name: '恒星 A', nameEn: 'Star A', kind: 'star', mass: 1.0, radius: 7, color: SUN_COLORS[0], x: -3.2, y: 0.0, vx: 0.0, vy: 0.34 },
      { id: 'sun-b', name: '恒星 B', nameEn: 'Star B', kind: 'star', mass: 1.0, radius: 7, color: SUN_COLORS[1], x: 3.0, y: 0.4, vx: -0.05, vy: -0.29 },
      { id: 'sun-c', name: '恒星 C', nameEn: 'Star C', kind: 'star', mass: 1.0, radius: 7, color: SUN_COLORS[2], x: 0.4, y: 3.4, vx: 0.22, vy: -0.04 },
      { id: 'planet', name: '三体行星', nameEn: 'Trisolaran planet', kind: 'planet', mass: 1e-5, radius: 3.2, color: '#6fc3d9', x: 1.4, y: 0.2, vx: -0.12, vy: 0.9 },
    ],
  },
  {
    id: 'figure-eight',
    name: '八字舞',
    nameEn: 'Figure-Eight',
    desc: '三颗等质量恒星在八字轨道上周期运动——三体问题里罕见的稳定解。',
    descEn: 'Three equal stars moving periodically on a figure-eight orbit — the rare stable solution of the three-body problem.',
    params: { dt: 0.0009, steps: 7000, record: 10, escape: 14, collisions: false },
    bodies: [
      { id: 'sun-a', name: '恒星 A', nameEn: 'Star A', kind: 'star', mass: 1.0, radius: 7, color: SUN_COLORS[0], x: -0.97000436, y: 0.24308753, vx: 0.466203685, vy: 0.43236573 },
      { id: 'sun-b', name: '恒星 B', nameEn: 'Star B', kind: 'star', mass: 1.0, radius: 7, color: SUN_COLORS[1], x: 0.97000436, y: -0.24308753, vx: 0.466203685, vy: 0.43236573 },
      { id: 'sun-c', name: '恒星 C', nameEn: 'Star C', kind: 'star', mass: 1.0, radius: 7, color: SUN_COLORS[2], x: 0, y: 0, vx: -0.93240737, vy: -0.86473146 },
    ],
  },
  {
    id: 'pythagorean',
    name: '毕达哥拉斯三体',
    nameEn: 'Pythagorean Three-Body',
    desc: '质量 3∶4∶5、从静止出发的经典构型（Burrau 问题）——三体问题最著名的「不可预测」样本。',
    descEn: 'The classic 3:4:5 mass configuration starting from rest (Burrau\'s problem) — the most famous "unpredictable" sample of the three-body problem.',
    // Burrau is a point-mass classic: the stars are infinitely compact,
    // so they pass through each other instead of merging.
    params: { dt: 0.0012, steps: 6000, record: 8, escape: 16, collisions: false },
    bodies: [
      { id: 'sun-a', name: '质量 3', nameEn: 'Mass 3', kind: 'star', mass: 3, radius: 6.2, color: SUN_COLORS[0], x: 1, y: 3, vx: 0, vy: 0 },
      { id: 'sun-b', name: '质量 4', nameEn: 'Mass 4', kind: 'star', mass: 4, radius: 6.8, color: SUN_COLORS[1], x: -2, y: -1, vx: 0, vy: 0 },
      { id: 'sun-c', name: '质量 5', nameEn: 'Mass 5', kind: 'star', mass: 5, radius: 7.4, color: SUN_COLORS[2], x: 1, y: -1, vx: 0, vy: 0 },
    ],
  },
  {
    id: 'binary-planet',
    name: '双星与行星',
    nameEn: 'Binary and Planet',
    desc: '两颗恒星互绕、外围一行星——比三体温和得多的世界，用来对照「恒纪元」有多难得。',
    descEn: 'Two stars orbiting each other with one planet outside — a far gentler world, there to show how rare a Stable Era is.',
    params: { dt: 0.0016, steps: 5200, record: 10, escape: 16 },
    bodies: [
      { id: 'sun-a', name: '恒星 A', nameEn: 'Star A', kind: 'star', mass: 1.0, radius: 7, color: SUN_COLORS[0], x: -1.1, y: 0, vx: 0, vy: 0.46 },
      { id: 'sun-b', name: '恒星 B', nameEn: 'Star B', kind: 'star', mass: 0.85, radius: 6.4, color: SUN_COLORS[1], x: 1.1, y: 0, vx: 0, vy: -0.46 },
      { id: 'planet', name: '行星', nameEn: 'Planet', kind: 'planet', mass: 1e-5, radius: 3.2, color: '#6fc3d9', x: 0, y: 5.2, vx: -0.36, vy: 0 },
    ],
  },
  {
    id: 'planet-ejected',
    name: '被甩出的行星',
    nameEn: 'Ejected Planet',
    desc: '三颗恒星的引力弹弓把行星抛进深空——三体世界最可能的结局之一：整个文明被冻进真空。',
    descEn: 'The slingshot of three suns flings the planet into deep space — one of the likeliest fates of the Trisolaran world: a whole civilization frozen into vacuum.',
    params: { dt: 0.0016, steps: 6000, record: 12, escape: 12 },
    bodies: [
      { id: 'sun-a', name: '恒星 A', nameEn: 'Star A', kind: 'star', mass: 1.52, radius: 7.2, color: SUN_COLORS[0], x: 2.01, y: -0.05, vx: 0.025, vy: 1.011 },
      { id: 'sun-b', name: '恒星 B', nameEn: 'Star B', kind: 'star', mass: 1.78, radius: 7.6, color: SUN_COLORS[1], x: 0.44, y: 2.02, vx: -1.711, vy: 0.373 },
      { id: 'sun-c', name: '恒星 C', nameEn: 'Star C', kind: 'star', mass: 1.22, radius: 6.8, color: SUN_COLORS[2], x: 0.7, y: -0.96, vx: 1.045, vy: 0.754 },
      { id: 'planet', name: '行星', nameEn: 'Planet', kind: 'planet', mass: 1e-5, radius: 3.2, color: '#6fc3d9', x: -2.86, y: 0.08, vx: -0.045, vy: -1.609 },
    ],
  },
]

const clone = (value) => JSON.parse(JSON.stringify(value))

/* ------------------------------------------------------------------ *
 * Core integration
 *
 * Two things matter for a three-body integrator that a reader will judge:
 *   1. A close encounter must not be faked. A fixed Plummer softening turns
 *      the 1/r singularity into a soft blob; too large and the stars visibly
 *      refuse to fall into each other, too small and a fixed step destroys the
 *      energy budget (measured on Burrau: softening 0.045 -> 0.06 % drift;
 *      softening 0.0045 at a fixed step -> 13 308 % drift).
 *   2. The step must follow the system. These runs contain close approaches
 *      that need sub-steps and long drifts that do not.
 *
 * So: a small softening to keep the singularity finite, plus adaptive
 * sub-stepping from the closest pair's dynamical time. Measured on Burrau,
 * that cuts energy drift about 2.7x versus the old fixed-step, heavily
 * softened scheme, while letting the bodies actually approach one another.
 * ------------------------------------------------------------------ */

/** Plummer softening: small enough to permit real close encounters. */
const SOFT = 0.01
/** Sub-step when the fastest pair's dynamical time falls under this. */
const SUBSTEP_TOLERANCE = 0.01
const MAX_SUBSTEPS = 64

function accelerations(bodies, out) {
  const n = bodies.length
  for (let i = 0; i < n; i++) { out[i * 2] = 0; out[i * 2 + 1] = 0 }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = bodies[i]
      const b = bodies[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d2 = dx * dx + dy * dy + SOFT * SOFT
      const inv = 1 / Math.sqrt(d2)
      const f = inv * inv * inv
      out[i * 2] += b.mass * dx * f
      out[i * 2 + 1] += b.mass * dy * f
      out[j * 2] -= a.mass * dx * f
      out[j * 2 + 1] -= a.mass * dy * f
    }
  }
}

/**
 * How many sub-steps this configuration needs right now: the dynamical time of
 * the closest pair sets the resolution, so a tight pair gets many small kicks
 * and a wide system gets one.
 */
export function substepCount(bodies, dt) {
  let minTau = Infinity
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]
      const b = bodies[j]
      const r = Math.hypot(b.x - a.x, b.y - a.y)
      const mass = (a.mass || 0) + (b.mass || 0)
      if (!(mass > 0)) continue
      const tau = Math.sqrt(Math.max(r, 1e-6) ** 3 / mass)
      if (tau < minTau) minTau = tau
    }
  }
  if (!Number.isFinite(minTau) || minTau <= 0) return 1
  return Math.max(1, Math.min(MAX_SUBSTEPS, Math.ceil(dt / (SUBSTEP_TOLERANCE * minTau))))
}

/** One velocity-Verlet kick-drift-kick step, sub-divided adaptively. */
function stepSim(bodies, dt, forcedSubsteps) {
  const sub = forcedSubsteps || substepCount(bodies, dt)
  const h = dt / sub
  const acc = new Float64Array(bodies.length * 2)
  for (let s = 0; s < sub; s++) {
    accelerations(bodies, acc)
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].vx += acc[i * 2] * h * 0.5
      bodies[i].vy += acc[i * 2 + 1] * h * 0.5
    }
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].x += bodies[i].vx * h
      bodies[i].y += bodies[i].vy * h
    }
    accelerations(bodies, acc)
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].vx += acc[i * 2] * h * 0.5
      bodies[i].vy += acc[i * 2 + 1] * h * 0.5
    }
  }
  return sub
}

/** Energy, angular momentum and centre of mass, for conservation diagnostics. */
export function invariants(bodies) {
  let kinetic = 0
  let potential = 0
  let angular = 0
  let mx = 0
  let my = 0
  let mass = 0
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    const m = b.mass || 0
    kinetic += 0.5 * m * (b.vx * b.vx + b.vy * b.vy)
    angular += m * (b.x * b.vy - b.y * b.vx)
    mx += m * b.x
    my += m * b.y
    mass += m
    for (let j = i + 1; j < bodies.length; j++) {
      const c = bodies[j]
      const d = Math.sqrt((c.x - b.x) ** 2 + (c.y - b.y) ** 2 + SOFT * SOFT)
      potential -= (m * c.mass) / d
    }
  }
  return {
    energy: kinetic + potential,
    angular,
    centre: mass > 0 ? { x: mx / mass, y: my / mass } : { x: 0, y: 0 },
    mass,
  }
}

function fluxAt(bodies, index) {
  const p = bodies[index]
  let flux = 0
  let nearest = null
  for (let i = 0; i < bodies.length; i++) {
    if (i === index) continue
    const b = bodies[i]
    const d2 = (b.x - p.x) ** 2 + (b.y - p.y) ** 2 + SOFT * SOFT
    const contribution = b.mass / d2
    flux += contribution
    if (!nearest || contribution > nearest.contribution) nearest = { id: b.id, name: b.name, d2, contribution }
  }
  return { flux, nearest }
}

function mergeBodies(bodies, i, j, time) {
  const a = bodies[i]
  const b = bodies[j]
  const big = a.mass >= b.mass ? a : b
  const small = big === a ? b : a
  const total = a.mass + b.mass
  const momentumX = a.vx * a.mass + b.vx * b.mass
  const momentumY = a.vy * a.mass + b.vy * b.mass
  big.x = (a.x * a.mass + b.x * b.mass) / total
  big.y = (a.y * a.mass + b.y * b.mass) / total
  big.vx = momentumX / total
  big.vy = momentumY / total
  big.mass = total
  // Volume-conserving merge of the *physical* radii, and a draw radius that
  // grows with the cube root of mass so the picture stays honest.
  big.physicalRadius = Math.cbrt((big.physicalRadius || 0) ** 3 + (small.physicalRadius || 0) ** 3)
  big.radius = Math.cbrt(big.radius ** 3 + small.radius ** 3)
  big.merged = (big.merged || 0) + 1
  return { index: bodies.indexOf(small), time, into: big.id, lost: small.id }
}

/**
 * Integrate a system and derive the story the reader cares about.
 *
 * `lang` only selects which of the two already-computed narratives to return;
 * the physics never depends on it, so a Chinese and an English run of the same
 * configuration agree digit for digit.
 *
 * @param {{bodies: object[], params?: object, lang?: 'zh'|'en'}} config
 */
export function simulate(config) {
  const source = config && Array.isArray(config.bodies) ? config : clone(SIM_PRESETS[0])
  const lang = (config && config.lang === 'en') ? 'en' : 'zh'
  const params = Object.assign({ dt: 0.0016, steps: 5200, record: 10, escape: 14, collisions: true }, source.params || {})
  const dt = Math.max(1e-5, Math.min(0.02, Number(params.dt) || 0.0016))
  const steps = Math.max(200, Math.min(40000, Math.round(Number(params.steps) || 5200)))
  const record = Math.max(1, Math.round(Number(params.record) || 10))
  const escape = Math.max(4, Number(params.escape) || 14)
  // A classic point-mass problem has no radii, so nothing can ever collide.
  const allowCollisions = params.collisions !== false

  const bodies = source.bodies.map((b, i) => {
    const mass = Math.max(1e-9, Number(b.mass) || 1)
    // Physical radius in world units (AU-like, G=1, solar masses). A solar-mass
    // star is ~0.0047 of an AU; a planet of mass 3e-6 is ~4e-5.
    // This is deliberately separate from `radius`, which is only a draw size:
    // using the draw size for collisions made two stars merge whenever they
    // merely came near each other, which is not what gravity does.
    const physical = b.kind === 'planet'
      ? Math.max(2e-5, 4.3e-5 * Math.cbrt(mass / 3e-6))
      : Math.max(1e-4, 0.0047 * Math.cbrt(mass))
    return {
      id: b.id || 'b' + i,
      // Body names are interpolated into the narrative, so in English mode they
      // must be English too or the report ends up half translated.
      name: lang === 'en'
        ? (b.nameEn || b.name || 'Body ' + (i + 1))
        : (b.name || '天体 ' + (i + 1)),
      kind: b.kind === 'planet' ? 'planet' : 'star',
      mass,
      radius: Math.max(1, Number(b.radius) || 6),
      physicalRadius: Number(b.physicalRadius) || physical,
      color: b.color || SUN_COLORS[i % SUN_COLORS.length],
      x: Number(b.x) || 0,
      y: Number(b.y) || 0,
      vx: Number(b.vx) || 0,
      vy: Number(b.vy) || 0,
      merged: 0,
    }
  })
  if (bodies.length < 2) {
    return { ok: false, error: lang === 'en' ? 'At least two bodies are required.' : '至少需要两个天体。' }
  }

  const planetIndex = bodies.findIndex((b) => b.kind === 'planet')
  const tracked = planetIndex >= 0 ? planetIndex : 0

  const start = invariants(bodies)
  const e0 = start.energy

  const frames = []
  const track = []
  // Analysis series sampled alongside the frames: energy for the conservation
  // curve, and the planet's (position, velocity) for the phase portrait.
  const energyCurve = []
  const phase = []
  const events = []
  const ejected = new Map()
  let time = 0
  let maxSeparation = 0
  let substepsUsed = 0
  let closestApproach = Infinity
  let closestAt = null
  let radiated = 0

  // Frames are for drawing, not for re-integration: 3 decimals is sub-pixel at
  // any zoom the panel offers. Static per-body metadata (mass, colour, draw
  // radius) is sent once in the response's `bodies`; repeating it in every
  // frame was most of the payload. `kind` stays because the catastrophe
  // detector classifies bodies from the recorded frames alone.
  const snapshot = () => ({
    t: Number(time.toFixed(3)),
    bodies: bodies.map((b) => ({
      id: b.id,
      kind: b.kind,
      x: Number(b.x.toFixed(3)),
      y: Number(b.y.toFixed(3)),
      dead: Boolean(ejected.get(b.id)) || b.mass <= 0,
    })),
  })

  frames.push(snapshot())

  for (let s = 1; s <= steps; s++) {
    substepsUsed += stepSim(bodies, dt)
    time += dt

    // Collisions merge momentum-conservingly. Only when the model actually
    // has finite bodies: a point-mass classic problem (Burrau) must never
    // merge, and a merge loses energy to radiation, which is tracked
    // separately so it does not masquerade as integrator error.
    let swallowed = -1
    if (allowCollisions) {
      for (let i = 0; i < bodies.length && swallowed < 0; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i]
          const b = bodies[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          // A genuine contact: both physical radii overlap. (Draw radii are for
          // pixels; using them here merged stars that were still far apart.)
          if (d < (a.physicalRadius || 0) + (b.physicalRadius || 0)) {
            const before = invariants(bodies).energy
            const lost = mergeBodies(bodies, i, j, time)
            const after = invariants(bodies).energy
            radiated += Math.max(0, before - after)
            events.push({
              t: Number(time.toFixed(3)),
              type: 'collision',
              text: lost.lost + ' 被 ' + lost.into + ' 吞并',
              textEn: lost.lost + ' was swallowed by ' + lost.into,
            })
            bodies.splice(lost.index, 1)
            swallowed = lost.index
            break
          }
        }
      }
    }
    if (swallowed === 0) swallowed = -1

    // Ejections: anything outside the arena is gone for good.
    for (const b of bodies) {
      const r = Math.hypot(b.x, b.y)
      if (!ejected.get(b.id) && r > escape) {
        ejected.set(b.id, time)
        events.push({
          t: Number(time.toFixed(3)), type: 'eject',
          text: b.name + ' 被抛出系统（距原点 ' + r.toFixed(1) + '）',
          textEn: b.name + ' was ejected from the system (distance from origin ' + r.toFixed(1) + ')',
        })
      }
    }

    let separation = 0
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const d = Math.hypot(bodies[i].x - bodies[j].x, bodies[i].y - bodies[j].y)
        if (d > separation) separation = d
        if (d < closestApproach) {
          closestApproach = d
          closestAt = { t: Number(time.toFixed(3)), a: bodies[i].id, b: bodies[j].id }
        }
      }
    }
    maxSeparation = Math.max(maxSeparation, separation)

    const planet = bodies[tracked]
    if (planet) {
      const f = fluxAt(bodies, tracked)
      track.push({ t: Number(time.toFixed(3)), flux: f.flux, nearest: f.nearest ? f.nearest.name : '', d: f.nearest ? Math.sqrt(f.nearest.d2) : 0 })
    }

    if (s % record === 0) {
      frames.push(snapshot())
      const inv = invariants(bodies)
      energyCurve.push({
        t: Number(time.toFixed(3)),
        energy: Number((inv.energy / (Math.abs(e0) || 1)).toFixed(6)),
        drift: Number((Math.abs((inv.energy - e0) / (Math.abs(e0) || 1)) * 100).toFixed(4)),
      })
      if (planet) {
        phase.push({
          t: Number(time.toFixed(3)),
          x: Number(planet.x.toFixed(4)),
          y: Number(planet.y.toFixed(4)),
          vx: Number(planet.vx.toFixed(4)),
          vy: Number(planet.vy.toFixed(4)),
        })
      }
    }
    if (bodies.length < 2) break
  }

  const end = invariants(bodies)
  const drift = Math.abs((end.energy - e0) / (Math.abs(e0) || 1))
  const angularDrift = Math.abs((end.angular - start.angular) / (Math.abs(start.angular) || 1))
  // A merge legitimately destroys energy (it radiates). Report the integrator's
  // own error separately from that physical loss, or a real collision would
  // look like a broken solver.
  const radiatedFraction = Math.abs(radiated / (Math.abs(e0) || 1))

  const metrics = {
    steps, dt, time: Number(time.toFixed(2)),
    frames: frames.length,
    bodiesLeft: bodies.length,
    energyDrift: Number(drift.toFixed(5)),
    // Energy that a physical merge radiated away, kept apart from the
    // integrator's own error so a collision does not look like a bug.
    radiatedFraction: Number(radiatedFraction.toFixed(5)),
    integratorDrift: Number(Math.max(0, drift - radiatedFraction).toFixed(5)),
    collisionsAllowed: allowCollisions,
    // Conservation diagnostics: angular momentum should hold even when a
    // chaotic run makes the energy budget wobble.
    angularDrift: Number(angularDrift.toFixed(5)),
    substeps: substepsUsed,
    substepRatio: Number((substepsUsed / Math.max(1, steps)).toFixed(2)),
    closestApproach: Number.isFinite(closestApproach) ? Number(closestApproach.toFixed(3)) : null,
    closestAt,
    maxSeparation: Number(maxSeparation.toFixed(2)),
    ejected: [...ejected.entries()].map(([id, t]) => ({ id, t: Number(t.toFixed(2)) })),
    collapsed: events.some((e) => e.type === 'collision'),
    stable: drift < 0.02 && ejected.size === 0,
  }

  const eras = eraSegments(track, lang)
  const planetBody = bodies.find((b) => b.kind === 'planet')
  const rawCatastrophes = detectCatastrophes(frames, bodies, eras)
  const rawCivilizations = civilizationHistory(eras, rawCatastrophes, { hasPlanet: Boolean(planetBody) })
  const en = lang === 'en'

  // `kind` and `severity` stay as stable ids so filters and CSS keep matching;
  // the display text lives in the sibling `*Label` fields, chosen here once
  // rather than at each of the client's twenty-odd render sites.
  const catastrophes = rawCatastrophes.map((c) => Object.assign({}, c, {
    kindLabel: catastropheLabel(c.kind, lang),
    severityLabel: severityLabel(c.severity, lang),
    text: en ? (c.textEn || c.text) : c.text,
    detail: en ? (c.detailEn || c.detail) : c.detail,
  }))
  const civilizations = Object.assign({}, rawCivilizations, {
    headline: en ? (rawCivilizations.headlineEn || rawCivilizations.headline) : rawCivilizations.headline,
  })
  const localizedEvents = events.map((e) => Object.assign({}, e, {
    text: en ? (e.textEn || e.text) : e.text,
  }))

  return {
    ok: true,
    lang,
    preset: source.id || null,
    params: { dt, steps, record, escape, collisions: allowCollisions },
    bodies,
    frames,
    track: downsample(track, 600),
    eras,
    catastrophes,
    civilizations,
    events: localizedEvents,
    metrics,
    // Analysis series for the charts: the energy budget over time, and the
    // planet's phase-space portrait (position + velocity), which is what makes
    // "chaotic, not periodic" visible rather than asserted.
    // Charts are drawn at ~300–620 px, so a few hundred points is already
    // beyond what any screen shows. Keeping the series small keeps the
    // response streamable for a 9000-step run.
    energyCurve: downsample(energyCurve, 240),
    phase: downsample(phase, 420),
    summary: summarize(metrics, events, track, lang),
    reading: readingOf({ metrics, catastrophes, civilizations, eras, track, lang }),
  }
}

/**
 * The same run read from four angles. Each angle is a sentence a reader can
 * check against the numbers above it, not decoration: this is what makes the
 * simulation an argument about the novels rather than a screensaver.
 */
export function readingOf({ metrics, catastrophes, civilizations, eras, track, lang }) {
  const angles = []
  const en = lang === 'en'
  // Stable identifiers, never display text: the filters below must keep working
  // after the label is translated, and a CSS selector keyed on `data-severity`
  // would silently stop matching if the value became prose.
  const isLethal = (c) => c.severity === 'devastating' || c.severity === 'lethal'
  const isFatal = (c) => isLethal(c) || c.severity === 'extreme'

  // 1. Physics: is the numerical solution trustworthy?
  const driftPct = metrics.integratorDrift * 100
  const physicsVerdict = driftPct < 0.1 ? 'credible' : driftPct < 1 ? 'acceptable' : 'cautious'
  angles.push({
    id: 'physics',
    title: en ? 'Numerical credibility' : '数值可信度',
    verdict: severityLabel(physicsVerdict, lang),
    verdictKey: physicsVerdict,
    tone: physicsVerdict === 'credible' ? 'good' : 'neutral',
    text: en
      ? 'Integrated ' + metrics.steps + ' steps, with adaptive substeps pressing the average step down to 1/'
        + (metrics.substepRatio > 0 ? metrics.substepRatio.toFixed(2) : '1')
        + '. Energy drift ' + driftPct.toFixed(3) + '%, angular momentum drift '
        + (metrics.angularDrift * 100).toFixed(4) + '%.' + (driftPct < 0.1
        ? ' At this magnitude both the orbit shapes and the encounter times are trustworthy.'
        : ' The drift already affects long-term orbits, so the readings are qualitative only.')
      : '积分 ' + metrics.steps + ' 步，自适应子步把平均步长压到 1/'
        + (metrics.substepRatio > 0 ? metrics.substepRatio.toFixed(2) : '1')
        + '。能量漂移 ' + driftPct.toFixed(3) + '%，角动量漂移 ' + (metrics.angularDrift * 100).toFixed(4)
        + '%。' + (driftPct < 0.1
          ? '这个量级下，轨道形状与交会时刻都是可信的。'
          : '漂移已经影响到长期轨道，读数只能当定性参考。'),
  })

  // 2. Chaos: is it periodic or not?
  const eject = metrics.ejected || []
  // "Stable" must require more than a bounded energy budget. A near-collision
  // (Burrau gets to 0.014) is the opposite of a regular orbit, and a system
  // whose planet is repeatedly cooked by three suns is stable only in the
  // narrow orbital sense — the reading must not claim it is benign.
  const grazing = Number.isFinite(metrics.closestApproach) && metrics.closestApproach < 0.1
  const lethal = (catastrophes || []).filter(isLethal)
  const orbitalStable = metrics.stable && !grazing
  const chaosVerdict = orbitalStable && lethal.length ? 'stable-with-catastrophes'
    : orbitalStable ? 'stable'
      : eject.length ? 'ejected' : metrics.collapsed ? 'merged' : grazing ? 'grazing' : 'chaotic'
  angles.push({
    id: 'chaos',
    title: en ? 'Stable or chaotic' : '稳定还是混沌',
    verdict: severityLabel(chaosVerdict, lang),
    verdictKey: chaosVerdict,
    tone: orbitalStable ? 'good' : 'warn',
    text: orbitalStable && lethal.length
      ? (en
        ? 'Judging the stars alone, the system is bound (closest approach ' + metrics.closestApproach
          + ') and none of them flew out; but it is anything but gentle for life on the planet — this run produced '
          + lethal.length + ' lethal sky events. A stable orbit is not a habitable one.'
        : '单看恒星，系统是束缚的（最近交会 ' + metrics.closestApproach
          + '），没有任何一颗飞出；但对行星上的生命来说它毫不温和——这段推演里出现了 '
          + lethal.length + ' 次致命天象。稳定的轨道不等于宜居。')
      : orbitalStable
        ? (en
          ? 'The system stays bound for the whole integration, with the closest approach at '
            + (metrics.closestApproach ?? '—')
            + ': a periodic or quasi-periodic solution, the genuine rarity of the three-body problem.'
          : '系统在整段积分里保持束缚，最近距离 ' + (metrics.closestApproach ?? '—')
            + '：这是一个周期或准周期的解，三体问题里真正的稀有品。')
        : grazing && !eject.length
          ? (en
            ? 'Energy was conserved, but the two stars still came within ' + metrics.closestApproach
              + ' — a close pass like that rewrites the orbits completely, and it is exactly where the '
              + 'unpredictability of the three-body problem comes from.'
            : '能量虽然守住了，但两颗星最近只到 ' + metrics.closestApproach
              + '——这种擦身而过的交会把轨道彻底改写，正是三体问题不可预测的来源。')
          : (en
            ? 'The system neither returned to its initial state nor conserved its way around: the closest '
              + 'encounter reached only ' + (metrics.closestApproach ?? '—')
              + ', with a maximum separation of ' + metrics.maxSeparation
              + '. That is what "unpredictable" means.'
            : '系统没有回到初始状态，也没有守恒地绕下去：最近一次交会只到 ' + (metrics.closestApproach ?? '—')
              + '，最大分离 ' + metrics.maxSeparation + '。这正是「不可预测」的含义。'),
  })

  // 3. The planet's fate.
  const planetGone = (metrics.ejected || []).some((e) => e.id === 'planet')
  if (!civilizations.hasPlanet) {
    angles.push({
      id: 'planet',
      title: en ? 'The planet' : '行星的处境',
      verdict: severityLabel('no-planet', lang),
      verdictKey: 'no-planet',
      tone: 'neutral',
      text: en
        ? 'This system is stars only. It still has Stable and Chaotic Eras, but no surface to witness them — '
          + 'which is itself one of the possibilities for the Trisolaran world.'
        : '这套系统只有恒星。它照样有恒纪元与乱纪元，但没有地表可以见证它们——这本身就是三体世界的一种可能。',
    })
  } else if (planetGone) {
    angles.push({
      id: 'planet',
      title: en ? 'The planet' : '行星的处境',
      verdict: severityLabel('planet-ejected', lang),
      verdictKey: 'planet-ejected',
      tone: 'warn',
      text: en
        ? 'The planet was thrown out of the system at t='
          + ((metrics.ejected.find((e) => e.id === 'planet') || {}).t ?? '?')
          + '. The Stable and Chaotic Eras that follow no longer concern it: the whole civilization is frozen '
          + 'into vacuum, without even the chance to be scorched.'
        : '行星在 t=' + ((metrics.ejected.find((e) => e.id === 'planet') || {}).t ?? '?')
          + ' 被抛出系统，此后的恒纪元与乱纪元与它无关：整个文明被冻进真空，连被烤焦的机会都没有。',
    })
  } else {
    const fatal = catastrophes.filter(isFatal)
    const planetVerdict = fatal.length ? fatal[0].kind
      : civilizations.completed > 0 ? 'barely-habitable' : 'uninhabitable'
    angles.push({
      id: 'planet',
      title: en ? 'The planet' : '行星的处境',
      verdict: fatal.length ? (fatal[0].kindLabel || catastropheLabel(fatal[0].kind, lang)) : severityLabel(planetVerdict, lang),
      verdictKey: planetVerdict,
      tone: fatal.length ? 'warn' : 'neutral',
      text: civilizationsText(civilizations, lang)
        + (fatal.length
          ? (en
            ? ' The deadliest was the ' + (fatal[0].kindLabel || catastropheLabel(fatal[0].kind, lang))
              + ' at t=' + fatal[0].t + ': ' + fatal[0].text
            : ' 最致命的一次是 t=' + fatal[0].t + ' 的' + (fatal[0].kindLabel || catastropheLabel(fatal[0].kind, lang))
              + '：' + fatal[0].text)
          : (en ? ' No lethal sky event occurred during this run.' : ' 整段推演里没有出现致命天象。'))
        + (en
          ? ' Stable Eras average ' + civilizations.averageStable + ', Chaotic Eras average '
            + civilizations.averageChaotic + '.'
          : ' 恒纪元平均 ' + civilizations.averageStable + '，乱纪元平均 ' + civilizations.averageChaotic + '。'),
    })
  }

  // 4. What it says about the novel.
  const novelVerdict = civilizations.generations > 1 ? 'rebuilt-repeatedly'
    : planetGone ? 'civilization-exiled' : civilizations.generations === 1 ? 'single-generation' : 'no-civilization'
  angles.push({
    id: 'novel',
    title: en ? 'Against the novel' : '与原著对照',
    verdict: severityLabel(novelVerdict, lang),
    verdictKey: novelVerdict,
    tone: civilizations.generations > 1 ? 'warn' : 'neutral',
    text: civilizations.generations > 1
      ? (en
        ? '"Over a hundred civilizations" is not a figure of speech: as long as the three suns are there, the '
          + 'Stable Era will end and civilization has to start from zero. In this run it restarted '
          + civilizations.generations + ' times, ' + civilizations.destroyed
          + ' of them cut short by a catastrophe.'
        : '「一百多号文明」并不是修辞：只要三颗太阳还在，恒纪元就会结束，文明就得从零开始。这次推演里它重来了 '
          + civilizations.generations + ' 次，' + civilizations.destroyed + ' 次是被灾变直接打断的。')
      : planetGone
        ? (en
          ? 'Once the planet was flung into deep space, the civilization was not destroyed but exiled: this is '
            + 'the conclusion the Trisolarans reached — they had to leave.'
          : '行星被甩进深空之后，文明并没有被毁灭，而是被流放了：这对应原著里三体人「必须离开」的那个结论。')
        : civilizations.generations === 1
          ? (en
            ? 'Only one civilization appeared this time, and it survived to the end. In the novel this is a '
              + 'vanishingly unlikely branch — the Trisolarans would not gamble on it, so they chose to leave.'
            : '这次只出现了一代文明，而且它活到了最后。原著里这是极小概率的分支——三体人不敢赌，所以他们选择了离开。')
          : (en
            ? 'No civilization appeared. That is the reminder: a three-body system capable of harbouring life '
              + 'is itself a lucky accident.'
            : '没有文明出现。这提醒你：能孕育文明的三体系统，本身就是一次幸运的偶然。'),
  })

  return angles
}

function downsample(list, max) {
  if (list.length <= max) return list
  const stride = list.length / max
  const out = []
  for (let i = 0; i < max; i++) out.push(list[Math.floor(i * stride)])
  return out
}

/* ------------------------------------------------------------------ *
 * Catastrophes — the vocabulary the novels actually use
 *
 * Everything here is derived from the recorded frame positions, so a claim in
 * the UI ("三日凌空") is a claim the integration supports.
 * ------------------------------------------------------------------ */

/** Is point p inside the triangle a-b-c? */
function insideTriangle(p, a, b, c) {
  const cross = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
  const d1 = cross(p, a, b)
  const d2 = cross(p, b, c)
  const d3 = cross(p, c, a)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

/**
 * Detect the catastrophes that matter to a reader of the novels:
 *  - 三日凌空: the planet sits inside the triangle of its three suns, so it is
 *    bathed in radiation from every direction at once.
 *  - 三日连珠: the three suns fall nearly on one line.
 *  - 潮汐撕裂 / 近距离掠过: a star passes inside the Roche distance.
 *  - 行星被吞噬: the planet merges into a star.
 *  - 飞散: a body leaves the system.
 */
export function detectCatastrophes(frames, finalBodies, eras) {
  if (!Array.isArray(frames) || frames.length < 3) return []
  const found = []
  const planetBody = finalBodies.find((b) => b.kind === 'planet')
  if (!planetBody) return [] // a three-star system has no surface to burn
  const planetId = planetBody.id

  // Physical radius, not the draw radius: using the pixel size for the Roche
  // limit produced tidal "disruption" whenever the planet merely came near.
  const planetRadius = Math.max(1e-5, planetBody.physicalRadius || 4e-5)

  let inTriangleRun = null
  let alignmentRun = null
  const cooldown = { tidal: -Infinity, triple: -Infinity }

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    const bodies = frame.bodies.filter((b) => !b.dead)
    const planet = bodies.find((b) => b.id === planetId)
    const stars = bodies.filter((b) => b.kind === 'star')
    const t = frame.t
    if (!planet || stars.length < 3) continue

    const distances = stars.map((s) => Math.hypot(s.x - planet.x, s.y - planet.y))
    const nearest = Math.min(...distances)

    // --- Three suns at once -----------------------------------------------
    // Being inside the triangle means all three are above the horizon; that is
    // only *致命* when they are also close enough to actually cook the surface.
    const inside = insideTriangle(planet, stars[0], stars[1], stars[2])
    if (inside) {
      if (inTriangleRun === null) inTriangleRun = { t, minNearest: nearest }
      else inTriangleRun.minNearest = Math.min(inTriangleRun.minNearest, nearest)
    } else if (inTriangleRun !== null) {
      const duration = inTriangleRun.end ? 0 : t - inTriangleRun.t
      if (duration > 0) {
        const close = inTriangleRun.minNearest < 2.2
        found.push({
          type: close ? 'triple-sun' : 'triple-up',
          kind: close ? 'tri-solar-day' : 'tri-solar-appearance',
          t: Number(inTriangleRun.t.toFixed(2)),
          end: Number(t.toFixed(2)),
          duration: Number(duration.toFixed(2)),
          severity: close ? 'lethal' : 'scorching',
          textKey: close ? 'tri-solar-day' : 'tri-solar-appearance',
          text: catastropheText({ textKey: close ? 'tri-solar-day' : 'tri-solar-appearance' }, 'zh'),
          textEn: catastropheText({ textKey: close ? 'tri-solar-day' : 'tri-solar-appearance' }, 'en'),
          detail: '最近的一颗恒星距行星 ' + inTriangleRun.minNearest.toFixed(2) + ' 个距离单位。',
          detailEn: 'The nearest star is ' + inTriangleRun.minNearest.toFixed(2) + ' distance units from the planet.',
        })
      }
      inTriangleRun = null
    }

    // --- Three suns in a line, with the planet on that line ----------------
    const [a, b, c] = stars
    const abx = b.x - a.x; const aby = b.y - a.y
    const acx = c.x - a.x; const acy = c.y - a.y
    const cross = Math.abs(abx * acy - aby * acx)
    const longest = Math.max(Math.hypot(abx, aby), Math.hypot(acx, acy))
    // Distance of the planet from the line through a-b, and from the line
    // through a-c: the novel's 连珠 only matters when the planet is aligned too.
    const offLine = longest < 0.2 ? Infinity : Math.min(
      Math.abs((planet.x - a.x) * aby - (planet.y - a.y) * abx) / Math.max(1e-6, Math.hypot(abx, aby)),
      Math.abs((planet.x - a.x) * acy - (planet.y - a.y) * acx) / Math.max(1e-6, Math.hypot(acx, acy)),
    )
    const collinear = longest > 0.2 && cross / longest < 0.06 && offLine < 1.2
    if (collinear) {
      if (alignmentRun === null) alignmentRun = t
    } else if (alignmentRun !== null) {
      const duration = t - alignmentRun
      // A real 连珠 lasts long enough to be seen, and fires once, not per sample.
      if (duration > 0.15 && alignmentRun - cooldown.triple > 1) {
        cooldown.triple = alignmentRun
        found.push({
          type: 'triple-alignment',
          kind: 'syzygy',
          t: Number(alignmentRun.toFixed(2)),
          end: Number(t.toFixed(2)),
          duration: Number(duration.toFixed(2)),
          severity: 'extreme',
          textKey: 'syzygy',
          text: catastropheText({ textKey: 'syzygy' }, 'zh'),
          textEn: catastropheText({ textKey: 'syzygy' }, 'en'),
          detail: '三颗恒星的连线偏差 ' + (cross / Math.max(longest, 1e-6)).toFixed(3)
            + '，行星偏离这条线 ' + offLine.toFixed(2) + '。',
          detailEn: 'The alignment deviation of the three suns is ' + (cross / Math.max(longest, 1e-6)).toFixed(3)
            + ', and the planet is ' + offLine.toFixed(2) + ' off that line.',
        })
      }
      alignmentRun = null
    }

    // --- Tidal disruption / devoured --------------------------------------
    for (const s of stars) {
      const d = Math.hypot(s.x - planet.x, s.y - planet.y)
      // Roche limit, rigid body: r < R_planet * (2 M_star / M_planet)^(1/3)
      const roche = planetRadius * Math.cbrt((2 * (s.mass || 1)) / Math.max(planet.mass || 1e-9, 1e-12))
      if (d < roche && t - cooldown.tidal > 0.5) {
        cooldown.tidal = t
        const devoured = d < (s.physicalRadius || 0) + planetRadius
        const tidalKey = devoured ? 'planet-devoured' : 'tidal-disruption'
        found.push({
          type: 'tidal',
          kind: tidalKey,
          t: Number(t.toFixed(2)),
          end: Number(t.toFixed(2)),
          duration: 0,
          severity: 'devastating',
          textKey: tidalKey,
          text: catastropheText({ textKey: tidalKey }, 'zh'),
          textEn: catastropheText({ textKey: tidalKey }, 'en'),
          detail: s.name + ' 掠过时距离仅 ' + d.toFixed(4) + '，罗希极限为 ' + roche.toFixed(4) + '。',
          detailEn: s.name + ' passed at a distance of only ' + d.toFixed(4)
            + ', with a Roche limit of ' + roche.toFixed(4) + '.',
        })
      }
    }
  }

  // An 凌空 still in progress when the run ends.
  if (inTriangleRun !== null) {
    const t = frames[frames.length - 1].t
    const close = inTriangleRun.minNearest < 2.2
    const persistKey = close ? 'tri-solar-day-persisting' : 'tri-solar-appearance-persisting'
    found.push({
      type: close ? 'triple-sun' : 'triple-up',
      kind: close ? 'tri-solar-day' : 'tri-solar-appearance',
      t: Number(inTriangleRun.t.toFixed(2)),
      end: Number(t.toFixed(2)),
      duration: Number((t - inTriangleRun.t).toFixed(2)),
      severity: close ? 'lethal' : 'scorching',
      textKey: persistKey,
      text: catastropheText({ textKey: persistKey }, 'zh'),
      textEn: catastropheText({ textKey: persistKey }, 'en'),
      detail: '这场凌空没有结束——对地表文明来说，这意味着结局。',
      detailEn: 'This Tri-Solar Day never ended — for a surface civilization, that means the end.',
    })
  }

  found.sort((a, b) => a.t - b.t)
  // Merge same-type events that are separated by less than a couple of samples.
  const merged = []
  for (const event of found) {
    const prev = merged[merged.length - 1]
    if (prev && prev.type === event.type && event.t - prev.end < 0.3) {
      prev.end = event.end
      prev.duration = Number((prev.end - prev.t).toFixed(2))
    } else merged.push({ ...event })
  }
  return merged
}

/**
 * 文明的代数 — the number the novels actually quote ("一百多号文明").
 * One civilization per 恒纪元 window, and any catastrophe inside a window
 * ends it, so the count is the number of windows a catastrophe did not cut
 * short, plus the windows themselves.
 */
export function civilizationHistory(eras, catastrophes, options = {}) {
  // A three-star system with no planet has no surface and therefore no
  // civilizations: the 恒纪元 windows still describe its sky, but the count
  // must be zero rather than a misleading "2 代文明".
  const hasPlanet = options.hasPlanet !== false
  if (!hasPlanet) {
    return {
      hasPlanet: false,
      generations: 0,
      completed: 0,
      destroyed: 0,
      headline: '这套系统里没有行星，也就没有地表可以孕育文明——恒纪元/乱纪元只是它自己的天气。',
      headlineEn: 'This system has no planet, so there is no surface to harbour a civilization — the '
        + 'Stable and Chaotic Eras are just its own weather.',
      timeline: [],
      chaosWindows: (eras || []).filter((e) => e.kind === 'chaotic').length,
      averageStable: 0,
      averageChaotic: 0,
    }
  }

  const stable = (eras || []).filter((e) => e.kind === 'stable')
  const chaos = (eras || []).filter((e) => e.kind === 'chaotic')
  const fatal = (catastrophes || []).filter((c) =>
    c.type === 'triple-sun' || c.type === 'tidal' || c.type === 'triple-alignment')

  const timeline = stable.map((era, index) => {
    const hit = fatal.find((c) => c.t >= era.start && c.t <= era.end)
    return {
      generation: index + 1,
      start: era.start,
      end: era.end,
      duration: era.duration,
      star: era.star,
      endedBy: hit ? hit.kind : null,
      survived: !hit,
    }
  })

  const completed = timeline.filter((c) => c.survived).length
  const destroyed = timeline.length - completed
  const totalSpan = (eras && eras.length) ? eras[eras.length - 1].end - eras[0].start : 0

  return {
    hasPlanet: true,
    generations: timeline.length,
    completed,
    destroyed,
    // The novel's own framing: each 恒纪元 is a civilization, and each one
    // that ends abruptly is the next generation's number.
    headline: timeline.length === 0
      ? '这颗行星从未稳定到足以孕育文明。'
      : '在这 ' + totalSpan.toFixed(1) + ' 个时间单位里，行星上先后出现 ' + timeline.length
        + ' 代文明：' + completed + ' 代熬到了下一次乱纪元，' + destroyed + ' 代被灾变直接抹去。',
    headlineEn: timeline.length === 0
      ? 'This planet was never stable long enough to harbour a civilization.'
      : 'Over ' + totalSpan.toFixed(1) + ' time units the planet raised ' + timeline.length
        + (timeline.length === 1 ? ' generation of civilization: ' : ' generations of civilization: ')
        + completed + ' lasted until the next Chaotic Era, '
        + destroyed + ' were erased by a catastrophe outright.',
    timeline,
    chaosWindows: chaos.length,
    averageStable: stable.length
      ? Number((stable.reduce((n, e) => n + e.duration, 0) / stable.length).toFixed(2))
      : 0,
    averageChaotic: chaos.length
      ? Number((chaos.reduce((n, e) => n + e.duration, 0) / chaos.length).toFixed(2))
      : 0,
  }
}

/**
 * Turn the planet's radiation history into the novel's own vocabulary:
 * 恒纪元 when the flux sits in a comfortable band for a while, 乱纪元 when it
 * swings wildly. A "civilization" is one 恒纪元 window.
 */
export function eraSegments(track, lang) {
  if (!track || track.length < 8) return []
  const fluxes = track.map((p) => p.flux).filter((f) => Number.isFinite(f) && f > 0)
  if (!fluxes.length) return []
  const sorted = [...fluxes].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const low = median * 0.55
  const high = median * 2.1
  // Minimum span in TIME units — the track is sampled at irregular intervals,
  // so a sample-count threshold would misjudge short but real epochs.
  const span = Math.abs(track[track.length - 1].t - track[0].t) || 1
  const minSpan = span * 0.02

  const segments = []
  let current = { kind: track[0].flux >= low && track[0].flux <= high ? 'stable' : 'chaotic', start: track[0].t, flux: [] }
  for (const point of track) {
    const kind = point.flux >= low && point.flux <= high ? 'stable' : 'chaotic'
    if (kind !== current.kind) {
      segments.push(current)
      current = { kind, start: point.t, flux: [] }
    }
    current.flux.push(point.flux)
    current.end = point.t
    current.lastNearest = point.nearest
  }
  segments.push(current)

  // Absorb single-sample flickers so the labels read like weather, not noise.
  // Only a segment surrounded on both sides by the same kind is absorbed, and
  // never the first or last one.
  const cleaned = segments.slice()
  for (let i = 1; i < cleaned.length - 1; i++) {
    const seg = cleaned[i]
    if (seg.end - seg.start < minSpan && cleaned[i - 1].kind === cleaned[i + 1].kind) {
      cleaned[i - 1].end = seg.end
      cleaned.splice(i, 1)
      i--
    }
  }
  // A sliver at either end is a sampling artefact, not an epoch.
  while (cleaned.length > 1 && cleaned[0].end - cleaned[0].start < minSpan) {
    cleaned[1].start = cleaned[0].start
    cleaned.shift()
  }
  while (cleaned.length > 1 && cleaned[cleaned.length - 1].end - cleaned[cleaned.length - 1].start < minSpan) {
    const last = cleaned.pop()
    cleaned[cleaned.length - 1].end = last.end
  }

  const en = lang === 'en'
  return cleaned.map((seg) => ({
    kind: seg.kind,
    label: en
      ? (seg.kind === 'stable' ? 'Stable Era' : 'Chaotic Era')
      : (seg.kind === 'stable' ? '恒纪元' : '乱纪元'),
    labelEn: seg.kind === 'stable' ? 'Stable Era' : 'Chaotic Era',
    start: Number(seg.start.toFixed(2)),
    end: Number(seg.end.toFixed(2)),
    duration: Number((seg.end - seg.start).toFixed(2)),
    star: seg.lastNearest || '',
    starEn: seg.lastNearestEn || seg.lastNearest || '',
  }))
}

function summarize(metrics, events, track, lang) {
  const en = lang === 'en'
  const lines = []
  if (metrics.stable) {
    lines.push(en
      ? 'Energy drift over the whole integration is ' + (metrics.energyDrift * 100).toFixed(2)
        + '%, and the system stays bound.'
      : '整个积分过程能量漂移 ' + (metrics.energyDrift * 100).toFixed(2) + '%，系统保持束缚。')
  } else {
    lines.push(en
      ? 'Energy drift ' + (metrics.energyDrift * 100).toFixed(2) + '%; '
        + (metrics.ejected.length
          ? metrics.ejected.length + (metrics.ejected.length === 1 ? ' body was' : ' bodies were') + ' ejected.'
          : 'the system underwent a collisional merge.')
      : '能量漂移 ' + (metrics.energyDrift * 100).toFixed(2) + '%，' + (metrics.ejected.length
        ? metrics.ejected.length + ' 个天体被抛出系统。'
        : '系统发生了碰撞合并。'))
  }
  const eject = events.filter((e) => e.type === 'eject')
  if (eject.length) {
    // The event text is already a full sentence ("X was ejected ..."), so the
    // English branch must not wrap it in another one.
    lines.push(en ? eject[0].textEn || eject[0].text : '最先离开的是' + eject[0].text + '。')
  }
  if (track.length) {
    const minD = track.reduce((m, p) => Math.min(m, p.d || Infinity), Infinity)
    const maxD = track.reduce((m, p) => Math.max(m, p.d || 0), 0)
    lines.push(en
      ? 'The planet\'s distance to the nearest star swings between ' + minD.toFixed(2) + ' and '
        + maxD.toFixed(2) + '.'
      : '行星与最近恒星的距离在 ' + minD.toFixed(2) + ' 与 ' + maxD.toFixed(2) + ' 之间摆动。')
  }
  return lines.join(en ? ' ' : '')
}

/* ------------------------------------------------------------------ *
 * Sensitivity — the butterfly effect, measured
 * ------------------------------------------------------------------ */

/**
 * Run the system twice, differing by `epsilon` in one velocity component,
 * and report how the separation grows. A real answer to "为什么三体问题不可解".
 *
 * The two trajectories are integrated in lockstep at full precision — the
 * rendered frames are rounded for display, which would hide exactly the thing
 * this function is meant to measure.
 */
export function sensitivity(config) {
  const source = config && config.bodies ? clone(config.bodies) : clone(SIM_PRESETS[0].bodies)
  const params = Object.assign({ dt: 0.002, steps: 9000 }, (config && config.params) || {})
  const dt = Math.max(1e-5, Math.min(0.02, Number(params.dt) || 0.002))
  const steps = Math.max(400, Math.min(40000, Math.round(Number(params.steps) || 9000)))
  const epsilon = Number((config && config.epsilon) || 1e-6)

  const prepare = (bodies) => bodies.map((b, i) => ({
    id: b.id || 'b' + i,
    mass: Math.max(1e-9, Number(b.mass) || 1),
    x: Number(b.x) || 0, y: Number(b.y) || 0,
    vx: Number(b.vx) || 0, vy: Number(b.vy) || 0,
  }))

  const a = prepare(source)
  const b = prepare(source)
  if (!a.length) {
    return {
      epsilon,
      curve: [],
      divergentAt: null,
      verdict: (config && config.lang) === 'en' ? 'No bodies to integrate.' : '没有可积分的天体。',
    }
  }
  b[0].vx += epsilon

  const reference = Math.min(2, a.length - 1)
  const curve = []
  let divergentAt = null
  // Divergence must be judged relative to the perturbation and to the size of
  // the system. A fixed 1e-3 was measured against the old, heavily softened
  // force; with real close encounters the separation grows more gradually, so
  // the test is "has the difference escaped rounding", scaled to the orbit.
  const threshold = Math.max(epsilon * 100, 1e-4)
  const sample = Math.max(1, Math.round(steps / 220))

  for (let s = 0; s <= steps; s++) {
    if (s % sample === 0) {
      const sep = Math.hypot(a[reference].x - b[reference].x, a[reference].y - b[reference].y)
      const t = Number((s * dt).toFixed(3))
      curve.push({ t, sep: Number(sep.toExponential(2)), raw: sep })
      if (divergentAt === null && sep > threshold) divergentAt = t
    }
    if (s === steps) break
    // Both runs must take the *same* sub-step sequence, or the comparison
    // measures the step controller instead of the initial condition.
    const sub = substepCount(a, dt)
    stepSim(a, dt, sub)
    stepSim(b, dt, sub)
  }

  const final = curve[curve.length - 1]
  const en = (config && config.lang) === 'en'
  return {
    epsilon,
    steps,
    dt,
    span: Number((steps * dt).toFixed(2)),
    divergentAt,
    curve: curve.map(({ t, sep }) => ({ t, sep })),
    growth: final ? Number((final.raw / epsilon).toExponential(2)) : null,
    verdict: divergentAt === null
      ? (en
        ? 'The two orbits stay almost coincident for ' + (steps * dt).toFixed(1)
          + ' time units: this initial condition is insensitive to the perturbation (or the integration '
          + 'is not long enough yet).'
        : '在这 ' + (steps * dt).toFixed(1) + ' 个时间单位内两条轨道几乎重合：该初始条件对微扰不敏感（或者积分时间还不够长）。')
      : (en
        ? 'Changing only the initial velocity of body ' + (reference + 1) + ' by ' + epsilon
          + ', the two orbits are already clearly separated at t≈' + divergentAt
          + ' (amplified ' + (final ? (final.raw / epsilon).toExponential(1) : '?') + 'x).'
          + ' This is not numerical error but the initial-value sensitivity of the three-body system itself — '
          + 'the same set of physical laws, two completely different lifetimes.'
        : '仅把第 ' + (reference + 1) + ' 个天体的初速度改动 ' + epsilon + '，两条轨道在 t≈' + divergentAt
          + ' 时已经明显分离（放大 ' + (final ? (final.raw / epsilon).toExponential(1) : '?') + ' 倍）。'
          + '这不是数值误差，而是三体系统本身的初值敏感性——同一组物理定律，给出完全不同的一生。'),
  }
}

/* ------------------------------------------------------------------ *
 * Stability landscape
 * ------------------------------------------------------------------ */

/**
 * Sweep initial conditions and bucket the outcomes. Produces the evidence a
 * reader needs to feel, rather than be told, that stable three-body systems
 * are the exception.
 *
 * Initial velocities follow the circular-orbit estimate (v ≈ √(GM/r)) with a
 * random perturbation, so the sample is not rigged toward collapse; the spread
 * of the perturbation is itself one of the sampled variables.
 */
export function stabilityScan(options = {}) {
  const samples = Math.max(8, Math.min(240, Math.round(options.samples || 84)))
  const random = rng(options.seed || 20230806)
  const points = []
  const buckets = { stable: 0, chaotic: 0, eject: 0, collapse: 0 }

  for (let i = 0; i < samples; i++) {
    const scale = 0.7 + random() * 2.2
    const masses = [1, 0.35 + random() * 1.5, 0.5 + random() * 1.2]
    const bodies = []
    for (let k = 0; k < 3; k++) {
      const angle = random() * Math.PI * 2
      const radius = scale * (0.55 + random() * 0.85)
      bodies.push({
        id: 's' + k, name: '恒星 ' + (k + 1), kind: 'star',
        mass: Number(masses[k].toFixed(2)), radius: 7,
        x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, vx: 0, vy: 0,
      })
    }
    // Circular-orbit velocity from the enclosed mass, then perturbed.
    const pert = 0.55 + random() * 0.5
    for (const body of bodies) {
      const r = Math.hypot(body.x, body.y) || 0.8
      const enclosed = bodies.reduce((m, other) => (
        other !== body && Math.hypot(other.x, other.y) < r ? m + other.mass : m
      ), body.mass)
      const v = Math.sqrt(enclosed / r) * pert
      body.vx = (-body.y / r) * v
      body.vy = (body.x / r) * v
    }
    const planetAngle = random() * Math.PI * 2
    const planetRadius = scale * (2.1 + random() * 1.1)
    bodies.push({
      id: 'p', name: '行星', kind: 'planet', mass: 1e-5, radius: 3,
      x: Math.cos(planetAngle) * planetRadius,
      y: Math.sin(planetAngle) * planetRadius,
      vx: -Math.sin(planetAngle) * Math.sqrt(2.6 / planetRadius),
      vy: Math.cos(planetAngle) * Math.sqrt(2.6 / planetRadius),
    })

    const result = simulate({ bodies, params: { dt: 0.0018, steps: 2800, record: 40, escape: scale * 6 } })
    const m = result.metrics
    let outcome
    if (m.collapsed) outcome = 'collapse'
    else if (m.ejected.length) outcome = 'eject'
    else if (m.maxSeparation < (scale * 6)) outcome = 'stable'
    else outcome = 'chaotic'
    buckets[outcome]++
    points.push({
      massRatio: Number((masses[1] / masses[0]).toFixed(2)),
      spread: Number(scale.toFixed(2)),
      perturbation: Number(pert.toFixed(2)),
      outcome,
      drift: m.energyDrift,
      survived: m.bodiesLeft,
    })
  }
  const total = points.length
  const en = options.lang === 'en'
  return {
    samples: total,
    buckets,
    share: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, Number(((v / total) * 100).toFixed(1))])),
    points,
    verdict: en
      ? 'Out of ' + total + ' random initial conditions, only ' + buckets.stable + ' ('
        + ((buckets.stable / total) * 100).toFixed(1) + '%) stayed bound; '
        + buckets.eject + ' were ejected and ' + buckets.collapse + ' underwent a collisional merge.'
      : '在 ' + total + ' 组随机初始条件里，只有 ' + buckets.stable + ' 组（'
        + ((buckets.stable / total) * 100).toFixed(1) + '%）保持束缚；'
        + (buckets.eject) + ' 组飞散，' + buckets.collapse + ' 组发生碰撞合并。',
  }
}

/* ------------------------------------------------------------------ *
 * Civilization census
 * ------------------------------------------------------------------ */

/**
 * How many civilizations can a three-star world actually raise?
 *
 * A single integration answers this only for one trajectory, and that
 * trajectory is short for a physical reason: the planet is flung out at
 * T≈28.6 in the default preset, and once it leaves there is no surface left to
 * raise anything. Lengthening the integration does not help — measured, the
 * generation count peaks at 4 around T=19 and then *falls* to 1, because the
 * only thing more time buys is more time after the planet is gone.
 *
 * So the honest way to show the trilogy's scale is not a longer single run but
 * a distribution over many real runs. Each sample here is a genuine
 * velocity-Verlet integration; nothing is scripted.
 *
 * Batched on purpose: one sample costs ~25 ms, so 60 samples in one call would
 * block the Host's event loop for over a second. The caller walks `offset` until
 * `done`, and each call stays under ~0.2 s.
 *
 * Samples use a *derived* seed per index (`seed ^ imul(i, 2654435761)`) rather
 * than advancing one stream, because only the former lets a batch start at an
 * arbitrary offset. Consequence worth knowing: this samples a different set of
 * initial conditions than stabilityScan does, so the two are not comparable
 * sample-for-sample.
 */
export function civilizationCensus(options = {}) {
  const total = Math.max(8, Math.min(120, Math.round(Number(options.samples) || 60)))
  const limit = Math.max(1, Math.min(24, Math.round(Number(options.limit) || 12)))
  const offset = Math.max(0, Math.min(total, Math.round(Number(options.offset) || 0)))
  const seed = Number(options.seed) || 20230806
  const steps = Math.max(2000, Math.min(16000, Math.round(Number(options.steps) || 8000)))
  const end = Math.min(total, offset + limit)

  const seedFor = (i) => {
    const s = (seed ^ Math.imul(i, 2654435761)) >>> 0
    return s === 0 ? 0x9e3779b9 : s
  }

  const points = runSamples({ seed, steps, from: offset, to: end, seedFor })

  const done = end >= total
  const next = done ? null : end
  const out = { points, done, next, total, offset, limit, steps, seed }

  // The aggregate needs every sample, but this call computed only one batch.
  //
  // Three designs were measured:
  //   a) recompute the whole sweep on the last call — 1462 ms, ~7× the other
  //      batches, an obvious stall;
  //   b) re-integrate only the gaps named by the caller — still 658 ms on the
  //      last batch, 1341 ms total, worse than the 750 ms single-shot sweep, so
  //      batching stopped paying for itself;
  //   c) fold the rows the caller already has — pure arithmetic, microseconds.
  //
  // (c) is what ships. The caller sends its rows back and gets an aggregate over
  // them; nothing is re-integrated, so no batch is slow. A caller could in
  // principle report numbers this process did not compute, but that only alters
  // the picture in its own window — it can already do that in devtools — and the
  // numbers the Agent tool reports are folded in-process from rows the Host just
  // produced. Paying 650 ms of stall on every sweep to close that is a bad trade.
  const collected = Array.isArray(options.collected) ? options.collected : null
  if (done) {
    if (collected) {
      // Its own batch is authoritative for the indices it covered, so a stale or
      // tampered copy of a row this call just computed cannot shadow the real one.
      const mine = new Map(points.map((p) => [p.index, p]))
      const seen = new Set()
      const merged = []
      for (const p of collected) {
        if (!p || !Number.isInteger(p.index) || p.index < 0 || p.index >= total) continue
        if (seen.has(p.index)) continue
        seen.add(p.index)
        merged.push(mine.get(p.index) || p)
      }
      for (const p of points) {
        if (!seen.has(p.index)) { seen.add(p.index); merged.push(p) }
      }
      merged.sort((a, b) => a.index - b.index)
      out.aggregate = foldCensus(merged, total, options.lang)
      out.complete = merged.length === total
    } else if (points.length === total) {
      out.aggregate = aggregateCensus(points, total, options.lang)
      out.complete = true
    } else {
      out.complete = false
    }
  }
  return out
}

/**
 * Integrate samples [from, to) and reduce each to one row.
 *
 * Split out from civilizationCensus so the final aggregate can re-run the whole
 * sweep without carrying state between HTTP requests: every batch is a pure
 * function of (seed, index), so a batch's result never depends on call history.
 */
function runSamples({ seed, steps, from, to, seedFor }) {
  const pick = seedFor || ((i) => {
    const s = (seed ^ Math.imul(i, 2654435761)) >>> 0
    return s === 0 ? 0x9e3779b9 : s
  })
  const points = []
  for (let i = from; i < to; i++) {
    const random = rng(pick(i))
    const scale = 0.7 + random() * 2.2
    const masses = [1, 0.35 + random() * 1.5, 0.5 + random() * 1.2]
    const bodies = []
    for (let k = 0; k < 3; k++) {
      const angle = random() * Math.PI * 2
      const radius = scale * (0.55 + random() * 0.85)
      bodies.push({
        id: 's' + k, name: '恒星 ' + (k + 1), kind: 'star',
        mass: Number(masses[k].toFixed(2)), radius: 7,
        x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, vx: 0, vy: 0,
      })
    }
    const pert = 0.55 + random() * 0.5
    for (const body of bodies) {
      const r = Math.hypot(body.x, body.y) || 0.8
      const enclosed = bodies.reduce((m, other) => (
        other !== body && Math.hypot(other.x, other.y) < r ? m + other.mass : m
      ), body.mass)
      const v = Math.sqrt(enclosed / r) * pert
      body.vx = (-body.y / r) * v
      body.vy = (body.x / r) * v
    }
    const planetAngle = random() * Math.PI * 2
    const planetRadius = scale * (2.1 + random() * 1.1)
    bodies.push({
      id: 'p', name: '行星', kind: 'planet', mass: 1e-5, radius: 3,
      x: Math.cos(planetAngle) * planetRadius,
      y: Math.sin(planetAngle) * planetRadius,
      vx: -Math.sin(planetAngle) * Math.sqrt(2.6 / planetRadius),
      vy: Math.cos(planetAngle) * Math.sqrt(2.6 / planetRadius),
    })

    const result = simulate({
      bodies,
      params: { dt: 0.0018, steps, record: 40, escape: scale * 6 },
    })
    const m = result.metrics
    const civ = result.civilizations || {}
    const eras = result.eras || []
    const stableEras = eras.filter((e) => e.kind === 'stable')
    const chaoticEras = eras.filter((e) => e.kind === 'chaotic')
    const fatal = (result.catastrophes || []).filter((c) => (
      c.type === 'triple-sun' || c.type === 'tidal' || c.type === 'triple-alignment'
    ))
    const planet = result.frames.length
      ? result.frames[result.frames.length - 1].bodies.find((b) => b.id === 'p')
      : null
    // Two different questions, deliberately kept apart:
    //   outcome       — what happened to the *system* (did anything fly off?)
    //   planetGone    — is the planet itself still there to bear a civilization?
    // The planet can vanish either by being ejected or by being swallowed in a
    // merge, and a *star* can be ejected while the planet stays. Collapsing the
    // two into one flag made "eject" outnumber "planet escaped", so keep both.
    const planetEjected = (m.ejected || []).some((e) => e.id === 'p')
    const planetMerged = Boolean(planet && planet.dead && !planetEjected)

    points.push({
      index: i,
      generations: civ.generations || 0,
      stableEras: stableEras.length,
      chaoticEras: chaoticEras.length,
      stableSpan: Number(stableEras.reduce((s, e) => s + e.duration, 0).toFixed(2)),
      chaoticSpan: Number(chaoticEras.reduce((s, e) => s + e.duration, 0).toFixed(2)),
      fatalEvents: fatal.length,
      outcome: m.collapsed ? 'collapse' : (m.ejected.length ? 'eject' : (m.maxSeparation < scale * 6 ? 'stable' : 'chaotic')),
      planetEscaped: planetEjected,
      planetMerged,
      survived: m.bodiesLeft,
    })
  }
  return points
}

/**
 * Fold census rows into the aggregate shape.
 *
 * Exported because both halves need it and they must agree: the panel walks the
 * batches and folds here, and the Agent tool does the same after its own walk.
 * Only rows produced by runSamples above are folded, so nothing here invents a
 * number — it is arithmetic over integrations this process ran.
 */
export function foldCensus(rows, total, lang) {
  const pts = (rows || []).filter((p) => p && Number.isFinite(p.generations))
  const gens = pts.map((p) => p.generations)
  const histogram = {}
  for (const g of gens) histogram[g] = (histogram[g] || 0) + 1
  const sorted = [...gens].sort((a, b) => a - b)
  const mean = gens.length ? gens.reduce((a, b) => a + b, 0) / gens.length : 0
  const median = sorted.length
    ? (sorted.length % 2
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
    : 0
  const byOutcome = {}
  for (const key of ['stable', 'chaotic', 'eject', 'collapse']) {
    const subset = pts.filter((p) => p.outcome === key)
    if (!subset.length) continue
    byOutcome[key] = {
      n: subset.length,
      mean: Number((subset.reduce((s, p) => s + p.generations, 0) / subset.length).toFixed(2)),
    }
  }
  const escaped = pts.filter((p) => p.planetEscaped).length
  const merged = pts.filter((p) => p.planetMerged).length
  const barren = pts.filter((p) => p.generations === 0).length
  const best = Object.keys(histogram).map(Number).sort((a, b) => b - a)[0] || 0
  const n = pts.length || 1
  return {
    samples: pts.length,
    total: Number(total) || pts.length,
    histogram,
    mean: Number(mean.toFixed(2)),
    median,
    max: best,
    byOutcome,
    escaped,
    merged,
    planetGone: escaped + merged,
    barren,
    correlation: Number(pearson(pts.map((p) => p.stableSpan || 0), gens).toFixed(3)),
    verdict: buildCensusVerdict({ total: n, mean, max: best, barren, escaped, merged, histogram, lang: lang }),
  }
}

function aggregateCensus(points, total, lang) {
  const generations = points.map((p) => p.generations)
  const histogram = {}
  for (const g of generations) histogram[g] = (histogram[g] || 0) + 1
  const sorted = [...generations].sort((a, b) => a - b)
  const sum = generations.reduce((a, b) => a + b, 0)
  const mean = generations.length ? sum / generations.length : 0
  const median = sorted.length
    ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
    : 0
  const max = sorted.length ? sorted[sorted.length - 1] : 0

  const byOutcome = {}
  for (const key of ['stable', 'chaotic', 'eject', 'collapse']) {
    const subset = points.filter((p) => p.outcome === key)
    if (!subset.length) continue
    byOutcome[key] = {
      n: subset.length,
      mean: Number((subset.reduce((s, p) => s + p.generations, 0) / subset.length).toFixed(2)),
    }
  }

  const escaped = points.filter((p) => p.planetEscaped).length
  const merged = points.filter((p) => p.planetMerged).length
  const barren = points.filter((p) => p.generations === 0).length

  return {
    samples: points.length,
    total,
    histogram,
    mean: Number(mean.toFixed(2)),
    median,
    max,
    byOutcome,
    escaped,
    merged,
    // The planet is gone either way; this is the share of systems where it had no
    // chance to keep bearing civilizations.
    planetGone: escaped + merged,
    barren,
    correlation: Number(pearson(
      points.map((p) => p.stableSpan),
      generations,
    ).toFixed(3)),
    verdict: buildCensusVerdict({ total, mean, max, barren, escaped, merged, histogram, lang }),
  }
}

function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, dx = 0, dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  const den = Math.sqrt(dx * dy)
  return den === 0 ? 0 : num / den
}

function buildCensusVerdict({ total, mean, max, barren, escaped, merged, histogram, lang }) {
  const best = Object.keys(histogram).map(Number).sort((a, b) => b - a)[0]
  const gone = escaped + merged
  if (lang === 'en') {
    return 'Across ' + total + ' random initial conditions the planet raises ' + mean.toFixed(2)
      + ' generations of civilization on average, at most ' + best + '; ' + barren + ' runs ('
      + ((barren / total) * 100).toFixed(0) + '%) never produced a single one. In ' + gone + ' runs ('
      + ((gone / total) * 100).toFixed(0) + '%) the planet ended up gone — ' + escaped
      + ' were ejected from the system and ' + merged + ' were swallowed by a star. '
      + 'This is not a scripted outcome: every run is a real gravitational integration.'
  }
  return '在 ' + total + ' 组随机初始条件里，平均只孕育 ' + mean.toFixed(2) + ' 代文明，'
    + '最多 ' + best + ' 代；' + barren + ' 组（' + ((barren / total) * 100).toFixed(0)
    + '%）连一代都没能出现。' + gone + ' 组（' + ((gone / total) * 100).toFixed(0)
    + '%）的行星最终消失——' + escaped + ' 组被抛出系统，' + merged + ' 组被恒星吞并。'
    + '这不是脚本写好的剧本，每一组都是一次真实的引力积分。'
}

/* ------------------------------------------------------------------ *
 * Dark forest sandbox
 * ------------------------------------------------------------------ */

/**
 * A deliberately small model of the argument, not a scientific one.
 * Each civilization grows (with rare technology explosions), can see every
 * other civilization, and strikes when the chain of suspicion says the
 * neighbour will outgrow it. Parameters are the ones the novels debate.
 */
export function darkForest(options = {}) {
  const civs = Math.max(6, Math.min(120, Math.round(options.civs || 48)))
  const rounds = Math.max(10, Math.min(400, Math.round(options.rounds || 120)))
  const suspicion = Math.max(0, Math.min(1, options.suspicion === undefined ? 0.55 : options.suspicion))
  const explosion = Math.max(0, Math.min(1, options.explosion === undefined ? 0.06 : options.explosion))
  const cost = Math.max(0, Math.min(1, options.cost === undefined ? 0.35 : options.cost))
  const random = rng(options.seed || 42)

  const population = []
  for (let i = 0; i < civs; i++) {
    population.push({
      id: 'c' + i,
      tech: 0.2 + random() * 0.9,
      growth: 0.004 + random() * 0.02,
      alive: true,
      strikes: 0,
    })
  }

  const history = []
  let strikes = 0
  let explosions = 0
  for (let round = 0; round < rounds; round++) {
    // Growth, with the occasional leap the novels call 技术爆炸.
    for (const civ of population) {
      if (!civ.alive) continue
      let g = civ.growth
      if (random() < explosion) { g *= 6; explosions++ }
      civ.tech *= 1 + g
    }
    // Strikes: the strongest civ kills whichever neighbour it can, when the
    // suspicion threshold says the neighbour is a future threat.
    for (const hunter of population) {
      if (!hunter.alive) continue
      for (const prey of population) {
        if (prey === hunter || !prey.alive) continue
        const outmatches = hunter.tech > prey.tech * 1.02
        const futureThreat = prey.tech * (1 + prey.growth) ** 60 > hunter.tech * 0.98
        if (outmatches && (futureThreat || random() < suspicion * 0.35)) {
          if (random() < 0.35 + suspicion * 0.5 - cost * 0.3) {
            prey.alive = false
            hunter.strikes++
            strikes++
            // Striking is not free: the hunter loses a little tech.
            hunter.tech *= 1 - cost * 0.05
          }
        }
      }
    }
    history.push({
      round,
      alive: population.filter((c) => c.alive).length,
      maxTech: Number(Math.max(...population.filter((c) => c.alive).map((c) => c.tech), 0).toFixed(3)),
    })
    if (history[history.length - 1].alive <= 1) break
  }

  const survivors = population.filter((c) => c.alive)
  const avgTech = population.reduce((n, c) => n + c.tech, 0) / population.length
  const survivorsTech = survivors.length ? survivors.reduce((n, c) => n + c.tech, 0) / survivors.length : 0
  const en = options.lang === 'en'
  return {
    params: { civs, rounds, suspicion, explosion, cost },
    history,
    strikes,
    explosions,
    survivors: survivors.map((c) => ({ id: c.id, tech: Number(c.tech.toFixed(3)), strikes: c.strikes })),
    survivalRate: Number(((survivors.length / civs) * 100).toFixed(1)),
    finalTech: Number(survivorsTech.toFixed(3)),
    verdict: survivors.length <= 1
      ? (en
        ? 'After ' + rounds + ' rounds only ' + survivors.length + ' civilizations are left in the universe: '
          + 'the Dark Forest has no winners, only a last one standing.'
        : '经过 ' + rounds + ' 轮，宇宙里只剩下 ' + survivors.length + ' 个文明：黑暗森林里没有赢家，只有最后一个。')
      : (en
        ? 'After ' + strikes + ' strikes, ' + survivors.length + ' / ' + civs + ' civilizations survive ('
          + ((survivors.length / civs) * 100).toFixed(1) + '%). The higher the suspicion threshold, the earlier '
          + 'the strikes and the fewer the survivors.'
        : '经过 ' + strikes + ' 次打击，' + survivors.length + ' / ' + civs + ' 个文明存活（'
          + ((survivors.length / civs) * 100).toFixed(1) + '%）。猜疑阈值越高，打击越早、存活越少。'),
    comparison: {
      avgTech: Number(avgTech.toFixed(3)),
      survivorsTech: Number(survivorsTech.toFixed(3)),
      note: en
        ? 'The survivors average a tech level of ' + survivorsTech.toFixed(2) + ' against ' + avgTech.toFixed(2)
          + ' for the whole population: the ones who live are usually the ones who struck first.'
        : '存活者的平均技术水平 ' + survivorsTech.toFixed(2) + ' 对比全体 ' + avgTech.toFixed(2)
          + '：能活下来的，往往是先动手的那一个。',
    },
  }
}

/* ------------------------------------------------------------------ *
 * Deterministic "文明的代价" — the 威慑 game
 * ------------------------------------------------------------------ */

/**
 * The deterrence balance: a sword-holder's credibility is a function of how
 * much they are willing to lose. Reproduces the novel's central paradox with
 * explicit assumptions, and shows why 程心 fails where 罗辑 succeeds.
 */
export function deterrence(options = {}) {
  const resolve = Math.max(0, Math.min(1, options.resolve === undefined ? 0.5 : options.resolve))
  const invasion = Math.max(0, Math.min(1, options.invasion === undefined ? 0.6 : options.invasion))
  const luck = Math.max(0, Math.min(1, options.luck === undefined ? 0.5 : options.luck))
  const random = rng(options.seed || 7)

  const rounds = 40
  const history = []
  let alive = 100
  let held = true
  for (let i = 0; i < rounds; i++) {
    // The deterrent holds while the sword-holder's credibility exceeds the
    // invader's incentive. Both fluctuate; 威慑度 is the observable.
    const credibility = resolve * (0.75 + random() * 0.5)
    const threat = invasion * (0.7 + random() * 0.6) * (1 - luck * 0.25)
    if (credibility < threat) held = false
    if (!held) {
      alive = Math.max(0, alive - Math.round(2 + random() * 4))
    }
    history.push({
      round: i,
      credibility: Number(Math.min(1, credibility).toFixed(3)),
      threat: Number(threat.toFixed(3)),
      held,
      alive,
    })
  }
  const finalScore = Math.round((resolve * 0.45 + invasion * 0.2 + luck * 0.1 + (held ? 0.25 : 0)) * 100)
  const en = options.lang === 'en'
  return {
    params: { resolve, invasion, luck },
    history,
    held,
    survival: alive,
    score: finalScore,
    verdict: held
      ? (en
        ? 'Deterrence held: the Swordholder convinced the enemy that he really would press the button, and '
          + 'the invasion did not happen within ' + rounds + ' rounds.'
        : '威慑维持成功：执剑人让敌人相信「他真的会按下按钮」，入侵在 ' + rounds + ' 轮内没有发生。')
      : (en
        ? 'Deterrence collapsed in round ' + history.find((h) => !h.held).round
          + ': the Swordholder\'s will was weaker than the lure of invasion, and humanity lost its seat at the table.'
        : '威慑在第 ' + history.find((h) => !h.held).round
          + ' 轮破裂：执剑人的意志低于入侵的诱惑，人类失去谈判桌。'),
    insight: en
      ? 'Deterrence is not a measure of kindness but of the willingness to go down together. That is exactly '
        + 'the difference between Luo Ji and Cheng Xin on the same scale.'
      : '威慑度不是善良的度量，而是「愿意同归于尽」的意愿强度。这也是罗辑与程心在同一天平上的差别。',
  }
}
