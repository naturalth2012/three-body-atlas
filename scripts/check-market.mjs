// Compare the live market entry against this repo's copy.
//
// The market is edited by maintainer automation that runs over many entries at
// once, so the published description can drift from what we wrote — including
// by re-adding claims that our code has since made false. Nothing in the local
// test suite can see that, because it only reads local files. This script
// fetches the published entry and reports every difference.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const UP = 'awesome-dsh-plugin/awesome-dsh-plugin'
const FILE = 'data/plugins/naturalth2012__three-body-atlas.yml'

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
const local = fs.readFileSync('D:/DeepseekAPP/three-body-atlas/market-entry.yml', 'utf8')
  .replace(/\r\n/g, '\n').trim()

let remote
try {
  const b = JSON.parse(gh(['api', `repos/${UP}/contents/${FILE}`])).content
  remote = Buffer.from(b, 'base64').toString('utf8').replace(/\r\n/g, '\n').trim()
} catch (e) {
  console.log('  无法读取市场条目：' + String(e.stderr || e.message).split('\n')[0])
  process.exit(2)
}

const field = (text, key) => (text.match(new RegExp(`^  ${key}: '(.*)'$`, 'm')) || [])[1] || ''

let bad = 0
const check = (ok, msg) => { if (!ok) { bad++; console.log('  ✗ ' + msg) } else console.log('  ✓ ' + msg) }

console.log('=== 市场条目 vs 本仓库 ===')
check(local === remote, '发布的条目与 market-entry.yml 逐字一致')

if (local !== remote) {
  for (const key of ['en', 'zh']) {
    const a = field(local, key)
    const b = field(remote, key)
    if (a === b) { console.log(`    ${key}: 相同`); continue }
    console.log(`    ${key}: 不同（本地 ${a.length} 字符 / 市场 ${b.length} 字符）`)
    // Show what the market added or dropped.
    const extra = b.slice(a.length).trim()
    const missing = a.slice(b.length).trim()
    if (b.startsWith(a) && extra) console.log(`      市场多出：${extra.slice(0, 160)}`)
    else if (a.startsWith(b) && missing) console.log(`      市场缺少：${missing.slice(0, 160)}`)
    else console.log('      两边结构不同，需人工比对')
  }
}

console.log('')
console.log('=== 已发布描述是否与代码一致 ===')
const ren = field(remote, 'en')
const rzh = field(remote, 'zh')
check(!/no DSH access check/.test(ren), '英文描述不声称「没有访问检查」')
check(!/没有 DSH 的访问检查/.test(rzh), '中文描述不声称「没有访问检查」')
check(/reject cross-site/.test(ren), '英文描述写明拒绝跨站')
check(/拒绝跨站/.test(rzh), '中文描述写明拒绝跨站')
// Self-contradiction is the specific failure mode here.
const contradicts = /reject cross-site/.test(ren) && /no DSH access check/.test(ren)
check(!contradicts, '英文描述不自相矛盾')
check(/11 agent tools/.test(ren), '英文描述写 11 个工具')

console.log('')
console.log(bad === 0 ? '  ✓ 市场条目与仓库、代码一致' : `  ✗ ${bad} 项需要修正`)
process.exit(bad === 0 ? 0 : 1)
