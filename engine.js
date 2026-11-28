/**
 * Three-Body Atlas — pure query, graph and question-answering engine.
 *
 * No I/O. The Host routes, the agent tools and the browser panel all call into
 * this module, so a conversational answer and what the panel shows can never
 * drift apart.
 */

import {
  WORKS, WORK_BY_ID, FACTIONS, FACTIONS_BY_ID, RELATION_TYPES,
  CHARACTERS, CHARACTER_BY_ID,
  ERAS, ERA_BY_ID, EVENTS,
  PLOT, GAME_LEVELS, PATHS, DIFFERENCES, THEMES,
  PLACES, PLACE_BY_ID, TECH, TECH_BY_ID, GLOSSARY, GLOSSARY_BY_ID, QUOTES,
  TIER_LABELS, MAX_TIER, GLOSSARY_TIER, MASKED_FIELDS, tierOfWork, tierOfWorks, maskRecord,
} from './data/index.js'
import { SIM_PRESETS, simulate, sensitivity, stabilityScan, civilizationCensus, foldCensus, darkForest, deterrence } from './sim.js'

const norm = (value) => String(value == null ? '' : value).trim().toLowerCase()

const CANON_ORDER = ['原著', '原著与剧集', '腾讯剧集', '动画改编', 'Netflix 改编', '非官方同人（仅作对照）']

/* ------------------------------------------------------------------ *
 * Index
 * ------------------------------------------------------------------ */

function buildIndex() {
  const rows = []
  for (const c of CHARACTERS) {
    rows.push({
      kind: 'character', id: c.id, name: c.name, nameEn: c.nameEn,
      hay: [c.name, c.nameEn, ...(c.alias || []), c.factionLabel, c.kind, c.canon, c.summary, c.details, ...(c.tags || [])].join(' '),
    })
  }
  for (const p of PLACES) {
    rows.push({
      kind: 'place', id: p.id, name: p.name, nameEn: p.nameEn,
      hay: [p.name, p.nameEn, p.region, p.type, p.canon, p.summary, p.desc].join(' '),
    })
  }
  for (const t of TECH) {
    rows.push({
      kind: 'tech', id: t.id, name: t.name, nameEn: t.nameEn,
      hay: [t.name, t.nameEn, t.tier, t.category, t.era, t.summary, t.desc].join(' '),
    })
  }
  for (const g of GLOSSARY) {
    rows.push({
      kind: 'glossary', id: g.id, name: g.term, nameEn: g.termEn || '',
      hay: [g.term, g.termEn || '', g.category, g.definition, g.detail].join(' '),
    })
  }
  for (const w of WORKS) {
    rows.push({
      kind: 'work', id: w.id, name: w.title, nameEn: w.titleEn,
      hay: [w.title, w.titleEn, String(w.year), w.author, w.canon, w.summary, w.tone].join(' '),
    })
  }
  for (const e of EVENTS) {
    rows.push({
      kind: 'event', id: e.id, name: e.title, nameEn: '',
      hay: [e.title, e.desc, e.year, ERA_BY_ID[e.era] ? ERA_BY_ID[e.era].name : ''].join(' '),
    })
  }
  for (const t of THEMES) {
    rows.push({
      kind: 'theme', id: t.id, name: t.title, nameEn: '',
      hay: [t.title, t.question, t.summary, t.discussion, ...(t.sides || []).map((s) => s.name + ' ' + s.view)].join(' '),
    })
  }
  return rows.map((row) => ({ ...row, hay: norm(row.hay) }))
}
const INDEX = buildIndex()

/* ------------------------------------------------------------------ *
 * Cards / summaries
 * ------------------------------------------------------------------ */

export function toCard(c) {
  return {
    id: c.id, name: c.name, nameEn: c.nameEn, alias: c.alias || [],
    faction: c.faction, factionLabel: c.factionLabel, kind: c.kind,
    canon: c.canon, summary: c.summary, fate: c.fate, tags: c.tags || [],
    works: c.works || {}, firstWork: c.firstWork,
  }
}

function describe(kind, id) {
  if (kind === 'character') { const c = CHARACTER_BY_ID[id]; return c ? toCard(c) : null }
  if (kind === 'place') {
    const p = PLACE_BY_ID[id]
    return p ? { id: p.id, name: p.name, nameEn: p.nameEn, kind: '地点', type: p.type, summary: p.summary } : null
  }
  if (kind === 'tech') {
    const t = TECH_BY_ID[id]
    return t ? { id: t.id, name: t.name, nameEn: t.nameEn, kind: '技术', type: t.category, summary: t.summary } : null
  }
  if (kind === 'glossary') {
    const g = GLOSSARY_BY_ID[id]
    return g ? { id: g.id, name: g.term, nameEn: g.termEn || '', kind: '术语', type: g.category, summary: g.definition } : null
  }
  if (kind === 'work') {
    const w = WORK_BY_ID[id]
    return w ? { id: w.id, name: w.title, nameEn: w.titleEn, kind: '作品', type: w.kind, summary: w.summary } : null
  }
  if (kind === 'event') {
    const e = EVENTS.find((x) => x.id === id)
    return e ? { id: e.id, name: e.title, nameEn: '', kind: '事件', type: e.year, summary: e.desc } : null
  }
  if (kind === 'theme') {
    const t = THEMES.find((x) => x.id === id)
    return t ? { id: t.id, name: t.title, nameEn: '', kind: '议题', type: '', summary: t.question } : null
  }
  return null
}

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

export function searchCharacters(query = '', options = {}) {
  const q = norm(query)
  let list = CHARACTERS
  if (options.faction) list = list.filter((c) => c.faction === options.faction)
  if (options.work) list = list.filter((c) => c.works && c.works[options.work])
  if (options.kind) list = list.filter((c) => c.kind === options.kind)
  if (options.canon) list = list.filter((c) => c.canon === options.canon)
  if (q) {
    list = list.filter((c) => norm([
      c.name, c.nameEn, ...(c.alias || []), c.factionLabel, c.kind, c.summary, c.details, ...(c.tags || []),
    ].join(' ')).includes(q))
  }
  return list.map(toCard)
}

const GROUP_LABELS = { character: '人物', place: '地点', tech: '技术', glossary: '术语', work: '作品', event: '事件', theme: '议题' }

export function searchAll(query = '') {
  const q = norm(query)
  if (!q) return { groups: [], total: 0 }
  const hits = INDEX.filter((row) => row.hay.includes(q))
  const byKind = {}
  for (const hit of hits) {
    const payload = describe(hit.kind, hit.id)
    if (!payload) continue
    byKind[hit.kind] = byKind[hit.kind] || []
    byKind[hit.kind].push(payload)
  }
  const order = ['character', 'place', 'tech', 'glossary', 'event', 'theme', 'work']
  const groups = order.filter((k) => byKind[k]).map((k) => ({ kind: k, label: GROUP_LABELS[k], items: byKind[k] }))
  return { groups, total: hits.length }
}

