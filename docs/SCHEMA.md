# 三体宇宙 · 数据规范（维护者参考）

本文件是 Host 引擎与 Client 面板共用的数据结构约定，供后续增补数据时对照。数据由 `data/` 目录下的五个模块导出，
`engine.js`（查询/图算法）、`index.js`（Host 路由与 Agent 工具）、`client.js`（面板）都只读这些导出。
`node scripts/selfcheck.mjs` 会真正校验下文的引用完整性与规模区间，改完数据请跑一遍。

> 所有内容用中文撰写；每条记录必须能看出**来源层级**（原著 / 腾讯剧集 / Netflix / 动画），
> 不确定的精确年份用纪元记法（如「威慑纪元初年」），不要编造具体数字。

## 文件划分

| 文件 | 导出 |
| --- | --- |
| `data/characters.js` | `FACTIONS`、`RELATION_TYPES`、`CHARACTERS` |
| `data/works.js` | `WORKS`（由主 Agent 负责） |
| `data/timeline.js` | `ERAS`、`EVENTS` |
| `data/plot.js` | `PLOT`、`GAME_LEVELS`、`PATHS`、`DIFFERENCES`、`THEMES` |
| `data/lore.js` | `PLACES`、`TECH`、`GLOSSARY`、`QUOTES` |
| `data/index.js` | 汇总再导出（由主 Agent 负责） |

## 通用约定

- 所有 `id` 为小写英文短横线串，全局唯一。
- 所有数组导出名固定，不得改名。
- `canon` 取值（按来源层级，写全字符串）：
  - `原著`（刘慈欣《三体》《黑暗森林》《死神永生》，含《球状闪电》关联设定）
  - `原著与剧集`（原著有、腾讯剧集也拍到的内容）
  - `腾讯剧集`（2023 腾讯版《三体》剧集，标注改编处）
  - `Netflix 改编`（2024 Netflix《3 Body Problem》，多为原创人物与重排）
  - `动画改编`（《我的三体》系列）
- `works` 里出现的作品 id 只能取：`three-body`、`dark-forest`、`deaths-end`、`ball-lightning`、
  `tencent-series`、`netflix-series`、`my-three-body`、`three-body-x`（非官方同人，仅作对照提及）。

## 势力（`FACTIONS`，写在 `data/characters.js`）

10 个固定 id：`earth` `pdc` `fleet` `wallfacer` `eso` `trisolarians` `blue-space` `singer` `zeroers` `four-dim`。

```js
{ id: 'earth', name: '地球 / 人类', nameEn: 'Earth / Humanity', color: '#4f8fd6',
  desc: '一到三个世纪的挣扎……' }
```

## 角色（`CHARACTERS`）

字段（除标注可选外都要有）：

```js
{
  id: 'luo-ji',
  name: '罗辑', nameEn: 'Luo Ji',
  alias: ['面壁者', '执剑人'],        // 可选
  faction: 'wallfacer',               // 必须是 FACTIONS id
  factionLabel: '面壁者',
  kind: '主角',                       // 主角 / 核心 / 配角 / 背景 / 反派 / 剧集原创 / 游戏投影
  canon: '原著',
  summary: '一句话定位（30–60 字）',
  details: '生平与关键行动（120–260 字，可含结局剧透）',
  fate: '一句话结局',                 // 可选
  relations: [                        // 2–6 条，指向其他角色 id
    { to: 'zhuang-yan', type: 'romance', label: '妻子' },
    { to: 'sanzu', type: 'conflict', label: '以黑暗森林威慑对峙' },
  ],
  works: { 'dark-forest': '主角 · 面壁者', 'deaths-end': '执剑人' },
  tags: ['面壁者', '威慑', '黑暗森林'],
  firstWork: 'dark-forest',           // 首次出场作品 id
}
```

`relations[].type` 只能取：`family` `friend` `romance` `mentor` `conflict` `ally` `faction`
`fate` `identity` `servant` `rival` `creator`。

