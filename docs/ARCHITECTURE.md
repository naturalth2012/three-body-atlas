# 三体宇宙 · 架构与执行细节（维护者参考）

本文件记录插件的分层结构、实测性能与已知边界。所有数字均为**脚本实测**，不是估算；
测量方法见文末「如何复现」。改代码后若数字变化，请重跑并更新本文件。

## 一、分层结构

```
L0  数据层      data/{characters,works,timeline,lore,plot,spoiler}.js   无任何依赖
                data/index.js  →  汇总 8 张索引表（*_BY_ID）
      ↓
L1  物理内核    sim.js      零依赖、零网络、纯函数
      ↓
L2  领域逻辑    engine.js   → data/index.js + sim.js
      ↓
L3  适配层      index.js    → engine.js        Host：11 个 Agent 工具 + 25 条 HTTP 路由
                client.js   → 无本地依赖        Client：经 HTTP 与 Host 解耦
```

实测依赖图（脚本解析 `import ... from` 得出，非目测）：

| 文件 | 依赖 |
|---|---|
| `data/characters.js` `data/works.js` `data/timeline.js` `data/plot.js` `data/lore.js` `data/spoiler.js` | 无 |
| `data/index.js` | `./characters.js` `./works.js` `./timeline.js` `./lore.js` |
| `sim.js` | 无 |
| `engine.js` | `./data/index.js` `./sim.js` |
| `index.js` | `./engine.js` |
| `client.js` | **无本地依赖** |

分层严格单向，无循环依赖。

### 关键决策：Client 不 import engine

`client.js` 通过 HTTP 路由访问数据，不直接引入 `engine.js`。三个后果：

1. Client 打包体积不含任何领域逻辑（否则 1167 行 lore 与 56 人物定义会被塞进浏览器包）；
2. 数据源只有一份，面板与 Agent 工具读同一份数据——**不可能出现「面板显示 A、工具回答 B」**；
3. 代价：首屏必须等一次 `bundle` 请求（见第三节）。

## 二、文件规模

行数一列是**非空行**（数据文件一直是这个口径）。这些数字由 `selfcheck` 的
「文档数字与实测一致」一节自动比对，改代码后忘了同步会直接失败。

| 文件 | 非空行 | 体积 |
|---|---:|---:|
| `client.js` | 3136 | 176.7 KB |
| `sim.js` | 1780 | 83.7 KB |
| `data/characters.js` | 1326 | 83.9 KB |
| `engine.js` | 1169 | 50.1 KB |
| `data/lore.js` | 1167 | 67.6 KB |
| `scripts/selfcheck.mjs` | 1428 | 86.3 KB |
| `index.js` | 1062 | 48.3 KB |
| `data/plot.js` | 749 | 50.8 KB |
| `data/timeline.js` | 601 | 30.5 KB |
| `scripts/probe.mjs` | 295 | 15.5 KB |
| `data/spoiler.js` | 116 | 4.0 KB |

## 三、实测性能

关键操作延迟（各预热 3 次后取 20 次均值，Node 本机）：

| 操作 | 延迟 |
|---|---:|
| `bundle()`（全量 17 类数据） | 0.18 ms |
| `searchAll('水滴')` | 0.03 ms |
| `characterDetail('luo-ji')` | 0.02 ms |
| `characterJourney('罗辑')` | 0.05 ms |
| `conceptGraph({id:'dark-forest', depth:2})` | 0.01 ms |
| `buildGraph()` | 0.21 ms |
| `ask('水滴是什么')` | 0.37 ms |
| `simulate({preset:'trisolaris'})` | 22.3 ms |
| `stabilityScan({samples:60})` | **211–285 ms** |
| `stabilityScan({samples:240})`（路由允许的上限） | **815 ms** |
| `civilizationCensus({limit:12, steps:16000})`（一批） | **180–210 ms** |
| `civilizationCensus({samples:30})`（客户端 3 批合计） | **约 750 ms** |

除 `stabilityScan` 与单批普查外全部亚毫秒。`simulate` 一次跑 521 帧、产出 2 次灾变、2 代文明。