/* ------------------------------------------------------------------ *
 * Details
 * ------------------------------------------------------------------ */

const lookupCharacter = (key) => {
  const q = norm(key)
  if (!q) return null
  return CHARACTER_BY_ID[key]
    || CHARACTERS.find((c) => norm(c.id) === q)
    || CHARACTERS.find((c) => norm(c.name) === q || norm(c.nameEn) === q)
    || CHARACTERS.find((c) => (c.alias || []).some((a) => norm(a) === q))
    || CHARACTERS.find((c) => norm(c.name).includes(q) || q.includes(norm(c.name)))
    || null
}

export function characterDetail(key, options = {}) {
  const c = lookupCharacter(key)
  if (!c) return null
  const cap = normalizeTier(options.maxTier)
  const tier = tierOf('character', c)
  const relations = (c.relations || []).map((r) => {
    const other = CHARACTER_BY_ID[r.to]
    const type = RELATION_TYPES[r.type] || { label: r.type, color: '#888' }
    return {
      to: r.to, name: other ? other.name : r.to, nameEn: other ? other.nameEn : '',
      faction: other ? other.faction : '', type: r.type, typeLabel: type.label, label: r.label,
    }
  })
  const works = Object.entries(c.works || {}).map(([id, role]) => {
    const w = WORK_BY_ID[id]
    return { id, title: w ? w.title : id, canon: w ? w.canon : '', role, year: w ? w.year : null }
  })
  // Each sub-list is filtered by its OWN tier, not just the parent's. A
  // first-book reader looking at a character introduced early must not read
  // the synopsis of a book-three location or the title of a book-three event
  // through that character's dossier.
  const withinCap = (itemTier) => cap >= MAX_TIER || itemTier <= cap
  const places = PLACES.filter((p) => (p.characters || []).includes(c.id) && withinCap(tierOf('place', p)))
    .map((p) => ({ id: p.id, name: p.name, type: p.type, summary: p.summary }))
  const tech = TECH.filter((t) => (t.related || []).includes(c.id) && withinCap(tierOf('tech', t)))
    .map((t) => ({ id: t.id, name: t.name, tier: t.tier, summary: t.summary }))
  // Quotes carry a work id; the reader needs the title. Same for the sheet
  // and the tools, so resolve it once here.
  const quotes = QUOTES.filter((q) => q.speaker === c.id && withinCap(tierOf('quote', q))).map((q) => ({
    ...q,
    workTitle: WORK_BY_ID[q.work] ? WORK_BY_ID[q.work].title : q.work,
  }))
  const appearances = EVENTS.filter((e) => (e.characters || []).includes(c.id) && withinCap(tierOf('event', e)))
    .map((e) => ({ id: e.id, title: e.title, year: e.year, era: e.era, age: ERA_BY_ID[e.era] ? ERA_BY_ID[e.era].name : e.era }))
  const themes = THEMES.filter((t) => (t.related || []).includes(c.id))
    .map((t) => ({ id: t.id, title: t.title, question: t.question }))
  // A relationship label can itself be a spoiler ("从执剑人手中接过开关"),
  // so relationships to a not-yet-reached character are withheld too.
  const gatedRelations = cap >= MAX_TIER ? relations : relations.map((r) => {
    const other = CHARACTER_BY_ID[r.to]
    if (other && tierOf('character', other) > cap) {
      return { to: r.to, name: r.name, nameEn: r.nameEn, faction: r.faction, type: r.type, typeLabel: r.typeLabel, locked: true, tier: tierOf('character', other) }
    }
    return r
  })

  return maskRecord({
    ...toCard(c),
    tier,
    details: c.details || '',
    relations: gatedRelations, works, places, artifacts: tech, quotes, appearances, themes,
    factionColor: FACTIONS_BY_ID[c.faction] ? FACTIONS_BY_ID[c.faction].color : '#888',
    firstWorkTitle: WORK_BY_ID[c.firstWork] ? WORK_BY_ID[c.firstWork].title : '',
    edgeCount: relations.length,
  }, tier, cap)
}

const lookupPlace = (key) => {
  const q = norm(key)
  return PLACE_BY_ID[key] || PLACES.find((p) => norm(p.id) === q)
    || PLACES.find((p) => norm(p.name) === q || norm(p.nameEn) === q)
    || PLACES.find((p) => norm(p.name).includes(q) || q.includes(norm(p.name))) || null
}

export function placeDetail(key, options = {}) {
  const p = lookupPlace(key)
  if (!p) return null
  const cap = normalizeTier(options.maxTier)
  const tier = tierOf('place', p)
  const withinCap = (itemTier) => cap >= MAX_TIER || itemTier <= cap
  return maskRecord({
    ...p,
    tier,
    characters: (p.characters || []).map((id) => {
      const c = CHARACTER_BY_ID[id]
      return c ? { id: c.id, name: c.name, factionLabel: c.factionLabel } : { id, name: id, factionLabel: '' }
    }),
    works: (p.works || []).map((id) => ({ id, title: WORK_BY_ID[id] ? WORK_BY_ID[id].title : id })),
    // Event titles are spoilers ("太阳系二维化"), so the list follows the tier.
    events: EVENTS.filter((e) => (e.characters || []).some((id) => (p.characters || []).includes(id))
      && withinCap(tierOf('event', e)))
      .slice(0, 6).map((e) => ({ id: e.id, title: e.title, year: e.year })),
  }, tier, cap)
}

const lookupTech = (key) => {
  const q = norm(key)
  return TECH_BY_ID[key] || TECH.find((t) => norm(t.id) === q)
    || TECH.find((t) => norm(t.name) === q || norm(t.nameEn) === q)
    || TECH.find((t) => norm(t.name).includes(q) || norm(t.nameEn).includes(q)) || null
}

export function techDetail(key, options = {}) {
  const t = lookupTech(key)
  if (!t) return null
  const cap = normalizeTier(options.maxTier)
  const tier = tierOf('tech', t)
  const withinCap = (itemTier) => cap >= MAX_TIER || itemTier <= cap
  return maskRecord({
    ...t,
    tier,
    relatedCharacters: (t.related || []).map((id) => CHARACTER_BY_ID[id]).filter(Boolean)
      .map((c) => ({ id: c.id, name: c.name, factionLabel: c.factionLabel })),
    relatedTech: (t.related || []).map((id) => TECH_BY_ID[id]).filter(Boolean)
      .map((x) => ({ id: x.id, name: x.name, tier: x.tier })),
    events: EVENTS.filter((e) => norm(e.desc).includes(norm(t.name)) && withinCap(tierOf('event', e)))
      .slice(0, 5).map((e) => ({ id: e.id, title: e.title, year: e.year })),
  }, tier, cap)
}

const lookupGlossary = (key) => {
  const q = norm(key)
  return GLOSSARY_BY_ID[key] || GLOSSARY.find((g) => norm(g.id) === q)
    || GLOSSARY.find((g) => norm(g.term) === q || norm(g.termEn) === q)
    || GLOSSARY.find((g) => norm(g.term).includes(q) || q.includes(norm(g.term))) || null
}