### 固定角色名单（id 与姓名不得更改，可补充 alias/details/fate/tags）

| id | 姓名 | 英文 | faction | kind | 首出场 |
| --- | --- | --- | --- | --- | --- |
| ye-wenjie | 叶文洁 | Ye Wenjie | eso | 核心 | three-body |
| ye-zhetai | 叶哲泰 | Ye Zhetai | earth | 背景 | three-body |
| wang-miao | 汪淼 | Wang Miao | earth | 主角 | three-body |
| shi-qiang | 史强 | Shi Qiang | earth | 主角 | three-body |
| chang-weisi | 常伟思 | Chang Weisi | pdc | 配角 | three-body |
| ding-yi | 丁仪 | Ding Yi | earth | 核心 | three-body |
| yang-dong | 杨冬 | Yang Dong | earth | 背景 | three-body |
| shen-yufei | 申玉菲 | Shen Yufei | eso | 配角 | three-body |
| pan-han | 潘寒 | Pan Han | eso | 配角 | three-body |
| evans | 麦克·伊文斯 | Mike Evans | eso | 反派 | three-body |
| wei-cheng | 魏成 | Wei Cheng | earth | 配角 | three-body |
| lei-zhicheng | 雷志成 | Lei Zhicheng | earth | 背景 | three-body |
| yang-weining | 杨卫宁 | Yang Weining | earth | 背景 | three-body |
| sha-ruishan | 沙瑞山 | Sha Ruishan | earth | 背景 | three-body |
| trisolaris-lord | 三体元首 | Trisolarian Lord | trisolarians | 反派 | three-body |
| listener-1379 | 1379 号监听员 | Listener 1379 | trisolarians | 配角 | three-body |
| sophon | 智子 | Sophon | trisolarians | 核心 | three-body |
| luo-ji | 罗辑 | Luo Ji | wallfacer | 主角 | dark-forest |
| zhuang-yan | 庄颜 | Zhuang Yan | earth | 配角 | dark-forest |
| bai-rong | 白蓉 | Bai Rong | earth | 背景 | dark-forest |
| zhang-beihai | 章北海 | Zhang Beihai | fleet | 核心 | dark-forest |
| dongfang-yanxu | 东方延绪 | Dongfang Yanxu | fleet | 配角 | dark-forest |
| hines | 比尔·希恩斯 | Bill Hines | wallfacer | 配角 | dark-forest |
| tyler | 弗雷德里克·泰勒 | Frederick Tyler | wallfacer | 配角 | dark-forest |
| rey-diaz | 曼努尔·雷迪亚兹 | Manuel Rey Diaz | wallfacer | 配角 | dark-forest |
| sayama-keiko | 山杉惠子 | Keiko Sayama | trisolarians | 配角 | dark-forest |
| kent | 坎特 | Kent | pdc | 配角 | dark-forest |
| garenin | 伽尔宁 | Garanin | pdc | 配角 | dark-forest |
| cheng-xin | 程心 | Cheng Xin | earth | 主角 | deaths-end |
| yun-tianming | 云天明 | Yun Tianming | earth | 核心 | deaths-end |
| aa | 艾 AA | Ai AA | earth | 配角 | deaths-end |
| wade | 托马斯·维德 | Thomas Wade | pdc | 核心 | deaths-end |
| guan-yifan | 关一帆 | Guan Yifan | blue-space | 核心 | deaths-end |
| chu-yan | 褚岩 | Chu Yan | blue-space | 核心 | deaths-end |
| pu-yijun | 朴义君 | Pu Yijun | blue-space | 配角 | deaths-end |
| singer | 歌者 | Singer | singer | 配角 | deaths-end |
| lin-yun | 林云 | Lin Yun | earth | 核心 | ball-lightning |
| chen-bo | 陈博士 | Chen Bo | earth | 主角 | ball-lightning |
| auggie | 奥姬·萨拉查 | Auggie Salazar | earth | 剧集原创 | netflix-series |
| jin-cheng | 程慬 | Jin Cheng | earth | 剧集原创 | netflix-series |
| saul | 索尔·杜兰德 | Saul Durand | earth | 剧集原创 | netflix-series |
| will-downing | 威尔·唐宁 | Will Downing | earth | 剧集原创 | netflix-series |
| jack-rooney | 杰克·鲁尼 | Jack Rooney | earth | 剧集原创 | netflix-series |
| mu-xing | 慕星 | Mu Xing | earth | 剧集原创 | tencent-series |