### 唯一的重操作：`stabilityScan`

**同步**计算，无 worker、无分片。耗时随 `samples` 线性增长（实测 8 → 46 ms、
60 → 211 ms、120 → 415 ms、240 → 815 ms）。路由接受 `samples` 到 240，所以最坏情况
不是 285 ms 而是约 0.8 秒——这段时间整个 GUI 事件循环被占住，并发请求会排队。
实测：`POST /stability {"samples":240}` 期间发 `GET /bundle`，后者被阻塞 0.766 秒
（空闲基线 0.0025 秒）。

`civilizationCensus` 是第二个重操作，所以它**按批设计**：一次只积分 12 个样本
（约 0.2 秒），客户端连续调用直到 `done`。这不是为了好看——早期版本让最后一次调用
重算整个 sweep，末批实测 1462 ms，是普通批的 7 倍并造成明显卡顿；现在由客户端把已
收到的行回传，末批降到 207 ms。

当前只由 `/stability` 一个显式路由触发（非首屏、非自动轮询），所以日常使用无感；
但这是**唯一的同步阻塞点**，改动此路由时需留意。

### `ask()` 是规则引擎，不是模型调用

`engine.js` 与 `sim.js` 全文**无 `fetch`、无网络调用、无 `await`**（实测 grep 确认）。
`ask()` 是一个正则分派器，按「关系 / 人物 / 术语 / 纪元 / 技术 / 剧情 / 改编差异」等
规则命中后拼装答案。

- 优点：零成本、离线、确定性输出、不受模型可用性影响；
- 限制：**只能答已编码进规则的问法**，不是自然语言理解。问法超出规则时走兜底提示。

这是能力边界，也是对外描述时必须诚实的一点。

## 四、载荷与传输

| 项 | 体积 |
|---|---:|
| `bundle` 未压缩 | 158.9 KB |
| `bundle` gzip | **57.4 KB** |
| `/graph` gzip | 11.5 KB |
| `/plot` gzip | 8.7 KB |
| `/timeline` gzip | 11.7 KB |

`bundle` 构成（未压缩）：`characters` 27.0 KB、`events` 24.6 KB、`plot` 20.1 KB、
`themes` 12.6 KB、`guides` 11.9 KB、`quotes` 8.9 KB、`glossary` 7.1 KB，其余各项均 < 6 KB。

`bundle` 是**一次性加载**（`client.js` 中单个 `getJSON(BUNDLE_PATH)`），17 类数据全部进内存。
gzip 后 57 KB 对本地同源请求可忽略。

**规模判断**：当前 56 人物规模下，一次性加载完全合理；若数据增长到 200+ 人物，
`bundle` 会到 ~200 KB（gzip ~120 KB），届时才需要按标签懒加载。
**当前做懒加载是过度设计。**

## 五、路由与工具的构成

```
Agent 工具    11 个   three_body_{search,detail,relation,timeline,simulate,census,
                                   theme,game,ask,journey,concept}
GET 路由      19 条   bundle/search/all/detail/place/tech/glossary/journey/guide/
                      concept/graph/neighbors/path/timeline/plot/themes/diff/game/path
POST 路由      6 条   simulate/sensitivity/stability/census/darkforest/deterrence
──────────────────────────────────────────────────────────────
HTTP 路由合计  25 条   与 25 个 *_PATH 常量一一对应
```

### 为什么代码里 `register` 出现了 32 次

`index.js` 有**两个独立作用域**，各自定义了同名的本地助手函数：

| 作用域 | 助手 | 调用次数 | 实际注册 |
|---|---|---:|---|
| `ctx.inject(['tools'])` | `register(def, label)` | 11 | 11 个 Agent 工具 |
| `ctx.inject(['webServer'])` | `register(path, …)` | 19 | 19 条 GET 路由 |
| 同上 | `registerAction(path, …)` | 6 | 6 条 POST 路由 |

