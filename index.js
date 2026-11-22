/**
 * Three-Body Atlas — Host half.
 *
 * 1. Serves the curated dataset and the simulation endpoints over same-origin
 *    routes, so the browser never carries the dataset itself.
 * 2. Registers agent tools that query the same engine, so a conversational
 *    answer and the panel can never drift apart.
 *
 * @module @naturalth2012/three-body-atlas
 */

import {
  bundle, counts, searchCharacters, searchAll,
  characterDetail, placeDetail, techDetail, glossaryDetail,
  buildGraph, neighbors, relationPath,
  timeline, plot, gameLevels, themes, differences,
  characterJourney, pathGuide, conceptGraph,
  ask, suggestions,
  SIM_PRESETS, simulate, sensitivity, stabilityScan, civilizationCensus, foldCensus, darkForest, deterrence,
} from './engine.js'

const BASE = '/plugins/three-body-atlas'
export const BUNDLE_PATH = BASE + '/bundle'
export const SEARCH_PATH = BASE + '/search'
export const ALL_PATH = BASE + '/search-all'
export const DETAIL_PATH = BASE + '/detail'
export const PLACE_PATH = BASE + '/place'
export const TECH_PATH = BASE + '/tech'
export const GLOSSARY_PATH = BASE + '/glossary'
export const GRAPH_PATH = BASE + '/graph'
export const NEIGHBORS_PATH = BASE + '/neighbors'
export const PATH_PATH = BASE + '/path'
export const TIMELINE_PATH = BASE + '/timeline'
export const PLOT_PATH = BASE + '/plot'
export const THEMES_PATH = BASE + '/themes'
export const GAME_PATH = BASE + '/game'
export const DIFF_PATH = BASE + '/differences'
export const ASK_PATH = BASE + '/ask'
export const SIM_PATH = BASE + '/simulate'
export const SENS_PATH = BASE + '/sensitivity'
export const SCAN_PATH = BASE + '/stability'
export const CENSUS_PATH = BASE + '/census'
export const FOREST_PATH = BASE + '/dark-forest'
export const DETERRENCE_PATH = BASE + '/deterrence'
export const JOURNEY_PATH = BASE + '/journey'
export const GUIDE_PATH = BASE + '/guide'
export const CONCEPT_PATH = BASE + '/concept'

const textOutput = {
  schema: { type: 'object', properties: { text: { type: 'string' } }, additionalProperties: true },
  render(args, value) {
    return [{ type: 'text', text: (value && value.text) || '没有结果。' }]
  },
}

