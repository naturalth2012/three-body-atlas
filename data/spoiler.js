/**
 * Spoiler tiers.
 *
 * The trilogy's reading experience depends on not knowing what comes next: a
 * reader who has finished book one should not meet the swordholder or the
 * dimension strike in a glossary tooltip. Every record therefore carries a
 * tier, and the engine can mask anything above the reader's mark.
 *
 * Tiers are derived from data that already exists rather than hand-tagged, so
 * they cannot drift out of sync with the catalogue:
 *
 *   - characters  -> `firstWork`
 *   - events      -> `works[]` (a record belongs to the latest work it appears in)
 *   - places      -> `works[]`
 *   - tech        -> `firstWork`
 *   - quotes      -> `work`
 *   - plot beats  -> the volume they live in
 *   - glossary    -> no work field, so GLOSSARY_TIER below fills the gap
 */

/** Reading order of the novels, plus the side works. */
export const WORK_TIER = {
  'ball-lightning': 0, // 前史，可先读
  'three-body': 1,
  'dark-forest': 2,
  'deaths-end': 3,
  'three-body-x': 3, // 同人，按最高级处理
  'tencent-series': 1, // 剧集覆盖第一部
  'netflix-series': 3, // 剧集覆盖全三部
  'my-three-body': 3, // 动画覆盖全三部
}

export const TIER_LABELS = [
  { tier: 0, id: 'pre', zh: '前史', en: 'Prelude', hint: '《球状闪电》，不含三部曲剧透' },
  { tier: 1, id: 'b1', zh: '第一部', en: 'Book One', hint: '《三体》' },
  { tier: 2, id: 'b2', zh: '第二部', en: 'Book Two', hint: '《黑暗森林》' },
  { tier: 3, id: 'b3', zh: '第三部', en: 'Book Three', hint: '《死神永生》' },
]

/** The maximum tier a reader has reached. 3 means "show everything". */
export const MAX_TIER = 3

/**
 * Glossary terms carry no `work` field, so their tier is stated here. The
 * grouping follows the novels: cosmic sociology only pays off in book two,
 * the swordholder and the bunker era only exist in book three.
 */
export const GLOSSARY_TIER = {
  // 宇宙社会学 — 黑暗森林才展开
  'dark-forest': 2,
  'chain-of-suspicion': 2,
  'technological-explosion': 2,
  'cosmic-sociology': 2,
  'deterrence-degree': 2,
  'cosmic-safety-statement': 3,
  // 人类组织
  'wallfacer-plan': 2,
  'wall-breaker': 2,
  'swordholder': 3,
  'guzheng-operation': 1,
  'red-coast-project': 1,
  'science-frontier': 1,
  'eto-factions': 1,
  'space-force': 2,
  'fleet-international': 2,
  'pdc': 1,
  'eto': 1,
  'bunker-plan': 3,
  'black-domain-plan': 3,
  // 纪元
  'deterrence-era': 3,
  'great-trough': 2,
  'beyond-time': 3,
  'broadcast-era': 3,
  'bunker-era': 3,
  // 科技
  'sophon-blockade': 1,
  'human-computer-term': 1,
  'thought-print-term': 2,
  'light-speed-ship-term': 3,
  'four-dim-space-term': 3,
  // 三体文明
  'three-body-problem': 1,
  'triple-sun': 1,
  'chaotic-era': 1,
  'dehydration-term': 1,
  'singer-civilization': 3,
  'trisolaran-civilization': 1,
  // 哲学
  'zeroers': 3,
  'pastoral-era': 3,
}

/** Tier of a work id, falling back to the highest tier for unknown ids. */
export function tierOfWork(work) {
  const t = WORK_TIER[work]
  return typeof t === 'number' ? t : MAX_TIER
}

/** Latest tier among a list of work ids — a record is as late as its latest work. */
export function tierOfWorks(works) {
  if (!Array.isArray(works) || !works.length) return MAX_TIER
  return works.reduce((max, w) => Math.max(max, tierOfWork(w)), 0)
}

/** The fields that get masked when a record is above the reader's tier. */
export const MASKED_FIELDS = ['details', 'desc', 'fate', 'detail', 'outcome', 'summaryLong']

/**
 * Replace spoilery fields with a lock marker. Never deletes the record: the
 * title and one-line summary stay visible so the reader knows what exists
 * without being told how it ends.
 */
export function maskRecord(record, tier, maxTier) {
  if (!record || typeof record !== 'object') return record
  if (typeof tier !== 'number' || tier <= maxTier) return record
  const out = { ...record, locked: true, tier }
  for (const field of MASKED_FIELDS) {
    if (out[field] !== undefined && out[field] !== null && out[field] !== '') {
      delete out[field]
    }
  }
  return out
}