`grep -c 'register('` 得到 32，其中 2 次是**助手自身的定义体**
（`webServer.register({ kind: 'exact', … })`），不计入路由数。
所以：**10 工具 + 24 路由 = 34 个注册点**，与 24 个 `*_PATH` 常量完全对应，
无重复注册、无遗漏路径（实测确认）。

## 六、数据完整性（实测）

三项校验全部通过：

1. **悬空引用 = 0**：56 个角色的 `relations[].to`、52 个事件的 `characters[]`、
   19 个地点的 `characters[]`，全部能解析到真实 id；
2. **术语分级覆盖 = 37/37**：`GLOSSARY_TIER` 无遗漏；
3. **分级单调性 = 0 违规**：56 角色 × 4 档（cap 0→3）全组合，
   可见内容数（appearances + places + artifacts + 未锁定 relations）**从不减少**。

第 3 项是遮蔽系统最容易写错的地方——提高剧透层级绝不能让内容消失。当前实现严格单调。

## 六之二、双语政策（实测边界）

界面的中英双语是完整的：`client.js` 内联 `ZH` / `EN` 两份词表，键数一致，
`t()` 用到的键无一缺失。**模拟叙事也是双语的**，但图鉴正文不是。这条边界是
`docs/I18N-DECISION.md` 记录过的决定（A 档「英文可用」，不是「英文完整」），
实施细节见 `docs/PLAN-EN.md`。

分三层看：

| 层 | 状态 | 说明 |
|---|---|---|
| 界面文案 | 双语完整 | `ZH`/`EN` 各 256 键，缺键为 0 |
| 模拟叙事 | 双语完整 | `simulate` / `sensitivity` / `stabilityScan` / `civilizationCensus` / `darkForest` / `deterrence` 全部随 `lang` 生成；`lang:'en'` 输出经断言确认无 CJK |
| 图鉴正文 | 仅中文 | 人物、情节、设定的**描述**未译；**名称**全有英文（角色 56/56、地点 19/19、技术 24/24、术语 37/37） |
| 原著引文 | 不译 | 30 条引文里 25 条 `verbatim: true` 是原文直引，翻译会变成伪造原文 |

关键实现约束，改代码时不能忘：

1. **判定必须用稳定 id，不能用文案。** `severity` / `kind` / `tone` /
   `verdictKey` 是稳定标识，`severityLabel` / `kindLabel` 才是给人看的标签。
   CSS 选择器与 `angle.tone === 'good'` 之类都挂在 id 上——曾经有三条
   `[data-severity='毁灭']` 规则，一翻译就静默失效。
2. **渲染在路由层选语言，不在客户端拼。** 客户端 `getJSON` 统一注入
   `lang`，服务端 `langOf(body)` 归一化为 `'zh'` / `'en'`（非法值回退中文，
   不抛错），再传给各函数。
3. **物理与语言无关。** 同一组初值下 `lang:'zh'` 与 `lang:'en'` 的
   `metrics`、`frames`、`eras` 逐位相同，已由自检断言。

### 语言从哪里来

面板**没有自己的语言开关**，它跟随 DSH 的界面语言：设置 → 通用 → 语言。
读取方式是 `locale.getSnapshot().active`（也兼容 `getLocale()` 与裸
`{ active }` 对象）。

这里有个坑值得记下来：`locale` 服务**没有** `language()` / `current()` /
`getLanguage()` 这三个方法。早期版本按这三个方法探测，全部落空后回退到
`navigator.language`——于是在中文浏览器上，即便把 DSH 切成英文，面板依然显示
中文。自检现在会实测 `active='zh'|'en'|'ja'` 三种取值下的判定结果，防止这种
「探测了不存在的方法、静默落到浏览器」的写法再次出现。

判定只认精确的 `en*`。服务自身的兜底语言是英文，但那是**词典兜底**而不是
语言偏好——把它当作偏好会让日语用户看到英文面板。

## 七、已知边界与风险

### 路由的访问检查

`webServer.register` 把原始 `IncomingMessage` 直接交给 handler，**不检查 cookie、Host 或 Origin**
（其 `readResource` 注释原文："This method checks no cookie, Host, or Origin"）。
`dsh web` 的 401 准入检查在 SPA fallback 里，而**命名路由的匹配优先于 fallback**，
所以本插件的 25 条路由绕过了那道准入。

