# 发布指南（GitHub → npm → DSH 市场）

本仓库已按可发布状态准备好，只差两步需要你的账号。下面每一步都可以独立完成。

---

## 当前状态

| 项目 | 状态 |
|---|---|
| 代码与数据 | ✅ 完成，`node scripts/selfcheck.mjs` 434 项通过 |
| 包规范 | ✅ 包名、license、author、keywords、engines、repository、publishConfig 就位 |
| `private` 字段 | ✅ 无（否则 npm 会拒绝发布） |
| LICENSE | ✅ MIT + 著作权与来源说明 |
| `.gitignore` | ✅ 已就位 |
| npm 打包预检 | ✅ 24 个文件 / 183 KB，解包后自检仍全过 |
| GitHub 仓库 | ✅ 已推送 https://github.com/naturalth2012/three-body-atlas |
| npm 登录 | ⬜ **需要你执行**（当前 `npm whoami` 报 ENEEDAUTH） |
| npm 发布 | ⬜ 待你执行 |
| 市场收录 | ⬜ 待你提交 |

---

## 一、发布到 npm

市场的条目读取 npm 上的包，所以这一步是进市场的前提。

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
  node scripts/selfcheck.mjs    # 434 项
  npm pack --dry-run            # 确认只含预期的 24 个文件
  ```

- 如果你的 npm 账号名不是 `naturalth2012`，需要同步改 `package.json` 的
  `name`、`author`、`repository`、`bug` 与两处 GitHub 链接。

---

## 二、提交到 DSH 市场（Discover）

市场不接收"上传"，而是读一份公开目录索引：

- 索引仓库：<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>
- 网页目录：<https://awesome-dsh-plugin.com>
- 客户端从 npm 包 `dsh-plugin-catalog`（内含 `plugins.json` / `index.json`）或官网读取

`dsh-plugin-catalog` 的 README 写明 **"Published automatically; do not open pull requests here"**，
所以**不要**给 catalog 开 PR；正确做法是到 `awesome-dsh-plugin/awesome-dsh-plugin`
主仓库按其贡献说明提交条目（通常是一个 YAML/JSON 条目或 issue 表单）。

建议填写的字段：

| 字段 | 值 |
|---|---|
| `name` | `three-body-atlas` |
| `owner` | `naturalth2012` |
| `url` | `https://github.com/naturalth2012/three-body-atlas` |
| `npm` | `@naturalth2012/three-body-atlas` |
| `category` | `fun`（娱乐）或 `docs`（知识库；本插件偏前者偏重模拟） |
| `install` | `dsh plugin --profile web add @naturalth2012/three-body-atlas` |
| `icon` | `https://raw.githubusercontent.com/naturalth2012/three-body-atlas/main/icon.svg` |
| `capabilities` | 只需 `network`（注册同源路由，不发起外部请求；审核若认为是误报可去掉） |

**英文简介**：

> The Three-Body trilogy as an explorable atlas: 56 characters with 247 curated
> relations, 52 events across 10 eras, 24 technologies, the in-novel game, and 8
> multi-angle themes. Ships a real three-body gravity simulation with adaptive
> sub-stepping, catastrophe detection (three-sun alignment, tidal disruption,
> ejection), a derived 恒纪元/乱纪元 calendar, civilization-generation
> accounting, phase portraits and an energy-conservation diagnostic. One sidebar
> panel and eight agent tools share the same dataset.

**中文简介**：

> 把《三体》三部曲整理成可探索的图鉴：56 位人物与 247 条关系、10 个纪元的 52 个事件、
> 24 件技术、原著里的三体游戏关卡、8 个多角度议题。并内置一个真正会跑的三体引力模拟：
> 自适应子步积分、三日凌空/潮汐撕裂/飞散等灾变判定、由辐射通量推出的恒纪元/乱纪元历法、
> 文明代数推演、相位图与能量守恒诊断。侧边栏面板与 8 个对话工具共用同一套数据。

---

## 三、审核可能关注的点（请如实知悉）

1. **数据未经在线核对**。构建环境联网检索不可用，数据基于广为人知的作品常识人工整理。
   每条记录都标注了来源层级（原著 / 腾讯剧集 / Netflix 改编 / 动画改编），但**没有逐条比对原书**。
   若审核要求事实准确性背书，需如实说明，后续可逐条校订。
2. **版权**。代码为 MIT。数据是原创编写的整理性说明，不复制原作段落；但三体宇宙的角色名、
   术语与台词版权归刘慈欣及权利方所有。`LICENSE` 已写明这是非官方、非商业的参考项目。
   市场若对 IP 敏感，`data/lore.js` 的 `QUOTES`（30 句台词）是最可能被要求处理的部分——
   其中 6 句已在 `context` 里标注为「大意/概括」而非逐字引用。
3. **`capabilities`**。本插件不发外部网络请求，也不读写工作区文件；只注册同源 HTTP 路由与 8 个工具。
   填 `network` 是保守起见。
4. **`engines.dsh`**。声明为 `>=0.2.2-rc.1`，与当前安装版本对齐。若目标市场版本区间不同需要调整，
   否则会被版本门槛拦住。

---

## 四、本地重新安装（改过包名或版本后）

改动 `package.json` 的包名/版本后，已安装的实例不会自动更新。本地验证请：

```bash
# 通过 plugin_manager 执行，或让 Agent 代为执行：
#   action: remove_bundle  target: @naturalth2012/three-body-atlas
#   action: install_bundle target: D:/DeepseekAPP/three-body-atlas
```

注意：**HMR 不会替换已安装的模块版本**。改完插件代码必须 remove + install 才会加载新代码。
