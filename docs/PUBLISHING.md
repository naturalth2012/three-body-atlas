# 发布指南（GitHub → npm → DSH 市场）

本仓库已按可发布状态准备好，只差两步需要你的账号。下面每一步都可以独立完成。

---

## 当前状态

| 项目 | 状态 |
|---|---|
| 代码与数据 | ✅ 完成，`node scripts/selfcheck.mjs` 598 项通过 |
| 包规范 | ✅ 包名、license、author、keywords、engines、repository、publishConfig 就位 |
| `private` 字段 | ✅ 无（否则 npm 会拒绝发布） |
| LICENSE | ✅ MIT + 著作权与来源说明 |
| `.gitignore` | ✅ 已就位 |
| npm 打包预检 | ✅ 37 个文件 / 286.1 kB，解包后自检仍全过 |
| GitHub 仓库 | ✅ 已推送 https://github.com/naturalth2012/three-body-atlas |
| 市场投稿文件 | ✅ [`data/plugins/naturalth2012__three-body-atlas.yml`](../data/plugins/naturalth2012__three-body-atlas.yml) 已就绪 |
| npm 登录 | ⬜ 可选，见下 |
| npm 发布 | ⬜ 可选，见下 |
| 市场收录 | ⬜ 需要你向索引仓库提 PR |

---

## 一、发布到 npm（可选，不影响市场收录）

**npm 不是进市场的前提。** 目录里有大量纯 GitHub 发行的条目；收录只看索引仓库的 PR 与
`dsh.bundle` 探测。发布 npm 的唯一收益是详情页显示 npm 下载量。想发布再读这一节：

**你的 npm 当前未登录，且 registry 指向国内镜像**（`registry.npmmirror.com`）。发布必须走官方源：

```bash
cd D:/DeepseekAPP/three-body-atlas

npm login --registry=https://registry.npmjs.org
npm publish --registry=https://registry.npmjs.org
```

说明：

- 包名是 scoped 的 `@naturalth2012/three-body-atlas`，但 `package.json` 里已经写了
  `publishConfig: { access: public, registry: https://registry.npmjs.org }`，
  所以 `--access public` 与 `--registry` 都已自动生效，命令可以更短：
  `npm publish`。显式加上仍然更稳妥。
- **scoped 包默认私有**，不加 public 会发布失败或市场读不到。
- **版本号不能重复**。重新发布前先升版本：

  ```bash
  npm version patch -m "release: %s"   # 1.0.0 → 1.0.1
  git push && git push --tags
  npm publish
  ```

- 发布前可再自查一次：

  ```bash
  node scripts/selfcheck.mjs    # 598 项
  npm pack --dry-run            # 确认只含预期的 37 个文件
  ```

- 如果你的 npm 账号名不是 `naturalth2012`，需要同步改 `package.json` 的
  `name`、`author`、`repository`、`bug` 与两处 GitHub 链接。

---

## 二、提交到 DSH 市场（Discover）

索引仓库：<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>；
网页目录：<https://awesome-dsh-plugin.com>。**不要**给 `dsh-plugin-catalog` 开 PR——它是自动生成的。

按现行贡献规范，投稿就是**一个文件**：`data/plugins/naturalth2012__three-body-atlas.yml`。
本仓库已准备好可直接复制的内容：[`market-entry.yml`](../market-entry.yml)。
注意新版规范**不接受** `npm:` / `capabilities:` / `install:` 字段（手写 `npm:` 会被校验拒绝），
图标必须是 GitHub 托管的**位图**：本仓库已生成 `assets/icon-180.png`（180×180 有效 PNG）。

提交步骤：

1. 为仓库添加 topic `dsh-plugin`（CI 会检查）：

   ```bash
   gh repo edit naturalth2012/three-body-atlas --add-topic dsh-plugin
   ```

2. Fork 索引仓库，把 [`data/plugins/naturalth2012__three-body-atlas.yml`](../data/plugins/naturalth2012__three-body-atlas.yml)
   原样放进你的 fork 的**同一路径**（内容与根目录 [`market-entry.yml`](../market-entry.yml) 一致），开 PR。
   两个 README 由脚本生成，**不要手工编辑**。
3. 本地可预览（可选）：`npm ci && node scripts/generate-readme.mjs`。
4. 一个 PR 最多 3 条；本插件只加 1 条。CI 会检查 `dsh.bundle` manifest（本仓库已声明）、
   仓库满 1 天（已满足）、YAML 格式与站点构建。

`market-entry.yml` 中的字段：

| 字段 | 值 |
|---|---|
| `url` | `https://github.com/naturalth2012/three-body-atlas` |
| `name` | `naturalth2012/three-body-atlas` |
| `category` | `fun` |
| `description.en` | 见文件（一行、句号结尾、无 `: ` 冒号空间） |
| `description.zh` | 见文件（可选，但已写好） |
| `icon` | `https://raw.githubusercontent.com/naturalth2012/three-body-atlas/main/assets/icon-180.png` |

npm 包是**可选**的：不影响收录；发布后映射自动从 registry 采集，条目里无需任何字段。
但已发布包的 `repository` 必须指回这个仓库（本仓库 `package.json` 已正确设置）。

---

## 三、审核可能关注的点（请如实知悉）

1. **数据未经在线核对**。构建环境联网检索不可用，数据基于广为人知的作品常识人工整理。
   每条记录都标注了来源层级，但**没有逐条比对原书**。若审核问及事实准确性，请如实说明。
   详见 [`docs/PROVENANCE.md`](PROVENANCE.md)。
2. **版权**。代码为 MIT。数据是原创整理的摘要，不复制原作段落；角色名、术语与台词版权归刘慈欣及权利方。
   `LICENSE` 已写明非官方、非商业性质。`docs/PROVENANCE.md` 说明 30 句短台词的逐字性：
   24 条标 `verbatim: true`，6 条明确标 `verbatim: false`（大意转述）。
   若权利方敏感，可把 `QUOTES` 置空——引擎、路由、工具与面板都不依赖台词数量。
3. **依赖**。本插件没有 `@deepseek-ai/*` 依赖，无需 `peerDependencies`。
4. **`engines.dsh`**。声明 `>=0.2.2-rc.1`，与当前安装版本对齐；若目标市场版本区间不同需调整。

---

## 四、本地重新安装（改过包名或版本后）

改动 `package.json` 的包名/版本后，已安装的实例不会自动更新。本地验证请：

```bash
# 通过 plugin_manager 执行，或让 Agent 代为执行：
#   action: remove_bundle  target: @naturalth2012/three-body-atlas
#   action: install_bundle target: D:/DeepseekAPP/three-body-atlas
```

注意：**HMR 不会替换已安装的模块版本**。改完插件代码必须 remove + install 才会加载新代码。
