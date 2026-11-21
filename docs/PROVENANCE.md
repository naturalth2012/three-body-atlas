# 数据来源与引文说明（Data provenance & quotations）

本文件如实说明本插件中三体相关内容的来源与版权边界。

## 著作权

《三体》《黑暗森林》《死神永生》《球状闪电》及其中的人物、设定、术语与台词，
著作权属于刘慈欣及相应权利方。本插件是**非官方、非商业的读者参考工具**：

- 代码为 MIT 许可（见 `LICENSE`）；
- 数据文件里的角色档案、关系、事件、技术说明等，**全部是本项目原创撰写的整理性摘要**，
  不是对原作段落的复制；
- 所有条目都标注了来源层级（原著 / 腾讯剧集 / Netflix 改编 / 动画改编 / 非官方同人）；
- 构建环境的联网检索不可用，数据基于广为人知的作品常识人工整理，
  **没有逐条比对原书**，细节请以原著与官方作品为准。

## 台词（`data/lore.js` 的 `QUOTES`）

共 30 条，全部是长度不超过 26 个汉字的**短句**，用于说明人物与议题，不是文本数据集。
每条都带一个 `verbatim` 字段，明确区分逐字引用与大意转述：

| `verbatim` | 条数 | 含义 |
| --- | --- | --- |
| `true` | 24 | 按通行文本记录的短句；个别字词版本可能因版本/改编而异 |
| `false` | 6 | 明确的大意转述或叙述概括，不是逐字原文，已在 `context` 里注明 |

`verbatim: false` 的六条：

- `physics-does-not-exist` — 智子对地球科学界的宣告，大意概括自科学家们的集体绝望
- `i-destroy-you` — 歌者清理工作流程的叙述概括，非逐字
- `broadcast-coordinates` — 罗辑广播坐标场景的大意概括
- `never-mind-all-the-same` — 结局评述，措辞为大意
- `child-too-early` — 掩体纪元场景的大意转述
- `love-not-your-business` — 广为流传的转述句，措辞为大意

如果市场或权利方对台词敏感，可直接移除 `QUOTES` 数组或将其置空：
引擎、面板、路由与工具都不依赖台词的数量（自检只要求它是一个数组），
移除后插件其余功能完全不受影响。

## 市场投稿需要如实知悉的一点

数据未在线逐条核对；若在收录评审中被问及事实准确性，请如实说明这一点，
而不是声称已逐条校订。这是资料整理类项目常见的边界，不影响代码的可用性。

---

# Data provenance & quotations (English)

The Three-Body novels and everything in them are the work of Liu Cixin (刘慈欣)
and the respective rights holders. This plugin is an **unofficial, non-commercial
reader's reference**:

- Code is MIT licensed (see `LICENSE`).
- All dossiers, relationships, events and technology notes in `data/` are
  **original summaries written for this project**, not copies of prose from the
  novels.
- Every record carries a source layer (original novel / Tencent series / Netflix
  adaptation / animation / unofficial fan work).
- The build environment had no web search; data was assembled by hand from
  widely known facts and **has not been checked line by line against the books**.

## Quotations

`data/lore.js` holds 30 short quotations, each at most 26 Chinese characters,
used solely to illustrate characters and themes. Every entry carries a
`verbatim` field: 24 are recorded short lines, and 6 are explicitly marked as
paraphrases (`verbatim: false`) with a note in `context`.

If a market or rights holder finds even these short quotations sensitive, the
`QUOTES` array can simply be emptied: no engine, route, tool or view depends on
its size, so the rest of the plugin keeps working.