现在分两层，缺一不可：

**第一层：`isCrossSiteRequest`——判断调用方是否"自称跨站"**

1. **明确标识为跨站的**：`sec-fetch-site` 为 `cross-site`/`same-site`、`Origin` 是异源或 `null`；
2. **`Host` 是普通域名的**——这一条才是关键。只比较 `Origin` 与 `Host` 是不够的：
   DNS rebinding 让攻击者页面以 `evil.example` 访问到 127.0.0.1 时，两个头**都**是
   `evil.example`，同源比较会放行。而 `webServer` 只接受 IP 字面量且拒绝通配绑定，
   所以合法请求的 `Host` 必然是回环名或 IP 字面量。

判定只接受标准 IP 字面量：`0x7f000001`、`2130706433`、`0177.0.0.1` 这类非标准写法
虽指向本机，仍会被拒——**宁可误拒，不放行无法确认来源的请求**。

**第二层：`rejectUnauthenticated`——要求一个活的、已认证的 Peer**

第一层只看调用方的"自称"，对**完全不带浏览器头部的本地进程毫无作用**。实测（改动前）：

| 请求 | 结果 |
|---|---|
| 带 `Origin: https://evil.example` | 403 |
| 带 `Sec-Fetch-Site: cross-site` | 403 |
| **不带任何浏览器头部** | **200，返回全量数据** |

也就是说，任何本地程序、任何 `curl` 都能读到全部数据。第二层补的正是这一点：
`ctx.connection.requestRejection(req)` 返回 `undefined` 才放行，否则按其给出的
401/403 拒绝。它内部做两件事——Host/Origin 信任判断，**以及**浏览器签名 cookie
或 API 凭据的认证。这与 DSH 自己的路由是同一个要求（实测 DSH 的 `GET /` 与
`POST /api` 无 cookie 均返回 401）。

面板不受影响：认证 cookie 的属性是 `Path=/ ; HttpOnly ; SameSite=Strict`，
覆盖整个源，而面板与路由同源，`fetch` 自动携带。`client.js` 里显式写了
`credentials: 'same-origin'`，因为改成 `omit` 会让每个请求都 401，而失败表现是
**空面板**而不是错误——那种 bug 很难追回到这一行。

`connection` 服务缺失时（非常规组合）退回第一层，而不是拒绝所有请求；
`requestRejection` 抛异常时同样不影响路由。

覆盖范围：25 条路由全部经过两层检查，POST 在读取 body **之前**就拒绝
（否则未认证调用方仍能让 Host 缓冲一个 payload）。

复现：`node scripts/probe-bypass.mjs`（24 项跨站对抗用例）、
`node scripts/verify-auth.mjs`（对运行中的 Host 验证 401/403）、
`node scripts/verify-routes.mjs`（25 条路由的计算，不需要端口或凭据）。

### 架构层面

| 项 | 现状 | 判断 |
|---|---|---|
| `client.js` 2904 行单体 | 40 个组件、70 个 `useState`、14 个 `useEffect`、2 个 `useReducer` | 投递方式决定的（无构建步骤，必须单文件）。状态分散是真实技术债，但改造成本高于收益 |
| 无缓存层 | 仅 `engine.js` 一个 `adjacency` Map | 当前 0.18/0.21 ms 完全不需要缓存，**这是正确的克制**；数据增长 5 倍后才值得加 |
| `stabilityScan` 同步阻塞 | 211–285 ms | 唯一重操作，仅显式路由触发 |
| `civilizationCensus` 单次积分时长受物理约束 | 默认只跑 8.32 个时间单位（<0.3 个轨道周期） | **不是缺陷**：行星在 T≈28.6 被抛出，拉长积分不会增加文明代数（实测 T=19 时峰值 4 代，之后降到 1）。要呈现原著尺度只能靠普查的分布，而不是延长单次运行 |

### 普查的口径（重要）