> 可以**新增**次要角色（如 `sayi` 萨伊、`jing-shang` 井上宏一等），但不得修改上表 id/姓名。
> 若新增，`netflix` 原创与 `腾讯剧集` 原创必须写 `canon: 'Netflix 改编'` / `'腾讯剧集'`，`kind: '剧集原创'`。

## 作品（`data/works.js` → `WORKS`）

```js
{ id: 'three-body', kind: '小说', title: '《三体》', titleEn: 'The Three-Body Problem',
  year: 2006, author: '刘慈欣', byline: '2006 年连载 / 2008 年出版 · 长篇', summary: '…',
  canon: '原著', media: 'book', tone: '…',
  volumes: [{ id: 'three-body-1', title: '第一部', note: '…' }] }   // 可选
```

作品必须覆盖：`three-body`、`dark-forest`、`deaths-end`、`ball-lightning`、
`tencent-series`、`netflix-series`、`my-three-body`、`three-body-x`。

## 纪元（`data/plot.js` → `ERAS`）

```js
{ id: 'crisis', name: '危机纪元', range: '公元 201X – 2208', desc: '三体舰队启航、面壁计划、大低谷…' }
```

必须覆盖：`pre-crisis`（危机前）、`crisis`（危机纪元）、`great-trough`（大低谷）、
`deterrence`（威慑纪元）、`post-deterrence`（威慑后）、`broadcast`（广播纪元）、
`bunker`（掩体纪元）、`galaxy`（银河纪元）、`dx3906`（DX3906 / 黑域纪元）、`647`（647 号宇宙 / 时间之外）。

## 事件（`EVENTS`）

```js
{ id: 'red-coast-signal', era: 'pre-crisis', year: '危机前 · 1960 年代',
  title: '红岸基地发出人类的第一声呼喊', desc: '…（60–140 字）',
  characters: ['ye-wenjie'], works: ['three-body'], importance: 3 }
```

`importance` 取 1–3（3 = 主线转折）。目标 40–55 条，覆盖三部曲主要节点。

## 剧情脉络（`PLOT`）

```js
{ work: 'three-body', name: '《三体》', beats: [
  { id: 'tb-01', title: '科学边界', desc: '…', era: 'crisis',
    characters: ['wang-miao', 'shi-qiang'], eventId: 'science-frontier' }  // eventId 可选
] }
```

每部 10–14 个节点，按时间顺序，`desc` 60–160 字。

## 三体游戏（`GAME_LEVELS`）

```js
{ id: 'game-01', order: 1, title: '周文王与纣王', avatars: ['周文王', '纣王'],
  scene: '荒原上的金字塔与巨大的单摆', progress: '首次登录',
  desc: '玩家第一次进入游戏看到的荒诞世界……',
  insight: '这个关卡想告诉玩家什么：三体问题的不可解' }
```

8–10 关，覆盖汪淼在游戏里经历的主要时代（周文王、墨子、哥白尼、牛顿/冯·诺依曼/秦始皇的人列计算机、
爱因斯坦、三日凌空、大撕裂等）。

## 阅读／理解路线（`PATHS`）

```js
{ id: 'newbie', icon: '🌱', name: '第一次进入三体', blurb: '…',
  steps: [{ work: 'three-body', why: '先建立世界观与人物关系' }] }
```