export function glossaryDetail(key, options = {}) {
  const g = lookupGlossary(key)
  if (!g) return null
  const cap = normalizeTier(options.maxTier)
  const tier = tierOf('glossary', g)
  const detail = {
    ...g,
    tier,
    related: (g.related || []).map((id) => CHARACTER_BY_ID[id] || TECH_BY_ID[id] || PLACE_BY_ID[id] || GLOSSARY_BY_ID[id])
      .filter(Boolean)
      .map((x) => {
        const kindKey = x.term ? 'glossary' : (x.tier !== undefined ? 'tech' : (x.region || x.type ? 'place' : 'character'))
        const kindLabel = { glossary: '术语', tech: '技术', place: '地点', character: '人物' }[kindKey]
        const itemTier = kindKey === 'glossary' ? tierOf('glossary', x) : kindKey === 'tech' ? tierOf('tech', x)
          : kindKey === 'place' ? tierOf('place', x) : tierOf('character', x)
        return {
          id: x.id,
          name: x.name || x.term,
          kind: kindLabel,
          // A stable key the Client can switch on, instead of parsing a label.
          kindKey,
          tier: itemTier,
          // The edge target itself can be a spoiler (a book-three character
          // hanging off a book-one term), so mark it rather than hide the shape.
          locked: cap < MAX_TIER && itemTier > cap,
        }
      }),
  }
  return maskRecord(detail, tier, cap)
}

/* ------------------------------------------------------------------ *
 * Graph
 * ------------------------------------------------------------------ */

export function buildGraph(options = {}) {
  const onlyFaction = options.faction || ''
  const ids = new Set(CHARACTERS.map((c) => c.id))
  const nodes = CHARACTERS.filter((c) => !onlyFaction || c.faction === onlyFaction).map((c) => {
    const f = FACTIONS_BY_ID[c.faction]
    return {
      id: c.id, label: c.name, nameEn: c.nameEn, faction: c.faction,
      factionLabel: c.factionLabel, factionColor: f ? f.color : '#888',
      kind: c.kind, canon: c.canon, summary: c.summary, degree: 0,
    }
  })
  const nodeMap = {}
  for (const node of nodes) nodeMap[node.id] = node

  const edges = []
  const seen = new Set()
  for (const c of CHARACTERS) {
    for (const rel of c.relations || []) {
      if (!ids.has(rel.to) || !nodeMap[c.id] || !nodeMap[rel.to]) continue
      const key = [c.id, rel.to].sort().join('::') + '::' + rel.type
      if (seen.has(key)) continue
      seen.add(key)
      const type = RELATION_TYPES[rel.type] || { label: rel.type, color: '#888' }
      edges.push({
        source: c.id, target: rel.to, type: rel.type, color: type.color,
        typeLabel: type.label, label: rel.label || type.label,
      })
      nodeMap[c.id].degree++
      nodeMap[rel.to].degree++
    }
  }
  return {
    nodes,
    edges,
    factions: FACTIONS,
    relationTypes: RELATION_TYPES,
  }
}

export function neighbors(key) {
  const c = lookupCharacter(key)
  if (!c) return null
  const groups = {}
  for (const rel of c.relations || []) {
    const other = CHARACTER_BY_ID[rel.to]
    const type = RELATION_TYPES[rel.type] || { label: rel.type, color: '#888' }
    groups[rel.type] = groups[rel.type] || []
    groups[rel.type].push({
      id: rel.to, name: other ? other.name : rel.to,
      faction: other ? other.faction : '', label: rel.label || type.label,
      typeLabel: type.label, color: type.color,
    })
  }
  return { character: toCard(c), groups }
}

/** Bidirectional BFS through the curated relation graph. */
export function relationPath(fromKey, toKey) {
  const from = lookupCharacter(fromKey)
  const to = lookupCharacter(toKey)
  if (!from) return { ok: false, error: '没有找到「' + (fromKey || '') + '」这个角色。' }
  if (!to) return { ok: false, error: '没有找到「' + (toKey || '') + '」这个角色。' }
  if (from.id === to.id) return { ok: true, steps: [], hops: 0, people: [toCard(from)] }

  const adjacency = new Map()
  for (const c of CHARACTERS) {
    const list = adjacency.get(c.id) || []
    for (const rel of c.relations || []) {
      const type = RELATION_TYPES[rel.type] || { label: rel.type }
      list.push({ to: rel.to, label: rel.label || type.label, typeLabel: type.label })
      const back = adjacency.get(rel.to) || []
      back.push({ to: c.id, label: rel.label || type.label, typeLabel: type.label, reverse: true })
      adjacency.set(rel.to, back)
    }
    adjacency.set(c.id, list)
  }

  const queue = [{ id: from.id, steps: [] }]
  const visited = new Set([from.id])
  while (queue.length) {
    const current = queue.shift()
    if (current.steps.length > 6) break
    for (const edge of adjacency.get(current.id) || []) {
      if (visited.has(edge.to)) continue
      const steps = [...current.steps, {
        from: CHARACTER_BY_ID[current.id] ? CHARACTER_BY_ID[current.id].name : current.id,
        to: CHARACTER_BY_ID[edge.to] ? CHARACTER_BY_ID[edge.to].name : edge.to,
        label: edge.label, typeLabel: edge.typeLabel,
      }]
      if (edge.to === to.id) {
        return {
          ok: true,
          hops: steps.length,
          steps,
          people: [toCard(from), toCard(to)],
        }
      }
      visited.add(edge.to)
      queue.push({ id: edge.to, steps })
    }
  }
  return {
    ok: false,
    error: '在已收录的关系里，' + from.name + ' 与 ' + to.name + ' 之间没有连通路径。',
  }
}

/* ------------------------------------------------------------------ *
 * Timeline, plot, themes
 * ------------------------------------------------------------------ */

export function timeline(options = {}) {
  let list = EVENTS
  if (options.era) list = list.filter((e) => e.era === options.era)
  if (options.work) list = list.filter((e) => (e.works || []).includes(options.work))
  if (options.character) {
    const c = lookupCharacter(options.character)
    if (c) list = list.filter((e) => (e.characters || []).includes(c.id))
    else list = []
  }
  return {
    events: list.map((e) => ({
      ...e,
      eraName: ERA_BY_ID[e.era] ? ERA_BY_ID[e.era].name : e.era,
      people: (e.characters || []).map((id) => (CHARACTER_BY_ID[id] ? CHARACTER_BY_ID[id].name : id)),
    })),
    eras: ERAS,
    total: list.length,
  }
}

export function plot(options = {}) {
  const list = options.work ? PLOT.filter((p) => p.work === options.work) : PLOT
  return list.map((p) => ({
    ...p,
    workTitle: WORK_BY_ID[p.work] ? WORK_BY_ID[p.work].title : p.work,
    beats: p.beats.map((b) => ({
      ...b,
      eraName: ERA_BY_ID[b.era] ? ERA_BY_ID[b.era].name : b.era,
      people: (b.characters || []).map((id) => (CHARACTER_BY_ID[id] ? CHARACTER_BY_ID[id].name : id)),
      event: b.eventId ? EVENTS.find((e) => e.id === b.eventId) : undefined,
    })),
  }))
}

