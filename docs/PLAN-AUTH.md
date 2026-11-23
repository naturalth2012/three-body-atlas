# 路由认证：把 `requestRejection` 接进来

> 起因：市场维护者 fkysly 在合并 #17807 后留言，把「路由没有 DSH 的访问检查
> （无 `ctx.connection.requestRejection`）」写回描述，并给出条件：**加上那个
> 检查，再开 PR 删掉这句话**。本文评估这件事能否做、怎么做、有什么代价。

## 一、结论

**可以解决，且改动很小**：两个 handler 工厂各加一处检查，注入列表加一项，
约 25 行代码。但**测试脚本必须改**，否则 CI 会全红——这是唯一实质工作量。

## 二、先把事实钉死

维护者是对的，我此前的判断是错的。实测（运行中的 Host，端口 14246）：

| 请求 | DSH 自己的路由 | 我们的路由 |
|---|---|---|
| `GET /` 无 cookie | **401** | — |
| `POST /api` 无 cookie | **401** | — |
| `GET /plugins/three-body-atlas/bundle` 无 cookie | — | **200，返回全量数据** |
| 带 `Origin: https://evil.example` | 403 | 403 |
| 带 `Sec-Fetch-Site: cross-site` | 403 | 403 |
| **完全不带浏览器头部** | 401 | **200** |

差别在于我们的 `isCrossSiteRequest` 只做**信任判断**（Host / Origin /
Sec-Fetch-Site），`requestRejection` 做**信任判断 + 身份认证**：

```
requestRejection(request) => 401 | 403 | undefined
  └─ admit(request)
       ├─ !isTrusted(request)          → 403
       ├─ 浏览器 cookie 已验证          → 放行
       ├─ API 凭据有效                  → 放行
       └─ 否则                          → 401
```

所以「挡得住跨站网页、挡不住本地进程」是准确的描述。任何本地程序、任何
`curl` 都能拿到全部数据。

## 三、为什么面板不会坏

这是最需要先确认的一点，因为一旦把面板自己挡在门外，插件就废了。

认证靠的是 `BrowserAuth` 签发的 cookie：

```
sessionCookie(...) → Path=/ ; HttpOnly ; SameSite=Strict ; Max-Age=...
```

`Path=/` 意味着**整个源**都会带上它，包括 `/plugins/three-body-atlas/*`。
面板与它的路由同源（都从 `http://127.0.0.1:14246` 加载），所以面板的
`fetch` 会自动携带这个 cookie——不需要 JS 读取（`HttpOnly` 也读不到），
不需要改前端任何代码。

验证方式：`GET /` 在已登录的浏览器里返回 200 而不是 401，说明 cookie 存在
且有效；同一浏览器的同源请求会带同一个 cookie。

## 四、实施方案

### 4.1 注入服务

`index.js` 第 871 行：

```diff
- ctx.inject(['webServer'], (webCtx) => {
+ ctx.inject(['webServer', 'connection'], (webCtx) => {
```

`connection` 是 Host 服务。它的类型包（`dsh-client-connection`）在浏览器侧，
所以照 `dsh-host-open-in-app` 的做法，本地声明最小接口：

```js
/** Trust surface used here; the full type lives in the browser-side package. */
function connectionOf(ctx) {
  return Reflect.get(ctx, 'connection')
}
```

### 4.2 统一检查

在 `rejectCrossSite` 旁边加一个函数，两个 handler 工厂共用：

```js
/**
 * Refuse a request that DSH itself would refuse.
 *
 * `isCrossSiteRequest` only decides whether the caller *claims* to be another
 * site. It says nothing about a local process that sends no browser headers at
 * all — that one is admitted, and gets the full dataset. `requestRejection`
 * additionally requires an authenticated live Peer, which is what makes the
 * route's access story true rather than merely cross-site-safe.
 *
 * Returns true when the response has been written.
 */
function rejectUnauthenticated(ctx, req, res) {
  let rejection
  try {
    rejection = connectionOf(ctx).requestRejection(req)
  } catch {
    // No connection service (a Host without it): fall back to the cross-site
    // fence rather than refusing every request.
    return false
  }
  if (rejection === undefined) return false
  json(res, rejection, { error: rejection === 401 ? 'authentication required' : 'cross-site request rejected' })
  return true
}
```