4–5 条路线（新手、硬核宇宙社会学、人物线、改编对照、哲学向）。

## 改编差异（`DIFFERENCES`）

```js
{ id: 'auggie', topic: '奥姬·萨拉查', media: 'Netflix 改编',
  book: '原著无此人物', screen: 'Netflix 把汪淼的纳米材料线拆给奥姬……',
  impact: '解释了为什么剧集里的主角是「牛津五杰」而不是汪淼' }
```

12–18 条，覆盖腾讯剧集、Netflix、动画三类。

## 主题与多角度（`THEMES`）

```js
{ id: 'survival-vs-morality', title: '生存与道德', question: '为了文明延续，可以牺牲多少人性？',
  summary: '…', work: 'deaths-end',
  sides: [
    { name: '维德的答案', view: '…' },
    { name: '程心的答案', view: '…' },
  ],
  related: ['wade', 'cheng-xin'], discussion: '…' }
```

8 条左右：生存与道德、面壁计划与欺骗、黑暗森林与猜疑链、爱与责任、科学与傲慢、
时间与死亡、个体与文明、宇宙的尺度。

## 地点（`data/lore.js` → `PLACES`）

```js
{ id: 'trisolaris', name: '三体世界', nameEn: 'Trisolaris', region: '半人马座 α 星系',
  type: '行星文明', canon: '原著', faction: 'trisolarians',
  summary: '…', desc: '…', characters: ['trisolaris-lord', 'listener-1379'],
  works: ['three-body'] }
```

15–20 条：三体世界、比邻星、太阳系、地球、红岸基地、三体舰队、四维空间碎片、冥王星地球文明博物馆、
DX3906、灰烬（蓝星）、647 号宇宙、三体游戏世界、掩体城市、引力波发射台、宇宙墓地等。

## 技术造物（`TECH`）

```js
{ id: 'sophon', name: '智子', nameEn: 'Sophon', tier: '三体', category: '信息与监视',
  era: '危机纪元', firstWork: 'three-body', danger: 4,
  summary: '…', desc: '…', related: ['sophon', 'ye-wenjie'] }
```

`tier` 取 `地球` `三体` `歌者` `神级`；`category` 取 `监视与信息` `武器` `飞船与推进` `宇宙规律`
`生命与意识` `社会工程`；`danger` 1–5。
20–26 条：智子、水滴、恒星级战舰、太空电梯、冬眠、思想钢印、面壁计划、咒语/宇宙广播、
引力波发射器、光粒、二向箔、黑域、曲率驱动、四维空间、人列计算机、反物质、脱水、三体游戏头盔等。

## 术语（`GLOSSARY`）

```js
{ id: 'dark-forest', term: '黑暗森林法则', termEn: 'Dark Forest Law', category: '宇宙社会学',
  definition: '一句话定义', detail: '80–200 字解释', related: ['luo-ji'] }
```

30–40 条，`category` 取 `宇宙社会学` `三体文明` `人类组织` `科技` `纪元` `哲学`。

## 名句（`QUOTES`）

```js
{ id: 'do-not-answer', text: '不要回答！不要回答！不要回答！', textEn: 'Do not answer! Do not answer! Do not answer!',
  speaker: 'listener-1379', context: '1379 号监听员收到叶文洁的信号后', work: 'three-body', canon: '原著' }
```

25–35 条，`speaker` 用角色 id（没有具名说话人时用 `'narrator'`）；`textEn` 可选。

## 校验

改完数据后运行（在插件目录）：

```powershell
node --input-type=module -e "const m=await import('file:///D:/DeepseekAPP/three-body-atlas/data/index.js');console.log(Object.keys(m), m.CHARACTERS.length, m.EVENTS.length)"
```

若 `data/index.js` 还没就绪，至少对自己的文件单独 import 一次，确认语法与导出名正确。