function json(res, status, body) {
  let payload
  try {
    payload = JSON.stringify(body)
  } catch (error) {
    payload = JSON.stringify({ error: 'response is not serializable: ' + String(error) })
    status = 500
  }
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function readQuery(req, fallbackPath) {
  try {
    return new URL(req.url === undefined ? fallbackPath : req.url, 'http://localhost').searchParams
  } catch {
    return new URLSearchParams()
  }
}

function numberParam(params, key, fallback) {
  const raw = params.get(key)
  if (raw === null || raw === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

/**
 * Which language to assemble the narrative in.
 *
 * Deliberately total and non-throwing: an unknown, missing or hostile value must
 * fall back to Chinese (the default the plugin has always shipped), never fail a
 * request. Only the two known codes are honoured.
 */
function langOf(body) {
  return body && body.lang === 'en' ? 'en' : 'zh'
}

/**
 * Whether a browser tells us this request came from another site.
 *
 * `webServer` admits every request itself: `register` hands the raw
 * `IncomingMessage` to the handler and checks no cookie, Host, or Origin — its
 * own `readResource` documentation says so outright. The `dsh web` admission
 * check lives in the SPA fallback, and a named route matches *before* the
 * fallback, so a route registered here answers any page the browser loads.
 * That is the risk the market entry disclosed.
 *
 * Two things are checked, and the second is what makes the first hold:
 *
 * 1. The caller must not identify as cross-site (`sec-fetch-site`, a foreign
 *    or opaque `Origin`).
 * 2. The `Host` must be a loopback name or a literal IP address. Comparing
 *    `Origin` against `Host` alone is not enough: DNS rebinding makes an
 *    attacker page on `evil.example` reach 127.0.0.1 with *both* headers
 *    reading `evil.example`, which a same-host comparison accepts. `webServer`
 *    refuses to bind a wildcard address and takes only an IP literal, so a
 *    legitimate request here always carries a loopback name or an IP — a
 *    request whose `Host` is an ordinary domain is being rebound, and is
 *    refused whatever its `Origin` says.
 *
 * This is not authentication and does not claim to be: it admits the panel's
 * own same-origin calls and leaves a non-browser client, which sends neither
 * header, alone.
 */
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/**
 * Put a `Host`-shaped value into one spelling, so comparing an `Origin`'s host
 * against the `Host` header does not fail on cosmetics.
 *
 * `new URL()` lowercases and drops a default port; the header keeps both. Without
 * this, `Host: LOCALHOST:7091` + `Origin: http://localhost:7091` was refused, as
 * was `Host: 127.0.0.1:80` + `Origin: http://127.0.0.1` — the same machine and
 * the same session.
 */
export function normalizeHost(value) {
  if (typeof value !== 'string') return ''
  let host = value.trim().toLowerCase()
  if (host === '') return ''
  let name = host
  let port = ''
  if (name.startsWith('[')) {
    const close = name.indexOf(']')
    if (close !== -1) {
      port = name.slice(close + 1).replace(/^:/, '')
      name = name.slice(0, close + 1)
    }
  } else {
    const colon = name.lastIndexOf(':')
    if (colon !== -1) {
      port = name.slice(colon + 1)
      name = name.slice(0, colon)
    }
  }
  // Drop a trailing dot after the port is split off, so "localhost.:7091"
  // reduces like "localhost.:7091" → "localhost:7091". "localhost." and
  // "localhost" are the same host.
  if (name.endsWith('.') && !name.endsWith(']')) name = name.slice(0, -1)
  // A default port and no port are the same authority.
  if (port === '80' || port === '443' || port === '') port = ''
  return port === '' ? name : `${name}:${port}`
}

/**
 * Whether a `Host` header names something that is not this machine.
 *
 * `true` only when a `Host` is present *and* it is neither a loopback name nor
 * a literal IP. A missing `Host` returns `false`: HTTP/1.1 always sends one, so
 * its absence means a local client or a test double rather than a rebound
 * browser, and treating that as hostile would break both without closing
 * anything a rebinding attack can use — a rebound request always carries its
 * domain.
 */
export function isForeignHostHeader(host) {
  if (typeof host !== 'string' || host === '') return false
  // Strip the port. IPv6 literals are bracketed, so split on the last colon
  // only when the value is not a bracketed literal.
  let name = host
  if (name.startsWith('[')) {
    const close = name.indexOf(']')
    if (close === -1) return true
    name = name.slice(0, close + 1)
  } else {
    const colon = name.lastIndexOf(':')
    if (colon !== -1) name = name.slice(0, colon)
  }
  const lower = name.toLowerCase().replace(/\.$/, '')
  if (LOOPBACK_HOSTNAMES.has(lower)) return false
  const bare = lower.startsWith('[') ? lower.slice(1, -1) : lower
  // Only the loopback family is this machine's own listener. An earlier version
  // admitted every IP literal, which assumed the GUI always binds loopback —
  // but webServer only refuses a *wildcard* bind, so a host configured to a LAN
  // address is legitimate and would then have admitted the whole subnet.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(bare)) {
    const parts = bare.split('.').map(Number)
    if (parts.some((part) => part > 255)) return true
    return parts[0] !== 127
  }
  if (bare === '::1') return false
  // IPv4-mapped loopback: ::ffff:127.0.0.1
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(bare)
  if (mapped) return !mapped[1].startsWith('127.')
  return true
}

export function isCrossSiteRequest(req) {
  const headers = (req && req.headers) || {}
  // A Host that is an ordinary domain name is a rebound request, whatever the
  // Origin claims. Checked first, so it cannot be talked past.
  if (isForeignHostHeader(headers.host)) return true
  const site = headers['sec-fetch-site']
  if (typeof site === 'string' && site !== 'same-origin' && site !== 'none') return true
  const origin = headers.origin
  // A same-origin GET carries no Origin.
  if (typeof origin !== 'string' || origin === '') return false
  // An opaque origin is never us.
  if (origin === 'null') return true
  let originHost
  try {
    originHost = new URL(origin).host
  } catch {
    return true
  }
  // A cross-origin Origin is refused even when Host is absent. The Host check
  // above deliberately lets a missing Host through, so relying on `host` here
  // would let an absent Host switch the Origin check off entirely.
  const host = headers.host
  if (typeof host !== 'string' || host === '') return true
  return normalizeHost(originHost) !== normalizeHost(host)
}

function rejectCrossSite(res) {
  json(res, 403, { error: 'cross-site request rejected' })
}

function routeHandler(path, compute) {
  return async (req, res) => {
    if (isCrossSiteRequest(req)) {
      rejectCrossSite(res)
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      json(res, 405, { error: 'method not allowed' })
      return
    }
    try {
      const params = readQuery(req, path)
      const result = await compute(params)
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end()
        return
      }
      json(res, 200, result)
    } catch (error) {
      json(res, 500, { error: error instanceof Error ? error.message : String(error) })
    }
  }
}

/** POST endpoints read a JSON body; used by the simulation controls. */
function actionHandler(path, compute) {
  return async (req, res) => {
    // Checked before the body is read, so a cross-site page cannot even make us
    // buffer its payload.
    if (isCrossSiteRequest(req)) {
      rejectCrossSite(res)
      return
    }
    try {
      if (req.method === 'GET') {
        json(res, 200, await compute(readQuery(req, path)))
        return
      }
      if (req.method !== 'POST') {
        json(res, 405, { error: 'method not allowed' })
        return
      }
      // A browser always sends JSON here; anything else is not our panel, and
      // text/plain is exactly the content type that skips a CORS preflight, so
      // accepting it would widen a CSRF surface for no benefit.
      const contentType = String(req.headers['content-type'] || '')
      if (!/^application\/json\b/i.test(contentType)) {
        json(res, 415, { error: 'expected application/json' })
        return
      }
      const chunks = []
      let size = 0
      let settled = false
      const outcome = await new Promise((resolve) => {
        // A client that opens a body and never finishes it would otherwise hold
        // this handler until Node's 300 s request timeout.
        const timer = setTimeout(() => {
          if (settled) return
          settled = true
          resolve({ kind: 'timeout' })
        }, 10_000)
        const finish = (value) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          resolve(value)
        }
        req.on('data', (chunk) => {
          size += chunk.length
          if (size > 512 * 1024) {
            // Answer before tearing the socket down: destroying first threw the
            // 400 away and the client saw only ECONNRESET.
            finish({ kind: 'too-large' })
            req.pause()
            return
          }
          chunks.push(chunk)
        })
        req.on('end', () => finish({ kind: 'ok' }))
        req.on('error', (error) => finish({ kind: 'error', error }))
      })
      if (outcome.kind === 'too-large') {
        json(res, 413, { error: 'request body too large' })
        return
      }
      if (outcome.kind === 'timeout') {
        json(res, 408, { error: 'request body timed out' })
        return
      }
      if (outcome.kind === 'error') {
        json(res, 400, { error: outcome.error instanceof Error ? outcome.error.message : String(outcome.error) })
        return
      }
      const raw = Buffer.concat(chunks).toString('utf8').trim()
      let body = {}
      if (raw) {
        try {
          body = JSON.parse(raw)
        } catch {
          // Silently falling back to {} returned a normal result for default
          // parameters, which reads as success and hides the mistake.
          json(res, 400, { error: 'body is not valid JSON' })
          return
        }
      }
      json(res, 200, await compute(body))
    } catch (error) {
      json(res, 400, { error: error instanceof Error ? error.message : String(error) })
    }
  }
}

