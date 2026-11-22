// Prove a packed install works, not just the checkout.
//
// `files` in package.json filters a tarball; a linked directory install bypasses
// it entirely. That difference hid a real defect: `data/plugins` was never
// listed, so `npm pack` + install failed a selfcheck assertion that passes in
// the checkout. This script reproduces what a market user gets.
//
// Run: node scripts/verify-pack.mjs
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tba-pack-'))

// npm ships as a Node CLI; invoking it through Node avoids the Windows
// shell-quoting and .cmd resolution problems entirely.
const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
const runNpm = (args, cwd) => {
  const cli = fs.existsSync(npmCli) ? npmCli : undefined
  if (cli) {
    const result = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' })
    return { code: result.status, out: `${result.stdout || ''}${result.stderr || ''}` }
  }
  // Fall back to a shell only when npm's CLI file is not where Node lives.
  const result = spawnSync('npm', args, { cwd, encoding: 'utf8', shell: true })
  return { code: result.status, out: `${result.stdout || ''}${result.stderr || ''}` }
}

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', shell: false })
  return { code: result.status, out: `${result.stdout || ''}${result.stderr || ''}` }
}

let failures = 0
const check = (label, ok, detail) => {
  if (!ok) failures++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)
}

try {
  console.log(`  临时目录 ${tmp}`)

  const packed = runNpm(['pack', '--pack-destination', tmp], root)
  check('npm pack 成功', packed.code === 0)
  const tarball = fs.readdirSync(tmp).find((name) => name.endsWith('.tgz'))
  check('产出 tarball', Boolean(tarball), tarball || '')

  if (tarball) {
    const installed = runNpm(['install', '--silent', '--no-save', tarball], tmp)
    check('npm install 成功', installed.code === 0)

    const pkgDir = path.join(tmp, 'node_modules', '@naturalth2012', 'three-body-atlas')
    check('安装目录存在', fs.existsSync(pkgDir))

    if (fs.existsSync(pkgDir)) {
      // The runtime files must be present regardless of what the checks say.
      for (const file of ['index.js', 'client.js', 'engine.js', 'sim.js', 'cordis.patch.yml', 'icon.svg']) {
        check(`打包含 ${file}`, fs.existsSync(path.join(pkgDir, file)))
      }

      const selfcheck = run(process.execPath, ['scripts/selfcheck.mjs'], pkgDir)
      const summary = (selfcheck.out.match(/(\d+) 项检查通过，(\d+) 项失败/) || [])[0] || '无摘要'
      check('打包产物自检通过', selfcheck.code === 0 && /0 项失败/.test(selfcheck.out), summary)
      if (selfcheck.code !== 0) {
        for (const line of selfcheck.out.split('\n').filter((l) => l.includes('✗'))) console.log(`        ${line.trim()}`)
      }

      const bypass = run(process.execPath, ['scripts/probe-bypass.mjs'], pkgDir)
      check('打包产物对抗测试通过', bypass.code === 0)
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`  临时目录已清理`)
}

console.log(failures ? `\n  ${failures} 项失败` : '\n  打包产物与仓库一致，可正常安装运行')
process.exit(failures ? 1 : 0)
