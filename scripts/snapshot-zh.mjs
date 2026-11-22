/**
 * Snapshot the Chinese narrative output so a later refactor can be diffed against
 * it byte for byte. Splitting severity/kind into stable ids is exactly the kind of
 * change that silently rewrites a sentence ("3 次致命天象" → "0 次"), and eyeballing
 * it is not a check.
 *
 * Usage: node scripts/snapshot-zh.mjs > .snapshot-zh.json   (before)
 *        node scripts/snapshot-zh.mjs > .snapshot-zh-new.json (after)
 */
import { SIM_PRESETS, simulate, stabilityScan, civilizationCensus, darkForest, deterrence } from '../sim.js'

const out = {}
for (const preset of SIM_PRESETS) {
  const r = simulate({ bodies: preset.bodies, params: preset.params })
  out[preset.id] = {
    summary: r.summary,
    reading: r.reading.map((x) => ({ title: x.title, verdict: x.verdict, text: x.text })),
    civilizations: {
      headline: r.civilizations.headline,
      generations: r.civilizations.generations,
      destroyed: r.civilizations.destroyed,
      completed: r.civilizations.completed,
    },
    catastrophes: (r.catastrophes || []).map((c) => ({
      t: c.t, kind: c.kind, severity: c.severity, text: c.text, detail: c.detail,
    })),
    events: (r.events || []).map((e) => ({ t: e.t, type: e.type, text: e.text })),
    eras: (r.eras || []).map((e) => ({ kind: e.kind, label: e.label, from: e.from, to: e.to })),
    lethalCount: (r.catastrophes || []).filter((c) => c.severity === 'devastating' || c.severity === 'lethal').length,
    fatalCount: (r.catastrophes || []).filter((c) => ['devastating', 'lethal', 'extreme'].includes(c.severity)).length,

  }
}

const scan = stabilityScan({ samples: 12 })
out._scan = { note: scan.verdict || scan.note, count: (scan.points || []).length }

const cen = civilizationCensus({ samples: 8, offset: 0, limit: 8, steps: 4000 })
out._census = cen.aggregate ? { verdict: cen.aggregate.verdict, mean: cen.aggregate.mean } : null

const df = darkForest({ civs: 12, strikes: 3 })
out._forest = { verdict: df.verdict, insight: df.insight }

const dt = deterrence({ resolve: 0.7, invasion: 0.5 })
out._deterrence = { verdict: dt.verdict, note: dt.comparison ? dt.comparison.note : null }

console.log(JSON.stringify(out, null, 2))