`civilizationCensus` 报告的是**随机初始条件下的分布**，不是某一颗行星的真实历史。两条必须守住的口径：

1. **每样本都是真实积分**——没有脚本演出、没有伪造轨道。这一点由 `verdict` 文字明确声明，并由自检断言（`普查结论说明每样本都是真实积分`）守住。
2. **不与 `stabilityScan` 逐样本对比**——普查用派生种子 `seed ^ imul(i, 2654435761)` 让任意 offset 可独立计算（分批的前提），因此它抽的是与 `stabilityScan` **不同**的一组初始条件。两者统计口径不同，不能横向对齐。

另外，`outcome` 与 `planetEscaped` 是**两个不同问题**：前者说系统层面有没有天体飞散，后者说行星本身还在不在。行星可能被抛出、被恒星吞并，或某颗恒星被抛出而行星仍在——早期版本把两者混成一个标志，导致「eject」数量与「行星逃逸」数量对不上，现已拆开。

### 不可验证项（如实标注）

以下三项**无法通过任何脚本验证**，只能靠人工在浏览器里看：

1. 视觉渲染与布局；
2. 暗色主题下的对比度；
3. 窄屏（手机宽度）下的排版。

若报告这三类问题，需在真实浏览器中复现，不能凭数据推断。

### 其他

- **数据未经逐条比对原书**，详见 [`PROVENANCE.md`](PROVENANCE.md)；
- **`ask()` 的规则覆盖面**决定了它能答什么问题，超出即兜底。

## 八、如何复现本文数字

```bash
cd three-body-atlas

# 数据完整性与渲染（可直接跑）
node scripts/selfcheck.mjs    # 837 项断言，含引用完整性、分级单调性与路由访问检查
node scripts/probe.mjs        # 108 次渲染，0 错误
node scripts/verify-routes.mjs # 25 条路由的计算，不需要端口或凭据
node scripts/probe-bypass.mjs # 24 项跨站对抗用例

# 需要运行中的 Host：验证未认证请求确实被拒
node scripts/verify-auth.mjs

# 需要联网：核对市场里发布的条目是否仍与仓库一致
node scripts/check-market.mjs
```

### 为什么要有 `check-market.mjs`

市场条目不是我们单方面写的。维护者会跑批量自动化，一次改几十个条目——
2026-11-23 的 `9190e56` 一次动了 28 个。

本地测试看不见这种漂移，因为它只读本地文件。这个脚本把发布的条目拉下来逐字
比对，并把「自相矛盾」当作独立的一类失败单独报告——那种错误 YAML 校验、
lint、打包检查全都发现不了，只有人去读才会发现。

### 关于「路由没有访问检查」那句话

维护者在合并 #17807 后把这句话写回描述，条件是「加上 `requestRejection`
再开 PR 删掉」。当时我判断这句话是自动化误伤——**那个判断是错的**。

实测证明维护者是对的：改动前，不带任何浏览器头部的请求能从 `/bundle`、
`/simulate`、`/census` 拿到 200 和全量数据。跨站防护只挡住"自称跨站"的调用方，
对本地进程毫无作用。加上 `requestRejection` 之后，同一请求返回 401，
与 DSH 自己的路由一致。这件事的教训写在 `docs/PLAN-AUTH.md`：**描述与代码
哪个对，要先测，不要先信自己的实现**。

**性能数字的测法**：目标函数预热 3 次，再取 20 次 `performance.now()` 均值。
示例：

```js
const bench = (fn) => {
  for (let i = 0; i < 3; i++) fn()
  const t0 = performance.now()
  for (let i = 0; i < 20; i++) fn()
  return (performance.now() - t0) / 20
}
```

**载荷体积的测法**：对运行中的 GUI 实测，不要用本地文件大小估算：

```bash
curl -s -o NUL -w "%{size_download}" \
  -H "Accept-Encoding: gzip" \
  http://127.0.0.1:6460/plugins/three-body-atlas/bundle
```

**依赖图的测法**：正则扫描各文件的 `import … from` 语句（注意多行 import 会被
逐行 grep 截断，必须用跨行匹配）。