function pickPreset(name) {
  if (!name) return SIM_PRESETS[0]
  return SIM_PRESETS.find((p) => p.id === name) || SIM_PRESETS[0]
}

/** @param {import('@deepseek-ai/cordis').Context} ctx */
export function apply(ctx) {
  // ---- Agent tools -------------------------------------------------------
  ctx.inject(['tools'], (toolCtx) => {
    const register = (def, label) => toolCtx.effect(() => toolCtx.tools.register(def), label)

    register({
      name: 'three_body_search',
      description:
        'Search the Three-Body (三体) knowledge base across characters, places, technologies, glossary terms, '
        + 'events and works. Use it to find who someone is, what a technology does, where a place sits, or which work something comes from.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Name or keyword, e.g. 罗辑 / 黑暗森林 / 水滴 / 智子 / 二向箔' },
          faction: { type: 'string', description: 'Optional faction id: earth, pdc, fleet, wallfacer, eso, trisolarians, blue-space, singer, zeroers, four-dim' },
          work: { type: 'string', description: 'Optional work id: three-body, dark-forest, deaths-end, ball-lightning, tencent-series, netflix-series, my-three-body' },
          scope: { type: 'string', enum: ['all', 'characters'], description: 'Search everything (default) or characters only.' },
        },
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const query = (args && args.query) || ''
        if (args && args.scope === 'characters') {
          const hits = searchCharacters(query, { faction: args.faction, work: args.work })
          if (!hits.length) return { text: '没有找到匹配的角色。' }
          return {
            text: hits.slice(0, 15).map((c) =>
              `- ${c.name}（${c.nameEn}）· ${c.factionLabel} · ${c.kind} · 来源：${c.canon}\n  ${c.summary}`
            ).join('\n'),
          }
        }
        const result = searchAll(query)
        if (!result.total) return { text: '没有找到匹配的内容。' }
        const lines = result.groups.map((g) =>
          `**${g.label}（${g.items.length}）**\n` + g.items.slice(0, 10).map((it) =>
            `- ${it.name}${it.nameEn ? '（' + it.nameEn + '）' : ''}${it.type ? ' · ' + it.type : ''}：${it.summary}`
          ).join('\n'))
        return { text: lines.join('\n\n') }
      },
    }, 'three-body-atlas: three_body_search tool')

    register({
      name: 'three_body_detail',
      description:
        'Get a full dossier for one Three-Body entity: a character (biography, relations, factions, works, quotes), '
        + 'a place, a technology, a glossary term, or a work.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name, e.g. 罗辑 / 水滴 / 黑暗森林 / 三体世界' },
          kind: {
            type: 'string',
            enum: ['character', 'place', 'tech', 'glossary', 'work'],
            description: 'Optional explicit entity kind; inferred when omitted.',
          },
          maxTier: {
            type: 'number',
            description: 'Optional spoiler ceiling 0-3 (0 prelude, 1 book one, 2 book two, 3 everything). '
              + 'Omit to return the full record; pass a lower value to withhold plot details.',
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const name = (args && args.name) || ''
        const kind = (args && args.kind) || ''
        const maxTier = args && args.maxTier
        const prefer = (k) => !kind || kind === k

        if (prefer('character')) {
          const d = characterDetail(name, { maxTier })
          if (d) {
            const lines = [
              `# ${d.name}（${d.nameEn}）`,
              `阵营：${d.factionLabel} · 类型：${d.kind} · 来源：${d.canon}`,
              '', d.summary, '', d.details || '',
            ]
            if (d.alias && d.alias.length) lines.push('', '别名：' + d.alias.join('、'))
            if (d.fate) lines.push('', '结局：' + d.fate)
            if (d.relations.length) {
              lines.push('', '## 主要关系')
              d.relations.forEach((r) => lines.push(`- [${r.typeLabel}] ${r.name}：${r.locked ? '（涉及更后面的情节，已按剧透层级遮蔽）' : r.label}`))
            }
            lines.push('', '## 出场作品')
            d.works.forEach((w) => lines.push(`- ${w.title}：${w.role}（${w.canon}）`))
            if (d.places.length) {
              lines.push('', '## 相关地点')
              d.places.forEach((p) => lines.push(`- ${p.name}（${p.type}）：${p.summary}`))
            }
            if (d.artifacts.length) {
              lines.push('', '## 相关技术')
              d.artifacts.forEach((a) => lines.push(`- ${a.name}（${a.tier}）：${a.summary}`))
            }
            if (d.quotes.length) {
              lines.push('', '## 名句')
              d.quotes.forEach((q) => lines.push(`- “${q.text}” — ${q.context}（${q.workTitle || q.work}）`))
            }
            if (d.themes.length) {
              lines.push('', '## 相关议题')
              d.themes.forEach((t) => lines.push(`- ${t.title}：${t.question}`))
            }
            if (d.appearances.length) {
              lines.push('', '## 相关事件')
              d.appearances.forEach((e) => lines.push(`- ${e.age} ${e.year} ${e.title}`))
            }
            return { text: lines.join('\n') }
          }
        }
        if (prefer('place')) {
          const p = placeDetail(name, { maxTier })
          if (p) {
            return {
              text: [
                `# ${p.name}（${p.nameEn}）`, `${p.region} · ${p.type} · 来源：${p.canon}`,
                '', p.summary, '', p.desc,
                '', '## 相关人物', ...p.characters.map((c) => `- ${c.name}（${c.factionLabel}）`),
              ].join('\n'),
            }
          }
        }
        if (prefer('tech')) {
          const t = techDetail(name, { maxTier })
          if (t) {
            return {
              text: [
                `# ${t.name}（${t.nameEn}）`, `${t.tier} · ${t.category} · ${t.era} · 危险等级 ${t.danger}/5`,
                '', t.summary, '', t.desc,
                '', '## 相关人物', ...t.relatedCharacters.map((c) => `- ${c.name}`),
                '', '## 相关技术', ...t.relatedTech.map((x) => `- ${x.name}（${x.tier}）`),
              ].join('\n'),
            }
          }
        }
        if (prefer('glossary')) {
          const g = glossaryDetail(name, { maxTier })
          if (g) {
            const lines = [`# ${g.term}（${g.termEn || ''}）`, g.category, '', g.definition, '', g.detail]
            if (g.related.length) lines.push('', '## 相关条目', ...g.related.map((c) => `- ${c.name}`))
            return { text: lines.join('\n') }
          }
        }
        return { text: '没有找到这个条目。' }
      },
    }, 'three-body-atlas: three_body_detail tool')

    register({
      name: 'three_body_relation',
      description:
        'Find the shortest curated relationship path between two Three-Body characters, e.g. 罗辑 and 庄颜, '
        + '程心 and 云天明. Returns every hop with the relation label connecting them.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'First character name' },
          to: { type: 'string', description: 'Second character name' },
        },
        required: ['from', 'to'],
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const result = relationPath((args && args.from) || '', (args && args.to) || '')
        if (!result.ok) return { text: (result.error || '未找到关系路径。') }
        if (!result.steps.length) return { text: '这两个是同一个角色。' }
        const lines = [`关系路径（${result.hops} 跳）：`]
        result.steps.forEach((s, i) => lines.push(`${i + 1}. ${s.from} —[${s.label}]→ ${s.to}`))
        return { text: lines.join('\n') }
      },
    }, 'three-body-atlas: three_body_relation tool')

    register({
      name: 'three_body_timeline',
      description:
        'Query the Three-Body chronology from the years before the Crisis Era through the Bunker Era, the Galaxy Era '
        + 'and 647 Universe. Filter by era id, work or character.',
      parameters: {
        type: 'object',
        properties: {
          era: { type: 'string', description: 'Optional era id, e.g. crisis / deterrence / broadcast / bunker / galaxy' },
          work: { type: 'string', description: 'Optional work id filter' },
          character: { type: 'string', description: 'Optional character name filter' },
        },
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const result = timeline({ era: args && args.era, work: args && args.work, character: args && args.character })
        if (!result.events.length) return { text: '该筛选条件下没有事件。' }
        return {
          text: result.events.map((e) => `- ${e.eraName} · ${e.year} **${e.title}**：${e.desc}`).join('\n'),
        }
      },
    }, 'three-body-atlas: three_body_timeline tool')

    register({
      name: 'three_body_simulate',
      description:
        'Run a real Three-Body gravitational simulation and return the derived 恒纪元 / 乱纪元 history. '
        + 'Use it whenever a question is about the three-body problem, stability, or why the Trisolaran world is doomed.',
      parameters: {
        type: 'object',
        properties: {
          preset: {
            type: 'string',
            enum: SIM_PRESETS.map((p) => p.id),
            description: 'Optional preset id; defaults to trisolaris.',
          },
          mode: {
            type: 'string',
            enum: ['simulate', 'sensitivity', 'stability', 'dark-forest', 'deterrence'],
            description:
              'simulate (default): integrate a preset. sensitivity: butterfly-effect measurement. '
              + 'stability: sweep random initial conditions. dark-forest / deterrence: the two arguments the novels turn on.',
          },
        },
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const preset = pickPreset(args && args.preset)
        const mode = (args && args.mode) || 'simulate'
        // The tool's own description is English, so its report should be too:
        // an agent that asked in English was otherwise handed Chinese prose.
        const lang = 'en'
        if (mode === 'sensitivity') {
          const s = sensitivity({ bodies: preset.bodies, lang })
          return { text: `${s.verdict}\n(${preset.nameEn || preset.name}, integrated over ${s.span} time units, perturbation ε=${s.epsilon})` }
        }
        if (mode === 'stability') {
          const scan = stabilityScan({ samples: 60, lang })
          return {
            text: [scan.verdict, '', 'Share of the four outcomes:',
              ...Object.entries(scan.share).map(([k, v]) => `- ${labelOfOutcome(k)}: ${v}%`)].join('\n'),
          }
        }
        if (mode === 'dark-forest') {
          const result = darkForest({ lang })
          return {
            text: [result.verdict, '', result.comparison.note,
              `Parameters: ${result.params.civs} civilizations, ${result.params.rounds} rounds, `
              + `suspicion ${result.params.suspicion}, tech-explosion probability ${result.params.explosion}.`].join('\n'),
          }
        }
        if (mode === 'deterrence') {
          const result = deterrence({ lang })
          return { text: `${result.verdict}\n\n${result.insight}` }
        }
        const result = simulate(Object.assign({}, preset, { lang }))
        const m = result.metrics
        const eras = result.eras.slice(0, 10).map((e) =>
          `- ${e.labelEn || e.label}: t=${e.start} → ${e.end} (${e.duration}), mainly driven by ${e.starEn || e.star || 'several stars'}`)
        const cats = result.catastrophes.map((c) =>
          `- t=${c.t} **${c.kindLabel || c.kind}** (${c.severityLabel || c.severity}, lasting ${c.duration}): ${c.text}\n  ${c.detail}`)
        const civ = result.civilizations
        const readings = result.reading.map((a) => `- **${a.title}** (${a.verdict}): ${a.text}`)
        return {
          text: [
            `**${preset.nameEn || preset.name}** (${preset.descEn || preset.desc})`,
            '', result.summary,
            `Integrated ${m.steps} steps (t=${m.time}), energy drift ${(m.integratorDrift * 100).toFixed(3)}%`
              + ` (angular momentum drift ${(m.angularDrift * 100).toFixed(4)}%), adaptive substeps averaging 1/${m.substepRatio}, `
              + `closest approach ${m.closestApproach ?? '—'}, bodies remaining ${m.bodiesLeft}.`,
            '', 'Era calendar:', ...eras,
            '', result.eras.length
              ? `${result.eras.length} segments in total: ${result.eras.filter((e) => e.kind === 'stable').length} Stable Eras `
                + `and ${result.eras.filter((e) => e.kind === 'chaotic').length} Chaotic Eras.`
              : 'No recognisable era emerged.',
            '', 'Catastrophes:', ...(cats.length ? cats : ['- No Tri-Solar Day, alignment, tidal disruption or engulfment in this run.']),
            '', 'Civilization count:', civ.headline,
            ...(civ.timeline || []).slice(0, 8).map((g) =>
              `- Generation ${g.generation}: t=${g.start} → ${g.end} (${g.duration})`
              + (g.endedBy ? `, ended by ${g.endedBy}` : ', lasted until the Chaotic Era')),
            '', 'Read from four angles:', ...readings,
          ].join('\n'),
        }
      },
    }, 'three-body-atlas: three_body_simulate tool')

    register({
      name: 'three_body_census',
      description:
        'Census many random three-star systems and report how many generations of civilization each planet can raise. '
        + 'Use it for "how many civilizations did the Trisolaran world go through" or "why is a stable era so rare" — '
        + 'a single run only lasts a fraction of one orbit, so the distribution over many real integrations is the honest answer.',
      parameters: {
        type: 'object',
        properties: {
          samples: { type: 'integer', description: 'How many random systems to integrate, 8–120. Defaults to 30.' },
        },
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const samples = Math.max(8, Math.min(120, Math.round(Number((args && args.samples) || 30))))
        // Walk the batches exactly as the panel does, so the tool and the GUI
        // report the same numbers.
        // Walk the batches like the panel does, then fold here. The Host only
        // aggregates a sweep it integrated in one call (its batch limit is 24, so
        // a 120-sample request cannot be one call), and the tool needs a number
        // for any sample count. Every row below came from an integration the Host
        // ran in this process, so folding here invents nothing.
        const rows = []
        let offset = 0
        let guard = 0
        let done = false
        while (!done && guard < 10) {
          const batch = civilizationCensus({ samples, offset, limit: 24, steps: 16000 })
          rows.push(...batch.points)
          done = batch.done
          if (batch.next !== null) offset = batch.next
          guard++
        }
        if (!rows.length) return { text: '普查没有完成，请减少样本数后重试。' }
        const a = foldCensus(rows, samples)
        const histogram = Object.keys(a.histogram).map(Number).sort((x, y) => x - y)
          .map((g) => `- ${g} 代：${a.histogram[g]} 组`).join('\n')
        const outcomes = Object.entries(a.byOutcome)
          .map(([k, v]) => `- ${labelOfOutcome(k)}：${v.n} 组，平均 ${v.mean} 代`).join('\n')
        return {
          text: [
            a.verdict,
            '',
            `样本 ${a.samples} 组，平均 ${a.mean} 代、中位 ${a.median} 代、最多 ${a.max} 代。`,
            '', '代数分布：', histogram,
            '', '按结局分组：', outcomes,
            '',
            `恒纪元累计时长与文明代数的相关系数 ${a.correlation}`
              + `（越接近 1，说明文明能延续多久几乎完全取决于稳定期能撑多久）。`,            '',
            '注意：这是随机初始条件下的分布，不是某一颗行星的真实历史。单次模拟只覆盖不到一个轨道周期，'
              + '行星往往在几代之后就被抛出系统——那正是三体文明必须逃离的原因。',
          ].join('\n'),
        }
      },
    }, 'three-body-atlas: three_body_census tool')

    register({
      name: 'three_body_theme',
      description:
        'Read the multi-angle analysis of a Three-Body theme (生存与道德, 面壁计划与欺骗, 黑暗森林, 爱与责任, 科学与傲慢, '
        + '时间与死亡, 个体与文明, 宇宙的尺度). Returns the question, both sides, and the open discussion.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Theme title or keyword, e.g. 生存与道德 / 黑暗森林 / 程心' },
          list: { type: 'boolean', description: 'Set true to list every available theme with its question.' },
        },
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const all = themes()
        if (args && args.list) {
          return { text: all.map((t) => `- ${t.title}：${t.question}（相关人物：${t.people.map((p) => p.name).join('、') || '—'}）`).join('\n') }
        }
        const topic = String((args && args.topic) || '')
        const hit = all.find((t) => t.title.includes(topic) || topic.includes(t.title))
          || all.find((t) => (t.summary + t.question + t.discussion).includes(topic))
          || all.find((t) => t.people.some((p) => p.name.includes(topic) || topic.includes(p.name)))
        if (!hit) {
          return { text: '没有找到这个议题。可用的议题：\n' + all.map((t) => '- ' + t.title).join('\n') }
        }
        return {
          text: [
            `# ${hit.title}`,
            hit.question, '', hit.summary, '',
            '## 两种立场',
            ...hit.sides.map((s) => `- **${s.name}**：${s.view}`),
            '', '## 可以继续争论的地方', hit.discussion,
            '', '相关人物：' + (hit.people.map((p) => p.name).join('、') || '—'),
          ].join('\n'),
        }
      },
    }, 'three-body-atlas: three_body_theme tool')

    register({
      name: 'three_body_game',
      description:
        'Walk through the 三体 game levels (the in-novel VR game) in order, or read one level. Each level carries what '
        + 'the player sees and what it was meant to teach.',
      parameters: {
        type: 'object',
        properties: {
          level: { type: 'number', description: 'Optional 1-based level number; omit to list every level.' },
        },
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const levels = gameLevels()
        const which = args && typeof args.level === 'number' ? levels[args.level - 1] : null
        if (which) {
          return {
            text: [
              `# 第 ${which.order} 关 · ${which.title}`,
              `出场：${(which.avatars || []).join('、') || '—'}`,
              `场景：${which.scene}`, `进度：${which.progress}`,
              '', which.desc, '', '**这一关想告诉你：** ' + which.insight,
            ].join('\n'),
          }
        }
        return {
          text: levels.map((l) => `${l.order}. **${l.title}**（${l.progress}）— ${l.scene}\n   ${l.insight}`).join('\n'),
        }
      },
    }, 'three-body-atlas: three_body_game tool')

    register({
      name: 'three_body_ask',
      description:
        'Ask a free-form question about the Three-Body universe: who someone is, relationships, eras, technologies, '
        + 'plot beats, adaptation differences or themes. Returns a concise answer grounded in the curated data.',
      parameters: {
        type: 'object',
        properties: { question: { type: 'string', description: 'Natural-language question in Chinese or English' } },
        required: ['question'],
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        return { text: ask((args && args.question) || '') }
      },
    }, 'three-body-atlas: three_body_ask tool')

    register({
      name: 'three_body_journey',
      description:
        'Walk one character through the story in order: every event and plot beat they appear in, tagged as '
        + 'driving the scene (focus), being named in it, or merely present. Use it to answer "what does this '
        + 'character actually live through" or to follow one thread across the trilogy.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Character name or id, e.g. 程心 / 罗辑 / ye-wenjie' },
          maxTier: {
            type: 'number',
            description: 'Optional spoiler ceiling 0-3; omit to include everything.',
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const j = characterJourney((args && args.name) || '', { maxTier: args && args.maxTier })
        if (!j) return { text: '没有找到该角色。' }
        const roleLabel = { focus: '主导', named: '被点名', present: '在场' }
        const lines = [
          `# ${j.character.name}（${j.character.nameEn}）`,
          `${j.character.factionLabel} · 首次出场：${j.character.firstWorkTitle || '—'}`,
          '', j.character.summary, '',
          `共 ${j.total} 个情节节点，其中 ${j.focusCount} 个由他/她主导。`,
        ]
        if (!j.hasStory) {
          lines.push('', '这个角色没有单独出场的情节节点，属于配角或背景设定；以下是其关系入口：')
          j.neighbours.forEach((n) => lines.push(`- ${n.name}：${n.label}`))
          return { text: lines.join('\n') }
        }
        let lastWork = ''
        for (const node of j.nodes) {
          const work = node.workTitle || ''
          if (work && work !== lastWork) { lines.push('', `## ${work}`); lastWork = work }
          const tag = roleLabel[node.role] || node.role
          const lock = node.locked ? '〔剧透已遮蔽〕' : ''
          lines.push(`- **${node.title}**（${tag}）${node.year ? ' · ' + node.year : ''}${lock}`)
          if (!node.locked && node.desc) lines.push(`  ${node.desc}`)
        }
        return { text: lines.join('\n') }
      },
    }, 'three-body-atlas: three_body_journey tool')

    register({
      name: 'three_body_concept',
      description:
        'Explore how Three-Body concepts depend on each other. Returns the cross-type graph around a term: '
        + 'related terms, technologies, characters and places, up to three hops. Use it for "how does X lead '
        + 'to Y" questions, e.g. 黑暗森林 or 猜疑链.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Concept or term, e.g. 黑暗森林 / 猜疑链 / 面壁计划. Omit for an overview.' },
          depth: { type: 'number', description: 'Hops to follow, 1-3; defaults to 2.' },
        },
        required: [],
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const g = conceptGraph({ id: (args && args.name) || '', depth: args && args.depth })
        if (!g) return { text: '没有找到该概念。' }
        if (!g.root) {
          return {
            text: '概念总览（按关联度排序）：\n' + g.nodes.slice(0, 15)
              .map((n) => `- ${n.name}（${n.kind}，${n.degree} 条关联）：${n.summary}`).join('\n'),
          }
        }
        const kindLabel = { glossary: '术语', tech: '技术', character: '人物', place: '地点' }
        const lines = [
          `# ${g.root.name}`, `${kindLabel[g.root.kind] || g.root.kind} · ${g.root.category}`, '', g.root.summary || '', '',
          `## 关联（${g.nodes.length - 1} 个节点，${g.edges.length} 条边）`,
        ]
        for (const e of g.edges) {
          const from = g.nodes.find((n) => n.id === e.from)
          const to = g.nodes.find((n) => n.id === e.to)
          if (from && to) lines.push(`- ${from.name} → ${to.name}（${kindLabel[to.kind] || to.kind}）`)
        }
        const locked = g.nodes.filter((n) => n.locked)
        if (locked.length) lines.push('', `（其中 ${locked.length} 个节点超出当前剧透层级）`)
        return { text: lines.join('\n') }
      },
    }, 'three-body-atlas: three_body_concept tool')
  })

  // ---- Browser routes ----------------------------------------------------
  ctx.inject(['webServer'], (webCtx) => {
    const register = (path, compute, label) =>
      webCtx.effect(() => webCtx.webServer.register({ kind: 'exact', path, handler: routeHandler(path, compute) }), label)
    const registerAction = (path, compute, label) =>
      webCtx.effect(() => webCtx.webServer.register({ kind: 'exact', path, handler: actionHandler(path, compute) }), label)

    register(BUNDLE_PATH, () => bundle(), 'three-body-atlas: bundle route')

    register(SEARCH_PATH, (p) => ({
      results: searchCharacters(p.get('q') || '', {
        faction: p.get('faction') || undefined,
        work: p.get('work') || undefined,
        kind: p.get('kind') || undefined,
        canon: p.get('canon') || undefined,
      }),
      counts: counts(),
    }), 'three-body-atlas: search route')

    register(ALL_PATH, (p) => searchAll(p.get('q') || ''), 'three-body-atlas: universal search route')

    register(DETAIL_PATH, (p) => characterDetail(p.get('id') || p.get('q') || '', {
      maxTier: p.get('maxTier'),
    }) || { error: '没有找到该角色' }, 'three-body-atlas: detail route')

    register(PLACE_PATH, (p) => placeDetail(p.get('id') || p.get('q') || '', {
      maxTier: p.get('maxTier'),
    }) || { error: '没有找到该地点' }, 'three-body-atlas: place route')

    register(TECH_PATH, (p) => techDetail(p.get('id') || p.get('q') || '', {
      maxTier: p.get('maxTier'),
    }) || { error: '没有找到该技术' }, 'three-body-atlas: tech route')

    register(GLOSSARY_PATH, (p) => glossaryDetail(p.get('id') || p.get('q') || '', {
      maxTier: p.get('maxTier'),
    }) || { error: '没有找到该术语' }, 'three-body-atlas: glossary route')

    register(JOURNEY_PATH, (p) => characterJourney(p.get('id') || p.get('q') || '', {
      maxTier: p.get('maxTier'),
    }) || { error: '没有找到该角色' }, 'three-body-atlas: journey route')

    register(GUIDE_PATH, (p) => ({ paths: pathGuide({ maxTier: p.get('maxTier') }) }),
      'three-body-atlas: reading guide route')

    register(CONCEPT_PATH, (p) => conceptGraph({
      id: p.get('id') || p.get('q') || '',
      depth: p.get('depth'),
      maxTier: p.get('maxTier'),
    }) || { error: '没有找到该概念' }, 'three-body-atlas: concept graph route')

    register(GRAPH_PATH, (p) => buildGraph({ faction: p.get('faction') || undefined }),
      'three-body-atlas: graph route')

    register(NEIGHBORS_PATH, (p) => neighbors(p.get('id') || p.get('q') || '')
      || { error: '没有找到该角色' }, 'three-body-atlas: neighbors route')

    register(PATH_PATH, (p) => relationPath(p.get('from') || '', p.get('to') || ''),
      'three-body-atlas: relation path route')

    register(TIMELINE_PATH, (p) => timeline({
      era: p.get('era') || undefined,
      work: p.get('work') || undefined,
      character: p.get('character') || undefined,
    }), 'three-body-atlas: timeline route')

    register(PLOT_PATH, (p) => ({ plots: plot({ work: p.get('work') || undefined }) }),
      'three-body-atlas: plot route')

    register(THEMES_PATH, () => ({ themes: themes() }), 'three-body-atlas: themes route')
    register(GAME_PATH, () => ({ levels: gameLevels() }), 'three-body-atlas: game route')
    register(DIFF_PATH, (p) => ({ differences: differences({ media: p.get('media') || undefined }) }),
      'three-body-atlas: differences route')

    register(ASK_PATH, (p) => ({
      answer: ask(p.get('q') || ''),
      suggestions: suggestions(),
    }), 'three-body-atlas: ask route')

    // The lab lets a reader override the initial state. Every override is
    // clamped here rather than trusted from the browser, so a hand-edited
    // request cannot ask for a 10^9-step integration.
    registerAction(SIM_PATH, (body) => {
      const preset = pickPreset(body && body.preset)
      const config = { bodies: preset.bodies, params: Object.assign({}, preset.params) }
      if (body && body.params && typeof body.params === 'object') {
        const p = body.params
        if (Number.isFinite(Number(p.steps))) config.params.steps = clamp(Number(p.steps), 200, 40000)
        if (Number.isFinite(Number(p.dt))) config.params.dt = clamp(Number(p.dt), 1e-5, 0.02)
        if (Number.isFinite(Number(p.record))) config.params.record = clamp(Number(p.record), 1, 200)
        if (Number.isFinite(Number(p.escape))) config.params.escape = clamp(Number(p.escape), 4, 60)
        if (typeof p.collisions === 'boolean') config.params.collisions = p.collisions
      }
      if (Array.isArray(body && body.bodies)) {
        const override = body.bodies
        config.bodies = config.bodies.map((original, i) => {
          const patch = override.find((o) => o && o.id === original.id)
          if (!patch) return original
          const next = { ...original }
          for (const key of ['x', 'y', 'vx', 'vy', 'mass']) {
            const value = Number(patch[key])
            if (Number.isFinite(value)) {
              next[key] = key === 'mass' ? clamp(value, 1e-9, 50) : clamp(value, -40, 40)
            }
          }
          return next
        })
      }
      return simulate(Object.assign(config, { lang: langOf(body) }))
    }, 'three-body-atlas: simulate route')

    registerAction(SENS_PATH, (body) => {
      const preset = pickPreset(body && body.preset)
      return sensitivity({
        bodies: preset.bodies,
        epsilon: numberParam(new URLSearchParams(body || {}), 'epsilon', 1e-6),
        lang: langOf(body),
      })
    }, 'three-body-atlas: sensitivity route')

    registerAction(SCAN_PATH, (body) => stabilityScan({
      samples: Math.round(Number((body && body.samples) || 60)),
      seed: Number((body && body.seed) || 20230806),
      lang: langOf(body),
    }), 'three-body-atlas: stability route')

    // Batched: the client walks `offset` until `done`, and sends back the rows it
    // already has so the final aggregate does not re-integrate the whole sweep.
    registerAction(CENSUS_PATH, (body) => civilizationCensus({
      samples: Math.round(Number((body && body.samples) || 60)),
      offset: Math.round(Number((body && body.offset) || 0)),
      limit: Math.round(Number((body && body.limit) || 12)),
      steps: Math.round(Number((body && body.steps) || 16000)),
      seed: Number((body && body.seed) || 20230806),
      collected: Array.isArray(body && body.collected) ? body.collected : null,
      lang: langOf(body),
    }), 'three-body-atlas: census route')

    registerAction(FOREST_PATH, (body) => darkForest({
      civs: Number((body && body.civs) || 48),
      rounds: Number((body && body.rounds) || 120),
      suspicion: Number((body && body.suspicion) ?? 0.55),
      explosion: Number((body && body.explosion) ?? 0.06),
      cost: Number((body && body.cost) ?? 0.35),
      seed: Number((body && body.seed) || 42),
      lang: langOf(body),
    }), 'three-body-atlas: dark forest route')

    registerAction(DETERRENCE_PATH, (body) => deterrence({
      resolve: Number((body && body.resolve) ?? 0.5),
      invasion: Number((body && body.invasion) ?? 0.6),
      luck: Number((body && body.luck) ?? 0.5),
      seed: Number((body && body.seed) || 7),
      lang: langOf(body),
    }), 'three-body-atlas: deterrence route')
  })
}

function labelOfOutcome(key) {
  // The tool's report is English (its description is), so the outcome labels are too.
  return {
    stable: 'stays bound (rare)',
    chaotic: 'chaotic but not ejected',
    eject: 'ejected',
    collapse: 'collisional merge',
  }[key] || key
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
