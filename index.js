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
  ask, suggestions,
  SIM_PRESETS, simulate, sensitivity, stabilityScan, darkForest, deterrence,
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
export const FOREST_PATH = BASE + '/dark-forest'
export const DETERRENCE_PATH = BASE + '/deterrence'

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

function routeHandler(path, compute) {
  return async (req, res) => {
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
    try {
      if (req.method === 'GET') {
        json(res, 200, await compute(readQuery(req, path)))
        return
      }
      if (req.method !== 'POST') {
        json(res, 405, { error: 'method not allowed' })
        return
      }
      const chunks = []
      let size = 0
      await new Promise((resolve, reject) => {
        req.on('data', (chunk) => {
          size += chunk.length
          if (size > 512 * 1024) { reject(new Error('request body too large')); req.destroy(); return }
          chunks.push(chunk)
        })
        req.on('end', resolve)
        req.on('error', reject)
      })
      const raw = Buffer.concat(chunks).toString('utf8').trim()
      let body = {}
      if (raw) {
        try { body = JSON.parse(raw) } catch { body = {} }
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
        },
        required: ['name'],
        additionalProperties: false,
      },
      output: textOutput,
      async execute(args) {
        const name = (args && args.name) || ''
        const kind = (args && args.kind) || ''
        const prefer = (k) => !kind || kind === k

        if (prefer('character')) {
          const d = characterDetail(name)
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
              d.relations.forEach((r) => lines.push(`- [${r.typeLabel}] ${r.name}：${r.label}`))
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
          const p = placeDetail(name)
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
          const t = techDetail(name)
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
          const g = glossaryDetail(name)
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
        if (mode === 'sensitivity') {
          const s = sensitivity({ bodies: preset.bodies })
          return { text: `${s.verdict}\n（${preset.name}，积分 ${s.span} 个时间单位，扰动 ε=${s.epsilon}）` }
        }
        if (mode === 'stability') {
          const scan = stabilityScan({ samples: 60 })
          return {
            text: [scan.verdict, '', '四种结局的占比：',
              ...Object.entries(scan.share).map(([k, v]) => `- ${labelOfOutcome(k)}：${v}%`)].join('\n'),
          }
        }
        if (mode === 'dark-forest') {
          const result = darkForest({})
          return {
            text: [result.verdict, '', result.comparison.note,
              `参数：文明 ${result.params.civs} 个、${result.params.rounds} 轮、猜疑 ${result.params.suspicion}、技术爆炸概率 ${result.params.explosion}。`].join('\n'),
          }
        }
        if (mode === 'deterrence') {
          const result = deterrence({})
          return { text: `${result.verdict}\n\n${result.insight}` }
        }
        const result = simulate(preset)
        const m = result.metrics
        const eras = result.eras.slice(0, 10).map((e) => `- ${e.label}：t=${e.start} → ${e.end}（${e.duration}），主要影响来自${e.star || '多颗恒星'}`)
        const cats = result.catastrophes.map((c) =>
          `- t=${c.t} **${c.kind}**（${c.severity}，持续 ${c.duration}）：${c.text}\n  ${c.detail}`)
        const civ = result.civilizations
        const readings = result.reading.map((a) => `- **${a.title}**（${a.verdict}）：${a.text}`)
        return {
          text: [
            `**${preset.name}**（${preset.desc}）`,
            '', result.summary,
            `积分 ${m.steps} 步（t=${m.time}），能量漂移 ${(m.integratorDrift * 100).toFixed(3)}%`
              + `（角动量漂移 ${(m.angularDrift * 100).toFixed(4)}%），自适应子步平均 1/${m.substepRatio}，`
              + `最近交会 ${m.closestApproach ?? '—'}，剩余天体 ${m.bodiesLeft} 个。`,
            '', '历法推演：', ...eras,
            '', result.eras.length ? `共 ${result.eras.length} 段，其中恒纪元 ${result.eras.filter((e) => e.kind === 'stable').length} 段、乱纪元 ${result.eras.filter((e) => e.kind === 'chaotic').length} 段。` : '没有出现可辨认的纪元。',
            '', '灾变记录：', ...(cats.length ? cats : ['- 这段推演里没有出现三日凌空、连珠、潮汐撕裂或吞噬。']),
            '', '文明代数：', civ.headline,
            ...(civ.timeline || []).slice(0, 8).map((g) =>
              `- 第 ${g.generation} 代：t=${g.start} → ${g.end}（${g.duration}）`
              + (g.endedBy ? `，终结于${g.endedBy}` : '，熬到了乱纪元')),
            '', '四角度解读：', ...readings,
          ].join('\n'),
        }
      },
    }, 'three-body-atlas: three_body_simulate tool')

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

    register(DETAIL_PATH, (p) => characterDetail(p.get('id') || p.get('q') || '')
      || { error: '没有找到该角色' }, 'three-body-atlas: detail route')

    register(PLACE_PATH, (p) => placeDetail(p.get('id') || p.get('q') || '')
      || { error: '没有找到该地点' }, 'three-body-atlas: place route')

    register(TECH_PATH, (p) => techDetail(p.get('id') || p.get('q') || '')
      || { error: '没有找到该技术' }, 'three-body-atlas: tech route')

    register(GLOSSARY_PATH, (p) => glossaryDetail(p.get('id') || p.get('q') || '')
      || { error: '没有找到该术语' }, 'three-body-atlas: glossary route')

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
      return simulate(config)
    }, 'three-body-atlas: simulate route')

    registerAction(SENS_PATH, (body) => {
      const preset = pickPreset(body && body.preset)
      return sensitivity({ bodies: preset.bodies, epsilon: numberParam(new URLSearchParams(body || {}), 'epsilon', 1e-6) })
    }, 'three-body-atlas: sensitivity route')

    registerAction(SCAN_PATH, (body) => stabilityScan({
      samples: Math.round(Number((body && body.samples) || 60)),
      seed: Number((body && body.seed) || 20230806),
    }), 'three-body-atlas: stability route')

    registerAction(FOREST_PATH, (body) => darkForest({
      civs: Number((body && body.civs) || 48),
      rounds: Number((body && body.rounds) || 120),
      suspicion: Number((body && body.suspicion) ?? 0.55),
      explosion: Number((body && body.explosion) ?? 0.06),
      cost: Number((body && body.cost) ?? 0.35),
      seed: Number((body && body.seed) || 42),
    }), 'three-body-atlas: dark forest route')

    registerAction(DETERRENCE_PATH, (body) => deterrence({
      resolve: Number((body && body.resolve) ?? 0.5),
      invasion: Number((body && body.invasion) ?? 0.6),
      luck: Number((body && body.luck) ?? 0.5),
      seed: Number((body && body.seed) || 7),
    }), 'three-body-atlas: deterrence route')
  })
}

function labelOfOutcome(key) {
  return { stable: '保持束缚（罕见）', chaotic: '混沌但未飞散', eject: '飞散', collapse: '碰撞合并' }[key] || key
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