### 4.3 接进两个工厂

`routeHandler` 与 `actionHandler` 都需要拿到 `ctx`。它们当前签名是
`(path, compute)`，改为 `(ctx, path, compute)`，调用点同步改：

```js
function routeHandler(ctx, path, compute) {
  return async (req, res) => {
    if (isCrossSiteRequest(req)) { rejectCrossSite(res); return }
    if (rejectUnauthenticated(ctx, req, res)) return
    ...
```

`register` / `registerAction` 两个闭包本来就在 `webCtx` 作用域里，把 `webCtx`
传进去即可，25 个注册点不用动：

```js
const register = (path, compute, label) =>
  webCtx.effect(() => webCtx.webServer.register({
    kind: 'exact', path, handler: routeHandler(webCtx, path, compute),
  }), label)
```

保留 `isCrossSiteRequest` 在最前面：它给出更明确的 403 文案，且不依赖
`connection` 服务是否存在。

### 4.4 测试脚本

这是**唯一实质工作量**，而且比我最初设想的更麻烦——原因需要先讲清楚。

DSH 的凭据有两种，都拿不到：

- **浏览器 cookie**：`HttpOnly` + 用本进程随机密钥签名，脚本无法伪造。
- **启动令牌**：`processLaunchToken()` 存在 Host 进程内存的 `WeakMap` 里，
  只在 `authenticatedUrl()` 拼进 URL 时出现一次。脚本读不到。

所以「脚本先换 cookie 再请求」这条路**不成立**。可行的做法是分工：

**A. 路由正确性 —— 直连函数（改 `verify-routes.mjs`）**

它现在的目的是「25 条路由都能算出正确结果」。加上认证后，用 HTTP 测就变成
在测认证，而不是在测路由。改为直接 import 导出的 `bundle()`、`simulate()`
等函数：更直接、不依赖端口、不依赖登录状态。

代价：不再覆盖 HTTP 层（方法检查、JSON 头、错误码）。这部分由 B 补。

**B. 认证行为 —— 用真实浏览器（新增 `verify-auth.mjs`）**

本机有 Edge，可以走 CDP：

1. 用 `--remote-debugging-port` 启动 Edge，`--user-data-dir` 用临时目录。
2. 先访问 DSH 的认证 URL 建立 cookie。**这一步需要人工点一次**，或者复用
   用户已登录的 profile——后者会污染用户的浏览器数据，不建议。
3. 带 cookie 请求 25 条路由，断言全部 200。
4. 不带 cookie 请求同一条路由，断言 401。
5. 带 `Origin: https://evil.example`，断言 403。

这一步能真正回答「面板会不会被自己挡住」，而这是纯 Node 脚本答不了的。

**C. 无凭据的对抗用例（保留 `probe-bypass.mjs`，改期望值）**

它现在断言「回环放行」，加上认证后要改为断言「回环但无凭据 → 401」。
这恰好是本次修复的核心行为，值得作为独立用例保留。

### 4.5 一个必须承认的取舍

`verify-routes.mjs` 改直连后，**HTTP 层在 CI 里就没有自动化覆盖了**。
B 方案依赖浏览器和一次人工登录，不适合放进 `npm test`。

我建议接受这个缺口，理由是：HTTP 层的行为（405、content-type、错误码）在
本次改动中不变，而变的是认证——认证恰恰只能端到端测。把 B 做成
`npm run verify:auth`，由人在改动认证代码后手动跑一次。

如果你不接受这个缺口，另一条路是给插件加一个「测试模式」配置项，跳过认证。
**我不建议**：那正是要消除的漏洞形态，而且会让市场描述重新需要一句解释。

### 4.5 文档与市场

- `docs/ARCHITECTURE.md` 的跨站一节改写：从「我们做了跨站防护」改为
  「我们复用 DSH 的 `requestRejection`，与 DSH 自己的路由同等要求」。
- 本地 `market-entry.yml` 的「HTTP 路由会拒绝跨站调用」改为更准确的表述，
  例如「HTTP 路由复用 DSH 的访问检查（`requestRejection`），未认证请求被拒」。
- 合并后再开 PR 删除市场里那句披露。**顺序不能反**：先让检查生效，再删句子。