/* ------------------------------------------------------------------ *
 * Spoiler gating
 * ------------------------------------------------------------------ */

/** Clamp an untrusted maxTier value to the supported range. */
export function normalizeTier(value) {
  // `URLSearchParams.get` returns null for an absent parameter, and
  // `Number(null)` is 0 — which would silently mask everything. Absent or
  // empty must mean "no ceiling", never "tier zero".
  if (value === null || value === undefined || value === '') return MAX_TIER
  const n = Number(value)
  if (!Number.isFinite(n)) return MAX_TIER
  return Math.min(MAX_TIER, Math.max(0, Math.round(n)))
}

/** The tier of one record, derived from the work it belongs to. */
export function tierOf(kind, record) {
  if (!record) return MAX_TIER
  if (kind === 'character') return tierOfWork(record.firstWork)
  if (kind === 'event' || kind === 'place') return tierOfWorks(record.works)
  if (kind === 'tech') return tierOfWork(record.firstWork)
  if (kind === 'quote') return tierOfWork(record.work)
  if (kind === 'glossary') {
    const t = GLOSSARY_TIER[record.id]
    return typeof t === 'number' ? t : MAX_TIER
  }
  if (kind === 'theme') return MAX_TIER
  return MAX_TIER
}

/**
 * Mask a list of records above the reader's tier. Records are kept, not
 * dropped: the reader should still see that a thing exists.
 */
export function gateList(kind, list, maxTier) {
  const cap = normalizeTier(maxTier)
  if (cap >= MAX_TIER) return list
  return list.map((item) => maskRecord(item, tierOf(kind, item), cap))
}

/** Same idea for one record. */
export function gateOne(kind, record, maxTier) {
  const cap = normalizeTier(maxTier)
  if (cap >= MAX_TIER) return record
  return maskRecord(record, tierOf(kind, record), cap)
}

/** How much of the catalogue each tier unlocks — powers the picker's copy. */
export function tierSummary() {
  const count = (kind, list) => {
    const buckets = [0, 0, 0, 0]
    for (const item of list) buckets[tierOf(kind, item)] += 1
    return buckets
  }
  const characters = count('character', CHARACTERS)
  const events = count('event', EVENTS)
  const glossary = count('glossary', GLOSSARY)
  return TIER_LABELS.map((label) => ({
    ...label,
    characters: characters.slice(0, label.tier + 1).reduce((a, b) => a + b, 0),
    events: events.slice(0, label.tier + 1).reduce((a, b) => a + b, 0),
    glossary: glossary.slice(0, label.tier + 1).reduce((a, b) => a + b, 0),
    totals: {
      characters: characters[label.tier],
      events: events[label.tier],
      glossary: glossary[label.tier],
    },
  }))
}

/* ------------------------------------------------------------------ *
 * Character journey — one character's path through the story
 * ------------------------------------------------------------------ */

/**
 * A beat names its focus character in the title when that character drives it.
 * Array position is NOT a reliable signal (the "do not answer" beat lists the
 * listener first even though Ye Wenjie makes the decision), so the role is
 * derived from the text instead.
 */
function beatRole(title, desc, character) {
  const names = [character.name, ...(character.alias || [])].filter((n) => n && n.length >= 2)
  const head = title || ''
  const body = desc || ''
  if (names.some((n) => head.includes(n))) return 'focus'
  if (names.some((n) => body.includes(n))) return 'named'
  return 'present'
}

/**
 * Everything one character lives through, in order: events plus plot beats,
 * each tagged with how strongly they are involved. Characters who never drive
 * a scene still get an honest, non-empty answer because their events remain.
 */
