/**
 * Three-Body Atlas — dataset entry point.
 *
 * Every module below is plain data; the engine, the Host routes, the agent
 * tools and the browser panel all import from here so there is exactly one
 * source of truth.
 */

export { FACTIONS, RELATION_TYPES, CHARACTERS } from './characters.js'
export { WORKS } from './works.js'
export { ERAS, EVENTS } from './timeline.js'
export { PLOT, GAME_LEVELS, PATHS, DIFFERENCES, THEMES } from './plot.js'
export { PLACES, TECH, GLOSSARY, QUOTES } from './lore.js'
export {
  WORK_TIER, TIER_LABELS, MAX_TIER, GLOSSARY_TIER, MASKED_FIELDS,
  tierOfWork, tierOfWorks, maskRecord,
} from './spoiler.js'

/* ------------------------------------------------------------------ *
 * Lookup tables — built once, shared by every consumer.
 * ------------------------------------------------------------------ */

import { FACTIONS, CHARACTERS } from './characters.js'
import { WORKS } from './works.js'
import { ERAS, EVENTS } from './timeline.js'
import { PLACES, TECH, GLOSSARY } from './lore.js'

const keyed = (list, key) => Object.fromEntries(list.map((item) => [item[key], item]))

export const CHARACTER_BY_ID = keyed(CHARACTERS, 'id')
export const WORK_BY_ID = keyed(WORKS, 'id')
export const FACTION_BY_ID = keyed(FACTIONS, 'id')
export const ERA_BY_ID = keyed(ERAS, 'id')
export const EVENT_BY_ID = keyed(EVENTS, 'id')
export const PLACE_BY_ID = keyed(PLACES, 'id')
export const TECH_BY_ID = keyed(TECH, 'id')
export const GLOSSARY_BY_ID = keyed(GLOSSARY, 'id')

/** Aliases the engine uses; kept separate so the names above stay obvious. */
export { FACTION_BY_ID as FACTIONS_BY_ID }