## 五、风险

| 风险 | 影响 | 处置 |
|---|---|---|
| `connection` 服务缺失 | 插件起不来 | `ctx.inject` 声明依赖，缺失即不激活；`connectionOf` 再用 try/catch 兜底 |
| 面板被自己挡住 | 插件不可用 | cookie `Path=/` 同源自动携带；上线前在真实浏览器点一遍每个标签页 |
| 测试脚本全红 | CI 失败 | 4.4 的 B 方案，先改脚本再改代码 |
| `requestRejection` 拒绝 HEAD | 部分路由失效 | 现有 handler 支持 HEAD，需实测 HEAD 是否带 cookie（浏览器会带） |
| 非浏览器客户端（含用户脚本）失效 | 行为变化 | 这是**预期结果**，也是维护者要的；在 README 说明 |

## 六、验收标准

1. 无 cookie 的 `GET /bundle` 返回 **401**（现在 200）。
2. 带 `Origin: https://evil.example` 仍返回 **403**。
3. 真实浏览器里，面板全部标签页正常加载数据（人工点一遍，或用 B 方案自动化）。
4. 11 个 agent 工具不受影响（不走 HTTP，已在代码里确认）。
5. `selfcheck` 全绿；`verify-routes` 改为直连后仍覆盖 25 条。
6. 新增断言：无凭据请求必须 401，有凭据必须 200。
7. 市场描述与实际行为逐字一致（`check-market.mjs` 转绿）。

## 七、审核结论

**方案成立，建议执行。** 四点需要注意：

1. **插件改动比想象小**：两个工厂各一处检查，25 个注册点不动。真正的成本
   在测试脚本，不在插件代码。
2. **顺序不能错**：必须先让检查生效、验证通过，再开 PR 删市场那句话。
   反过来做就是第二次说错话。
3. **`isCrossSiteRequest` 不要删**。它不是冗余：`requestRejection` 只返回
   401/403，我们无法据此区分「跨站」与「未认证」，保留前置检查能给出准确
   文案；它同时保证 `connection` 缺失时仍有基本防护。
4. **测试会有一个真实缺口**：路由改直连后，HTTP 层在 CI 里没有自动化覆盖，
   认证行为只能靠浏览器端到端验证。这个缺口是本次改动的固有代价，不是疏忽。

## 八、执行结果（2026-11-23）

已按本方案实施。与原计划的差异：

**路由表被提取出来了。** 原计划只说"改两个工厂"，但 `verify-routes.mjs`
要直连计算就得有可导入的入口，而 25 个 `compute` 原本是 `apply()` 里的匿名
闭包。于是把它们提成 `routeTable()` 并导出——注册只消费这张表，测试也消费
同一张表，两边不会再漂移。

**测试脚本的结论**（4.4 节预判的缺口确实存在，处置如下）：

| 脚本 | 改动 | 原因 |
|---|---|---|
| `verify-routes.mjs` | 改为直连 `routeTable()` | 25 条计算不需要端口、不需要凭据 |
| `verify-auth.mjs` | 新增 | 对运行中的 Host 验证 401/403 |
| `selfcheck.mjs` | 新增 23 项断言 | 用 stub connection 驱动真实 handler，含"认证先于读 body" |

**验收结果**：

| 项 | 结果 |
|---|---|
| 无 cookie `GET /bundle` | **401**（改动前 200） |
| 无 cookie `POST /simulate`、`/census` | **401** |
| `Origin: https://evil.example` | **403** |
| DSH 自己的 `GET /` 无 cookie | 401（同一标准） |
| 真实面板 | **用户确认数据正常** |
| 11 个 agent 工具 | 不受影响（不走 HTTP） |
| `selfcheck` | 840 项通过 |
| `verify-routes` | 25 条全通过 |
| 打包产物 | 840 项通过 |

**一个没能自动化的环节**：面板可用性无法用脚本证明。DSH 是桌面应用，
GUI 跑在它自己的 WebView 里，外部浏览器（全新 profile）拿不到那个 cookie，
实测返回 401——这本身是对的，但回答不了"面板是否还能用"。最后由用户
在真实窗口里确认。这个环节没有替代品：认证的失败模式是面板静默空白，
而脚本测不出"用户看到的东西"。