export function characterJourney(key, options = {}) {
  const c = lookupCharacter(key)
  if (!c) return null
  const cap = normalizeTier(options.maxTier)

  const beats = []
  for (const volume of PLOT) {
    for (const beat of volume.beats) {
      if (!(beat.characters || []).includes(c.id)) continue
      beats.push({
        kind: 'beat',
        id: beat.id,
        title: beat.title,
        desc: beat.desc,
        era: beat.era,
        eraName: ERA_BY_ID[beat.era] ? ERA_BY_ID[beat.era].name : beat.era,
        work: volume.work,
        workTitle: WORK_BY_ID[volume.work] ? WORK_BY_ID[volume.work].title : volume.work,
        role: beatRole(beat.title, beat.desc, c),
        tier: tierOfWork(volume.work),
        people: (beat.characters || []).map((id) => (CHARACTER_BY_ID[id] ? CHARACTER_BY_ID[id].name : id)),
      })
    }
  }

  const events = []
  for (const e of EVENTS) {
    if (!(e.characters || []).includes(c.id)) continue
    events.push({
      kind: 'event',
      id: e.id,
      title: e.title,
      desc: e.desc,
      year: e.year,
      era: e.era,
      eraName: ERA_BY_ID[e.era] ? ERA_BY_ID[e.era].name : e.era,
      importance: e.importance,
      workTitle: (e.works || []).map((w) => (WORK_BY_ID[w] ? WORK_BY_ID[w].title : w)).join('、'),
      // The earliest work an event belongs to decides which chapter it sits in.
      // Without this, events carry only the joined title and cannot be ordered
      // against the beats, so the journey interleaved books and repeated
      // headings.
      work: (e.works || [])[0] || '',
      role: beatRole(e.title, e.desc, c),
      tier: tierOfWorks(e.works),
      people: (e.characters || []).map((id) => (CHARACTER_BY_ID[id] ? CHARACTER_BY_ID[id].name : id)),
    })
  }

  // Beats carry no year; events do. Group by the work each belongs to, then
  // put beats before the events of the same work so a reader walks the volume
  // as a story and sees the dated record afterwards.
  const WORK_ORDER = ['ball-lightning', 'three-body', 'dark-forest', 'deaths-end']
  const rank = (node) => {
    const index = WORK_ORDER.indexOf(node.work || '')
    return index < 0 ? 99 : index
  }
  const ordered = [...beats, ...events].sort((a, b) => {
    const diff = rank(a) - rank(b)
    if (diff !== 0) return diff
    // Same work: beats (story) first, then events (dated record).
    if (a.kind !== b.kind) return a.kind === 'beat' ? -1 : 1
    return 0
  })

  const masked = cap >= MAX_TIER
    ? ordered
    : ordered.map((node) => (node.tier > cap ? { ...node, locked: true } : node))

  const focusCount = masked.filter((n) => n.role === 'focus').length
  const worksSeen = [...new Set(beats.map((b) => b.work))]

  return {
    character: {
      id: c.id, name: c.name, nameEn: c.nameEn, faction: c.faction,
      factionLabel: c.factionLabel, summary: c.summary,
      firstWorkTitle: WORK_BY_ID[c.firstWork] ? WORK_BY_ID[c.firstWork].title : '',
      factionColor: FACTIONS_BY_ID[c.faction] ? FACTIONS_BY_ID[c.faction].color : '#888',
    },
    nodes: masked,
    total: masked.length,
    focusCount,
    works: worksSeen.map((w) => ({ id: w, title: WORK_BY_ID[w] ? WORK_BY_ID[w].title : w })),
    // Honest signal for the panel: a character with no nodes is a supporting
    // role, not a broken page.
    hasStory: masked.length > 0,
    neighbours: (c.relations || []).slice(0, 6).map((r) => {
      const other = CHARACTER_BY_ID[r.to]
      return { id: r.to, name: other ? other.name : r.to, label: r.label }
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Reading paths
 * ------------------------------------------------------------------ */

/**
 * The five curated paths are written at the work level ("read book one, then
 * book two"), so each step resolves to a work plus the characters and events
 * that live in it. That keeps the guide honest: it tells you what to read, not
 * which page to jump to.
 */
export function pathGuide(options = {}) {
  const cap = normalizeTier(options.maxTier)
  return PATHS.map((path) => ({
    id: path.id,
    icon: path.icon,
    name: path.name,
    blurb: path.blurb,
    steps: path.steps.map((step, index) => {
      const work = WORK_BY_ID[step.work]
      const tier = tierOfWork(step.work)
      const cast = CHARACTERS.filter((c) => (c.works || {})[step.work])
        .sort((a, b) => (b.relations || []).length - (a.relations || []).length)
        .slice(0, 5)
        .map((c) => ({ id: c.id, name: c.name, role: (c.works || {})[step.work] }))
      const events = EVENTS.filter((e) => (e.works || []).includes(step.work)).length
      return {
        index: index + 1,
        work: step.work,
        title: work ? work.title : step.work,
        kind: work ? work.kind : '',
        year: work ? work.year : null,
        why: step.why,
        tier,
        locked: tier > cap,
        cast,
        eventCount: events,
      }
    }),
  }))
}

/* ------------------------------------------------------------------ *
 * Concept graph
 * ------------------------------------------------------------------ */

/**
 * The glossary's `related` edges are already cross-type: they point at other
 * terms, at technologies, at characters and at places. Resolving them yields a
 * real dependency graph (cosmic sociology -> suspicion chain -> dark forest)
 * without adding any new data.
 */
export function conceptGraph(options = {}) {
  const rootId = options.id ? String(options.id) : ''
  const depth = Math.min(3, Math.max(1, Number(options.depth) || 2))
  const cap = normalizeTier(options.maxTier)

  // Callers pass either an id or a human name ("黑暗森林", "猜疑链"), so a raw
  // id lookup is not enough. Resolve through the same name-matching helpers the
  // detail views use, then fall back to a substring scan.
  const resolveRootId = (key) => {
    if (!key) return ''
    if (GLOSSARY_BY_ID[key] || TECH_BY_ID[key] || CHARACTER_BY_ID[key] || PLACE_BY_ID[key]) return key
    const q = norm(key)
    const g = GLOSSARY.find((x) => norm(x.id) === q || norm(x.term) === q || norm(x.termEn) === q)
      || GLOSSARY.find((x) => norm(x.term).includes(q) || q.includes(norm(x.term)))
    if (g) return g.id
    const t = TECH.find((x) => norm(x.id) === q || norm(x.name) === q || norm(x.nameEn) === q)
    if (t) return t.id
    const c = CHARACTERS.find((x) => norm(x.id) === q || norm(x.name) === q || norm(x.nameEn) === q)
    if (c) return c.id
    const p = PLACES.find((x) => norm(x.id) === q || norm(x.name) === q || norm(x.nameEn) === q)
    if (p) return p.id
    return ''
  }

  const resolve = (id) => {
    if (GLOSSARY_BY_ID[id]) {
      const g = GLOSSARY_BY_ID[id]
      return { id, kind: 'glossary', name: g.term, category: g.category, tier: tierOf('glossary', g), summary: g.definition }
    }
    if (TECH_BY_ID[id]) {
      const t = TECH_BY_ID[id]
      return { id, kind: 'tech', name: t.name, category: t.category, tier: tierOf('tech', t), summary: t.summary }
    }
    if (CHARACTER_BY_ID[id]) {
      const c = CHARACTER_BY_ID[id]
      return { id, kind: 'character', name: c.name, category: c.factionLabel, tier: tierOf('character', c), summary: c.summary }
    }
    if (PLACE_BY_ID[id]) {
      const p = PLACE_BY_ID[id]
      return { id, kind: 'place', name: p.name, category: p.type, tier: tierOf('place', p), summary: p.summary }
    }
    return null
  }

  const edgesFrom = (id) => {
    const g = GLOSSARY_BY_ID[id]
    const t = TECH_BY_ID[id]
    const source = g ? g.related : t ? t.related : null
    return (source || []).map(resolve).filter(Boolean)
  }

  if (!rootId) {
    // Overview: the most connected concepts, so the panel has an entry point.
    const ranked = GLOSSARY.map((g) => ({ g, degree: (g.related || []).length }))
      .sort((a, b) => b.degree - a.degree)
    return {
      root: null,
      nodes: ranked.map(({ g, degree }) => ({
        ...resolve(g.id), degree, locked: tierOf('glossary', g) > cap,
      })),
      edges: [],
      depth,
    }
  }

  const root = resolve(resolveRootId(rootId))
  if (!root) return null

  const nodes = new Map([[root.id, { ...root, degree: 0 }]])
  const edges = []
  const seenEdge = new Set()
  let frontier = [root.id]

  for (let level = 0; level < depth; level += 1) {
    const next = []
    for (const id of frontier) {
      for (const child of edgesFrom(id)) {
        const key = id + '->' + child.id
        if (!seenEdge.has(key)) {
          seenEdge.add(key)
          edges.push({ from: id, to: child.id, toKind: child.kind })
        }
        if (!nodes.has(child.id)) {
          nodes.set(child.id, { ...child, degree: 0, level: level + 1 })
          next.push(child.id)
        }
      }
    }
    frontier = next
    if (!frontier.length) break
  }

  for (const edge of edges) {
    const a = nodes.get(edge.from)
    const b = nodes.get(edge.to)
    if (a) a.degree += 1
    if (b) b.degree += 1
  }

  const list = [...nodes.values()].map((n) => (n.tier > cap ? { ...n, locked: true, summary: '' } : n))
  return { root: list.find((n) => n.id === root.id) || null, nodes: list, edges, depth }
}


export function gameLevels() {
  return GAME_LEVELS.slice().sort((a, b) => (a.order || 0) - (b.order || 0))
}

export function themes() {
  return THEMES.map((t) => ({
    ...t,
    people: (t.related || []).map((id) => CHARACTER_BY_ID[id])
      .filter(Boolean)
      .map((c) => ({ id: c.id, name: c.name, factionLabel: c.factionLabel })),
    workTitle: WORK_BY_ID[t.work] ? WORK_BY_ID[t.work].title : t.work,
  }))
}

export function differences(options = {}) {
  const list = options.media ? DIFFERENCES.filter((d) => d.media === options.media) : DIFFERENCES
  return list
}

/* ------------------------------------------------------------------ *
 * Counts and bundle
 * ------------------------------------------------------------------ */

export function counts() {
  const relationCount = CHARACTERS.reduce((n, c) => n + (c.relations || []).length, 0)
  const factionCount = {}
  for (const c of CHARACTERS) factionCount[c.faction] = (factionCount[c.faction] || 0) + 1
  const canonCount = {}
  for (const key of CANON_ORDER) canonCount[key] = 0
  for (const c of CHARACTERS) {
    const bucket = CANON_ORDER.find((key) => c.canon === key)
      || CANON_ORDER.find((key) => String(c.canon || '').startsWith(key.split(' ')[0]))
      || '原著'
    canonCount[bucket] = (canonCount[bucket] || 0) + 1
  }
  const eraCount = ERAS.map((era) => ({
    id: era.id, name: era.name, nameEn: era.nameEn,
    n: EVENTS.filter((e) => e.era === era.id).length,
  }))
  const tierCount = {}
  for (const t of TECH) tierCount[t.tier] = (tierCount[t.tier] || 0) + 1
  return {
    works: WORKS.length,
    characters: CHARACTERS.length,
    factions: FACTIONS.length,
    relations: relationCount,
    events: EVENTS.length,
    places: PLACES.length,
    tech: TECH.length,
    glossary: GLOSSARY.length,
    quotes: QUOTES.length,
    themes: THEMES.length,
    differences: DIFFERENCES.length,
    gameLevels: GAME_LEVELS.length,
    paths: PATHS.length,
    byFaction: FACTIONS.map((f) => ({ id: f.id, name: f.name, n: factionCount[f.id] || 0, color: f.color })),
    byCanon: canonCount,
    byEra: eraCount,
    byTier: Object.entries(tierCount).map(([name, n]) => ({ name, n })),
  }
}

/** Everything the browser page needs on first load. */
export function bundle() {
  return {
    works: WORKS,
    factions: FACTIONS,
    relationTypes: RELATION_TYPES,
    eras: ERAS,
    characters: CHARACTERS.map(toCard),
    events: EVENTS.map((e) => ({ ...e, eraName: ERA_BY_ID[e.era] ? ERA_BY_ID[e.era].name : e.era })),
    plot: plot(),
    gameLevels: gameLevels(),
    paths: PATHS,
    // Reading guides resolved to works, with the cast each step involves.
    guides: pathGuide(),
    // Spoiler picker: how much each tier unlocks.
    tiers: tierSummary(),
    differences: DIFFERENCES,
    themes: themes(),
    places: PLACES.map((p) => ({
      id: p.id, name: p.name, nameEn: p.nameEn, region: p.region, type: p.type,
      canon: p.canon, faction: p.faction, summary: p.summary,
    })),
    tech: TECH.map((t) => ({
      id: t.id, name: t.name, nameEn: t.nameEn, tier: t.tier, category: t.category,
      era: t.era, danger: t.danger, summary: t.summary,
      // Without firstWork the client cannot derive a spoiler tier for a
      // technology, so the quiz would only ever ask tech questions at the
      // highest level. Carry it through.
      firstWork: t.firstWork,
    })),
    glossary: GLOSSARY.map((g) => ({
      id: g.id, term: g.term, termEn: g.termEn || '', category: g.category, definition: g.definition,
    })),
    quotes: QUOTES.map((q) => ({
      ...q,
      workTitle: WORK_BY_ID[q.work] ? WORK_BY_ID[q.work].title : q.work,
    })),
    simPresets: SIM_PRESETS,
    counts: counts(),
    generatedAt: new Date().toISOString(),
  }
}

export { SIM_PRESETS, simulate, sensitivity, stabilityScan, civilizationCensus, foldCensus, darkForest, deterrence }
export { WORKS, FACTIONS, RELATION_TYPES, CHARACTERS, ERAS, EVENTS, PLACES, TECH, GLOSSARY, QUOTES, THEMES, PLOT, DIFFERENCES, PATHS, GAME_LEVELS }

/* ------------------------------------------------------------------ *
 * Deterministic question answering
 * ------------------------------------------------------------------ */

const STOP = /[?？。，,、；;：:！!“”"'（）()\s的了吗呢吧啊是在和与跟到至]/g

function keywords(question) {
  const raw = String(question || '')
  const stripped = raw.replace(STOP, ' ').split(/\s+/).filter((w) => w.length >= 2)
  const extras = []
  // Chinese questions rarely contain spaces, so also try every 2–4 character
  // window that matches a known entity name.
  for (const row of INDEX) {
    for (const name of [row.name, row.nameEn].filter(Boolean)) {
      if (name.length >= 2 && raw.includes(name)) extras.push(name)
    }
  }
  return [...new Set([...stripped, ...extras])]
}

/**
 * Longest run of characters `needle` shares with `haystack`.
 * Questions are rarely exact titles ("末日战役怎么发生的" vs the event title
 * "末日战役：二十分钟的屠杀"), so an approximate name match is what lets the
 * right entity win instead of a same-keyword neighbour.
 */
function commonRun(haystack, needle) {
  if (!haystack || !needle) return 0
  const a = norm(haystack)
  const b = norm(needle)
  let best = 0
  for (let i = 0; i < b.length; i++) {
    for (let j = i + best + 1; j <= b.length; j++) {
      if (a.includes(b.slice(i, j))) best = j - i
      else break
    }
  }
  return best
}

/** Strip decoration so 《三体》 matches a plain "三体" in a question. */
const bare = (value) => norm(value).replace(/[《》「」『』“”"'·:：,，.。!！?？()（）\s]/g, '')

function matchEntities(question, limit = 5) {
  const raw = String(question || '')
  const q = norm(raw)
  const qBare = bare(raw)
  const kws = keywords(question)
  const scored = []
  for (const row of INDEX) {
    let score = 0
    const name = norm(row.name)
    const nameBare = bare(row.name)
    const nameEn = norm(row.nameEn)
    // A bare mention of the entity's own name is decisive; when several names
    // match, the longer (more specific) one wins on length.
    if ((name && q.includes(name)) || (nameBare.length >= 2 && qBare.includes(nameBare))) {
      score = 1000 + nameBare.length
    } else if (nameEn && nameEn.length > 2 && q.includes(nameEn)) score = 900 + nameEn.length
    else {
      // Approximate name match. A question rarely repeats a full title
      // ("末日战役" vs "末日战役：二十分钟的屠杀"), so a distinctive keyword or
      // shared run that most of the name covers is enough.
      const run = Math.max(commonRun(qBare, nameBare), nameEn.length > 3 ? commonRun(q, nameEn) : 0)
      const covered = run >= 3 && run >= Math.min(nameBare.length, 8) * 0.5
      // A keyword inside an event, place or glossary name is a strong signal:
      // these names are phrases, not people, so "球状闪电" naming a novel is
      // the ambiguous case rather than the rule.
      const phraseKinds = row.kind !== 'character'
      const keywordInName = phraseKinds
        ? kws.find((k) => k.length >= 3 && nameBare.includes(norm(k)))
        : undefined
      if (covered) score = 500 + run * 10
      else if (keywordInName) score = 200 + keywordInName.length * 10
      if (!score) {
        let hits = 0
        for (const k of kws) if (row.hay.includes(norm(k))) hits++
        if (hits) score = hits * 3
      }
    }
    if (score) scored.push({ row, score })
  }
  // "怎么发生的 / 导致 / 引起" asks for the event, not the place it happened in.
  if (/怎么|如何|发生|引起|导致|过程/.test(raw)) {
    for (const entry of scored) if (entry.row.kind === 'event') entry.score += 40
  }
  // 「X 是什么」 asks about the thing itself; the same-named novel is the
  // weaker reading unless nothing else matched.
  if (/是什么|什么意思|什么是|什么叫|原理/.test(raw)) {
    const concept = scored.find((e) => e.row.kind !== 'work' && e.row.kind !== 'character' && e.score >= 500)
    if (concept) for (const entry of scored) if (entry.row.kind === 'work') entry.score -= 80
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

const KIND_LABEL = { character: '人物', place: '地点', tech: '技术', glossary: '术语', work: '作品', event: '事件', theme: '议题' }

/**
 * Answer from the curated data. Deterministic and transparent on purpose: it
 * says what it matched, and points at the panel instead of inventing prose.
 */
export function ask(question) {
  const raw = String(question == null ? '' : question).trim()
  if (!raw) return '问点什么吧：人物、关系、纪元、技术、术语、剧情或改编差异都可以。'
  const q = norm(raw)
  const out = []

  // 1) Relationship: "A 和 B 是什么关系"
  if (/关系|联系|关联|怎么连|connect|relation/.test(q) && /和|与|跟|同|到|between|and/.test(raw)) {
    const pair = raw.split(/\s*(?:和|与|跟|同|between|and)\s*/).filter(Boolean)
    if (pair.length >= 2) {
      const a = pair[0].replace(/^.*(?:问|查|看看|讲讲)/, '').replace(/[?？]/g, '').trim()
      const b = pair[1].replace(/(?:是什么关系|什么关系|有什么关系|的关系|怎么联系|怎么关联|关系|呢|吗|[?？])/g, '').trim()
      const result = relationPath(a, b)
      if (result.ok && result.steps.length) {
        out.push('**' + result.people[0].name + ' → ' + result.people[1].name + '：相距 ' + result.hops + ' 跳**')
        result.steps.forEach((s, i) => out.push((i + 1) + '. ' + s.from + ' —[' + s.label + ']→ ' + s.to))
        return out.join('\n')
      }
      if (result.ok) return '这是同一个人物。'
      return '没能连起来：' + (result.error || '关系路径未收录') + '\n可以到「人物关系」页直接点选，或换用全名。'
    }
  }

  // 2) Who is X
  const named = matchEntities(raw, 6).filter((h) => h.score >= 900)
  const namedCharacter = named.find((h) => h.row.kind === 'character')

  if (/谁|介绍|是什么人|什么来历|原型|who/.test(q) && namedCharacter) {
    return characterAnswer(namedCharacter.row.id)
  }

  // 3) Direct entity questions, in the order the novels introduce the ideas.
  const conceptKinds = /武器|技术|原理|怎么做到|如何实现/.test(q) ? ['tech', 'glossary']
    : /哪里|在哪|地点|地方|星系|基地|where/.test(q) ? ['place']
      : /是什么|什么意思|什么是|术语|概念|什么叫/.test(q) ? ['glossary', 'tech']
        : []
  for (const kind of conceptKinds) {
    const hit = named.find((h) => h.row.kind === kind)
    if (!hit) continue
    if (kind === 'tech') return techAnswer(hit.row.id)
    if (kind === 'place') return placeAnswer(hit.row.id)
    return glossaryAnswer(hit.row.id)
  }

  // 4) Era / timeline questions. A named era wins outright; a character
  //    narrows the list only when the question actually names one.
  if (/纪元|时间线|哪一年|什么时候|经过|历史/.test(q)) {
    const matchedEra = ERAS.find((e) => raw.includes(e.name))
    const character = namedCharacter
    let list = EVENTS.filter((e) => {
      if (matchedEra && e.era !== matchedEra.id) return false
      if (character && !(e.characters || []).includes(character.row.id)) return false
      return true
    })
    // Never let a loosely matched character empty out a named era.
    if (!list.length && matchedEra) list = EVENTS.filter((e) => e.era === matchedEra.id)
    if (!list.length && character) list = EVENTS.filter((e) => (e.characters || []).includes(character.row.id))
    if (list.length) {
      out.push(matchedEra ? '**' + matchedEra.name + '（' + matchedEra.range + '）**' : '**相关时间线事件：**')
      if (matchedEra) out.push(matchedEra.desc)
      list.slice(0, 8).forEach((e) => out.push('- ' + e.year + ' · **' + e.title + '**：' + e.desc))
      return out.join('\n').trim()
    }
  }

  // 5) Plot questions. Score every beat instead of taking the first loose
  //    keyword hit, and ignore 2-character noise words that match everything.
  const kw = keywords(raw).filter((k) => k.length >= 2)
  const strongKw = kw.filter((k) => k.length >= 3)
  if (/剧情|故事|经过|怎么|如何|结局|结局是|plot/.test(q)) {
    const scored = []
    for (const p of PLOT) {
      for (const b of p.beats) {
        const hay = norm(b.title + ' ' + b.desc)
        let hits = 0
        for (const k of kw) if (hay.includes(norm(k))) hits += k.length >= 3 ? 2 : 1
        if (hits) scored.push({ plot: p, beat: b, hits })
      }
    }
    scored.sort((a, b) => b.hits - a.hits)
    // A single weak 2-character hit is noise, not an answer.
    if (scored.length && (scored[0].hits >= 2 || strongKw.length)) {
      out.push('**相关剧情节点：**')
      scored.slice(0, 6).forEach(({ plot, beat }) => out.push('- 【' + plot.name + '】' + beat.title + '：' + beat.desc))
      return out.join('\n')
    }
  }

  // 6) Theme questions — prefer a theme the named character is part of.
  if (/为什么|哲学|意义|该不该|对不对|道德|两难|选择/.test(q)) {
    const relatedTo = (t) => namedCharacter && (t.related || []).includes(namedCharacter.row.id)
    const byKeyword = (t) => kw.some((k) => norm(t.title + t.question + t.summary).includes(norm(k)))
    const themeHit = THEMES.find(relatedTo) || THEMES.find(byKeyword)
    if (themeHit) {
      out.push('**' + themeHit.title + '**：' + themeHit.question)
      out.push(themeHit.summary)
      for (const side of themeHit.sides || []) out.push('- ' + side.name + '：' + side.view)
      out.push('')
      out.push(themeHit.discussion)
      return out.join('\n')
    }
  }

  // 7) A bare entity name gives its card. 900 means an exact name match; 500
  //    means an approximate one (most of the name appears in the question).
  //    A work is only the answer when nothing else explains the question —
  //    "球状闪电" is a novel *and* a phenomenon.
  const bare = matchEntities(raw, 3)
  const topNonWork = bare.find((h) => h.row.kind !== 'work')
  if (bare.length && bare[0].score >= 500) {
    const top = bare[0].kind === 'work' && topNonWork && topNonWork.score >= 500 ? topNonWork.row : bare[0].row
    if (top.kind === 'character') return characterAnswer(top.id)
    if (top.kind === 'tech') return techAnswer(top.id)
    if (top.kind === 'place') return placeAnswer(top.id)
    if (top.kind === 'glossary') return glossaryAnswer(top.id)
    if (top.kind === 'event') return eventAnswer(top.id)
    if (top.kind === 'theme') return themeAnswer(top.id)
    if (top.kind === 'work') {
      const w = WORK_BY_ID[top.id]
      return ['**' + w.title + '（' + w.titleEn + '，' + w.year + '）**',
        w.author + ' · ' + w.canon, '', w.summary, '', '基调：' + w.tone].join('\n')
    }
  }

  // 8) Fall back to whatever matched — but only surface named or clearly
  //    related entities, so an off-topic question does not get a cast list.
  if (bare.length && bare[0].score >= 40) {
    out.push('**与问题相关的内容：**')
    for (const h of bare) {
      const d = describe(h.row.kind, h.row.id)
      if (!d) continue
      out.push('- [' + (KIND_LABEL[h.row.kind] || d.kind) + '] ' + d.name + '：' + d.summary)
    }
    out.push('')
    out.push('想更深入的话，可以直接说「XXX 是谁」「A 和 B 是什么关系」或「黑暗森林是什么」。')
    return out.join('\n')
  }

  return [
    '我在这套资料里没找到足够对应的内容。',
    '',
    '可以试试这些问法：',
    '- 「罗辑是谁」',
    '- 「罗辑和庄颜是什么关系」',
    '- 「黑暗森林法则是什么」',
    '- 「水滴是什么」',
    '- 「威慑纪元发生了什么」',
    '- 「为什么三体问题不可解」',
  ].join('\n')
}

function characterAnswer(id) {
  const d = characterDetail(id)
  if (!d) return '没有找到这个角色。'
  const out = ['# ' + d.name + (d.nameEn ? '（' + d.nameEn + '）' : ''), d.factionLabel + ' · ' + d.kind + ' · 来源：' + d.canon]
  if (d.alias && d.alias.length) out.push('别名：' + d.alias.join('、'))
  out.push('')
  out.push(d.summary)
  if (d.details) out.push(d.details)
  if (d.fate) out.push('结局：' + d.fate)
  if (d.relations.length) {
    out.push('')
    out.push('**主要关系：**')
    d.relations.forEach((r) => out.push('- [' + r.typeLabel + '] ' + r.name + '：' + r.label))
  }
  if (d.quotes.length) {
    out.push('')
    out.push('**名句：**')
    d.quotes.slice(0, 3).forEach((quote) => out.push('“' + quote.text + '” — ' + quote.context))
  }
  return out.join('\n')
}

function techAnswer(id) {
  const t = techDetail(id)
  if (!t) return '没有找到这项技术。'
  const out = ['# ' + t.name + (t.nameEn ? '（' + t.nameEn + '）' : ''), t.tier + ' · ' + t.category + ' · ' + t.era + ' · 危险等级 ' + t.danger + '/5']
  out.push('')
  out.push(t.summary)
  out.push(t.desc)
  if (t.relatedCharacters.length) out.push('', '相关人物：' + t.relatedCharacters.map((c) => c.name).join('、'))
  if (t.relatedTech.length) out.push('相关技术：' + t.relatedTech.map((c) => c.name).join('、'))
  return out.join('\n')
}

function placeAnswer(id) {
  const p = placeDetail(id)
  if (!p) return '没有找到这个地点。'
  const out = ['# ' + p.name + (p.nameEn ? '（' + p.nameEn + '）' : ''), p.region + ' · ' + p.type + ' · ' + p.canon]
  out.push('')
  out.push(p.summary)
  out.push(p.desc)
  if (p.characters.length) out.push('', '相关人物：' + p.characters.map((c) => c.name).join('、'))
  return out.join('\n')
}

function glossaryAnswer(id) {
  const g = glossaryDetail(id)
  if (!g) return '没有找到这个术语。'
  const out = ['# ' + g.term + (g.termEn ? '（' + g.termEn + '）' : ''), g.category]
  out.push('')
  out.push(g.definition)
  out.push(g.detail)
  if (g.related.length) out.push('', '相关条目：' + g.related.map((r) => r.name).join('、'))
  return out.join('\n')
}

function eventAnswer(id) {
  const e = EVENTS.find((x) => x.id === id)
  if (!e) return '没有找到这个事件。'
  const era = ERA_BY_ID[e.era]
  const people = (e.characters || []).map((cid) => (CHARACTER_BY_ID[cid] ? CHARACTER_BY_ID[cid].name : cid))
  const related = EVENTS.filter((x) => x.era === e.era && x.id !== e.id)
    .slice(0, 4).map((x) => x.year + ' · ' + x.title)
  const out = ['# ' + e.title, (era ? era.name : e.era) + ' · ' + e.year]
  out.push('')
  out.push(e.desc)
  if (people.length) out.push('', '相关人物：' + people.join('、'))
  const works = (e.works || []).map((wid) => (WORK_BY_ID[wid] ? WORK_BY_ID[wid].title : wid))
  if (works.length) out.push('出自：' + works.join('、'))
  if (related.length) out.push('', '同纪元的其他事件：', ...related.map((r) => '- ' + r))
  return out.join('\n')
}

function themeAnswer(id) {
  const t = THEMES.find((x) => x.id === id)
  if (!t) return '没有找到这个议题。'
  const people = (t.related || []).map((cid) => (CHARACTER_BY_ID[cid] ? CHARACTER_BY_ID[cid].name : cid))
  return [
    '# ' + t.title, t.question, '', t.summary, '',
    '## 两种立场',
    ...(t.sides || []).map((s) => '- **' + s.name + '**：' + s.view),
    '', '## 可以继续争论的地方', t.discussion,
    '', '相关人物：' + (people.join('、') || '—'),
  ].join('\n')
}

export function suggestions() {
  return [
    '罗辑是谁',
    '罗辑和庄颜是什么关系',
    '黑暗森林法则是什么',
    '水滴是什么',
    '三体问题为什么不可解',
    '威慑纪元发生了什么',
    '程心为什么被骂',
    '太阳系是怎么被二维化的',
  ]
}
