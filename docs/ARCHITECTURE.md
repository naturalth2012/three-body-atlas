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
L3  适配层      index.js    → engine.js        Host：10 个 Agent 工具 + 24 条 HTTP 路由
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

| 文件 | 行数 | 体积 |
|---|---:|---:|
| `client.js` | 2904 | 164.1 KB |
| `data/characters.js` | 1326 | 83.9 KB |
| `engine.js` | 1169 | 50.0 KB |
| `data/lore.js` | 1167 | 67.6 KB |
| `sim.js` | 1136 | 51.6 KB |
| `scripts/selfcheck.mjs` | 845 | 51.9 KB |
| `data/plot.js` | 749 | 50.8 KB |
| `index.js` | 696 | 32.5 KB |
| `data/timeline.js` | 601 | 30.5 KB |
| `scripts/probe.mjs` | 204 | 10.7 KB |
| `data/spoiler.js` | 116 | 4.0 KB |
| `data/works.js` | 106 | 4.1 KB |
| `data/index.js` | 34 | 1.6 KB |

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

除 `stabilityScan` 外全部亚毫秒。`simulate` 一次跑 521 帧、产出 2 次灾变、2 代文明。

### `ask()` 是规则引擎，不是模型调用

`engine.js` 与 `sim.js` 全文**无 `fetch`、无网络调用、无 `await`**（实测 grep 确认）。
`ask()` 是一个正则分派器，按「关系 / 人物 / 术语 / 纪元 / 技术 / 剧情 / 改编差异」等
规则命中后拼装答案。

- 优点：零成本、离线、确定性输出、不受模型可用性影响；
- 限制：**只能答已编码进规则的问法**，不是自然语言理解。问法超出规则时走兜底提示。

这是能力边界，也是对外描述时必须诚实的一点。

### 唯一的重操作：`stabilityScan`

211–285 ms **同步**计算，无 worker、无分片。若宿主在同一线程处理 POST，这次调用会
阻塞整个 GUI 约 0.2 秒。当前只由 `/stability` 一个显式路由触发（非首屏、非自动轮询），
所以实际影响可控；但这是**唯一的同步阻塞点**，改动此路由时需留意。

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
Agent 工具    10 个   three_body_{search,detail,relation,timeline,simulate,
                                   theme,game,ask,journey,concept}
GET 路由      19 条   bundle/search/all/detail/place/tech/glossary/journey/guide/
                      concept/graph/neighbors/path/timeline/plot/themes/diff/game/path
POST 路由      5 条   simulate/sensitivity/stability/darkforest/deterrence
──────────────────────────────────────────────────────────────
HTTP 路由合计  24 条   与 24 个 *_PATH 常量一一对应
```

### 为什么代码里 `register` 出现了 32 次

`index.js` 有**两个独立作用域**，各自定义了同名的本地助手函数：

| 作用域 | 助手 | 调用次数 | 实际注册 |
|---|---|---:|---|
| `ctx.inject(['tools'])` | `register(def, label)` | 10 | 10 个 Agent 工具 |
| `ctx.inject(['webServer'])` | `register(path, …)` | 19 | 19 条 GET 路由 |
| 同上 | `registerAction(path, …)` | 5 | 5 条 POST 路由 |

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

## 七、已知边界与风险

### 路由的跨站防护

`webServer.register` 把原始 `IncomingMessage` 直接交给 handler，**不检查 cookie、Host 或 Origin**
（其 `readResource` 注释原文："This method checks no cookie, Host, or Origin"）。
`dsh web` 的 401 准入检查在 SPA fallback 里，而**命名路由的匹配优先于 fallback**，
所以本插件的 24 条路由绕过了那道准入——任何浏览器里打开的网页都能调用它们。
插件市场条目曾如实披露这一点。

现在的实现（`index.js` 的 `isCrossSiteRequest`）拒绝两类请求：

1. **明确标识为跨站的**：`sec-fetch-site` 为 `cross-site`/`same-site`、`Origin` 是异源或 `null`；
2. **`Host` 是普通域名的**——这一条才是关键。只比较 `Origin` 与 `Host` 是不够的：
   DNS rebinding 让攻击者页面以 `evil.example` 访问到 127.0.0.1 时，两个头**都**是
   `evil.example`，同源比较会放行。而 `webServer` 只接受 IP 字面量且拒绝通配绑定，
   所以合法请求的 `Host` 必然是回环名或 IP 字面量。

**这不是认证，代码里也没这么声称。** 它放行面板自身的同源调用，也不干扰不发这些头的
非浏览器客户端。判定只接受标准 IP 字面量：`0x7f000001`、`2130706433`、`0177.0.0.1`
这类非标准写法虽指向本机，仍会被拒——**宁可误拒，不放行无法确认来源的请求**。
缺少 `Host` 头的请求放行（HTTP/1.1 必带 `Host`，缺失说明是本机客户端或测试替身，
而 rebinding 请求一定带自己的域名）。

覆盖范围：24 条路由全部经过校验，POST 在读取 body **之前**就拒绝。

复现：`node scripts/probe-bypass.mjs`（24 项对抗用例）、
`node scripts/verify-guard.mjs <port>`（对运行中的 Host 做端到端验证）。

### 架构层面

| 项 | 现状 | 判断 |
|---|---|---|
| `client.js` 2904 行单体 | 40 个组件、70 个 `useState`、14 个 `useEffect`、2 个 `useReducer` | 投递方式决定的（无构建步骤，必须单文件）。状态分散是真实技术债，但改造成本高于收益 |
| 无缓存层 | 仅 `engine.js` 一个 `adjacency` Map | 当前 0.18/0.21 ms 完全不需要缓存，**这是正确的克制**；数据增长 5 倍后才值得加 |
| `stabilityScan` 同步阻塞 | 211–285 ms | 唯一重操作，仅显式路由触发 |

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
node scripts/selfcheck.mjs   # 598 项断言，含引用完整性、分级单调性与跨站防护
node scripts/probe.mjs       # 108 次渲染，0 错误
node scripts/probe-bypass.mjs # 24 项跨站对抗用例
```

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
