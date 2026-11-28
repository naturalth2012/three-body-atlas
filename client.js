/**
 * Three-Body Atlas — Client half.
 *
 * A `sidebar.panellist` row opens a `main` panel with the whole three-body
 * universe: plot arcs, a searchable cast, an interactive relationship graph,
 * the era chronology, the in-novel game, the technology catalogue, places,
 * glossary and quotes, adaptation differences, multi-angle themes, a question
 * box — and a simulation lab where the three-body problem actually runs.
 *
 * Data and simulation live in the Host; this module renders and animates.
 */

window.__ModuleLoader__.load({
  id: '@naturalth2012/three-body-atlas',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'three-body-atlas'
    const PANEL_ID = 'three-body-atlas'
    const BASE = '/plugins/three-body-atlas'
    const BUNDLE_PATH = BASE + '/bundle'
    const DETAIL_PATH = BASE + '/detail'
    const PLACE_PATH = BASE + '/place'
    const TECH_PATH = BASE + '/tech'
    const GLOSSARY_PATH = BASE + '/glossary'
    const GRAPH_PATH = BASE + '/graph'
    const PATH_PATH = BASE + '/path'
    const ASK_PATH = BASE + '/ask'
    const SIM_PATH = BASE + '/simulate'
    const SENS_PATH = BASE + '/sensitivity'
    const SCAN_PATH = BASE + '/stability'
    const CENSUS_PATH = BASE + '/census'
    const FOREST_PATH = BASE + '/dark-forest'
    const DETERRENCE_PATH = BASE + '/deterrence'
    const JOURNEY_PATH = BASE + '/journey'
    const GUIDE_PATH = BASE + '/guide'
    const CONCEPT_PATH = BASE + '/concept'

    /* ------------------------------------------------------------------ *
     * Reader preferences
     *
     * The webview may refuse localStorage (private mode, blocked storage), so
     * every read falls back to an in-memory value for the session rather than
     * throwing. Losing a preference is acceptable; losing the page is not.
     * ------------------------------------------------------------------ */

    const PREF_TIER = 'tba:tier'
    const PREF_DONE = 'tba:done'
    // '1' once the reader picks a tier by hand; from then on reading progress
    // no longer moves the ceiling.
    const PREF_TIER_MANUAL = 'tba:tier-manual'
    // Per-work reading state: { 'three-body': 'done', 'dark-forest': 'reading' }.
    const PREF_PROGRESS = 'tba:progress'
    const memoryPrefs = {}

    /* The active language, kept module-level because `getJSON` lives outside the
       panel's closure. Written once per locale change, read on every request. */
    let activeLang = 'zh'

    const readPref = (key, fallback) => {
      try {
        const raw = window.localStorage.getItem(key)
        if (raw != null) return raw
      } catch { /* storage unavailable — fall through to memory */ }
      return Object.prototype.hasOwnProperty.call(memoryPrefs, key) ? memoryPrefs[key] : fallback
    }

    const writePref = (key, value) => {
      memoryPrefs[key] = String(value)
      try {
        window.localStorage.setItem(key, String(value))
      } catch { /* memory copy already holds it */ }
    }

    /* ------------------------------------------------------------------ *
     * Copy
     * ------------------------------------------------------------------ */
    const ZH = {
      nav: '三体宇宙',
      title: '三体宇宙图鉴',
      subtitle: '从红岸基地到 647 号宇宙：剧情、人物、纪元与可以真的跑起来的三体模拟',
      back: '返回对话',
      loading: '正在展开宇宙…',
      errorTitle: '数据加载失败',
      errorHint: '宿主端没有返回数据，插件可能刚重载。',
      retry: '重试',
      close: '关闭',
      copyMarkdown: '复制为 Markdown',
      copied: '已复制',
      copyFailed: '复制失败',

      tabOverview: '概览',
      tabPlot: '剧情脉络',
      tabCharacters: '人物档案',
      tabGraph: '人物关系图',
      tabTimeline: '纪元时间线',
      tabGame: '三体游戏',
      tabSim: '三体模拟',
      tabTech: '技术造物',
      tabPlaces: '地点',
      tabLore: '术语与名句',
      tabThemes: '多角度议题',
      tabDiff: '原著 vs 改编',
      tabAsk: '随手问',

      ovWelcome: '欢迎来到三体宇宙',
      ovIntro: '这不是一份设定集，而是一张可以走进去的星图。你可以从任何一个纪元、一个人物或一件技术进入，顺着关系与因果走完三部曲，也可以在「三体模拟」里亲手推演那颗行星为什么活不下去。',
      ovStartHere: '从哪里开始',
      ovQuick: '快速入口',
      ovCharacters: '人物',
      ovRelations: '条关系',
      ovEvents: '个事件',
      ovTech: '件技术',
      ovPlaces: '个地点',
      ovQuotes: '句名句',
      ovThemes: '个议题',
      ovWorks: '部作品',
      ovEras: '纪元分布',
      ovCanon: '来源层级',
      ovCanonNote: '改编不等于原著。本应用把内容分为：刘慈欣原著、腾讯剧集、Netflix 改编、动画改编；《三体X》只作对照提及。',
      ovToday: '今天的一句',
      ovSimTeaser: '去三体模拟里看看：三颗恒星如何把一颗行星撕碎。',

      searchPlaceholder: '搜索人物、技术、术语、事件… 试试「罗辑」「水滴」「二向箔」',
      allFactions: '全部阵营',
      allWorks: '全部作品',
      allKinds: '全部身份',
      allEras: '全部纪元',
      resultCount: '找到 {n} 条',
      clearFilters: '清空筛选',
      empty: '没有找到符合条件的内容',
      emptyHint: '换个关键词或清空筛选试试。',
      noResults: '暂无结果',

      dossier: '人物档案',
      relations: '主要关系',
      works: '出场作品',
      appearances: '相关事件',
      placesOf: '相关地点',
      artifactsOf: '相关技术',
      quotesOf: '关联名句',
      themesOf: '相关议题',
      fate: '结局',
      alias: '别名',
      canon: '来源',
      noRelations: '暂无已收录的关系。',
      noWorks: '暂无作品记录。',

      graphHint: '拖动节点可挪动位置，滚轮缩放，点击人物聚焦其关系，双击打开档案。',
      graphAll: '全部人物',
      graphFocus: '聚焦人物',
      graphReset: '重置视图',
      graphHighlight: '按阵营高亮',
      graphEmpty: '这里还没有关系数据',
      graphZoomIn: '放大',
      graphZoomOut: '缩小',
      graphDegree: '{n} 条关系',
      graphLoading: '正在绘制关系网络…',
      pathTool: '关系路径查询',
      pathFrom: '起点',
      pathTo: '终点',
      pathFind: '查找路径',
      pathPlaceholder: '输入姓名，如「罗辑」',
      pathHint: '例如：叶文洁 → 程心，看人类是怎么一路走过来的。',
      pathHops: '相距 {n} 跳',
      pathNotFound: '两者之间没有已收录的关系路径。',
      pathSame: '这是同一个人物。',

      timelineHint: '从危机前的红岸，到时间之外的 647 号宇宙。点纪元可筛选。',
      timelineOnlyMajor: '只看转折',
      timelineAll: '全部事件',
      plotTitle: '剧情脉络',
      plotHint: '每部作品的主线，分步看完。',
      gameTitle: '三体游戏',
      gameHint: '汪淼戴上头盔后看到的那些文明——每一关都是一次论证。',
      gameInsight: '这一关想告诉你',
      gameAvatars: '出场',

      techTitle: '技术造物',
      techHint: '从智子到二向箔：谁掌握了宇宙规律，谁就掌握了审判权。',
      allTiers: '全部层级',
      dangerLabel: '危险等级',
      placesTitle: '地点',
      placesHint: '从红岸的雷达到冥王星的博物馆，人类走过的每一个坐标。',
      glossaryTitle: '术语表',
      quotesTitle: '名句',
      loreHint: '这些词是三体的骨架；这些句子是它的体温。',
      diffHint: '改编不是错，但值得分清——这些差异会改变你对故事的理解。',
      diffViewList: '逐条读',
      diffViewSide: '并排对照',
      progressTitle: '阅读进度',
      progressUnread: '未读',
      progressReading: '在读',
      progressDone: '读完',
      progressManual: '已手动设定层级',
      progressFollow: '改为跟随进度',
      tabQuiz: '闪卡自测',
      quizHint: '题干从档案自动生成，正确答案就在选项里。答错不扣分——这里只是让你知道自己记住了多少。',
      quizEmpty: '当前剧透层级下没有可出的题，试试调高层级。',
      quizProgress: '第 {n} / {total} 张',
      quizScore: '答对 {right} / {total}（{pct}%）',
      quizReset: '重新开始',
      quizKindCharacter: '这是谁',
      quizKindGlossary: '这是什么概念',
      quizKindTech: '这是什么技术',
      quizRight: '答对了',
      quizWrong: '答错了',
      quizAnswerWas: '正确答案：',
      quizNext: '下一张',
      book: '原著',
      screen: '改编',
      impact: '影响',
      themeTitle: '多角度议题',
      themeHint: '三体最耐读的地方，是它不给你标准答案。',
      themeSides: '两种立场',
      themeDiscuss: '可以继续争论的地方',
      themePeople: '相关人物',

      simTitle: '三体模拟实验台',
      simHint: '这不是示意图：下面每一个点都由真实的万有引力积分算出来，恒纪元与乱纪元由行星接收到的辐射通量判定。',
      simRun: '开始推演',
      simPause: '暂停',
      simPlay: '播放',
      simReplay: '重来',
      simEras: '历法推演',
      simStable: '恒纪元',
      simChaotic: '乱纪元',
      simMetrics: '积分指标',
      simEnergy: '能量漂移',
      simBodies: '剩余天体',
      simSteps: '积分步数',
      simSummary: '结论',
      simSubOrbit: '引力模拟',
      simSubSens: '初值敏感',
      simSubScan: '稳定性普查',
      simSubCensus: '文明史普查',
      censusIntro: '单次模拟只覆盖不到一个轨道周期，行星往往几代之后就被抛出系统。这里对大量随机初值各做一次真实积分，看这个行星究竟能孕育几代文明。',
      censusRun: '开始普查',
      censusProgress: '已采样 {done}/{total}',
      censusMean: '平均代数',
      censusMax: '最多代数',
      censusBarren: '从未出现文明',
      censusEscaped: '行星消失',
      censusHistogram: '文明代数分布',
      censusOutcomes: '按结局分组',
      censusCorrelation: '恒纪元时长与代数的相关性',
      censusGenerations: '{n} 代',
      censusNote: '这是随机初始条件下的分布，不是某一颗行星的真实历史——但它正说明三体文明为什么必须逃离。',
      simSubForest: '黑暗森林',
      simSubDeterrence: '威慑博弈',
      sensIntro: '把一颗恒星的初速度改动百万分之一，会发生什么？',
      sensRun: '测量发散',
      sensVerdict: '结论',
      scanIntro: '把随机的初始条件跑很多遍，看「稳定」到底有多罕见。',
      scanRun: '开始普查',
      scanStable: '保持束缚',
      scanChaotic: '混沌未散',
      scanEject: '飞散',
      scanCollapse: '碰撞合并',
      scanPoint: '质量比 {mass} · 尺度 {spread} · 摄动 {pert}',
      forestIntro: '每个文明都在增长、都在观察，也都知道别人在观察自己。参数就是原著里争论的那几个。',
      forestRun: '推演文明史',
      forestCivs: '文明数量',
      forestSuspicion: '猜疑强度',
      forestExplosion: '技术爆炸概率',
      forestCost: '打击代价',
      forestAlive: '存活文明',
      forestStrikes: '打击次数',
      forestSurvivors: '存活率',
      forestTech: '存活者技术水平',
      deterrenceIntro: '执剑人的威慑度，等于「愿意同归于尽」的强度。调一调，看他能撑多久。',
      deterrenceRun: '推演威慑',
      deterrenceResolve: '执剑人的意志',
      deterrenceInvasion: '入侵的诱惑',
      deterrenceLuck: '运气 / 变数',
      deterrenceScore: '威慑评分',
      deterrenceHeld: '威慑是否维持',
      simRunning: '推演中…',
      simIdle: '还没开始。选一个初始条件，点「开始推演」。',

      askTitle: '随手问一问',
      askPlaceholder: '问一个三体问题，如「罗辑和庄颜是什么关系」',
      askButton: '提问',
      askThinking: '正在检索…',
      askFail: '没有拿到答案，请稍后再试。',
      askTryThese: '可以试试：',
      simMajor: '关键',
      simSpan: 't 上限',
      simEraCount: '恒纪元 {stable} 段 · 乱纪元 {chaotic} 段',
      simSeekHint: '点色块跳到该段',
      simSubsteps: '平均子步',
      simAngular: '角动量漂移',
      simEnergyCurve: '能量守恒曲线',
      simEnergyDriftMax: '峰值漂移 {v}%',
      simFluxTitle: '行星辐射史',
      simFluxHint: '底色的绿／红是「恒纪元／乱纪元」，曲线是行星接收到的辐射通量。',
      simPhaseTitle: '相位图：轨道与速度空间',
      simPhasePosition: '位置空间（x, y）',
      simPhaseVelocity: '速度空间（vx, vy）',
      simNoPhase: '这套系统没有行星，因此没有相位图。',
      simCatastrophes: '灾变记录',
      simNoCats: '这段推演里没有出现三日凌空、连珠、潮汐撕裂或吞噬。',
      simDuration: '持续',
      simCivilizations: '文明的代数',
      simBench: '参数台',
      simBenchOpen: '展开',
      simBenchClose: '收起',
      simBenchHint: '改任何初值都会重新积分——这就是初值敏感本身。留空即用预设值。',
      simBenchSteps: '积分步数',
      simBenchReset: '恢复预设',
      simRunWithParams: '用这组参数推演',
      simPresetFallback: '三体世界',
      simScale: '视野跨度 {span} 单位',
      simEjected: '{n} 个天体已飞出视野',
      simTrailAll: '显示完整轨迹',
      allCategories: '全部分类',
      allMedia: '全部改编',
      deterrenceHoldYes: '维持',
      deterrenceHoldNo: '破裂',
      deterrenceHumanity: '人类存续',
      footer: '数据为人工整理的三体宇宙导读；细节请以刘慈欣原著与官方作品为准。',

      tabGuide: '导读',
      tabJourney: '角色视角',
      tabConcept: '概念图',
      tierTitle: '我读到第几部',
      tierHint: '超出进度的人物结局、事件详情会被遮住，避免剧透。',
      tierAll: '全部展开',
      tierLocked: '这里涉及{label}的内容',
      tierUnlock: '仍然展开',
      tierRestore: '收起',
      tierSaved: '已记住你的阅读进度',
      tierCounts: '{c} 位人物 · {e} 个事件',
      tierPrelude: '前史',
      tierB1: '第一部',
      tierB2: '第二部',
      tierB3: '第三部',

      guideTitle: '按一条线读下去',
      guideHint: '五条精心编排的路线，每条都说明「为什么这样读」。点一步展开这一部的人物与事件。',
      guideSteps: '{n} 步',
      guideStep: '第 {n} 步',
      guideWhy: '为什么读这一步',
      guideCast: '涉及人物',
      guideEvents: '{n} 个事件',
      guideLocked: '这一步属于{label}，已按你的进度折叠。',
      guideProgress: '已走 {done}/{total} 步',
      guideMarkDone: '标记为已读',
      guideMarkedDone: '已读',
      guideClear: '清空进度',
      guideWorks: '这一步读的作品',

      journeyTitle: '角色视角：跟着一个人走完故事',
      journeyHint: '选一个角色，把他/她经历的事件与情节按顺序排成一条线。同一件事，不同人的重量完全不同。',
      journeyPick: '选择角色',
      journeyFocus: '{n} 个节点由他/她主导',
      journeyTotal: '共 {n} 个情节节点',
      journeyRoleFocus: '主导',
      journeyRoleNamed: '被点名',
      journeyRolePresent: '在场',
      journeyEmpty: '这个角色没有单独出场的情节节点，属于配角或背景设定。可以从这些关系进入：',
      journeySpan: '出场跨度',
      journeySearch: '搜索角色…',

      conceptTitle: '概念如何互相推导',
      conceptHint: '术语、技术、人物、地点之间的真实引用关系，可逐层展开。',
      conceptPick: '从任意概念出发',
      conceptDegree: '{n} 条关联',
      conceptDepth: '展开层数',
      conceptNone: '这个概念没有收录关联。',
      conceptBack: '回到总览',
      conceptKinds: '术语 / 技术 / 人物 / 地点',
    }

    const EN = {
      nav: 'Three-Body', title: 'Three-Body Universe',
      subtitle: 'Red Coast to Universe 647: plot, people, eras — and a three-body simulation that really runs',
      back: 'Back to chat', loading: 'Unfolding the universe…',
      errorTitle: 'Failed to load', errorHint: 'No data from the host; the plugin may have just reloaded.',
      retry: 'Retry', close: 'Close',
      copyMarkdown: 'Copy as Markdown', copied: 'Copied', copyFailed: 'Copy failed',
      tabOverview: 'Overview', tabPlot: 'Plot', tabCharacters: 'Cast', tabGraph: 'Relationship map',
      tabTimeline: 'Chronology', tabGame: 'Game', tabSim: 'Simulation', tabTech: 'Technology',
      tabPlaces: 'Places', tabLore: 'Glossary & quotes', tabThemes: 'Themes', tabDiff: 'Book vs screen',
      tabAsk: 'Ask',
      ovWelcome: 'Welcome to the Three-Body universe',
      ovIntro: 'Not a lore dump but a star map you can walk through. Enter from any era, character or technology, follow the relations and causes through the trilogy, or run the simulation and watch why that planet cannot survive.',
      ovStartHere: 'Start here', ovQuick: 'Quick links',
      ovCharacters: 'characters', ovRelations: 'relations', ovEvents: 'events',
      ovTech: 'technologies', ovPlaces: 'places', ovQuotes: 'quotes', ovThemes: 'themes', ovWorks: 'works',
      ovEras: 'Eras', ovCanon: 'Source layers',
      ovCanonNote: 'Adaptation is not canon: Liu Cixin, the Tencent series, the Netflix series and the animated adaptation are labelled separately.',
      ovToday: 'One line today',
      ovSimTeaser: 'Try the simulation: watch three suns tear a planet apart.',
      searchPlaceholder: 'Search characters, tech, terms, events… try "Luo Ji" or "sophon"',
      allFactions: 'All factions', allWorks: 'All works', allKinds: 'All roles', allEras: 'All eras',
      resultCount: '{n} results', clearFilters: 'Clear filters',
      empty: 'Nothing matched', emptyHint: 'Try another keyword or clear the filters.', noResults: 'No results',
      dossier: 'Dossier', relations: 'Relations', works: 'Works', appearances: 'Events',
      placesOf: 'Places', artifactsOf: 'Technologies', quotesOf: 'Quotes', themesOf: 'Themes',
      fate: 'Fate', alias: 'Aliases', canon: 'Source',
      noRelations: 'No relations recorded.', noWorks: 'No works recorded.',
      graphHint: 'Drag nodes to move them, scroll to zoom, click to focus, double-click for the dossier.',
      graphAll: 'Everyone', graphFocus: 'Focus', graphReset: 'Reset view', graphHighlight: 'Highlight faction',
      graphEmpty: 'No relations yet', graphLoading: 'Drawing the graph…',
      graphZoomIn: 'Zoom in', graphZoomOut: 'Zoom out', graphDegree: '{n} relations',
      pathTool: 'Relationship path', pathFrom: 'From', pathTo: 'To', pathFind: 'Find',
      pathPlaceholder: 'A name, e.g. Luo Ji', pathHint: 'For example: Ye Wenjie → Cheng Xin.',
      pathHops: '{n} hops apart', pathNotFound: 'No curated path between them.', pathSame: 'Same character.',
      timelineHint: 'From Red Coast before the Crisis to Universe 647 beyond time.',
      timelineOnlyMajor: 'turning points', timelineAll: 'all events',
      plotTitle: 'Plot', plotHint: 'Every main line, step by step.',
      gameTitle: 'The Three-Body game', gameHint: 'What Wang Miao saw once he put the headset on.',
      gameInsight: 'What this level argues', gameAvatars: 'Appears',
      techTitle: 'Technology', techHint: 'From sophons to the dual-vector foil.',
      allTiers: 'All tiers', dangerLabel: 'Danger',
      placesTitle: 'Places', placesHint: 'Every coordinate humanity passed through.',
      glossaryTitle: 'Glossary', quotesTitle: 'Quotes', loreHint: 'The vocabulary is the skeleton; the lines are the pulse.',
      diffHint: 'Adaptation is not error, but it changes what the story means.',
      diffViewList: 'Read in turn',
      diffViewSide: 'Side by side',
      progressTitle: 'Reading progress',
      progressUnread: 'Unread',
      progressReading: 'Reading',
      progressDone: 'Finished',
      progressManual: 'Tier set by hand',
      progressFollow: 'Follow progress instead',
      tabQuiz: 'Flashcards',
      quizHint: 'Questions are generated from the entries themselves. Wrong answers cost nothing — this only shows you what you remember.',
      quizEmpty: 'Nothing to ask at this spoiler level. Try raising it.',
      quizProgress: 'Card {n} of {total}',
      quizScore: '{right} / {total} correct ({pct}%)',
      quizReset: 'Start over',
      quizKindCharacter: 'Who is this',
      quizKindGlossary: 'Which concept',
      quizKindTech: 'Which technology',
      quizRight: 'Correct',
      quizWrong: 'Not quite',
      quizAnswerWas: 'Answer:',
      quizNext: 'Next card',
      book: 'Book', screen: 'Screen', impact: 'Impact',
      themeTitle: 'Themes', themeHint: 'The best part of Three-Body is that it refuses to answer for you.',
      themeSides: 'Two positions', themeDiscuss: 'What to keep arguing about', themePeople: 'Related characters',
      simTitle: 'Three-body lab',
      simHint: 'Not an illustration: every point below comes from a real gravitational integration, and the era labels come from the radiation flux the planet receives.',
      simRun: 'Run', simPause: 'Pause', simPlay: 'Play', simReplay: 'Replay',
      simEras: 'Derived calendar', simStable: 'Stable era', simChaotic: 'Chaotic era',
      simMetrics: 'Metrics', simEnergy: 'Energy drift', simBodies: 'Bodies left', simSteps: 'Steps',
      simSummary: 'Verdict',
      simSubOrbit: 'Gravity', simSubSens: 'Sensitivity', simSubScan: 'Stability scan',
      simSubCensus: 'Civilization census',
      censusIntro: 'One run covers less than a single orbit, and the planet is usually flung out after a few generations. This integrates many random systems for real and asks how many civilizations the planet can actually raise.',
      censusRun: 'Run the census',
      censusProgress: 'Sampled {done}/{total}',
      censusMean: 'Mean generations',
      censusMax: 'Most generations',
      censusBarren: 'Never raised one',
      censusEscaped: 'Planet gone',
      censusHistogram: 'Generations distribution',
      censusOutcomes: 'By outcome',
      censusCorrelation: 'Stable span vs generations',
      censusGenerations: '{n} gen',
      censusNote: 'This is a distribution over random initial conditions, not the true history of one planet — and that is exactly why the Trisolarans had to leave.',
      simSubForest: 'Dark forest', simSubDeterrence: 'Deterrence',
      sensIntro: 'Nudge one star\'s velocity by one millionth. What happens?',
      sensRun: 'Measure divergence', sensVerdict: 'Verdict',
      scanIntro: 'Run many random initial conditions and see how rare stability is.',
      scanRun: 'Run the scan', scanStable: 'Bound', scanChaotic: 'Chaotic', scanEject: 'Ejected', scanCollapse: 'Merged',
      scanPoint: 'mass ratio {mass} · scale {spread} · perturbation {pert}',
      forestIntro: 'Every civilization grows, observes, and knows it is observed. The parameters are the ones the novels argue about.',
      forestRun: 'Run the history', forestCivs: 'Civilizations', forestSuspicion: 'Suspicion',
      forestExplosion: 'Explosion chance', forestCost: 'Strike cost',
      forestAlive: 'Alive', forestStrikes: 'Strikes', forestSurvivors: 'Survival rate', forestTech: 'Survivor tech',
      deterrenceIntro: 'A sword-holder\'s credibility equals the willingness to lose everything.',
      deterrenceRun: 'Run deterrence', deterrenceResolve: 'Resolve', deterrenceInvasion: 'Invasion pressure',
      deterrenceLuck: 'Luck', deterrenceScore: 'Score', deterrenceHeld: 'Deterrence held',
      simRunning: 'Running…', simIdle: 'Not started yet.',
      askTitle: 'Ask anything', askPlaceholder: 'e.g. what is the Dark Forest law?',
      askButton: 'Ask', askThinking: 'Searching…', askFail: 'No answer yet, try again later.',
      askTryThese: 'Try these:',
      simMajor: 'key', simSpan: 't limit',
      simEraCount: '{stable} stable · {chaotic} chaotic',
      simSeekHint: 'click a band to jump there',
      simSubsteps: 'avg substep', simAngular: 'Angular drift',
      simEnergyCurve: 'Energy conservation',
      simEnergyDriftMax: 'peak drift {v}%',
      simFluxTitle: 'Planet radiation history',
      simFluxHint: 'Green/red bands are stable/chaotic eras; the line is the radiation flux the planet receives.',
      simPhaseTitle: 'Phase portrait: orbit and velocity space',
      simPhasePosition: 'Position (x, y)', simPhaseVelocity: 'Velocity (vx, vy)',
      simNoPhase: 'No planet in this system, so no phase portrait.',
      simCatastrophes: 'Catastrophes',
      simNoCats: 'No triple-sun, alignment, tidal disruption or engulfment in this run.',
      simDuration: 'lasting',
      simCivilizations: 'Civilization generations',
      simBench: 'Parameter bench', simBenchOpen: 'Open', simBenchClose: 'Close',
      simBenchHint: 'Changing any initial value re-integrates the whole run — that is initial-value sensitivity itself.',
      simBenchSteps: 'Steps', simBenchReset: 'Reset to preset', simRunWithParams: 'Run with these values',
      simPresetFallback: 'Trisolaris',
      simScale: 'view span {span} units',
      simEjected: '{n} bodies left the frame',
      simTrailAll: 'full trails',
      allCategories: 'All categories', allMedia: 'All adaptations',
      deterrenceHoldYes: 'held', deterrenceHoldNo: 'broken',
      deterrenceHumanity: 'Humanity',
      footer: 'Curated reading notes; defer to the novels for fine detail.',

      tabGuide: 'Guide',
      tabJourney: 'One character',
      tabConcept: 'Concepts',
      tierTitle: 'How far have you read?',
      tierHint: 'Endings and plot detail past your mark are masked so nothing is spoiled.',
      tierAll: 'Show everything',
      tierLocked: 'This involves {label}',
      tierUnlock: 'Reveal anyway',
      tierRestore: 'Hide again',
      tierSaved: 'Your reading progress is remembered',
      tierCounts: '{c} characters · {e} events',
      tierPrelude: 'Prelude',
      tierB1: 'Book one',
      tierB2: 'Book two',
      tierB3: 'Book three',

      guideTitle: 'Pick one thread and follow it',
      guideHint: 'Five curated routes, each saying why it is read in that order. Open a step for its cast and events.',
      guideSteps: '{n} steps',
      guideStep: 'Step {n}',
      guideWhy: 'Why this step',
      guideCast: 'Characters',
      guideEvents: '{n} events',
      guideLocked: 'This step belongs to {label} and is folded to match your progress.',
      guideProgress: '{done}/{total} steps done',
      guideMarkDone: 'Mark as read',
      guideMarkedDone: 'Read',
      guideClear: 'Clear progress',
      guideWorks: 'What you read here',

      journeyTitle: 'One character, the whole story',
      journeyHint: 'Pick a character to line up every event and plot beat they live through. The same scene weighs differently to each of them.',
      journeyPick: 'Choose a character',
      journeyFocus: '{n} nodes driven by them',
      journeyTotal: '{n} story nodes',
      journeyRoleFocus: 'drives it',
      journeyRoleNamed: 'named',
      journeyRolePresent: 'present',
      journeyEmpty: 'This character never drives a scene on their own; they are supporting cast. Enter through these relations:',
      journeySpan: 'Span',
      journeySearch: 'Search characters…',

      conceptTitle: 'How the ideas depend on each other',
      conceptHint: 'The real reference edges between terms, technologies, characters and places, expandable layer by layer.',
      conceptPick: 'Start from any concept',
      conceptDegree: '{n} links',
      conceptDepth: 'Depth',
      conceptNone: 'No curated links for this concept.',
      conceptBack: 'Back to overview',
      conceptKinds: 'terms / tech / people / places',
    }

    /* Which language is DSH itself showing?
     *
     * The locale service exposes its state as a snapshot, `{ active, locales,
     * revision }` — reachable through `getSnapshot()` (the LocaleFace) or
     * `getLocale()`. It has no `language()` / `current()` / `getLanguage()`.
     * Probing for those and falling through to `navigator.language` silently
     * ignored the user's DSH setting: switching DSH to English left this panel
     * Chinese on a Chinese-locale browser.
     *
     * Only an exact `en*` id counts as English. The service's own fallback is
     * English, but that is a dictionary fallback, not a language preference —
     * treating it as one would flip this panel to English for a Japanese user.
     */
    const activeLocaleId = (locale) => {
      const read = (source) => {
        if (!source) return undefined
        if (typeof source.getSnapshot === 'function') {
          const snap = source.getSnapshot()
          if (snap && typeof snap.active === 'string') return snap.active
        }
        if (typeof source.getLocale === 'function') {
          const snap = source.getLocale()
          if (snap && typeof snap.active === 'string') return snap.active
        }
        return undefined
      }
      try {
        const direct = read(locale)
        if (direct !== undefined) return direct
        // Older or partial hosts may hand over the bare snapshot instead.
        if (locale && typeof locale.active === 'string') return locale.active
      } catch { /* fall through to the browser */ }
      try {
        return typeof navigator !== 'undefined' ? navigator.language : 'zh'
      } catch {
        return 'zh'
      }
    }

    const isEnglish = (locale) => {
      try {
        return String(activeLocaleId(locale)).toLowerCase().startsWith('en')
      } catch {
        return false
      }
    }

    const makeTranslator = (locale, messages) => (key, vars) => {
      let text = messages && Object.prototype.hasOwnProperty.call(messages, key) ? messages[key] : ZH[key]
      if (text === undefined) {
        try {
          const translated = locale && typeof locale.t === 'function' ? locale.t(NS + '.' + key) : undefined
          if (typeof translated === 'string' && translated.indexOf(NS + '.') !== 0) text = translated
        } catch { /* keep the fallback */ }
      }
      if (text === undefined) text = key
      if (vars && text) {
        Object.keys(vars).forEach((k) => {
          text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]))
        })
      }
      return text
    }

    const getJSON = async (url, body) => {
      const withLang = (payload) => (payload && typeof payload === 'object' && !Array.isArray(payload)
        ? Object.assign({}, payload, { lang: activeLang })
        : payload)
      const init = body === undefined ? undefined : {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(withLang(body)),
      }
      // The routes require the DSH session cookie (`ctx.connection.requestRejection`),
      // so this must stay a credentialed same-origin request. `same-origin` is the
      // default, but stated here because switching to `omit` would make every
      // panel request answer 401 — and the failure looks like an empty panel,
      // not an error anyone would trace back to this line.
      const res = await fetch(url, init === undefined
        ? { credentials: 'same-origin' }
        : { ...init, credentials: 'same-origin' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    }

    /* ------------------------------------------------------------------ *
     * Styles — host theme tokens only, artwork carries its own palette
     * ------------------------------------------------------------------ */
    function installStyleSheet() {
      if (typeof document === 'undefined' || !document.createElement) return () => {}
      const style = document.createElement('style')
      style.setAttribute('data-plugin', NS)
      style.textContent = `
        .tba-root{display:flex;flex-direction:column;height:100%;min-height:0;color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.65}
        .tba-scroll{flex:1;min-height:0;overflow:auto;padding:22px 26px 40px}
        .tba-tabs{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l1);margin-bottom:18px;position:sticky;top:-22px;z-index:3;background:var(--dsw-alias-bg-base);padding-top:6px}
        .tba-head{display:flex;align-items:flex-start;gap:14px;margin-bottom:16px}
        .tba-head h1{margin:0;font-size:25px;font-weight:650;letter-spacing:.3px}
        .tba-head .tba-sub{color:var(--dsw-alias-label-secondary);font-size:13px;margin-top:3px}
        .tba-crest{width:48px;height:48px;flex:0 0 48px;border-radius:14px;background:radial-gradient(circle at 32% 28%,#f6d67a,#b4762a 58%,#3d2a12);display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 0 0 1px var(--dsw-alias-border-l1) inset}
        .tba-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px;margin:14px 0 18px}
        .tba-stat{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 14px}
        .tba-stat b{display:block;font-size:19px;font-weight:650;line-height:1.2}
        .tba-stat span{color:var(--dsw-alias-label-secondary);font-size:12px}
        .tba-tabs{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l1);margin-bottom:18px;position:sticky;top:-22px;z-index:3;background:var(--dsw-alias-bg-base);padding-top:6px}
        .tba-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:8px 11px;border-radius:8px 8px 0 0;cursor:pointer;font-size:13.5px;font-weight:500;border-bottom:2px solid transparent;font-family:inherit}
        .tba-tab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}
        .tba-tab.tba-active{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:650}
        .tba-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
        .tba-input,.tba-select{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;color:var(--dsw-alias-label-primary);padding:8px 11px;font-size:13px;outline:none;font-family:inherit}
        .tba-input:focus,.tba-select:focus{border-color:var(--dsw-alias-brand-primary)}
        .tba-input.tba-grow{flex:1;min-width:200px}
        .tba-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:7px 13px;font-size:13px;cursor:pointer;font-family:inherit}
        .tba-btn:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
        .tba-btn:disabled{opacity:.55;cursor:default}
        .tba-btn.tba-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:600}
        .tba-btn.tba-primary:hover:not(:disabled){opacity:.9;color:var(--dsw-alias-bg-base)}
        .tba-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;align-items:center}
        .tba-chip{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:999px;padding:4px 11px;font-size:12px;cursor:pointer;font-family:inherit}
        .tba-chip:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
        .tba-chip.tba-on{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1)}
        .tba-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(252px,1fr));gap:11px}
        .tba-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:14px;cursor:pointer;transition:transform .12s,border-color .12s;display:flex;flex-direction:column;gap:7px}
        .tba-card:hover{transform:translateY(-2px);border-color:var(--dsw-alias-brand-primary)}
        .tba-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
        .tba-card.tba-flat{cursor:default}
        .tba-card.tba-flat:hover{transform:none;border-color:var(--dsw-alias-border-l1)}
        .tba-card-top{display:flex;align-items:center;gap:9px}
        .tba-dot{width:10px;height:10px;border-radius:50%;flex:0 0 10px}
        .tba-card h3{margin:0;font-size:15px;font-weight:650;line-height:1.35}
        .tba-card .tba-en{color:var(--dsw-alias-label-secondary);font-size:12px}
        .tba-card p{margin:0;color:var(--dsw-alias-label-secondary);font-size:12.8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
        .tba-tagrow{display:flex;flex-wrap:wrap;gap:5px;margin-top:auto;padding-top:4px}
        .tba-tag{font-size:11px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border-radius:6px;padding:2px 7px}
        .tba-badge{font-size:11px;padding:2px 7px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);white-space:nowrap}
        .tba-badge.tba-canon-book{color:var(--dsw-alias-state-success-primary)}
        .tba-badge.tba-canon-both{color:var(--dsw-alias-brand-primary)}
        .tba-badge.tba-canon-screen{color:var(--dsw-alias-label-primary)}
        .tba-badge.tba-canon-adapt{color:var(--dsw-alias-state-warn-primary)}
        .tba-empty{text-align:center;color:var(--dsw-alias-label-secondary);padding:56px 20px}
        .tba-empty .tba-eicon{font-size:38px;margin-bottom:10px}
        .tba-drawer-back{position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:60;display:flex;justify-content:flex-end}
        .tba-drawer{width:min(600px,94vw);height:100%;overflow:auto;background:var(--dsw-alias-bg-base);border-left:1px solid var(--dsw-alias-border-l1);padding:26px 28px 44px;box-shadow:-8px 0 30px rgba(0,0,0,.2)}
        .tba-drawer h2{margin:8px 0 2px;font-size:23px}
        .tba-drawer .tba-den{color:var(--dsw-alias-label-secondary);margin-bottom:14px;font-size:13px}
        .tba-drawer-close{float:right;appearance:none;border:0;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:16px}
        .tba-drawer-close:hover{background:var(--dsw-alias-bg-layer-2)}
        /* Sits beside the close button; both float right so the copy control
           never pushes the dossier title down. */
        .tba-drawer-copy{float:right;appearance:none;border:0;margin-right:8px;padding:0 10px;height:32px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:8px;cursor:pointer;font-size:12.5px;line-height:32px}
        .tba-drawer-copy:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
        .tba-section{margin-top:20px}
        .tba-section h4{margin:0 0 9px;font-size:13.5px;font-weight:650;display:flex;align-items:center;gap:7px}
        .tba-section h4:before{content:'';width:3px;height:13px;border-radius:2px;background:var(--dsw-alias-brand-primary)}
        .tba-p{color:var(--dsw-alias-label-secondary);font-size:13.4px;margin:0}
        .tba-relitem,.tba-workitem,.tba-eventitem,.tba-miniitem{display:flex;gap:10px;align-items:flex-start;padding:9px 11px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:9px;margin-bottom:7px;font-size:13px}
        .tba-miniitem{cursor:pointer}
        .tba-miniitem:hover{border-color:var(--dsw-alias-brand-primary)}
        .tba-reltype{font-size:11px;padding:2px 7px;border-radius:6px;white-space:nowrap;color:#fff;font-weight:600;background-image:linear-gradient(rgba(0,0,0,.18),rgba(0,0,0,.18))}
        .tba-relitem b,.tba-workitem b,.tba-eventitem b,.tba-miniitem b{font-weight:650}
        .tba-relitem small,.tba-workitem small,.tba-eventitem small,.tba-miniitem small{color:var(--dsw-alias-label-secondary);display:block;font-size:12px}
        .tba-quote{border-left:3px solid var(--dsw-alias-brand-primary);padding:6px 0 6px 13px;margin-bottom:13px;font-size:13.6px;font-style:italic;color:var(--dsw-alias-label-primary)}
        .tba-quote cite{display:block;font-style:normal;font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:5px}
        .tba-graphwrap{position:relative;background:radial-gradient(ellipse at 50% 40%,rgba(64,86,140,.16),transparent 62%),var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;overflow:hidden;height:540px}
        .tba-graphwrap svg{display:block;width:100%;height:100%;cursor:grab;touch-action:none}
        .tba-graphwrap svg.tba-drag{cursor:grabbing}
        .tba-node{cursor:pointer}
        .tba-node text{font-size:10.5px;fill:var(--dsw-alias-label-primary);pointer-events:none;paint-order:stroke}
        .tba-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
        .tba-legend span{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--dsw-alias-label-secondary)}
        .tba-legend i{width:9px;height:9px;border-radius:50%;display:inline-block}
        .tba-pathbox{margin-top:16px;padding:15px 16px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px}
        .tba-pathbox h4{margin:0 0 10px;font-size:15px}
        .tba-pathrow{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
        .tba-pathresult{margin-top:12px;padding:12px;background:var(--dsw-alias-bg-layer-2);border-radius:9px;font-size:13px}
        .tba-hop{display:block;margin:4px 0}
        .tba-arrow{color:var(--dsw-alias-brand-primary);font-weight:700;margin:0 4px}
        .tba-timeline{position:relative;padding-left:26px;margin-top:8px}
        .tba-timeline:before{content:'';position:absolute;left:7px;top:4px;bottom:4px;width:2px;background:var(--dsw-alias-border-l2)}
        .tba-ev{position:relative;margin-bottom:14px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:11px;padding:13px 16px}
        .tba-ev:before{content:'';position:absolute;left:-24px;top:18px;width:11px;height:11px;border-radius:50%;background:var(--dsw-alias-brand-primary);border:2px solid var(--dsw-alias-bg-base)}
        .tba-ev.tba-major:before{background:var(--dsw-alias-state-warn-primary);width:14px;height:14px;left:-25.5px}
        .tba-evhead{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-bottom:4px}
        .tba-age{font-size:11px;color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);padding:2px 8px;border-radius:6px}
        .tba-year{font-size:12px;color:var(--dsw-alias-label-secondary)}
        .tba-ev h3{margin:0;font-size:14.5px}
        .tba-ev p{margin:5px 0 0;color:var(--dsw-alias-label-secondary);font-size:12.8px}
        .tba-people{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:7px}
        .tba-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px}
        /* Single column for the side-by-side diff view: each card already holds
           two columns of its own, so a grid would nest columns inside columns. */
        .tba-one{display:grid;grid-template-columns:1fr;gap:18px}
        .tba-sbs{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px}
        /* Narrow panels stack the pair rather than squeezing both columns. */
        @media (max-width:720px){.tba-sbs{grid-template-columns:1fr}}
        .tba-sbs-col{background:var(--dsw-alias-bg-layer-2);border-radius:10px;padding:12px 13px}
        .tba-sbs-head{font-size:12px;font-weight:650;color:var(--dsw-alias-label-secondary);margin-bottom:7px;letter-spacing:.02em}
        .tba-sbs-body{margin:0;font-size:13.5px;line-height:1.72;color:var(--dsw-alias-label-primary)}
        .tba-sbs-impact{margin-top:12px;padding:10px 13px;border-left:3px solid var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);border-radius:0 9px 9px 0;font-size:13px;line-height:1.68;display:flex;gap:9px;align-items:baseline}
        .tba-sbs-impact b{color:var(--dsw-alias-label-secondary);font-weight:650;white-space:nowrap}
        .tba-progress{margin-top:8px;display:flex;flex-wrap:wrap;align-items:center;gap:8px}
        .tba-progress-toggle{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:8px;padding:5px 11px;font-size:12.5px;cursor:pointer}
        .tba-progress-toggle:hover,.tba-progress-toggle.tba-on{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
        .tba-progress-note{font-size:12px;color:var(--dsw-alias-label-tertiary)}
        .tba-linkbtn{appearance:none;border:0;background:none;color:var(--dsw-alias-brand-primary);font-size:12px;cursor:pointer;padding:0;text-decoration:underline}
        .tba-progress-body{flex-basis:100%;margin-top:6px;display:grid;gap:7px}
        .tba-progress-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .tba-progress-work{font-size:13px;min-width:110px;color:var(--dsw-alias-label-primary)}
        .tba-progress-states{display:flex;gap:5px}
        .tba-progress-state{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:7px;padding:3px 9px;font-size:12px;cursor:pointer}
        .tba-progress-state.tba-on{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-inverse,#fff)}
        .tba-quizbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0 14px}
        .tba-quizcard{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:14px;padding:20px 22px;max-width:760px}
        .tba-quizkind{font-size:12px;font-weight:650;color:var(--dsw-alias-label-tertiary);letter-spacing:.04em;margin-bottom:9px}
        .tba-quizstem{margin:0 0 16px;font-size:15px;line-height:1.78;color:var(--dsw-alias-label-primary)}
        .tba-quizoptions{display:grid;gap:8px}
        .tba-quizopt{appearance:none;text-align:left;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:10px;padding:11px 14px;font-size:13.5px;cursor:pointer;transition:background .12s}
        .tba-quizopt:hover:not(:disabled){background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2));border-color:var(--dsw-alias-brand-primary)}
        .tba-quizopt:disabled{cursor:default}
        .tba-quizopt.tba-right{background:rgba(46,160,67,.16);border-color:rgba(46,160,67,.55)}
        .tba-quizopt.tba-wrong{background:rgba(220,60,60,.14);border-color:rgba(220,60,60,.5)}
        .tba-quizopt.tba-dim{opacity:.55}
        .tba-quizresult{margin-top:16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:13.5px}
        .tba-pathcard{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:13px;padding:17px}
        .tba-pathcard h3{margin:0 0 4px;font-size:16.5px}
        .tba-pathcard .tba-blurb{color:var(--dsw-alias-label-secondary);font-size:12.8px;margin-bottom:13px}
        .tba-steps{list-style:none;padding:0;margin:0}
        .tba-steps li{position:relative;padding:0 0 13px 30px;border-left:2px solid var(--dsw-alias-border-l1);margin-left:9px}
        .tba-steps li:last-child{border-left-color:transparent;padding-bottom:0}
        .tba-steps li:before{content:attr(data-step);position:absolute;left:-11px;top:0;width:20px;height:20px;border-radius:50%;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .tba-steps b{font-size:13.5px}
        .tba-steps p{margin:3px 0 0;color:var(--dsw-alias-label-secondary);font-size:12.4px}
        .tba-diffcard{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:15px}
        .tba-diffcard h3{margin:0 0 11px;font-size:15px}
        .tba-drow{display:grid;grid-template-columns:48px 1fr;gap:8px;margin-bottom:8px;font-size:12.8px}
        .tba-dkey{font-size:11px;font-weight:700;color:var(--dsw-alias-brand-primary);padding-top:2px}
        .tba-dval{color:var(--dsw-alias-label-secondary)}
        .tba-askbox{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:17px}
        .tba-askbox h3{margin:0 0 11px;font-size:17px}
        .tba-answer{margin-top:12px;padding:13px 14px;background:var(--dsw-alias-bg-layer-2);border-radius:9px;font-size:13.2px;line-height:1.75}
        .tba-answerhead{font-weight:650;font-size:14px;margin-bottom:6px;color:var(--dsw-alias-label-primary)}
        .tba-answerp{margin:0 0 7px}
        .tba-answerp:last-child{margin-bottom:0}
        .tba-answerlist{margin:0 0 7px;padding-left:19px}
        .tba-answerlist li{margin-bottom:3px}
        .tba-bar{height:7px;border-radius:4px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;display:flex}
        .tba-bar i{display:block;height:100%}
        .tba-barrow{display:flex;align-items:center;gap:9px;font-size:12.5px;margin-bottom:7px}
        .tba-barrow span:first-child{width:96px;flex:0 0 96px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .tba-barrow .tba-track{flex:1}
        .tba-barrow span:last-child{width:42px;text-align:right;color:var(--dsw-alias-label-secondary)}
        .tba-intro{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:16px 18px;margin-bottom:18px;font-size:13.5px;color:var(--dsw-alias-label-secondary);line-height:1.75}
        .tba-quick{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:9px}
        .tba-qbtn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:10px;padding:12px 13px;cursor:pointer;text-align:left;font-family:inherit;color:var(--dsw-alias-label-primary);transition:border-color .12s}
        .tba-qbtn:hover{border-color:var(--dsw-alias-brand-primary)}
        .tba-qbtn b{display:block;font-size:13.5px;font-weight:600}
        .tba-qbtn small{color:var(--dsw-alias-label-secondary);font-size:11.5px}
        .tba-footer{margin-top:26px;padding-top:14px;border-top:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font-size:11.5px}
        .tba-loading,.tba-error{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;color:var(--dsw-alias-label-secondary)}
        .tba-loading .tba-spin{font-size:30px;animation:tba-spin 3.4s linear infinite}
        @keyframes tba-spin{to{transform:rotate(360deg)}}
        .tba-kicker{font-size:12px;color:var(--dsw-alias-label-secondary);margin:0 0 8px}
        .tba-h3sm{margin:0 0 10px;font-size:15px;font-weight:650}
        .tba-era-strip{display:flex;height:28px;border-radius:7px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);margin:10px 0 6px;position:relative}
        .tba-era-playhead{position:absolute;top:0;bottom:0;width:2px;background:#fff;box-shadow:0 0 6px rgba(0,0,0,.55);pointer-events:none}
        .tba-era-seg{position:relative;font-size:10px;display:flex;align-items:center;justify-content:center;color:rgba(0,0,0,.72);font-weight:600;overflow:hidden;white-space:nowrap}
        .tba-era-seg.tba-stable{background:linear-gradient(180deg,#8fd6a6,#4fa86d)}
        .tba-era-seg.tba-chaotic{background:linear-gradient(180deg,#e8a06a,#c2543a);color:#2a1208}
        .tba-era-note{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
        .tba-stage{position:relative;background:#05070b;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;overflow:hidden;height:clamp(400px,42vw,620px)}
        .tba-stage-cta{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#a9b8cb;text-align:center;padding:0 24px}
        .tba-stage-cta .tba-btn{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.24);color:#e6eef8}
        .tba-stage-cta .tba-btn:hover:not(:disabled){border-color:#8fc7f0;color:#bfe2ff}
        .tba-stage svg{display:block;width:100%;height:100%}
        .tba-stage-meta{position:absolute;left:12px;top:10px;font-size:11.5px;color:#c9d6e6;font-family:ui-monospace,Consolas,monospace;line-height:1.7;text-shadow:0 1px 3px #000}
        .tba-stage-legend{position:absolute;right:12px;top:10px;font-size:11px;color:#a9b8cb;text-align:right;line-height:1.8}
        .tba-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:12px}
        .tba-metric{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:9px;padding:9px 12px}
        .tba-metric b{display:block;font-size:15px;font-weight:650;font-variant-numeric:tabular-nums}
        .tba-metric span{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
        .tba-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0 4px}
        .tba-slider{flex:1;min-width:160px;accent-color:var(--dsw-alias-brand-primary)}
        .tba-slider-row{display:flex;align-items:center;gap:10px;font-size:12.5px;margin-bottom:8px}
        .tba-slider-row label{width:120px;flex:0 0 120px;color:var(--dsw-alias-label-secondary)}
        .tba-slider-row output{width:52px;text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary)}
        .tba-subtabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
        .tba-panel{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:16px}
        .tba-panel h3{margin:0 0 6px;font-size:16px}
        .tba-verdict{margin-top:12px;padding:12px 14px;border-radius:9px;background:var(--dsw-alias-bg-layer-2);font-size:13px;line-height:1.75}
        .tba-chart{background:var(--dsw-alias-bg-layer-2);border-radius:9px;padding:10px}
        .tba-chart svg{display:block;width:100%;height:auto}
        .tba-scatter{display:flex;flex-wrap:wrap;gap:4px;margin-top:10px}
        .tba-scatter i{width:9px;height:9px;border-radius:2px;display:block}
        .tba-themecard{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:16px;margin-bottom:14px}
        .tba-themecard h3{margin:0 0 4px;font-size:16.5px}
        .tba-themecard .tba-q{color:var(--dsw-alias-brand-primary);font-size:13px;margin-bottom:10px}
        .tba-side{display:grid;grid-template-columns:110px 1fr;gap:10px;padding:9px 0;border-top:1px dashed var(--dsw-alias-border-l1);font-size:12.8px}
        .tba-side b{font-size:12.5px}
        .tba-side span{color:var(--dsw-alias-label-secondary)}
        .tba-gamestep{display:flex;gap:14px;margin-bottom:16px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:14px 16px}
        .tba-gamenum{flex:0 0 34px;height:34px;border-radius:50%;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px}
        .tba-gamestep h4{margin:0 0 3px;font-size:14.5px}
        .tba-gamestep p{margin:4px 0 0;font-size:12.8px;color:var(--dsw-alias-label-secondary)}
        .tba-gamestep .tba-insight{margin-top:8px;padding:8px 11px;background:var(--dsw-alias-bg-layer-2);border-radius:8px;font-size:12.4px;color:var(--dsw-alias-label-primary)}
        .tba-kv{display:flex;flex-wrap:wrap;gap:14px;font-size:12.5px;color:var(--dsw-alias-label-secondary);margin-top:6px}
        .tba-cat{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-left:3px solid var(--dsw-alias-state-warn-primary);border-radius:10px;padding:11px 13px;margin-bottom:9px}
        .tba-cat:hover{border-color:var(--dsw-alias-brand-primary)}
        .tba-cathead{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:4px}
        .tba-catkind{font-size:12.5px;font-weight:650}
        /* Keyed on the stable severity id, never the translated label: matching
           on prose would silently lose these colours in the English UI. */
        .tba-catkind[data-severity='devastating']{color:var(--dsw-alias-state-error-primary)}
        .tba-catkind[data-severity='lethal']{color:var(--dsw-alias-state-error-primary)}
        .tba-catkind[data-severity='extreme']{color:var(--dsw-alias-state-warn-primary)}
        .tba-catkind[data-severity='scorching']{color:var(--dsw-alias-state-warn-primary)}
        .tba-catwhen{font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
        .tba-cat p{margin:0;font-size:12.8px;color:var(--dsw-alias-label-secondary)}
        .tba-catdetail{margin-top:6px;font-size:11.5px;color:var(--dsw-alias-label-secondary);opacity:.85;font-variant-numeric:tabular-nums}
        .tba-generation{display:flex;gap:10px;align-items:flex-start;margin-bottom:9px}
        .tba-gennum{flex:0 0 30px;font-size:11.5px;font-weight:700;color:var(--dsw-alias-brand-primary);padding-top:2px}
        .tba-genbar{height:8px;border-radius:4px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;margin-bottom:4px}
        .tba-genbar i{display:block;height:100%;border-radius:4px}
        .tba-genmeta{font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
        .tba-readings{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}
        .tba-reading{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:12px 13px}
        .tba-readinghead{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;font-size:13px}
        .tba-reading p{margin:0;font-size:12.6px;color:var(--dsw-alias-label-secondary);line-height:1.7}
        .tba-badge.tba-good{color:var(--dsw-alias-state-success-primary)}
        .tba-benchrow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:7px;font-size:12px}
        .tba-benchfield{display:inline-flex;align-items:center;gap:4px}
        .tba-benchfield span{color:var(--dsw-alias-label-secondary);font-size:11px;width:16px}
        .tba-benchinput{width:76px;padding:4px 6px;font-size:12px;font-variant-numeric:tabular-nums}

        /* Spoiler picker */
        .tba-tier{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 14px}
        .tba-tierlabel{font-size:12px;color:var(--dsw-alias-label-secondary);margin-right:2px}
        .tba-tierbtn{font:inherit;font-size:12.5px;padding:5px 11px;border-radius:999px;cursor:pointer;
          border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);
          color:var(--dsw-alias-label-secondary);transition:all .15s}
        .tba-tierbtn:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}
        .tba-tierbtn.tba-on{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);
          color:var(--dsw-alias-label-onbrand, #fff);font-weight:600}
        .tba-tierhint{font-size:11.5px;color:var(--dsw-alias-label-secondary);opacity:.8;margin:-8px 0 14px}
        .tba-locked{position:relative;border-radius:10px;padding:12px 13px;
          border:1px dashed var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
        .tba-lockedmsg{display:flex;flex-wrap:wrap;gap:8px;align-items:center;
          font-size:12.5px;color:var(--dsw-alias-label-secondary)}
        .tba-lockedblur{filter:blur(4px);opacity:.4;pointer-events:none;user-select:none;
          font-size:12.6px;line-height:1.7;margin-top:6px}

        /* Reading guide */
        .tba-guide{margin-bottom:18px}
        .tba-guidehead{display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;margin-bottom:4px}
        .tba-guidehead h3{margin:0;font-size:15px}
        .tba-guideblurb{margin:0 0 10px;font-size:12.6px;color:var(--dsw-alias-label-secondary)}
        .tba-guidesteps{display:flex;flex-direction:column;gap:8px}
        .tba-guidestep{display:flex;gap:11px;align-items:flex-start;padding:11px 13px;border-radius:10px;
          border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
        .tba-guidestep.tba-done{border-color:var(--dsw-alias-state-success-primary);opacity:.85}
        .tba-guidestep.tba-lockedstep{opacity:.6}
        .tba-guidenum{flex:0 0 24px;height:24px;border-radius:50%;display:grid;place-items:center;
          font-size:11.5px;font-weight:700;background:var(--dsw-alias-bg-layer-2);
          color:var(--dsw-alias-label-secondary)}
        .tba-guidestep.tba-done .tba-guidenum{background:var(--dsw-alias-state-success-primary);
          color:var(--dsw-alias-label-onbrand, #fff)}
        .tba-guidebody{flex:1;min-width:0}
        .tba-guidetitle{font-size:13.5px;font-weight:650;margin-bottom:3px;display:flex;flex-wrap:wrap;gap:7px;align-items:center}
        .tba-guidewhy{margin:0;font-size:12.4px;color:var(--dsw-alias-label-secondary);line-height:1.65}
        .tba-guidecast{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
        .tba-guideprog{height:6px;border-radius:3px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;margin:8px 0 14px}
        .tba-guideprog i{display:block;height:100%;background:var(--dsw-alias-brand-primary);border-radius:3px}

        /* Character journey */
        .tba-journey{display:flex;flex-direction:column;gap:0}
        .tba-jnode{display:flex;gap:12px;padding:11px 0}
        .tba-jline{flex:0 0 14px;display:flex;flex-direction:column;align-items:center}
        .tba-jdot{width:9px;height:9px;border-radius:50%;background:var(--dsw-alias-border-l1);margin-top:5px}
        .tba-jdot[data-role='focus']{background:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px rgba(93,124,156,.18)}
        .tba-jdot[data-role='named']{background:var(--dsw-alias-state-warn-primary)}
        .tba-jstem{flex:1;width:1px;background:var(--dsw-alias-border-l1);margin-top:4px}
        .tba-jbody{flex:1;min-width:0}
        .tba-jtitle{font-size:13.2px;font-weight:620;margin-bottom:3px;display:flex;flex-wrap:wrap;gap:7px;align-items:center}
        .tba-jdesc{margin:0;font-size:12.5px;color:var(--dsw-alias-label-secondary);line-height:1.7}
        .tba-jmeta{font-size:11.5px;color:var(--dsw-alias-label-secondary);opacity:.85;margin-top:4px;
          font-variant-numeric:tabular-nums}
        .tba-jchapter{font-size:12.5px;font-weight:700;color:var(--dsw-alias-brand-primary);
          padding:14px 0 4px;border-bottom:1px solid var(--dsw-alias-border-l1);margin-bottom:4px}

        /* Concept graph */
        .tba-conceptgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:9px}
        .tba-conceptnode{text-align:left;font:inherit;cursor:pointer;padding:11px 12px;border-radius:10px;
          border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);transition:all .15s}
        .tba-conceptnode:hover{border-color:var(--dsw-alias-brand-primary)}
        .tba-conceptnode[data-kind='tech']{border-left:3px solid var(--dsw-alias-state-warn-primary)}
        .tba-conceptnode[data-kind='character']{border-left:3px solid var(--dsw-alias-brand-primary)}
        .tba-conceptnode[data-kind='place']{border-left:3px solid var(--dsw-alias-state-success-primary)}
        .tba-conceptname{font-size:13.2px;font-weight:640;margin-bottom:3px}
        .tba-conceptsum{margin:0;font-size:12.2px;color:var(--dsw-alias-label-secondary);line-height:1.6}
        .tba-conceptmeta{font-size:11px;color:var(--dsw-alias-label-secondary);opacity:.8;margin-top:5px}
        .tba-edge{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12.4px;
          padding:6px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
        .tba-edgearrow{color:var(--dsw-alias-label-secondary);opacity:.7}
      `
      document.head.appendChild(style)
      return () => {
        if (style.parentNode) style.parentNode.removeChild(style)
      }
    }

    /* ------------------------------------------------------------------ *
     * Spoiler picker
     * ------------------------------------------------------------------ */

    const TIER_KEYS = ['tierPrelude', 'tierB1', 'tierB2', 'tierB3']

    const TierPicker = ({ tiers, value, onChange, t }) => {
      const list = (tiers && tiers.length ? tiers : []).map((tier) => ({
        ...tier,
        label: t(TIER_KEYS[tier.tier] || 'tierAll'),
      }))
      return h('div', null,
        h('div', { className: 'tba-tier' },
          h('span', { className: 'tba-tierlabel' }, t('tierTitle')),
          ...list.map((tier) => h('button', {
            key: tier.tier,
            className: 'tba-tierbtn' + (value === tier.tier ? ' tba-on' : ''),
            onClick: () => onChange(tier.tier),
            title: tier.hint,
          }, tier.label)),
          h('button', {
            className: 'tba-tierbtn' + (value >= 3 ? ' tba-on' : ''),
            onClick: () => onChange(3),
          }, t('tierAll'))),
        h('div', { className: 'tba-tierhint' },
          value >= 3 ? t('tierHint') : t('tierCounts', {
            c: (list.find((x) => x.tier === value) || {}).characters || 0,
            e: (list.find((x) => x.tier === value) || {}).events || 0,
          })))
    }

    /**
     * Build flashcard questions from the data already in the bundle.
     *
     * Every question is derived — nothing here is authored per card — so the
     * quiz cannot drift from the atlas. Three shapes: identify a character from
     * its summary, identify a glossary term from its definition, identify a
     * technology from its summary.
     *
     * Two rules keep the questions honest:
     *  - the stem has the answer's name removed, or the card answers itself;
     *  - distractors come from the same faction/category first, so a wrong option
     *    is plausible rather than absurd, but only half the options are drawn
     *    that way so the right answer cannot be found by elimination.
     */
    const buildCards = (data, maxTier) => {
      if (!data) return []
      const cap = Number.isFinite(maxTier) ? maxTier : 3
      const cards = []
      // Records carry no `tier` field: the ceiling is applied by masking, not by
      // filtering the payload. Derive it from the works a record appears in so a
      // tier-1 reader is not quizzed on Death's End characters.
      const tierOfRecord = (record) => {
        const own = Number(record && record.tier)
        if (Number.isFinite(own)) return own
        // Glossary entries are keyed separately: they belong to no single work.
        const g = record && GLOSSARY_TIER[record.id]
        if (Number.isFinite(g) && (record.definition || record.term)) return g
        const works = record && record.works
        const ids = works && typeof works === 'object' ? Object.keys(works) : []
        const first = record && record.firstWork
        if (first) ids.push(first)
        let max = null
        for (const id of ids) {
          const t = Number(tierOfWork(id))
          if (!Number.isFinite(t)) continue
          if (max === null || t > max) max = t
        }
        return max
      }
      const tierOk = (record) => {
        const t = tierOfRecord(record)
        // A record whose tier cannot be derived (adaptation-only characters, for
        // instance) must not slip past every ceiling. Treat it as the highest
        // tier: a reader at tier 1 is not shown it, which is the safe direction
        // for a spoiler guard.
        return t === null ? cap >= 3 : t <= cap
      }
      // A tiny deterministic shuffle: the quiz must be reproducible in tests.
      const seeded = (list, seed) => {
        const out = list.slice()
        let s = seed || 1
        for (let i = out.length - 1; i > 0; i--) {
          s = (s * 1103515245 + 12345) & 0x7fffffff
          const j = s % (i + 1)
          const tmp = out[i]
          out[i] = out[j]
          out[j] = tmp
        }
        return out
      }
      const stripName = (text, name) => {
        if (!text || !name) return text || ''
        return String(text).split(name).join('＿＿')
      }

      const push = (kind, pool, record, answerField, stemField, groupKey) => {
        if (!tierOk(record)) return
        const answer = record[answerField]
        const rawStem = record[stemField]
        if (!answer || !rawStem) return
        const stem = stripName(rawStem, answer)
        // Too short after stripping means the name was most of the sentence.
        if (stem.replace(/＿/g, '').trim().length < 15) return
        const group = groupKey ? record[groupKey] : undefined
        const others = pool.filter((x) => x[answerField] && x[answerField] !== answer)
        const same = group ? others.filter((x) => x[groupKey] === group) : []
        const rest = others.filter((x) => !same.includes(x))
        // Half plausible, half random: same-group only would be solvable by
        // elimination, all-random would be trivially easy.
        const picks = []
        for (const candidate of seeded(same, answer.length + 7)) {
          if (picks.length >= 2) break
          picks.push(candidate[answerField])
        }
        for (const candidate of seeded(rest, answer.length + 13)) {
          if (picks.length >= 3) break
          if (!picks.includes(candidate[answerField])) picks.push(candidate[answerField])
        }
        if (picks.length < 3) return
        const options = seeded(picks.concat([answer]), answer.length + 29)
        cards.push({
          kind,
          id: record.id,
          stem: stem.trim(),
          answer,
          options,
          // The atlas entry this card came from, so a wrong answer can be opened.
          ref: record.id,
        })
      }

      for (const c of data.characters || []) {
        push('character', data.characters || [], c, 'name', 'summary', 'faction')
      }
      for (const g of data.glossary || []) {
        push('glossary', data.glossary || [], g, 'term', 'definition', 'category')
      }
      for (const t of data.tech || []) {
        push('tech', data.tech || [], t, 'name', 'summary', 'category')
      }
      return cards
    }

    /**
     * Reading progress, three states per work.
     *
     * Per work rather than per chapter: chapter divisions differ across editions,
     * so "chapter 12" would mean different things to different readers.
     * `reading` and `done` both unlock that work's tier.
     */
    const ProgressPicker = ({ data, t, progress, manual, onChange, onFollow }) => {
      const [open, setOpen] = React.useState(false)
      // The main three books are what a reader tracks; spin-offs and adaptations
      // follow from them and would only clutter the control.
      const tracked = (data.works || []).filter((w) => ['three-body', 'dark-forest', 'deaths-end'].includes(w.id))
      const states = ['unread', 'reading', 'done']
      const stateLabel = (s) => t(s === 'done' ? 'progressDone' : s === 'reading' ? 'progressReading' : 'progressUnread')
      const set = (id, state) => {
        const next = Object.assign({}, progress)
        if (state === 'unread') delete next[id]
        else next[id] = state
        onChange(next)
      }
      return h('div', { className: 'tba-progress' },
        h('button', {
          className: 'tba-progress-toggle' + (open ? ' tba-on' : ''),
          onClick: () => setOpen((v) => !v),
          'aria-expanded': open,
        }, '📖 ' + t('progressTitle')),
        manual ? h('span', { className: 'tba-progress-note' }, t('progressManual'), ' ',
          h('button', { className: 'tba-linkbtn', onClick: onFollow }, t('progressFollow'))) : null,
        open ? h('div', { className: 'tba-progress-body' },
          ...tracked.map((w) => h('div', { key: w.id, className: 'tba-progress-row' },
            h('span', { className: 'tba-progress-work' }, labelOf(w, 'title', 'titleEn')),
            h('div', { className: 'tba-progress-states' },
              ...states.map((s) => h('button', {
                key: s,
                className: 'tba-progress-state' + ((progress[w.id] || 'unread') === s ? ' tba-on' : ''),
                onClick: () => set(w.id, s),
              }, stateLabel(s))))))
        ) : null)
    }

    /** A masked block: shows that something exists without telling how it ends. */
    const Locked = ({ tier, t, onReveal, children }) => {
      const [open, setOpen] = React.useState(false)
      const label = t(TIER_KEYS[tier] || 'tierB3')
      if (open && children) return h('div', null,
        children,
        h('button', { className: 'tba-chip', style: { marginTop: 8 }, onClick: () => setOpen(false) },
          t('tierRestore')))
      return h('div', { className: 'tba-locked' },
        h('div', { className: 'tba-lockedmsg' },
          h('span', null, '🔒 ' + t('tierLocked', { label })),
          onReveal
            ? h('button', { className: 'tba-chip', onClick: onReveal }, t('tierUnlock'))
            : h('button', { className: 'tba-chip', onClick: () => setOpen(true) }, t('tierUnlock'))),
        h('div', { className: 'tba-lockedblur' }, '（剧透内容已遮蔽 · spoiler masked）'))
    }

    /* ------------------------------------------------------------------ *
     * Shared bits
     * ------------------------------------------------------------------ */
    const Crest = () => h('div', { className: 'tba-crest', title: 'Three-Body' }, '☄️')
    const Stat = ({ n, label }) => h('div', { className: 'tba-stat' }, h('b', null, String(n)), h('span', null, label))
    const FactionDot = ({ id, factions }) => {
      const f = (factions || []).find((x) => x.id === id)
      return h('span', { className: 'tba-dot', style: { background: f ? f.color : '#888' } })
    }
    const Empty = ({ t, icon }) => h('div', { className: 'tba-empty' },
      h('div', { className: 'tba-eicon' }, icon || '🛰️'),
      h('div', null, t('empty')),
      h('div', { style: { fontSize: 12, marginTop: 6 } }, t('emptyHint')))
    const Bar = ({ items, total }) => h('div', null, items.map((it) => h('div', { key: it.id || it.name, className: 'tba-barrow' },
      h('span', { title: it.name }, it.name),
      h('div', { className: 'tba-track' },
        h('div', { className: 'tba-bar' },
          h('i', { style: { width: Math.round((it.n / Math.max(1, total)) * 100) + '%', background: it.color || 'var(--dsw-alias-brand-primary)' } }))),
      h('span', null, String(it.n)))))

    /**
     * The canonical source layers are three, not "book vs screen": a character
     * that appears in both text and series is its own honest category, not an
     * adaptation warning.
     */
    const canonClass = (canon) => {
      const text = String(canon || '')
      if (/原著与剧集/.test(text)) return 'tba-badge tba-canon-both'
      if (/Netflix|腾讯|剧集|动画/.test(text)) return 'tba-badge tba-canon-adapt'
      if (/电影|改编/.test(text)) return 'tba-badge tba-canon-screen'
      return 'tba-badge tba-canon-book'
    }

    /**
     * Pick the field the active language should show.
     *
     * Eras and events carry an English name beside the Chinese one; every other
     * entity already did. Reading `x.name` directly is what left the timeline
     * entirely Chinese in an English UI, so the label goes through here.
     * Chinese is the default and returns the original field unchanged.
     */
    const labelOf = (record, zhField, enField) => {
      if (!record) return ''
      const en = record[enField]
      if (activeLang === 'en' && en) return en
      return record[zhField] || en || ''
    }
    const eraLabel = (era) => labelOf(era, 'name', 'nameEn')
    const eventLabel = (event) => labelOf(event, 'title', 'titleEn')

    /**
     * Spoiler tier of a work, mirrored from data/spoiler.js.
     *
     * Duplicated rather than imported because the client bundle has no module
     * system for the data package. Only the three books the progress control
     * tracks are needed; `three-body-x` and the adaptations map to the same
     * numbers upstream and are not read here.
     */
    const WORK_TIER = { 'ball-lightning': 0, 'three-body': 1, 'dark-forest': 2, 'deaths-end': 3 }
    const tierOfWork = (id) => (Object.prototype.hasOwnProperty.call(WORK_TIER, id) ? WORK_TIER[id] : undefined)

    /**
     * Spoiler tier per glossary entry, mirrored from data/spoiler.js.
     *
     * Glossary records carry no tier of their own and are not tied to a work, so
     * without this map every term would be askable at every level — which is how
     * a tier-0 reader would get quizzed on 黑暗森林. Same duplication rationale as
     * WORK_TIER above; a selfcheck asserts the two stay in step.
     */
    const GLOSSARY_TIER = {
      'dark-forest': 2, 'chain-of-suspicion': 2, 'technological-explosion': 2,
      'cosmic-sociology': 2, 'deterrence-degree': 2, 'cosmic-safety-statement': 3,
      'wallfacer-plan': 2, 'wall-breaker': 2, swordholder: 3,
      'guzheng-operation': 1, 'red-coast-project': 1, 'science-frontier': 1,
      'eto-factions': 1, 'space-force': 2, 'fleet-international': 2, pdc: 1, eto: 1,
      'bunker-plan': 3, 'black-domain-plan': 3, 'deterrence-era': 3, 'great-trough': 2,
      'beyond-time': 3, 'broadcast-era': 3, 'bunker-era': 3, 'sophon-blockade': 1,
      'human-computer-term': 1, 'thought-print-term': 2,
    }

    /**
     * Derive the spoiler ceiling from how far the reader says they have read.
     *
     * Granularity is per work, not per chapter: chapter divisions differ between
     * editions and translations, so a chapter number would mean different things
     * to different readers. `reading` and `done` both unlock that work; `unread`
     * never raises the ceiling.
     *
     * Returns a tier number, or null when no progress has been recorded — the
     * caller then keeps whatever the reader chose manually.
     */
    const tierFromProgress = (progress) => {
      if (!progress || typeof progress !== 'object') return null
      const ids = Object.keys(progress)
      if (!ids.length) return null
      let highest = null
      for (const id of ids) {
        const state = progress[id]
        if (state !== 'reading' && state !== 'done') continue
        const tier = Number(tierOfWork(id))
        if (!Number.isFinite(tier)) continue
        if (highest === null || tier > highest) highest = tier
      }
      return highest
    }

    /* ------------------------------------------------------------------ *
     * Export — turn what the reader sees into Markdown they can take away
     * ------------------------------------------------------------------ *
     *
     * These are pure functions on purpose: `__test__` exports them so the
     * self-check can assert the output without a browser. Keep them free of
     * DOM access, and keep them reading the *masked* payload — copying must not
     * reveal what the spoiler tier hid.
     */
    const mdHeading = (level, text) => (text ? '#'.repeat(level) + ' ' + String(text).trim() + '\n\n' : '')
    const mdLine = (label, value) => (value ? '**' + label + '**：' + String(value).trim() + '\n' : '')
    const mdQuote = (text, speaker, source) => {
      if (!text) return ''
      const body = String(text).trim().split('\n').map((line) => '> ' + line).join('\n')
      const tail = [speaker, source].filter(Boolean).join(' · ')
      return body + (tail ? '\n>\n> —— ' + tail : '') + '\n\n'
    }

    /**
     * One dossier as Markdown. `kind` picks the shape, exactly as the drawer does.
     * A masked record still produces its title and a line saying why the rest is
     * missing, so a copied file never silently looks complete.
     */
    const dossierToMarkdown = (kind, d, data) => {
      if (!d) return ''
      const name = d.name || d.term || d.title || ''
      const nameEn = d.nameEn || d.termEn || ''
      let out = mdHeading(1, name)
      if (nameEn) out += mdLine('English', nameEn)
      if (d.locked) {
        out += '> 该条目按剧透层级遮蔽，仅显示概要。\n\n'
        out += (d.summary || d.definition || '') + '\n'
        return out
      }
      if (kind === 'character') {
        if (d.alias && d.alias.length) out += mdLine('别名', d.alias.join('、'))
        if (d.factionLabel) out += mdLine('阵营', d.factionLabel)
        if (d.canon) out += mdLine('设定', d.canon)
        if (d.firstWork) out += mdLine('首次出场', d.firstWork)
        if (d.summary) out += '\n' + d.summary + '\n\n'
        if (d.details) out += mdHeading(2, '详情') + d.details + '\n\n'
        if (d.fate) out += mdHeading(2, '命运') + d.fate + '\n\n'
        if (d.relations && d.relations.length) {
          // A relation carries only the target id; resolve it so a copied file
          // reads as prose rather than as a list of slugs. Fall back to the id
          // when the target is outside the current dataset (a masked neighbour).
          const nameOf = (relation) => {
            if (relation.name) return relation.name
            const id = relation.to
            const list = (data && data.characters) || []
            const hit = list.find((c) => c.id === id)
            return (hit && hit.name) || id
          }
          out += mdHeading(2, '关系') + d.relations.map((r) => (
            '- **' + nameOf(r) + '**' + (r.label ? '（' + r.label + '）' : '')
          )).join('\n') + '\n\n'
        }
      } else if (kind === 'place') {
        if (d.type) out += mdLine('类型', d.type)
        if (d.region) out += mdLine('区域', d.region)
        if (d.canon) out += mdLine('设定', d.canon)
        if (d.summary) out += '\n' + d.summary + '\n\n'
        if (d.desc) out += d.desc + '\n\n'
        if (d.characters && d.characters.length) {
          out += mdHeading(2, '相关人物') + d.characters.map((c) => '- ' + (c.name || c.id)).join('\n') + '\n\n'
        }
      } else if (kind === 'tech') {
        if (d.category) out += mdLine('分类', d.category)
        if (d.era) out += mdLine('纪元', d.era)
        if (d.danger) out += mdLine('危险等级', d.danger)
        if (d.summary) out += '\n' + d.summary + '\n\n'
        if (d.desc) out += d.desc + '\n\n'
      } else {
        if (d.definition) out += '\n' + d.definition + '\n\n'
        else if (d.summary) out += '\n' + d.summary + '\n\n'
        if (d.desc) out += d.desc + '\n\n'
      }
      return out.trimEnd() + '\n'
    }

    /** A timeline slice as Markdown, grouped by era in the order given. */
    const timelineToMarkdown = (events, eras) => {
      if (!events || !events.length) return ''
      const byEra = new Map()
      for (const e of events) {
        if (!byEra.has(e.era)) byEra.set(e.era, [])
        byEra.get(e.era).push(e)
      }
      const order = (eras || []).map((x) => x.id)
      const ids = [...byEra.keys()].sort((a, b) => order.indexOf(a) - order.indexOf(b))
      let out = mdHeading(1, '三体 · 时间线')
      for (const id of ids) {
        const era = (eras || []).find((x) => x.id === id)
        out += mdHeading(2, era ? eraLabel(era) : id)
        for (const e of byEra.get(id)) {
          out += '- **' + (e.year || '') + '**　' + eventLabel(e) + '\n'
          if (e.desc) out += '  ' + e.desc + '\n'
        }
        out += '\n'
      }
      return out
    }

    /** A character's relationship path as one arrow chain. */
    const pathToMarkdown = (from, to, hops) => {
      if (!from || !to) return ''
      const chain = [from].concat((hops || []).map((h) => (h && (h.name || h.to)) || ''), [to])
      return mdHeading(1, '关系路径：' + from + ' → ' + to) + chain.join(' → ') + '\n'
    }

    /** Copy text, degrading through execCommand when the async API is missing. */
    const copyText = async (text) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text)
          return true
        } catch {
          // Fall through: some embeddings expose the API but deny the write.
        }
      }
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(area)
        return ok
      } catch {
        return false
      }
    }

    const renderDossierBody = ({ kind, payload: d, data, t, onOpen, onReveal }) => {
      // A locked record keeps its title so the reader knows the entry exists,
      // but every long field was stripped by the engine. Say so plainly rather
      // than rendering an empty dossier.
      if (d.locked) {
        const label = t(TIER_KEYS[d.tier] || 'tierB3')
        const title = d.name || d.term || d.title || ''
        return h(React.Fragment, null,
          h('h2', null, title),
          d.nameEn || d.termEn ? h('div', { className: 'tba-den' }, d.nameEn || d.termEn) : null,
          h(Locked, { tier: d.tier, t, onReveal },
            h('div', { className: 'tba-section' },
              h('p', { className: 'tba-p' }, d.summary || d.definition || ''))))
      }
      if (kind === 'place') {
        return h(React.Fragment, null,
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h('span', { className: canonClass(d.canon) }, d.canon),
            h('span', { className: 'tba-badge' }, d.type)),
          h('h2', null, d.name),
          h('div', { className: 'tba-den' }, d.nameEn + ' · ' + d.region),
          h('div', { className: 'tba-section' },
            h('h4', null, t('dossier')),
            h('p', { className: 'tba-p' }, d.summary),
            d.desc ? h('p', { className: 'tba-p', style: { marginTop: 8 } }, d.desc) : null),
          h('div', { className: 'tba-section' }, h('h4', null, t('placesOf')),
            ...d.characters.map((c) => h('div', {
              key: c.id, className: 'tba-miniitem', onClick: () => onOpen('character', c.id),
            },
              h(FactionDot, { id: c.faction || (data.characters.find((x) => x.id === c.id) || {}).faction, factions: data.factions }),
              h('div', null, h('b', null, c.name), h('small', null, c.factionLabel || ''))))))
      }

      if (kind === 'tech') {
        return h(React.Fragment, null,
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h('span', { className: 'tba-badge' }, d.tier),
            h('span', { className: 'tba-badge' }, d.category),
            h('span', { className: 'tba-badge' }, d.era)),
          h('h2', null, d.name),
          h('div', { className: 'tba-den' }, d.nameEn),
          h('div', { className: 'tba-section' },
            h('h4', null, t('dossier')),
            h('p', { className: 'tba-p' }, d.summary),
            h('p', { className: 'tba-p', style: { marginTop: 8 } }, d.desc),
            h('p', { className: 'tba-p', style: { marginTop: 8 } },
              h('b', null, t('dangerLabel') + '：'), '☠️'.repeat(Math.max(0, Math.min(5, d.danger || 0))))),
          d.relatedCharacters && d.relatedCharacters.length
            ? h('div', { className: 'tba-section' }, h('h4', null, t('themePeople')),
              ...d.relatedCharacters.map((c) => h('div', {
                key: c.id, className: 'tba-miniitem', onClick: () => onOpen('character', c.id),
              }, h('div', null, h('b', null, c.name), h('small', null, c.factionLabel || '')))))
            : null,
          d.relatedTech && d.relatedTech.length
            ? h('div', { className: 'tba-section' }, h('h4', null, t('artifactsOf')),
              ...d.relatedTech.map((x) => h('div', {
                key: x.id, className: 'tba-miniitem', onClick: () => onOpen('tech', x.id),
              }, h('div', null, h('b', null, x.name), h('small', null, x.tier || '')))))
            : null)
      }

      if (kind === 'glossary') {
        return h(React.Fragment, null,
          h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
            h('span', { className: 'tba-badge' }, d.category)),
          h('h2', null, d.term),
          h('div', { className: 'tba-den' }, d.termEn || ''),
          h('div', { className: 'tba-section' },
            h('p', { className: 'tba-p' }, d.definition),
            h('p', { className: 'tba-p', style: { marginTop: 8 } }, d.detail)),
          d.related && d.related.length
            ? h('div', { className: 'tba-section' }, h('h4', null, t('relations')),
              ...d.related.map((r) => h('div', {
                key: r.id, className: 'tba-miniitem',
                onClick: () => onOpen(r.kindKey || 'glossary', r.id),
              }, h('div', null,
                h('b', null, r.name),
                h('small', null, r.locked
                  ? '🔒 ' + t('tierLocked', { label: t(TIER_KEYS[r.tier] || 'tierB3') })
                  : (r.kind || ''))))))
            : null)
      }

      // character
      const alias = d.alias && d.alias.length ? ' · ' + t('alias') + '：' + d.alias.join('、') : ''
      return h(React.Fragment, null,
        h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
          h(FactionDot, { id: d.faction, factions: data.factions }),
          h('span', { className: 'tba-badge' }, d.factionLabel),
          h('span', { className: 'tba-badge' }, d.kind),
          h('span', { className: canonClass(d.canon) }, d.canon)),
        h('h2', null, d.name),
        h('div', { className: 'tba-den' }, d.nameEn + alias),
        h('div', { className: 'tba-section' },
          h('h4', null, t('dossier')),
          h('p', { className: 'tba-p' }, d.summary),
          d.details ? h('p', { className: 'tba-p', style: { marginTop: 8 } }, d.details) : null,
          d.fate ? h('p', { className: 'tba-p', style: { marginTop: 8 } },
            h('b', null, t('fate') + '：'), d.fate) : null),
        h('div', { className: 'tba-section' }, h('h4', null, t('relations')),
          d.relations.length
            ? d.relations.map((r) => h('div', { key: r.to, className: 'tba-relitem' },
              h('span', {
                className: 'tba-reltype',
                style: { background: (data.relationTypes[r.type] || {}).color || '#888' },
              }, r.typeLabel),
              h('div', null,
                h('b', { style: { cursor: 'pointer' }, onClick: () => onOpen('character', r.to) }, r.name),
                r.locked
                  ? h('small', null, '🔒 ' + t('tierLocked', { label: t(TIER_KEYS[r.tier] || 'tierB3') }))
                  : h('small', null, r.label))))
            : h('p', { className: 'tba-p' }, t('noRelations'))),
        h('div', { className: 'tba-section' }, h('h4', null, t('works')),
          ...d.works.map((w) => h('div', { key: w.id, className: 'tba-workitem' },
            h('div', null, h('b', null, w.title), h('small', null, w.role + (w.year ? ' · ' + w.year : '')))))),
        d.places.length
          ? h('div', { className: 'tba-section' }, h('h4', null, t('placesOf')),
            ...d.places.map((p) => h('div', {
              key: p.id, className: 'tba-miniitem', onClick: () => onOpen('place', p.id),
            }, h('div', null, h('b', null, p.name), h('small', null, p.type)))))
          : null,
        d.artifacts.length
          ? h('div', { className: 'tba-section' }, h('h4', null, t('artifactsOf')),
            ...d.artifacts.map((a) => h('div', {
              key: a.id, className: 'tba-miniitem', onClick: () => onOpen('tech', a.id),
            }, h('div', null, h('b', null, a.name), h('small', null, a.tier || a.summary)))))
          : null,
        d.quotes.length
          ? h('div', { className: 'tba-section' }, h('h4', null, t('quotesOf')),
            ...d.quotes.map((q) => h('div', { key: q.id, className: 'tba-quote' },
              '“' + q.text + '”',
              h('cite', null, q.context + ' · ' + (q.workTitle || q.work)))))
          : null,
        d.themes.length
          ? h('div', { className: 'tba-section' }, h('h4', null, t('themesOf')),
            ...d.themes.map((th) => h('div', { key: th.id, className: 'tba-relitem' },
              h('div', null, h('b', null, th.title), h('small', null, th.question)))))
          : null,
        d.appearances.length
          ? h('div', { className: 'tba-section' }, h('h4', null, t('appearances')),
            ...d.appearances.map((e) => h('div', { key: e.id, className: 'tba-eventitem' },
              h('div', null, h('b', null, e.title), h('small', null, e.age + ' · ' + e.year)))))
          : null)
    }

    const Drawer = ({ kind, id, data, t, tier, onClose, onOpen }) => {
      const [payload, setPayload] = React.useState(null)
      const [failed, setFailed] = React.useState(false)
      // Per-dossier override: a reader may choose to see one entry in full
      // without lowering the ceiling for the whole app.
      const [revealed, setRevealed] = React.useState(false)
      // 'ok' | 'fail' | null — transient feedback for the copy button.
      const [copied, setCopied] = React.useState(null)

      React.useEffect(() => { setRevealed(false) }, [kind, id])

      React.useEffect(() => {
        let alive = true
        setPayload(null); setFailed(false)
        const path = kind === 'place' ? PLACE_PATH : kind === 'tech' ? TECH_PATH
          : kind === 'glossary' ? GLOSSARY_PATH : DETAIL_PATH
        const cap = revealed ? 3 : (tier == null ? 3 : tier)
        getJSON(path + '?id=' + encodeURIComponent(id) + '&maxTier=' + cap)
          .then((d) => { if (alive) { if (d && d.error) setFailed(true); else setPayload(d) } })
          .catch(() => { if (alive) setFailed(true) })
        return () => { alive = false }
      }, [kind, id, tier, revealed])

      React.useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])

      let body
      if (failed) body = h('div', { className: 'tba-error', style: { height: 'auto', paddingTop: 40 } }, t('errorTitle'))
      else if (!payload) {
        body = h('div', { className: 'tba-loading', style: { height: 'auto', paddingTop: 40 } },
          h('div', { className: 'tba-spin' }, '🛰️'), h('div', null, t('loading')))
      } else body = renderDossierBody({
        kind, payload, data, t, onOpen,
        onReveal: payload && payload.locked ? () => setRevealed(true) : null,
      })

      return h('div', { className: 'tba-drawer-back', onClick: onClose },
        h('div', {
          className: 'tba-drawer',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': t('dossier'),
          ref: (node) => { if (node && !node.__focused) { node.__focused = true; try { node.focus() } catch { /* ignore */ } } },
          tabIndex: -1,
          onClick: (e) => e.stopPropagation(),
        },
          h('button', { className: 'tba-drawer-close', onClick: onClose, 'aria-label': t('close') }, '×'),
          payload && !failed ? h('button', {
            className: 'tba-drawer-copy',
            title: t('copyMarkdown'),
            'aria-label': t('copyMarkdown'),
            onClick: async (e) => {
              e.stopPropagation()
              // Copy what is on screen: a masked dossier stays masked in the
              // export, so a copied file never looks more complete than the panel.
              const ok = await copyText(dossierToMarkdown(kind, payload, data))
              setCopied(ok ? 'ok' : 'fail')
              setTimeout(() => setCopied(null), 1600)
            },
          }, copied === 'ok' ? t('copied') : copied === 'fail' ? t('copyFailed') : '⧉ ' + t('copyMarkdown')) : null,
          body))
    }

    /* ------------------------------------------------------------------ *
     * Overview
     * ------------------------------------------------------------------ */
    const OverviewTab = ({ data, t, go, open }) => {
      const c = data.counts
      const eraBar = h(Bar, { items: c.byEra.map((e) => ({ id: e.id, name: labelOf(e, 'name', 'nameEn'), n: e.n })), total: Math.max(1, c.events) })
      const canonBar = h(Bar, {
        items: Object.entries(c.byCanon).filter(([, n]) => n).map(([name, n]) => ({ id: name, name, n })),
        total: c.characters,
      })
      const quick = (tab, emoji, label, detail) => h('button', {
        className: 'tba-qbtn', onClick: () => go(tab),
      }, h('b', null, emoji + ' ' + label), h('small', null, detail))

      const quote = data.quotes.length ? data.quotes[Math.floor(Date.now() / 86400000) % data.quotes.length] : null

      return h(React.Fragment, null,
        h('div', { className: 'tba-intro' },
          h('div', { style: { fontSize: 16, fontWeight: 650, color: 'var(--dsw-alias-label-primary)', marginBottom: 6 } }, t('ovWelcome')),
          t('ovIntro')),
        // The entry points come before the statistics: a reader who opened the
        // panel for the first time needs somewhere to go, not a census.
        h('div', { style: { marginBottom: 20 } },
          h('h3', { className: 'tba-h3sm' }, '🧭 ' + t('ovStartHere')),
          h('div', { className: 'tba-quick' },
            quick('plot', '📖', t('tabPlot'), t('ovWorks') + '：' + c.works),
            quick('characters', '👤', t('tabCharacters'), t('ovCharacters') + '：' + c.characters),
            quick('graph', '🕸️', t('tabGraph'), t('ovRelations') + '：' + c.relations),
            quick('timeline', '📜', t('tabTimeline'), t('ovEvents') + '：' + c.events),
            quick('sim', '☄️', t('tabSim'), t('ovSimTeaser')),
            quick('themes', '⚖️', t('tabThemes'), t('ovThemes') + '：' + c.themes))),
        h('div', { className: 'tba-stats' },
          h(Stat, { n: c.characters, label: t('ovCharacters') }),
          h(Stat, { n: c.relations, label: t('ovRelations') }),
          h(Stat, { n: c.events, label: t('ovEvents') }),
          h(Stat, { n: c.tech, label: t('ovTech') }),
          h(Stat, { n: c.places, label: t('ovPlaces') }),
          h(Stat, { n: c.quotes, label: t('ovQuotes') }),
          h(Stat, { n: c.themes, label: t('ovThemes') })),
        h('div', { className: 'tba-two' },
          h('div', null,
            h('h3', { className: 'tba-h3sm' }, '📜 ' + t('ovEras')),
            eraBar),
          h('div', null,
            h('h3', { className: 'tba-h3sm' }, '🎬 ' + t('ovCanon')),
            canonBar,
            h('p', { className: 'tba-kicker', style: { marginTop: 10 } }, t('ovCanonNote')))),
        quote
          ? h('div', { style: { marginTop: 24 } },
            h('h3', { className: 'tba-h3sm' }, '✨ ' + t('ovToday')),
            h('div', { className: 'tba-quote' },
              '“' + quote.text + '”',
              h('cite', null, '— ' + (data.characters.find((x) => x.id === quote.speaker) || {}).name
                + ' · ' + quote.context)))
          : null)
    }

    /* ------------------------------------------------------------------ *
     * Plot
     * ------------------------------------------------------------------ */
    const PlotTab = ({ data, t, open }) => {
      // Default to the first novel instead of dumping 46 beats at once; the
      // "all works" chip is still one click away.
      const firstWork = data.plot.length ? data.plot[0].work : ''
      const [work, setWork] = React.useState(firstWork)
      const plots = work ? data.plot.filter((p) => p.work === work) : data.plot

      const chips = h('div', { className: 'tba-chips' },
        h('button', {
          className: 'tba-chip' + (work === '' ? ' tba-on' : ''),
          onClick: () => setWork(''),
        }, t('allWorks')),
        ...data.works.filter((w) => data.plot.some((p) => p.work === w.id)).map((w) => h('button', {
          key: w.id,
          className: 'tba-chip' + (work === w.id ? ' tba-on' : ''),
          onClick: () => setWork(w.id),
        }, w.title)))

      const blocks = plots.map((p) => {
        const beats = p.beats.map((b, i) => h('li', { key: b.id, 'data-step': i + 1 },
          h('b', null, b.title),
          h('p', null, b.desc),
          h('p', {
            style: { fontSize: 11.5, color: 'var(--dsw-alias-brand-primary)', marginTop: 3 },
          }, (b.eraName || '') + (b.event ? ' · ' + b.event.year : '')),
          b.people && b.people.length
            ? h('p', { style: { fontSize: 11.5, marginTop: 2 } }, '👥 ' + b.people.join(' · '))
            : null))
        return h('div', { key: p.work, style: { marginBottom: 22 } },
          h('h3', { className: 'tba-h3sm' }, p.name || p.workTitle),
          h('ol', { className: 'tba-steps' }, ...beats))
      })

      return h(React.Fragment, null,
        chips,
        h('p', { className: 'tba-kicker' }, t('plotHint')),
        ...blocks)
    }

    /* ------------------------------------------------------------------ *
     * Characters
     * ------------------------------------------------------------------ */
    const CharactersTab = ({ data, t, open, go }) => {
      const [query, setQuery] = React.useState('')
      const [faction, setFaction] = React.useState('')
      const [work, setWork] = React.useState('')
      const [kind, setKind] = React.useState('')
      const [remote, setRemote] = React.useState(null)
      const [busy, setBusy] = React.useState(false)

      React.useEffect(() => {
        let alive = true
        const q = query.trim()
        if (!q) { setRemote(null); setBusy(false); return undefined }
        setBusy(true)
        getJSON(BASE + '/search-all?q=' + encodeURIComponent(q))
          .then((r) => { if (alive) { setRemote(r); setBusy(false) } })
          .catch(() => { if (alive) { setRemote(null); setBusy(false) } })
        return () => { alive = false }
      }, [query])

      const characters = React.useMemo(() => {
        const q = query.trim().toLowerCase()
        return data.characters.filter((c) => {
          if (faction && c.faction !== faction) return false
          if (work && !(c.works && c.works[work])) return false
          if (kind && c.kind !== kind) return false
          if (q) {
            const hay = [c.name, c.nameEn, ...(c.alias || []), c.factionLabel, c.summary, ...(c.tags || [])]
              .join(' ').toLowerCase()
            if (!hay.includes(q)) return false
          }
          return true
        })
      }, [data.characters, query, faction, work, kind])

      const kinds = React.useMemo(() => [...new Set(data.characters.map((c) => c.kind))], [data.characters])
      const clear = () => { setQuery(''); setFaction(''); setWork(''); setKind('') }
      const hasFilter = Boolean(query || faction || work || kind)

      const cards = characters.map((c) => h('div', {
        key: c.id, className: 'tba-card', onClick: () => open('character', c.id),
      },
        h('div', { className: 'tba-card-top' },
          h(FactionDot, { id: c.faction, factions: data.factions }),
          h('h3', null, c.name)),
        h('div', { className: 'tba-en' }, c.nameEn + ' · ' + c.factionLabel),
        h('p', null, c.summary),
        h('div', { className: 'tba-tagrow' },
          h('span', { className: 'tba-badge' }, c.kind),
          ...(c.tags || []).slice(0, 2).map((tag) => h('span', { key: tag, className: 'tba-tag' }, tag)))))

      // Every group the Host returns must be clickable. Places, technologies and
      // glossary terms open their dossier; events, themes and works route to the
      // tab that owns them. A card that does nothing is worse than no card.
      const OPENABLE = new Set(['place', 'tech', 'glossary'])
      const otherGroups = remote && remote.groups ? remote.groups.filter((g) => g.kind !== 'character') : []
      const otherBlocks = otherGroups.map((g) => {
        const items = g.items.map((it) => {
          const action = OPENABLE.has(g.kind)
            ? () => open(g.kind, it.id)
            : g.kind === 'event' ? () => go('timeline')
              : g.kind === 'theme' ? () => go('themes')
                : g.kind === 'work' ? () => go('plot')
                  : null
          return h('div', {
            key: it.id,
            className: 'tba-card' + (action ? '' : ' tba-flat'),
            role: action ? 'button' : undefined,
            tabIndex: action ? 0 : undefined,
            onClick: action || undefined,
            onKeyDown: action ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action() } } : undefined,
          },
            h('h3', null, it.name),
            h('div', { className: 'tba-en' }, (it.nameEn || '') + (it.type ? ' · ' + it.type : '')),
            h('p', null, it.summary),
            action ? null : h('div', { className: 'tba-tag' }, t('noResults')))
        })
        return h('div', { key: g.kind, style: { marginBottom: 16 } },
          h('h3', { className: 'tba-h3sm' }, g.label + '（' + g.items.length + '）'),
          h('div', { className: 'tba-grid' }, ...items))
      })

      const toolbar = h('div', { className: 'tba-toolbar' },
        h('input', {
          className: 'tba-input tba-grow', value: query, placeholder: t('searchPlaceholder'),
          onChange: (e) => setQuery(e.target.value),
        }),
        h('select', { className: 'tba-select', value: faction, onChange: (e) => setFaction(e.target.value) },
          h('option', { value: '' }, t('allFactions')),
          ...data.factions.map((f) => h('option', { key: f.id, value: f.id }, f.name))),
        h('select', { className: 'tba-select', value: work, onChange: (e) => setWork(e.target.value) },
          h('option', { value: '' }, t('allWorks')),
          ...data.works.map((w) => h('option', { key: w.id, value: w.id }, w.title))),
        h('select', { className: 'tba-select', value: kind, onChange: (e) => setKind(e.target.value) },
          h('option', { value: '' }, t('allKinds')),
          ...kinds.map((k) => h('option', { key: k, value: k }, k))))

      return h(React.Fragment, null,
        toolbar,
        h('div', { className: 'tba-chips' },
          h('span', { className: 'tba-badge' }, busy ? t('askThinking') : t('resultCount', { n: characters.length })),
          hasFilter ? h('button', { className: 'tba-chip', onClick: clear }, t('clearFilters')) : null),
        characters.length === 0 ? h(Empty, { t }) : h('div', { className: 'tba-grid' }, ...cards),
        otherGroups.length > 0 ? h('div', { style: { marginTop: 22 } }, ...otherBlocks) : null)
    }

    /* ------------------------------------------------------------------ *
     * Relationship graph + path finder
     * ------------------------------------------------------------------ */
    const GraphTab = ({ data, t, open }) => {
      const [focus, setFocus] = React.useState('')
      const [graph, setGraph] = React.useState(null)
      const [faction, setFaction] = React.useState('')
      const [view, setView] = React.useState({ x: 0, y: 0, k: 1 })
      const [hover, setHover] = React.useState(null)
      const [, bump] = React.useReducer((v) => v + 1, 0)
      const drag = React.useRef(null)
      const pan = React.useRef(null)

      React.useEffect(() => {
        let alive = true
        setGraph(null)
        const params = []
        if (focus) params.push('focus=' + encodeURIComponent(focus))
        if (faction) params.push('faction=' + encodeURIComponent(faction))
        getJSON(GRAPH_PATH + (params.length ? '?' + params.join('&') : ''))
          .then((g) => { if (alive) { setGraph(g); setView({ x: 0, y: 0, k: 1 }) } })
          .catch(() => { if (alive) setGraph(null) })
        return () => { alive = false }
      }, [focus, faction])

      // Deterministic force layout: seeded on a circle, then relaxed. Runs once
      // per payload so dragging never fights the physics.
      const layout = React.useMemo(() => {
        if (!graph || !graph.nodes.length) return { nodes: [], edges: [] }
        const W = 1000
        const H = 600
        const n = graph.nodes.length
        const nodes = graph.nodes.map((node, i) => {
          const angle = (i / Math.max(1, n)) * Math.PI * 2
          const r = Math.min(W, H) * (0.3 + (i % 3) * 0.04)
          return { ...node, x: W / 2 + Math.cos(angle) * r, y: H / 2 + Math.sin(angle) * r, vx: 0, vy: 0 }
        })
        const byId = {}
        nodes.forEach((node) => { byId[node.id] = node })
        const edges = graph.edges.map((e) => ({ ...e, a: byId[e.source], b: byId[e.target] }))
          .filter((e) => e.a && e.b)

        for (let step = 0; step < 260; step++) {
          for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i]
            for (let j = i + 1; j < nodes.length; j++) {
              const b = nodes[j]
              let dx = a.x - b.x
              let dy = a.y - b.y
              let d2 = dx * dx + dy * dy
              if (d2 < 1) { dx = 1; dy = 1; d2 = 2 }
              const d = Math.sqrt(d2)
              const rep = Math.min(26, 4800 / d2)
              const fx = (dx / d) * rep
              const fy = (dy / d) * rep
              a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
            }
          }
          for (const e of edges) {
            const dx = e.b.x - e.a.x
            const dy = e.b.y - e.a.y
            const d = Math.max(1, Math.sqrt(dx * dx + dy * dy))
            const force = (d - 96) * 0.011
            const fx = (dx / d) * force
            const fy = (dy / d) * force
            e.a.vx += fx; e.a.vy += fy; e.b.vx -= fx; e.b.vy -= fy
          }
          for (const node of nodes) {
            node.vx += (W / 2 - node.x) * 0.0022
            node.vy += (H / 2 - node.y) * 0.0022
            node.vx *= 0.85; node.vy *= 0.85
            node.x = Math.max(48, Math.min(W - 48, node.x + node.vx))
            node.y = Math.max(42, Math.min(H - 42, node.y + node.vy))
          }
        }
        return { nodes, edges }
      }, [graph])

      // Pointer handlers (below) cover mouse, touch and pen; the old
      // mouse-only handlers were removed so a tablet can drag the graph.
      const onWheel = (e) => {
        e.preventDefault()
        const factor = e.deltaY < 0 ? 1.12 : 0.89
        setView((v) => ({ ...v, k: Math.max(0.3, Math.min(2.8, v.k * factor)) }))
      }
      const zoom = (factor) => setView((v) => ({ ...v, k: Math.max(0.3, Math.min(2.8, v.k * factor)) }))

      // Touch and pen: pointer events cover mouse, touch and stylus, so dragging
      // works on a tablet without a separate touch handler.
      const pointOf = (e) => ({ x: e.clientX, y: e.clientY })
      const onPointerDown = (e, node) => {
        if (node) e.stopPropagation()
        try { if (e.currentTarget && e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
        const p = pointOf(e)
        if (node) drag.current = { node, sx: p.x, sy: p.y, ox: node.x, oy: node.y }
        else { pan.current = { sx: p.x, sy: p.y, x: view.x, y: view.y }; drag.current = null }
      }
      const onPointerMove = (e) => {
        if (!drag.current && !pan.current) return
        const p = pointOf(e)
        if (drag.current) {
          const d = drag.current
          d.node.x = d.ox + (p.x - d.sx) / view.k
          d.node.y = d.oy + (p.y - d.sy) / view.k
          bump()
        } else {
          const q = pan.current
          setView((v) => ({ ...v, x: q.x + (p.x - q.sx), y: q.y + (p.y - q.sy) }))
        }
      }
      const onPointerUp = () => { drag.current = null; pan.current = null }

      const dim = (node) => Boolean(faction) && node.faction !== faction

      const toolbar = h('div', { className: 'tba-toolbar' },
        h('select', { className: 'tba-select', value: focus, onChange: (e) => setFocus(e.target.value) },
          h('option', { value: '' }, t('graphAll')),
          ...data.characters.map((c) => h('option', { key: c.id, value: c.id }, c.name))),
        h('select', { className: 'tba-select', value: faction, onChange: (e) => setFaction(e.target.value) },
          h('option', { value: '' }, t('graphHighlight')),
          ...data.factions.map((f) => h('option', { key: f.id, value: f.id }, f.name))),
        h('button', {
          className: 'tba-btn',
          onClick: () => { setFocus(''); setFaction(''); setView({ x: 0, y: 0, k: 1 }) },
        }, t('graphReset')),
        h('button', { className: 'tba-btn', onClick: () => zoom(1.25), 'aria-label': t('graphZoomIn') }, '＋'),
        h('button', { className: 'tba-btn', onClick: () => zoom(0.8), 'aria-label': t('graphZoomOut') }, '－'))

      let canvas
      if (!graph) {
        canvas = h('div', { className: 'tba-graphwrap' }, h('div', { className: 'tba-empty' }, t('graphLoading')))
      } else if (!layout.nodes.length) {
        canvas = h('div', { className: 'tba-graphwrap' }, h('div', { className: 'tba-empty' }, t('graphEmpty')))
      } else {
        const edgeEls = layout.edges.map((e, i) => h('line', {
          key: 'e' + i,
          x1: e.a.x, y1: e.a.y, x2: e.b.x, y2: e.b.y,
          stroke: e.color,
          strokeOpacity: dim(e.a) || dim(e.b) ? 0.05 : 0.36,
          strokeWidth: 1.3,
        }))
        const nodeEls = layout.nodes.map((node) => {
          const isFocus = focus === node.id
          const radius = isFocus ? 15 : hover && hover.id === node.id ? 13 : 7 + Math.min(6, node.degree / 3)
          return h('g', {
            key: node.id,
            className: 'tba-node',
            transform: 'translate(' + node.x + ',' + node.y + ')',
            opacity: dim(node) ? 0.14 : 1,
            onPointerDown: (e) => onPointerDown(e, node),
            onMouseEnter: () => setHover(node),
            onMouseLeave: () => setHover(null),
            onClick: () => setFocus(node.id),
            onDoubleClick: () => open('character', node.id),
          },
            h('circle', {
              r: radius,
              fill: node.factionColor,
              stroke: isFocus ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-bg-base)',
              strokeWidth: isFocus ? 3 : 1.6,
            }),
            h('text', { x: 0, y: -radius - 8, textAnchor: 'middle' }, node.label))
        })
        canvas = h('div', { className: 'tba-graphwrap' },
          h('svg', {
            viewBox: '0 0 1000 600',
            role: 'application',
            'aria-label': t('graphHint'),
            tabIndex: 0,
            onPointerDown: (e) => onPointerDown(e, null),
            onPointerMove: onPointerMove,
            onPointerUp: onPointerUp,
            onPointerLeave: onPointerUp,
            onWheel,
            onKeyDown: (e) => {
              if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(1.2) }
              else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoom(0.83) }
              else if (e.key === '0') { e.preventDefault(); setView({ x: 0, y: 0, k: 1 }) }
            },
          },
            h('g', { transform: 'translate(' + view.x + ',' + view.y + ') scale(' + view.k + ')' },
              ...edgeEls, ...nodeEls)))
      }

      const legend = h('div', { className: 'tba-legend' },
        ...data.factions.map((f) => h('span', { key: f.id }, h('i', { style: { background: f.color } }), f.name)))

      return h(React.Fragment, null,
        toolbar,
        h('p', { className: 'tba-kicker' }, t('graphHint')),
        canvas,
        legend,
        hover ? h('div', {
          style: { marginTop: 10, fontSize: 12.5, color: 'var(--dsw-alias-label-secondary)' },
        },
          h('b', { style: { color: 'var(--dsw-alias-label-primary)' } }, hover.label),
          ' · ' + t('graphDegree', { n: hover.degree }) + ' · ' + hover.summary) : null,
        h(PathFinder, { t }))
    }

    const PathFinder = ({ t }) => {
      const [from, setFrom] = React.useState('')
      const [to, setTo] = React.useState('')
      const [result, setResult] = React.useState(null)
      const [busy, setBusy] = React.useState(false)

      const find = async () => {
        if (!from.trim() || !to.trim()) return
        setBusy(true); setResult(null)
        try {
          setResult(await getJSON(PATH_PATH + '?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to)))
        } catch {
          setResult({ ok: false, error: t('askFail') })
        } finally { setBusy(false) }
      }

      let body = null
      if (result) {
        if (!result.ok) body = h('div', null, result.error || t('pathNotFound'))
        else if (result.hops === 0) body = h('div', null, t('pathSame'))
        else {
          body = h(React.Fragment, null,
            h('div', { style: { fontWeight: 600, marginBottom: 6 } }, t('pathHops', { n: result.hops })),
            ...result.steps.map((s, i) => h('div', { key: i, className: 'tba-hop' },
              h('b', null, s.from),
              h('span', { className: 'tba-arrow' }, '—[' + s.label + ']→'),
              h('b', null, s.to))))
        }
      }

      return h('div', { className: 'tba-pathbox' },
        h('h4', null, '🔗 ' + t('pathTool')),
        h('div', { className: 'tba-pathrow' },
          h('input', {
            className: 'tba-input', value: from, placeholder: t('pathPlaceholder'),
            onChange: (e) => setFrom(e.target.value),
          }),
          h('span', { className: 'tba-arrow' }, '→'),
          h('input', {
            className: 'tba-input', value: to, placeholder: t('pathPlaceholder'),
            onChange: (e) => setTo(e.target.value),
          }),
          h('button', { className: 'tba-btn tba-primary', onClick: find, disabled: busy },
            busy ? t('askThinking') : t('pathFind'))),
        h('div', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12, marginTop: 7 } }, t('pathHint')),
        body ? h('div', { className: 'tba-pathresult' }, body) : null)
    }

    /* ------------------------------------------------------------------ *
     * Chronology
     * ------------------------------------------------------------------ */
    const TimelineTab = ({ data, t }) => {
      const [era, setEra] = React.useState('')
      const [majorOnly, setMajorOnly] = React.useState(true)
      const inEra = era ? data.events.filter((e) => e.era === era) : data.events
      // 52 events in one column is a wall. Start on the turning points and let
      // the reader ask for the rest.
      const events = majorOnly && inEra.some((e) => (e.importance || 0) >= 3)
        ? inEra.filter((e) => (e.importance || 0) >= 3)
        : inEra
      const nameOf = (id) => {
        const c = data.characters.find((x) => x.id === id)
        return c ? c.name : id
      }

      const chips = h('div', { className: 'tba-chips' },
        h('button', {
          className: 'tba-chip' + (era === '' ? ' tba-on' : ''),
          onClick: () => setEra(''),
        }, t('allEras')),
        ...data.eras.map((e) => h('button', {
          key: e.id,
          className: 'tba-chip' + (era === e.id ? ' tba-on' : ''),
          onClick: () => setEra(e.id),
        }, eraLabel(e))),
        h('button', {
          className: 'tba-chip' + (majorOnly ? ' tba-on' : ''),
          onClick: () => setMajorOnly((v) => !v),
        }, majorOnly ? '★ ' + t('simMajor') + '：' + t('timelineOnlyMajor') : t('timelineAll')),
        h('span', { className: 'tba-badge' }, t('resultCount', { n: events.length })))

      const eraInfo = era ? data.eras.find((e) => e.id === era) : null

      const rows = events.map((e) => {
        const major = (e.importance || 0) >= 3
        const people = (e.characters || []).map(nameOf).join(' · ')
        return h('div', { key: e.id, className: 'tba-ev' + (major ? ' tba-major' : '') },
          h('div', { className: 'tba-evhead' },
            h('span', { className: 'tba-age' }, e.eraName || e.era),
            h('span', { className: 'tba-year' }, e.year),
            major ? h('span', { className: 'tba-badge' }, '★ ' + t('simMajor')) : null),
          h('h3', null, eventLabel(e)),
          h('p', null, e.desc),
          people ? h('div', { className: 'tba-people' }, '👥 ' + people) : null)
      })

      return h(React.Fragment, null,
        h('p', { className: 'tba-kicker' }, t('timelineHint')),
        chips,
        eraInfo ? h('div', { className: 'tba-intro', style: { marginBottom: 14 } },
          h('b', null, eraLabel(eraInfo) + ' · ' + eraInfo.range), h('div', null, eraInfo.desc)) : null,
        h('div', { className: 'tba-timeline' }, ...rows))
    }

    /* ------------------------------------------------------------------ *
     * The in-novel game
     * ------------------------------------------------------------------ */
    const GameTab = ({ data, t }) => {
      const levels = data.gameLevels || []
      if (!levels.length) return h(Empty, { t })
      return h(React.Fragment, null,
        h('p', { className: 'tba-kicker' }, t('gameHint')),
        ...levels.map((l) => h('div', { key: l.id, className: 'tba-gamestep' },
          h('div', { className: 'tba-gamenum' }, String(l.order)),
          h('div', { style: { flex: 1, minWidth: 0 } },
            h('h4', null, l.title),
            h('div', { className: 'tba-kv' },
              l.progress ? h('span', null, '🕹️ ' + l.progress) : null,
              l.avatars && l.avatars.length ? h('span', null, '👥 ' + l.avatars.join('、')) : null),
            l.scene ? h('p', null, '🎬 ' + l.scene) : null,
            h('p', null, l.desc),
            l.insight ? h('div', { className: 'tba-insight' }, '💡 ' + t('gameInsight') + '：' + l.insight) : null))))
    }
    /* ------------------------------------------------------------------ *
     * Simulation lab
     * ------------------------------------------------------------------ */
    const fmt = (n, digits) => {
      if (!Number.isFinite(n)) return '—'
      const abs = Math.abs(n)
      if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) return n.toExponential(2)
      return n.toFixed(digits === undefined ? 2 : digits)
    }

    /** Animated canvas: plays recorded frames, drawn as SVG for crispness. */
    const OrbitStage = ({ result, preset, t, busy, onRun, seek, onTime, fullTrail, onToggleTrail }) => {
      const [frame, setFrame] = React.useState(0)
      const [playing, setPlaying] = React.useState(true)
      const timer = React.useRef(null)

      React.useEffect(() => {
        setFrame(0); setPlaying(true)
      }, [result])

      React.useEffect(() => {
        if (!result || !playing || !result.frames || result.frames.length < 2) return undefined
        timer.current = setInterval(() => {
          setFrame((f) => (f + 1 >= result.frames.length ? 0 : f + 1))
        }, 40)
        return () => clearInterval(timer.current)
      }, [result, playing])

      // Seeking from the era strip: jump to the frame nearest that time and
      // pause, so the reader can look at the sky they just clicked on.
      React.useEffect(() => {
        if (!seek || !result || !result.frames || !result.frames.length) return
        let best = 0
        let bestGap = Infinity
        result.frames.forEach((f, i) => {
          const gap = Math.abs(f.t - seek.t)
          if (gap < bestGap) { bestGap = gap; best = i }
        })
        setPlaying(false)
        setFrame(best)
      }, [seek && seek.nonce])

      const current = result && result.frames && result.frames.length
        ? result.frames[Math.min(frame, result.frames.length - 1)]
        : null

      React.useEffect(() => {
        if (onTime && current) onTime(current.t)
      }, [current && current.t])

      // ---- Camera measurement -------------------------------------------
      // Hooks must run unconditionally, in the same order on every render. The
      // empty branch below returns early, so these three have to be declared
      // before it — placing them after it changed the hook count between the
      // idle and playing states and blanked the whole page with "Rendered more
      // hooks than during the previous render".
      const stageRef = React.useRef(null)
      const [box, setBox] = React.useState({ w: 1000, h: 600 })
      React.useEffect(() => {
        const el = stageRef.current
        if (!el || typeof ResizeObserver === 'undefined') return undefined
        const measure = () => {
          const r = el.getBoundingClientRect()
          if (!(r.width > 0) || !(r.height > 0)) return
          // Fix the *height* at 600 and derive the width from the true aspect.
          // Deriving the height instead would need a lower clamp, and on a very
          // wide stage that clamp would re-introduce the letterbox this change
          // exists to remove.
          const w = Math.round(Math.max(600, Math.min(3600, (r.width / r.height) * 600)))
          setBox((prev) => (prev.w === w ? prev : { w, h: 600 }))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
      }, [])

      if (!result || !result.frames || !result.frames.length) {
        // The empty stage is the natural place for the primary action: before
        // the first run, the only useful thing to do is start one.
        return h('div', { className: 'tba-stage tba-stage-empty', ref: stageRef },
          h('div', { className: 'tba-stage-cta' },
            h('div', { style: { fontSize: 30, marginBottom: 8 } }, busy ? '⏳' : '🪐'),
            h('div', { style: { fontSize: 13.5, marginBottom: 12 } },
              busy ? t('simRunning') : t('simIdle')),
            h('button', {
              className: 'tba-btn tba-primary', onClick: onRun, disabled: busy || !preset,
            }, busy ? t('simRunning') : '▶ ' + t('simRun'))))
      }

      // ---- Camera -------------------------------------------------------
      // The stage is far wider than it is tall, but the viewBox used to be a
      // fixed 1000×600. With preserveAspectRatio="meet" that letterboxed the
      // drawing into the middle 37% of the stage, and because the SVG painted
      // its own gradient only inside the letterbox, the leftover strips showed
      // the stage's *different* CSS gradient — two dark bands down either side.
      // Measure the real box and build the viewBox to match it, so the scene
      // covers the stage exactly and the fit uses the height it really has.
      const W = box.w
      const H = box.h
      const liveFrames = result.frames
      // Frame the *bound* system. A body that has been ejected is drawn clamped
      // at the edge, so including it in the fit would zoom the real orbits away.
      const ejectedIds = new Set((result.metrics.ejected || []).map((e) => e.id))
      let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity
      for (const snapshot of liveFrames) {
        for (const body of snapshot.bodies) {
          if (body.dead || ejectedIds.has(body.id)) continue
          if (body.x < minX) minX = body.x
          if (body.x > maxX) maxX = body.x
          if (body.y < minY) minY = body.y
          if (body.y > maxY) maxY = body.y
        }
      }
      if (!Number.isFinite(minX)) {
        // Everything was ejected: fall back to the raw extremes so the frame is
        // still showing something recognisable.
        for (const snapshot of liveFrames) {
          for (const body of snapshot.bodies) {
            if (body.dead) continue
            if (body.x < minX) minX = body.x
            if (body.x > maxX) maxX = body.x
            if (body.y < minY) minY = body.y
            if (body.y > maxY) maxY = body.y
          }
        }
      }
      if (!Number.isFinite(minX)) { minX = -1; maxX = 1; minY = -1; maxY = 1 }
      const centreX = (minX + maxX) / 2
      const centreY = (minY + maxY) / 2
      // Bounding-box fit: scale by whichever axis is binding, so the system
      // uses as much of the stage as it can without cropping a body or
      // distorting the orbits. Using a single min(W,H) term assumed a square
      // box and left most of a wide stage empty.
      const spanX = Math.max(0.7, maxX - minX)
      const spanY = Math.max(0.7, maxY - minY)
      const halfSpan = Math.max(spanX, spanY) / 2
      const fitScale = Math.min((W * 0.94) / spanX, (H * 0.94) / spanY)
      const toSvgX = (x) => W / 2 + (x - centreX) * fitScale
      const toSvgY = (y) => H / 2 - (y - centreY) * fitScale

      // ---- Trails -------------------------------------------------------
      // Two modes: the live "comet tail" (history up to the playhead) and the
      // full trajectory (the entire integrated path). A three-body orbit only
      // reads as an orbit when you can see the whole curve, so the full mode
      // is what most readers actually want after the first run.
      const trailFrom = 0
      const trailTo = fullTrail
        ? liveFrames.length - 1
        : Math.min(frame, liveFrames.length - 1)
      const trailStride = Math.max(1, Math.ceil((trailTo - trailFrom + 1) / 700))
      const trails = {}
      for (let i = trailFrom; i <= trailTo; i += trailStride) {
        const snapshot = liveFrames[i]
        if (!snapshot) continue
        for (const body of snapshot.bodies) {
          if (body.dead) continue
          trails[body.id] = trails[body.id] || []
          trails[body.id].push([toSvgX(body.x), toSvgY(body.y)])
        }
      }

      // Frames deliberately carry only {id, kind, x, y, dead} — repeating the
      // static metadata in all 521 of them was most of the payload. The draw
      // radius and colour live once in result.bodies, so join them back by id
      // here. Reading them off the frame body instead yielded undefined, which
      // made discRadius NaN; SVG treats r="NaN" as invalid and skips the whole
      // <circle>, so every star and the planet silently vanished.
      const metaById = new Map((result.bodies || []).map((b) => [b.id, b]))
      const FALLBACK_COLOR = '#9fb4cc'
      const bodyEls = current.bodies.filter((b) => !b.dead).map((b) => {
        const meta = metaById.get(b.id) || {}
        const color = meta.color || FALLBACK_COLOR
        const trail = trails[b.id] || []
        // A draw radius in viewBox units would shrink as the camera zooms out,
        // so scale the marker with the fitted span: stars stay legible in a
        // wide system and do not balloon in a tight one.
        const baseRadius = Number.isFinite(meta.radius) ? meta.radius : 4
        const zoom = Math.min(1.9, Math.max(0.55, 3.1 / Math.max(0.35, halfSpan)))
        const discRadius = (b.kind === 'planet'
          ? Math.max(2.6, baseRadius * 0.55)
          : Math.max(4.5, Math.min(15, baseRadius * 0.9))) * zoom
        const cx = toSvgX(b.x)
        const cy = toSvgY(b.y)
        // Clamp the marker to the frame so a body outside the 98% fit stays
        // visible at the edge instead of silently vanishing.
        const clampedX = Math.max(8, Math.min(W - 8, cx))
        const clampedY = Math.max(8, Math.min(H - 8, cy))
        const offscreen = clampedX !== cx || clampedY !== cy
        return h('g', { key: b.id },
          trail.length > 1
            ? h('polyline', {
              points: trail.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '),
              fill: 'none', stroke: color, strokeOpacity: 0.55,
              strokeWidth: b.kind === 'planet' ? 1.8 : 1.5, strokeLinejoin: 'round',
              strokeLinecap: 'round',
            })
            : null,
          // The head of the trail, so the current position is unmistakable.
          h('circle', { cx: clampedX, cy: clampedY, r: discRadius * 2.6, fill: color, opacity: 0.13 }),
          h('circle', {
            cx: clampedX, cy: clampedY, r: discRadius,
            fill: color,
            opacity: offscreen ? 0.55 : 1,
            stroke: offscreen ? color : 'rgba(0,0,0,.35)',
            strokeWidth: offscreen ? 1.6 : 0.8,
            strokeDasharray: offscreen ? '2 2' : undefined,
          }))
      })

      const speed = result.frames.length > 1
        ? Math.min(1, frame / (result.frames.length - 1))
        : 0

      return h(React.Fragment, null,
        h('div', { className: 'tba-stage', ref: stageRef },
          h('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet' },
            h('defs', null,
              h('radialGradient', { id: 'tba-bg', cx: '50%', cy: '45%', r: '70%' },
                h('stop', { offset: '0', stopColor: '#16233a' }),
                h('stop', { offset: '0.55', stopColor: '#0b1018' }),
                h('stop', { offset: '1', stopColor: '#05070b' }))),
            h('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#tba-bg)' }),
            ...Array.from({ length: 90 }, (_, i) => h('circle', {
              key: 'star' + i,
              cx: (i * 137.5) % W,
              cy: (i * 89.3) % H,
              r: (i % 4) * 0.35 + 0.5,
              fill: '#c9d6e6',
              opacity: 0.16 + (i % 5) * 0.06,
            })),
            // Faint reference circles make the scale legible. Radius follows
            // the fitted system, not the box, so they read as distance rings.
            ...Array.from({ length: 3 }, (_, i) => h('circle', {
              key: 'ring' + i,
              cx: W / 2, cy: H / 2,
              r: halfSpan * fitScale * (0.36 + i * 0.32),
              fill: 'none', stroke: '#5d7c9c', strokeOpacity: 0.12, strokeWidth: 0.8,
            })),
            ...bodyEls),
          h('div', { className: 'tba-stage-meta' },
            h('div', null, 't = ' + fmt(current.t, 2) + ' / ' + fmt(result.metrics.time, 2)),
            h('div', null, (preset && preset.name) || ''),
            h('div', { style: { opacity: 0.62 } },
              t('simScale', { span: (halfSpan * 2).toFixed(1) }))),
          h('div', { className: 'tba-stage-legend' },
            ...current.bodies.filter((b) => !b.dead).map((b) => {
              const meta = metaById.get(b.id) || {}
              return h('div', { key: b.id },
                h('span', { style: { color: meta.color || FALLBACK_COLOR } }, '●'),
                ' ' + (meta.name || b.id))
            })),
          result.metrics.ejected.length
            ? h('div', { className: 'tba-stage-meta', style: { left: 'auto', right: 12, top: 'auto', bottom: 10 } },
              t('simEjected', { n: result.metrics.ejected.length }))
            : null),
        h('div', { className: 'tba-controls' },
          h('button', { className: 'tba-btn tba-primary', onClick: () => setPlaying((p) => !p) },
            playing ? '⏸ ' + t('simPause') : '▶ ' + t('simPlay')),
          h('button', { className: 'tba-btn', onClick: () => setFrame(0) }, '↺ ' + t('simReplay')),
          h('input', {
            className: 'tba-slider', type: 'range', min: 0, max: Math.max(0, result.frames.length - 1),
            value: frame, onChange: (e) => { setPlaying(false); setFrame(Number(e.target.value)) },
          }),
          h('span', { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', width: 46, textAlign: 'right' } },
            Math.round(speed * 100) + '%'),
          h('button', {
            className: 'tba-btn',
            onClick: onToggleTrail,
            'aria-pressed': Boolean(fullTrail),
          }, (fullTrail ? '◉ ' : '○ ') + t('simTrailAll'))))
    }

    const EraStrip = ({ eras, t, onSeek, currentTime }) => {
      if (!eras || !eras.length) return null
      const total = eras.reduce((n, e) => n + Math.max(0.001, e.duration), 0)
      const playhead = Number.isFinite(currentTime) && total > 0
        ? Math.max(0, Math.min(100, (currentTime / total) * 100))
        : null
      return h(React.Fragment, null,
        h('div', { className: 'tba-era-strip', role: 'group', 'aria-label': t('simEras') },
          ...eras.map((e, i) => h('div', {
            key: i,
            className: 'tba-era-seg ' + (e.kind === 'stable' ? 'tba-stable' : 'tba-chaotic'),
            style: { width: (Math.max(0.001, e.duration) / total) * 100 + '%', cursor: onSeek ? 'pointer' : 'default' },
            title: e.label + ' · ' + e.duration + (e.star ? ' · ' + e.star : ''),
            onClick: onSeek ? () => onSeek(e.start) : undefined,
          }, e.duration > total * 0.06 ? e.label : '')),
          playhead === null ? null : h('div', { className: 'tba-era-playhead', style: { left: playhead + '%' } })),
        h('div', { className: 'tba-era-note' },
          t('simEraCount', {
            stable: eras.filter((e) => e.kind === 'stable').length,
            chaotic: eras.filter((e) => e.kind === 'chaotic').length,
          }) + (onSeek ? ' · ' + t('simSeekHint') : '')))
    }

    /* ------------------------------------------------------------------ *
     * Analysis charts
     *
     * Small inline SVG charts. Each draws a series the Host actually
     * computed: no decorative sparklines.
     * ------------------------------------------------------------------ */

    /** Generic line chart over an arbitrary series. */
    const LineChart = ({ points, xOf, yOf, width = 620, height = 150, stroke, labelX, labelY, fillOpacity = 0 }) => {
      if (!points || points.length < 2) return null
      const xs = points.map(xOf)
      const ys = points.map(yOf)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const spanX = (maxX - minX) || 1
      const spanY = (maxY - minY) || 1
      const toX = (v) => ((v - minX) / spanX) * (width - 8) + 4
      const toY = (v) => height - 6 - ((v - minY) / spanY) * (height - 14)
      const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + toX(xOf(p)).toFixed(1) + ',' + toY(yOf(p)).toFixed(1)).join(' ')
      const area = path + ' L' + toX(maxX).toFixed(1) + ',' + (height - 6) + ' L' + toX(minX).toFixed(1) + ',' + (height - 6) + ' Z'
      return h('div', { className: 'tba-chart' },
        h('svg', { viewBox: '0 0 ' + width + ' ' + height, preserveAspectRatio: 'none', style: { height } },
          h('line', { x1: 4, y1: height - 6, x2: width - 4, y2: height - 6, stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 1 }),
          fillOpacity > 0 ? h('path', { d: area, fill: stroke, opacity: fillOpacity, stroke: 'none' }) : null,
          h('path', { d: path, fill: 'none', stroke, strokeWidth: 1.8, strokeLinejoin: 'round' })),
        h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
          h('span', null, labelX || ''), h('span', null, labelY || '')))
    }

    /** Planet phase portrait: position and velocity, i.e. the state orbit. */
    const PhasePortrait = ({ phase, t, width = 300, height = 300 }) => {
      if (!phase || phase.length < 3) {
        return h('div', { className: 'tba-empty', style: { padding: 24 } }, t('simNoPhase'))
      }
      // Two panels side by side: (x,y) orbit and (vx,vy) velocity space. A
      // periodic system closes both; a chaotic one closes neither.
      const panel = (ax, ay, title, color) => {
        const xs = phase.map(ax)
        const ys = phase.map(ay)
        const minX = Math.min(...xs); const maxX = Math.max(...xs)
        const minY = Math.min(...ys); const maxY = Math.max(...ys)
        const spanX = (maxX - minX) || 1
        const spanY = (maxY - minY) || 1
        const pad = 10
        const w = width
        const hgt = height
        const toX = (v) => ((v - minX) / spanX) * (w - pad * 2) + pad
        const toY = (v) => hgt - pad - ((v - minY) / spanY) * (hgt - pad * 2)
        const d = phase.map((p, i) => (i === 0 ? 'M' : 'L') + toX(ax(p)).toFixed(1) + ',' + toY(ay(p)).toFixed(1)).join(' ')
        const head = phase[phase.length - 1]
        return h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { style: { fontSize: 11.5, color: 'var(--dsw-alias-label-secondary)', marginBottom: 4 } }, title),
          h('svg', { viewBox: '0 0 ' + w + ' ' + hgt, style: { width: '100%', height: 'auto', background: 'var(--dsw-alias-bg-layer-2)', borderRadius: 8 } },
            h('path', { d, fill: 'none', stroke: color, strokeWidth: 1.2, strokeOpacity: 0.75 }),
            h('circle', { cx: toX(ax(head)), cy: toY(ay(head)), r: 3.4, fill: color })))
      }
      return h('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap' } },
        panel((p) => p.x, (p) => p.y, t('simPhasePosition'), '#6fc3d9'),
        panel((p) => p.vx, (p) => p.vy, t('simPhaseVelocity'), 'var(--dsw-alias-brand-primary)'))
    }

    /** Era strip rendered as a radiation history with the labels below. */
    const FluxChart = ({ track, eras, t, width = 620, height = 130 }) => {
      if (!track || track.length < 3) return null
      const fluxes = track.map((p) => p.flux)
      const maxF = Math.max(...fluxes)
      const minF = Math.min(...fluxes)
      const spanF = (maxF - minF) || 1
      const tMax = track[track.length - 1].t || 1
      const toX = (time) => (time / tMax) * (width - 8) + 4
      const toY = (f) => height - 8 - ((f - minF) / spanF) * (height - 16)
      const d = track.map((p, i) => (i === 0 ? 'M' : 'L') + toX(p.t).toFixed(1) + ',' + toY(p.flux).toFixed(1)).join(' ')
      return h('div', { className: 'tba-chart' },
        h('svg', { viewBox: '0 0 ' + width + ' ' + height, preserveAspectRatio: 'none', style: { height } },
          ...(eras || []).map((e, i) => h('rect', {
            key: 'era' + i,
            x: toX(e.start), y: 4,
            width: Math.max(1, toX(e.end) - toX(e.start)),
            height: height - 12,
            fill: e.kind === 'stable' ? 'rgba(79,168,109,.16)' : 'rgba(194,84,58,.16)',
          })),
          h('path', { d, fill: 'none', stroke: 'var(--dsw-alias-brand-primary)', strokeWidth: 1.8 })),
        h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } }, t('simFluxHint')))
    }

    /** Catastrophe log plus the civilization ledger. */
    const CatastrophePanel = ({ result, t, onSeek }) => {
      const cats = result.catastrophes || []
      const civ = result.civilizations || { timeline: [], generations: 0, hasPlanet: false }
      return h('div', { className: 'tba-two' },
        h('div', null,
          h('h3', { className: 'tba-h3sm' }, '💥 ' + t('simCatastrophes')),
          cats.length
            ? h('div', null, ...cats.map((c, i) => h('div', {
              key: i,
              className: 'tba-cat',
              onClick: onSeek ? () => onSeek(c.t) : undefined,
              style: onSeek ? { cursor: 'pointer' } : undefined,
            },
              h('div', { className: 'tba-cathead' },
                h('span', { className: 'tba-catkind', 'data-severity': c.severity }, c.kindLabel || c.kind),
                h('span', { className: 'tba-catwhen' }, 't=' + c.t + (c.duration ? ' · ' + t('simDuration') + ' ' + c.duration : '')),
                h('span', { className: 'tba-badge' }, c.severityLabel || c.severity)),
              h('p', null, c.text),
              h('div', { className: 'tba-catdetail' }, c.detail))))
            : h('p', { className: 'tba-kicker' }, t('simNoCats')))
        ,
        h('div', null,
          h('h3', { className: 'tba-h3sm' }, '🏛️ ' + t('simCivilizations')),
          h('p', { className: 'tba-kicker' }, civ.headline || ''),
          civ.generations
            ? h('div', { style: { marginTop: 8 } },
              ...civ.timeline.map((g) => h('div', { key: g.generation, className: 'tba-generation' },
                h('span', { className: 'tba-gennum' }, '#' + g.generation),
                h('div', { style: { flex: 1, minWidth: 0 } },
                  h('div', { className: 'tba-genbar' },
                    h('i', {
                      style: {
                        width: Math.min(100, (g.duration / Math.max(0.001, civ.timeline.reduce((n, x) => Math.max(n, x.duration), 1))) * 100) + '%',
                        background: g.survived
                          ? 'var(--dsw-alias-state-success-primary)'
                          : 'var(--dsw-alias-state-error-primary)',
                      },
                    })),
                  h('div', { className: 'tba-genmeta' },
                    't=' + g.start + ' → ' + g.end + '（' + g.duration + '）'
                    + (g.star ? ' · 主星 ' + g.star : '')
                    + (g.endedBy ? ' · 终结于' + g.endedBy : ' · 熬到乱纪元'))))))
            : null))
    }

    /* ------------------------------------------------------------------ *
     * Reading panel — the four angles the Host derived from this run
     * ------------------------------------------------------------------ */
    const ReadingPanel = ({ result, t }) => {
      if (!result.reading || !result.reading.length) return null
      return h('div', { className: 'tba-readings' },
        ...result.reading.map((angle) => h('div', { key: angle.id, className: 'tba-reading' },
          h('div', { className: 'tba-readinghead' },
            h('b', null, angle.title),
            /* `tone` is a stable id from the engine; matching the verdict text
               would break as soon as the label is translated. */
            h('span', { className: 'tba-badge' + (angle.tone === 'good' ? ' tba-good' : '') }, angle.verdict)),
          h('p', null, angle.text))))
    }

    /* PART_CHARTS */
    const OrbitPanel = ({ presets, t }) => {
      const [presetId, setPresetId] = React.useState(presets && presets[0] ? presets[0].id : '')
      const [result, setResult] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [failed, setFailed] = React.useState(false)
      const [playTime, setPlayTime] = React.useState(0)
      const [seekState, setSeekState] = React.useState(null)
      const [fullTrail, setFullTrail] = React.useState(true)
      // Parameter bench: per-body initial state overrides plus integration knobs.
      const [overrides, setOverrides] = React.useState({})
      const [steps, setSteps] = React.useState(0)
      const [showBench, setShowBench] = React.useState(false)

      const preset = (presets || []).find((p) => p.id === presetId) || (presets || [])[0]

      const run = async (extra) => {
        if (!preset) return
        setBusy(true); setFailed(false); setSeekState(null); setPlayTime(0)
        const bodies = Object.entries(overrides)
          .map(([id, patch]) => ({ id, ...patch }))
        try {
          setResult(await getJSON(SIM_PATH, Object.assign({
            preset: preset.id,
            bodies: bodies.length ? bodies : undefined,
            params: steps > 0 ? { steps } : undefined,
          }, extra || {})))
        } catch {
          setFailed(true); setResult(null)
        } finally { setBusy(false) }
      }

      const patchBody = (id, key, value) => {
        setOverrides((prev) => {
          const next = { ...prev }
          next[id] = { ...(next[id] || {}), [key]: value }
          return next
        })
      }

      const seedBodies = preset ? preset.bodies : []
      const seek = (time) => {
        setSeekState({ t: time, nonce: Date.now() })
        if (typeof document !== 'undefined') {
          const node = document.querySelector('.tba-stage')
          if (node && node.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }

      return h('div', null,
        h('p', { className: 'tba-kicker' }, t('simHint')),
        h('div', { className: 'tba-chips' },
          ...(presets || []).map((p) => h('button', {
            key: p.id,
            className: 'tba-chip' + (p.id === presetId ? ' tba-on' : ''),
            onClick: () => { setPresetId(p.id); setResult(null); setOverrides({}) },
          }, p.name))),
        preset ? h('div', { className: 'tba-intro', style: { padding: '11px 14px', fontSize: 12.8 } }, preset.desc) : null,
        failed ? h('div', { className: 'tba-verdict' }, t('errorTitle') + ' — ' + t('errorHint')) : null,
        h('div', { className: 'tba-panel', style: { marginBottom: 12 } },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 } },
            h('b', { style: { fontSize: 13.5 } }, '🎛️ ' + t('simBench')),
            h('button', {
              className: 'tba-chip' + (showBench ? ' tba-on' : ''),
              onClick: () => setShowBench((v) => !v),
            }, showBench ? t('simBenchClose') : t('simBenchOpen'))),
          showBench
            ? h('div', { style: { marginTop: 12 } },
              h('p', { className: 'tba-kicker' }, t('simBenchHint')),
              h('div', { className: 'tba-slider-row' },
                h('label', null, t('simBenchSteps')),
                h('input', {
                  className: 'tba-slider', type: 'range', min: 800, max: 12000, step: 200,
                  value: steps || (preset && preset.params ? preset.params.steps : 5200),
                  onChange: (e) => setSteps(Number(e.target.value)),
                }),
                h('output', null, String(steps || (preset && preset.params ? preset.params.steps : 5200)))),
              ...seedBodies.map((b) => h('div', { key: b.id, className: 'tba-benchrow' },
                h('span', { className: 'tba-dot', style: { background: b.color } }),
                h('b', { style: { minWidth: 74 } }, b.name),
                ...['x', 'y', 'vx', 'vy'].map((key) => h('label', { key, className: 'tba-benchfield' },
                  h('span', null, key),
                  h('input', {
                    className: 'tba-input tba-benchinput',
                    type: 'number', step: '0.05',
                    value: (overrides[b.id] && overrides[b.id][key] !== undefined)
                      ? overrides[b.id][key]
                      : Number(b[key]).toFixed(3),
                    onChange: (e) => patchBody(b.id, key, Number(e.target.value)),
                  }))))),
              h('div', { className: 'tba-controls', style: { marginTop: 6 } },
                h('button', {
                  className: 'tba-btn tba-primary', disabled: busy,
                  onClick: () => run(),
                }, busy ? t('simRunning') : '▶ ' + t('simRunWithParams')),
                h('button', {
                  className: 'tba-btn',
                  onClick: () => { setOverrides({}); setSteps(0) },
                }, t('simBenchReset'))))
            : null),
        h(OrbitStage, {
          result, preset, t, busy,
          onRun: () => run(),
          seek: seekState,
          onTime: (time) => setPlayTime(time),
          fullTrail,
          onToggleTrail: () => setFullTrail((v) => !v),
        }),
        busy
          ? h('div', { className: 'tba-kicker', style: { marginTop: 8 } },
            '⏳ ' + t('simRunning') + ' · ' + (preset ? preset.name : ''))
          : null,
        result
          ? h(React.Fragment, null,
            h('div', { className: 'tba-metrics' },
              h('div', { className: 'tba-metric' }, h('b', null, fmt(result.metrics.integratorDrift * 100, 3) + '%'), h('span', null, t('simEnergy'))),
              h('div', { className: 'tba-metric' }, h('b', null, String(result.metrics.bodiesLeft)), h('span', null, t('simBodies'))),
              h('div', { className: 'tba-metric' }, h('b', null, String(result.metrics.steps)), h('span', null, t('simSteps'))),
              h('div', { className: 'tba-metric' }, h('b', null, fmt(result.metrics.time, 2)), h('span', null, t('simSpan'))),
              h('div', { className: 'tba-metric' }, h('b', null, '1/' + fmt(result.metrics.substepRatio, 2)), h('span', null, t('simSubsteps'))),
              h('div', { className: 'tba-metric' }, h('b', null, fmt(result.metrics.angularDrift * 100, 4) + '%'), h('span', null, t('simAngular')))),
            h('div', { style: { marginTop: 14 } },
              h('h3', { className: 'tba-h3sm' }, '🕰️ ' + t('simEras')),
              h(EraStrip, {
                eras: result.eras,
                t,
                currentTime: playTime,
                onSeek: (time) => setSeekState({ t: time, nonce: Date.now() }),
              }),
              h('div', { className: 'tba-verdict' }, result.summary),
              result.events.length
                ? h('div', { style: { marginTop: 8, fontSize: 12.5, color: 'var(--dsw-alias-label-secondary)' } },
                  ...result.events.slice(0, 6).map((e, i) => h('div', { key: i }, '· t=' + e.t + ' ' + e.text)))
                : null),
            h('div', { style: { marginTop: 16 } },
              h('h3', { className: 'tba-h3sm' }, '📈 ' + t('simEnergyCurve')),
              h(LineChart, {
                points: result.energyCurve,
                xOf: (p) => p.t,
                yOf: (p) => p.drift,
                stroke: 'var(--dsw-alias-state-warn-primary)',
                labelX: 't = 0',
                labelY: t('simEnergyDriftMax', { v: fmt(Math.max(...result.energyCurve.map((p) => p.drift)), 3) }),
              })),
            h('div', { style: { marginTop: 16 } },
              h('h3', { className: 'tba-h3sm' }, '🌡️ ' + t('simFluxTitle')),
              h(FluxChart, { track: result.track, eras: result.eras, t })),
            h('div', { style: { marginTop: 16 } },
              h('h3', { className: 'tba-h3sm' }, '🌀 ' + t('simPhaseTitle')),
              h(PhasePortrait, { phase: result.phase, t })),
            h('div', { style: { marginTop: 16 } },
              h(CatastrophePanel, { result, t, onSeek: seek })),
            h('div', { style: { marginTop: 16 } },
              h(ReadingPanel, { result, t })))
          : null)
    }

    const SensPanel = ({ presets, t }) => {
      const [presetId, setPresetId] = React.useState(
        (presets.find((p) => p.id === 'pythagorean') || presets[0] || {}).id || '',
      )
      const [data, setData] = React.useState(null)
      const [busy, setBusy] = React.useState(false)

      const run = async () => {
        setBusy(true)
        try {
          setData(await getJSON(SENS_PATH, { preset: presetId, epsilon: 1e-6 }))
        } catch {
          setData(null)
        } finally { setBusy(false) }
      }

      const chart = () => {
        if (!data || !data.curve || !data.curve.length) return null
        const pts = data.curve
        const maxSep = Math.max(...pts.map((p) => p.sep), 1e-9)
        const w = 620
        const hgt = 190
        const path = pts.map((p, i) => {
          const x = (i / Math.max(1, pts.length - 1)) * w
          const y = hgt - (Math.log10(Math.max(p.sep, 1e-12)) - Math.log10(1e-12))
            / (Math.log10(maxSep || 1) - Math.log10(1e-12) + 1e-9) * hgt
          return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + Math.max(2, Math.min(hgt - 2, y)).toFixed(1)
        }).join(' ')
        return h('div', { className: 'tba-chart' },
          h('svg', { viewBox: '0 0 ' + w + ' ' + hgt, preserveAspectRatio: 'none', style: { height: 190 } },
            h('path', { d: path, fill: 'none', stroke: 'var(--dsw-alias-brand-primary)', strokeWidth: 2 }),
            h('line', { x1: 0, y1: hgt - 2, x2: w, y2: hgt - 2, stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 1 })),
          h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)', display: 'flex', justifyContent: 'space-between' } },
            h('span', null, 't = 0'), h('span', null, 't = ' + fmt(data.span, 1))))
      }

      return h('div', null,
        h('p', { className: 'tba-kicker' }, t('sensIntro')),
        h('div', { className: 'tba-chips' },
          ...presets.map((p) => h('button', {
            key: p.id,
            className: 'tba-chip' + (p.id === presetId ? ' tba-on' : ''),
            onClick: () => { setPresetId(p.id); setData(null) },
          }, p.name))),
        h('div', { className: 'tba-controls' },
          h('button', { className: 'tba-btn tba-primary', onClick: run, disabled: busy },
            busy ? t('simRunning') : '📐 ' + t('sensRun'))),
        chart(),
        data ? h('div', { className: 'tba-verdict' }, data.verdict) : null)
    }

    const ScanPanel = ({ t }) => {
      const [data, setData] = React.useState(null)
      const [busy, setBusy] = React.useState(false)

      const run = async () => {
        setBusy(true)
        try {
          setData(await getJSON(SCAN_PATH, { samples: 60 }))
        } catch {
          setData(null)
        } finally { setBusy(false) }
      }

      const colors = {
        stable: 'var(--dsw-alias-state-success-primary)',
        chaotic: 'var(--dsw-alias-brand-primary)',
        eject: 'var(--dsw-alias-state-warn-primary)',
        collapse: 'var(--dsw-alias-state-error-primary)',
      }

      const outcomeLabel = (key) => ({
        stable: t('scanStable'), chaotic: t('scanChaotic'),
        eject: t('scanEject'), collapse: t('scanCollapse'),
      }[key] || key)

      return h('div', null,
        h('p', { className: 'tba-kicker' }, t('scanIntro')),
        h('div', { className: 'tba-controls' },
          h('button', { className: 'tba-btn tba-primary', onClick: run, disabled: busy },
            busy ? t('simRunning') : '🔬 ' + t('scanRun'))),
        data
          ? h(React.Fragment, null,
            h('div', { className: 'tba-metrics' },
              ...Object.entries(data.share).map(([key, pct]) => h('div', { key, className: 'tba-metric' },
                h('b', null, pct + '%'),
                h('span', null, outcomeLabel(key))))),
            // A colour swatch with no key is decoration; the legend and the
            // per-dot tooltip carry the same words as the metrics above.
            h('div', { className: 'tba-legend', style: { marginTop: 12 } },
              ...Object.entries(colors).map(([key, color]) => h('span', { key },
                h('i', { style: { background: color } }), outcomeLabel(key)))),
            h('div', { className: 'tba-scatter' },
              ...data.points.map((p, i) => h('i', {
                key: i,
                title: outcomeLabel(p.outcome) + ' · ' + t('scanPoint', {
                  mass: p.massRatio, spread: p.spread, pert: p.perturbation,
                }),
                style: { background: colors[p.outcome] || '#888', opacity: 0.85 },
              }))),
            h('div', { className: 'tba-verdict' }, data.verdict))
          : null)
    }

    // The panel walks the batches and hands its rows back on the final call, so
    // the aggregate is computed once, on the Host, over every sample. Folding it
    // here as well would duplicate the arithmetic and risk the two drifting.
    const CensusPanel = ({ t }) => {
      const [data, setData] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [progress, setProgress] = React.useState({ done: 0, total: 0 })
      const [failed, setFailed] = React.useState(false)

      // The route integrates real orbits, so one sample costs ~25 ms. Asking for
      // all of them at once would block the Host for over a second, so the panel
      // walks the batches. The server only aggregates a sweep it integrated whole,
      // so a batched caller gets `points` and folds them here — every row still
      // came from an integration the Host actually ran.
      const run = async () => {
        setBusy(true); setFailed(false); setData(null)
        const total = 30
        let collected = []
        let offset = 0
        setProgress({ done: 0, total })
        try {
          // Bounded loop: a route bug that never reports done must not spin the
          // browser forever.
          for (let guard = 0; guard < 40; guard++) {
            const batch = await getJSON(CENSUS_PATH, {
              samples: total, offset, limit: 12, steps: 16000, collected,
            })
            collected = collected.concat(batch.points || [])
            setProgress({ done: collected.length, total: batch.total || total })
            if (batch.done) { setData(batch); break }
            if (batch.next === null || batch.next === undefined) break
            offset = batch.next
          }
        } catch {
          setFailed(true)
        } finally { setBusy(false) }
      }

      const colors = {
        stable: 'var(--dsw-alias-state-success-primary)',
        chaotic: 'var(--dsw-alias-brand-primary)',
        eject: 'var(--dsw-alias-state-warn-primary)',
        collapse: 'var(--dsw-alias-state-error-primary)',
      }
      const outcomeLabel = (key) => ({
        stable: t('scanStable'), chaotic: t('scanChaotic'),
        eject: t('scanEject'), collapse: t('scanCollapse'),
      }[key] || key)

      const agg = data && data.aggregate
      const hist = agg ? Object.keys(agg.histogram).map(Number).sort((a, b) => a - b) : []
      const peak = agg ? Math.max(...hist.map((g) => agg.histogram[g])) : 1

      return h('div', null,
        h('p', { className: 'tba-kicker' }, t('censusIntro')),
        h('div', { className: 'tba-controls' },
          h('button', { className: 'tba-btn tba-primary', onClick: run, disabled: busy },
            busy ? t('simRunning') : '🏛️ ' + t('censusRun')),
          busy && progress.total
            ? h('span', { className: 'tba-kicker', style: { marginLeft: 10 } },
              t('censusProgress', { done: progress.done, total: progress.total }))
            : null),
        failed ? h('div', { className: 'tba-error' }, t('errorTitle')) : null,
        agg
          ? h(React.Fragment, null,
            h('div', { className: 'tba-metrics' },
              h('div', { className: 'tba-metric' }, h('b', null, String(agg.mean)), h('span', null, t('censusMean'))),
              h('div', { className: 'tba-metric' }, h('b', null, String(agg.max)), h('span', null, t('censusMax'))),
              h('div', { className: 'tba-metric' },
                h('b', null, agg.barren + '/' + agg.samples), h('span', null, t('censusBarren'))),
              h('div', { className: 'tba-metric' },
                h('b', null, Math.round((agg.planetGone / agg.samples) * 100) + '%'), h('span', null, t('censusEscaped')))),
            h('h3', { className: 'tba-h3sm' }, '📊 ' + t('censusHistogram')),
            h('div', { className: 'tba-steps' },
              ...hist.map((g) => h('div', { key: g, className: 'tba-benchrow' },
                h('div', { className: 'tba-benchfield' }, t('censusGenerations', { n: g })),
                h('div', { className: 'tba-bar' },
                  h('div', {
                    className: 'tba-barrow',
                    style: { width: Math.max(2, (agg.histogram[g] / peak) * 100) + '%' },
                  })),
                h('div', { className: 'tba-benchfield' }, String(agg.histogram[g]))))),
            h('h3', { className: 'tba-h3sm' }, '🎲 ' + t('censusOutcomes')),
            h('div', { className: 'tba-legend' },
              ...Object.entries(agg.byOutcome).map(([key, v]) => h('span', { key },
                h('i', { style: { background: colors[key] || '#888' } }),
                outcomeLabel(key) + ' · ' + v.n + ' (' + v.mean + ')'))),
            h('div', { className: 'tba-verdict' },
              agg.verdict + '\n\n' + t('censusCorrelation') + ' r = ' + agg.correlation
              + '\n\n' + t('censusNote')))
          : null)
    }

    const ForestPanel = ({ t }) => {
      const [params, setParams] = React.useState({ civs: 48, suspicion: 0.55, explosion: 0.06, cost: 0.35 })
      const [data, setData] = React.useState(null)
      const [busy, setBusy] = React.useState(false)

      const run = async () => {
        setBusy(true)
        try {
          setData(await getJSON(FOREST_PATH, params))
        } catch {
          setData(null)
        } finally { setBusy(false) }
      }

      const slider = (key, label, min, max, step) => h('div', { className: 'tba-slider-row' },
        h('label', null, label),
        h('input', {
          className: 'tba-slider', type: 'range', min, max, step, value: params[key],
          onChange: (e) => setParams((p) => ({ ...p, [key]: Number(e.target.value) })),
        }),
        h('output', null, String(params[key])))

      const chart = () => {
        if (!data || !data.history.length) return null
        const points = data.history
        const w = 620
        const hgt = 170
        const maxAlive = Math.max(...points.map((p) => p.alive), 1)
        const path = points.map((p, i) => {
          const x = (i / Math.max(1, points.length - 1)) * w
          const y = hgt - (p.alive / maxAlive) * (hgt - 8)
          return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)
        }).join(' ')
        return h('div', { className: 'tba-chart' },
          h('svg', { viewBox: '0 0 ' + w + ' ' + hgt, preserveAspectRatio: 'none', style: { height: 170 } },
            h('path', { d: path, fill: 'none', stroke: 'var(--dsw-alias-state-warn-primary)', strokeWidth: 2 })))
      }

      return h('div', null,
        h('p', { className: 'tba-kicker' }, t('forestIntro')),
        slider('civs', t('forestCivs'), 8, 120, 1),
        slider('suspicion', t('forestSuspicion'), 0, 1, 0.05),
        slider('explosion', t('forestExplosion'), 0, 0.3, 0.01),
        slider('cost', t('forestCost'), 0, 1, 0.05),
        h('div', { className: 'tba-controls' },
          h('button', { className: 'tba-btn tba-primary', onClick: run, disabled: busy },
            busy ? t('simRunning') : '🌌 ' + t('forestRun'))),
        chart(),
        data
          ? h(React.Fragment, null,
            h('div', { className: 'tba-metrics' },
              h('div', { className: 'tba-metric' }, h('b', null, String(data.survivors.length)), h('span', null, t('forestAlive'))),
              h('div', { className: 'tba-metric' }, h('b', null, String(data.strikes)), h('span', null, t('forestStrikes'))),
              h('div', { className: 'tba-metric' }, h('b', null, data.survivalRate + '%'), h('span', null, t('forestSurvivors'))),
              h('div', { className: 'tba-metric' }, h('b', null, fmt(data.finalTech, 2)), h('span', null, t('forestTech')))),
            h('div', { className: 'tba-verdict' }, data.verdict + '\n' + data.comparison.note))
          : null)
    }

    const DeterrencePanel = ({ t }) => {
      const [params, setParams] = React.useState({ resolve: 0.5, invasion: 0.6, luck: 0.5 })
      const [data, setData] = React.useState(null)
      const [busy, setBusy] = React.useState(false)

      const run = async () => {
        setBusy(true)
        try {
          setData(await getJSON(DETERRENCE_PATH, params))
        } catch {
          setData(null)
        } finally { setBusy(false) }
      }

      const slider = (key, label) => h('div', { className: 'tba-slider-row' },
        h('label', null, label),
        h('input', {
          className: 'tba-slider', type: 'range', min: 0, max: 1, step: 0.05, value: params[key],
          onChange: (e) => setParams((p) => ({ ...p, [key]: Number(e.target.value) })),
        }),
        h('output', null, params[key].toFixed(2)))

      return h('div', null,
        h('p', { className: 'tba-kicker' }, t('deterrenceIntro')),
        slider('resolve', t('deterrenceResolve')),
        slider('invasion', t('deterrenceInvasion')),
        slider('luck', t('deterrenceLuck')),
        h('div', { className: 'tba-controls' },
          h('button', { className: 'tba-btn tba-primary', onClick: run, disabled: busy },
            busy ? t('simRunning') : '🗡️ ' + t('deterrenceRun'))),
        data
          ? h(React.Fragment, null,
            h('div', { className: 'tba-metrics' },
              h('div', { className: 'tba-metric' }, h('b', null, String(data.score)), h('span', null, t('deterrenceScore'))),
              h('div', { className: 'tba-metric' },
                h('b', null, data.held ? '✓ ' + t('deterrenceHoldYes') : '✗ ' + t('deterrenceHoldNo')),
                h('span', null, t('deterrenceHeld'))),
              h('div', { className: 'tba-metric' }, h('b', null, data.survival + '%'), h('span', null, t('deterrenceHumanity')))),
            h('div', { className: 'tba-verdict' }, data.verdict + '\n\n' + data.insight))
          : null)
    }

    const SimTab = ({ data, t }) => {
      const [sub, setSub] = React.useState('orbit')
      const fallbackPresets = [{ id: 'trisolaris', name: t('simPresetFallback'), desc: '', bodies: [] }]
      const presets = data.simPresets && data.simPresets.length ? data.simPresets : fallbackPresets
      const subs = [
        ['orbit', '🪐 ' + t('simSubOrbit')],
        ['sens', '📐 ' + t('simSubSens')],
        ['scan', '🔬 ' + t('simSubScan')],
        ['census', '🏛️ ' + t('simSubCensus')],
        ['forest', '🌌 ' + t('simSubForest')],
        ['deterrence', '🗡️ ' + t('simSubDeterrence')],
      ]
      return h('div', null,
        h('div', { className: 'tba-subtabs' },
          ...subs.map(([id, label]) => h('button', {
            key: id,
            className: 'tba-chip' + (sub === id ? ' tba-on' : ''),
            onClick: () => setSub(id),
          }, label))),
        h('div', { className: 'tba-panel' },
          h('h3', null, '☄️ ' + t('simTitle')),
          sub === 'orbit' ? h(OrbitPanel, { presets, t }) : null,
          sub === 'sens' ? h(SensPanel, { presets, t }) : null,
          sub === 'scan' ? h(ScanPanel, { t }) : null,
          sub === 'census' ? h(CensusPanel, { t }) : null,
          sub === 'forest' ? h(ForestPanel, { t }) : null,
          sub === 'deterrence' ? h(DeterrencePanel, { t }) : null))
    }
    /* ------------------------------------------------------------------ *
     * Technology catalogue
     * ------------------------------------------------------------------ */
    const TechTab = ({ data, t, open }) => {
      const [tier, setTier] = React.useState('')
      const [category, setCategory] = React.useState('')
      const list = data.tech.filter((x) => (!tier || x.tier === tier) && (!category || x.category === category))
      const tiers = [...new Set(data.tech.map((x) => x.tier))]
      const categories = [...new Set(data.tech.map((x) => x.category))]

      const cards = list.map((x) => h('div', {
        key: x.id, className: 'tba-card', onClick: () => open('tech', x.id),
      },
        h('h3', null, x.name),
        h('div', { className: 'tba-en' }, (x.nameEn || '') + ' · ' + x.category),
        h('p', null, x.summary),
        h('div', { className: 'tba-tagrow' },
          h('span', { className: 'tba-badge' }, x.tier),
          h('span', { className: 'tba-badge' }, x.era),
          h('span', { className: 'tba-tag' }, '☠️'.repeat(Math.max(0, Math.min(5, x.danger || 0)))))))

      return h(React.Fragment, null,
        h('p', { className: 'tba-kicker' }, t('techHint')),
        h('div', { className: 'tba-toolbar' },
          h('select', { className: 'tba-select', value: tier, onChange: (e) => setTier(e.target.value) },
            h('option', { value: '' }, t('allTiers')),
            ...tiers.map((x) => h('option', { key: x, value: x }, x))),
          h('select', { className: 'tba-select', value: category, onChange: (e) => setCategory(e.target.value) },
            h('option', { value: '' }, t('allCategories')),
            ...categories.map((x) => h('option', { key: x, value: x }, x))),
          h('span', { className: 'tba-badge' }, t('resultCount', { n: list.length }))),
        list.length ? h('div', { className: 'tba-grid' }, ...cards) : h(Empty, { t }))
    }

    /* ------------------------------------------------------------------ *
     * Places
     * ------------------------------------------------------------------ */
    const PlacesTab = ({ data, t, open }) => {
      const [faction, setFaction] = React.useState('')
      const places = faction ? data.places.filter((p) => p.faction === faction) : data.places
      const used = [...new Set(data.places.map((p) => p.faction))].filter(Boolean)
      const cards = places.map((p) => h('div', {
        key: p.id, className: 'tba-card', onClick: () => open('place', p.id),
      },
        h('h3', null, p.name),
        h('div', { className: 'tba-en' }, (p.nameEn || '') + ' · ' + p.region),
        h('p', null, p.summary),
        h('div', { className: 'tba-tagrow' },
          h('span', { className: 'tba-badge' }, p.type),
          h('span', { className: canonClass(p.canon) }, p.canon))))

      return h(React.Fragment, null,
        h('p', { className: 'tba-kicker' }, t('placesHint')),
        h('div', { className: 'tba-chips' },
          h('button', {
            className: 'tba-chip' + (faction === '' ? ' tba-on' : ''),
            onClick: () => setFaction(''),
          }, t('allFactions')),
          ...used.map((id) => {
            const f = data.factions.find((x) => x.id === id)
            return h('button', {
              key: id,
              className: 'tba-chip' + (faction === id ? ' tba-on' : ''),
              onClick: () => setFaction(id),
            }, (f ? f.name : id))
          })),
        h('div', { className: 'tba-grid' }, ...cards))
    }

    /* ------------------------------------------------------------------ *
     * Glossary + quotes
     * ------------------------------------------------------------------ */
    const LoreTab = ({ data, t, open }) => {
      const [sub, setSub] = React.useState('glossary')
      const [category, setCategory] = React.useState('')
      const categories = [...new Set(data.glossary.map((g) => g.category))]
      const glossary = data.glossary.filter((g) => !category || g.category === category)

      const glossaryCards = glossary.map((g) => h('div', {
        key: g.id, className: 'tba-card', onClick: () => open('glossary', g.id),
      },
        h('h3', null, g.term),
        h('div', { className: 'tba-en' }, (g.termEn || '') + ' · ' + g.category),
        h('p', null, g.definition)))

      const quoteCards = data.quotes.map((q) => {
        const sp = data.characters.find((x) => x.id === q.speaker)
        return h('div', { key: q.id, className: 'tba-quote' },
          '“' + q.text + '”',
          q.textEn ? h('div', { style: { fontSize: 11.5, color: 'var(--dsw-alias-label-secondary)', marginBottom: 5 } }, q.textEn) : null,
          h('cite', {
            style: { cursor: sp ? 'pointer' : 'default' },
            onClick: () => { if (sp) open('character', sp.id) },
          }, '— ' + (sp ? sp.name : q.speaker) + ' · ' + q.context + ' · ' + (q.work || '')))
      })

      return h(React.Fragment, null,
        h('p', { className: 'tba-kicker' }, t('loreHint')),
        h('div', { className: 'tba-chips' },
          h('button', {
            className: 'tba-chip' + (sub === 'glossary' ? ' tba-on' : ''),
            onClick: () => setSub('glossary'),
          }, '📖 ' + t('glossaryTitle') + ' ' + data.glossary.length),
          h('button', {
            className: 'tba-chip' + (sub === 'quotes' ? ' tba-on' : ''),
            onClick: () => setSub('quotes'),
          }, '✨ ' + t('quotesTitle') + ' ' + data.quotes.length)),
        sub === 'glossary'
          ? h(React.Fragment, null,
            h('div', { className: 'tba-chips' },
              h('button', {
                className: 'tba-chip' + (category === '' ? ' tba-on' : ''),
                onClick: () => setCategory(''),
              }, t('allCategories')),
              ...categories.map((c) => h('button', {
                key: c,
                className: 'tba-chip' + (category === c ? ' tba-on' : ''),
                onClick: () => setCategory(c),
              }, c))),
            h('div', { className: 'tba-grid' }, ...glossaryCards))
          : h('div', { className: 'tba-two' }, ...quoteCards))
    }

    /* ------------------------------------------------------------------ *
     * Themes
     * ------------------------------------------------------------------ */
    const ThemesTab = ({ data, t, open }) => {
      const cards = (data.themes || []).map((th) => h('div', { key: th.id, className: 'tba-themecard' },
        h('h3', null, th.title),
        th.question ? h('div', { className: 'tba-q' }, th.question) : null,
        th.summary ? h('p', { className: 'tba-p' }, th.summary) : null,
        th.sides && th.sides.length
          ? h('div', { style: { marginTop: 12 } },
            h('h4', { className: 'tba-h3sm', style: { fontSize: 13 } }, '⚖️ ' + t('themeSides')),
            ...th.sides.map((s, i) => h('div', { key: i, className: 'tba-side' },
              h('b', null, s.name), h('span', null, s.view))))
          : null,
        th.discussion
          ? h('div', { style: { marginTop: 10 } },
            h('h4', { className: 'tba-h3sm', style: { fontSize: 13 } }, '💬 ' + t('themeDiscuss')),
            h('p', { className: 'tba-p' }, th.discussion))
          : null,
        th.people && th.people.length
          ? h('div', { className: 'tba-chips', style: { marginTop: 12, marginBottom: 0 } },
            h('span', { className: 'tba-badge' }, t('themePeople')),
            ...th.people.map((p) => h('button', {
              key: p.id, className: 'tba-chip', onClick: () => open('character', p.id),
            }, p.name)))
          : null))

      return h(React.Fragment, null,
        h('p', { className: 'tba-kicker' }, t('themeHint')),
        ...cards)
    }

    /* ------------------------------------------------------------------ *
     * Adaptation differences
     * ------------------------------------------------------------------ */
    const DiffTab = ({ data, t }) => {
      const [media, setMedia] = React.useState('')
      // 'list' keeps the original row layout; 'side' puts the book and the
      // screen text next to each other, which is the point of a comparison —
      // reading them one after another loses the contrast.
      const [view, setView] = React.useState('list')
      const list = media ? data.differences.filter((d) => d.media === media) : data.differences
      const medias = [...new Set(data.differences.map((d) => d.media))]
      const cards = list.map((d) => h('div', { key: d.id, className: 'tba-diffcard' },
        h('h3', null, d.topic),
        h('div', { className: 'tba-chips', style: { marginBottom: 10 } },
          h('span', { className: 'tba-badge' }, d.media)),
        h('div', { className: 'tba-drow' },
          h('span', { className: 'tba-dkey' }, t('book')),
          h('span', { className: 'tba-dval' }, d.book)),
        h('div', { className: 'tba-drow' },
          h('span', { className: 'tba-dkey' }, t('screen')),
          h('span', { className: 'tba-dval' }, d.screen)),
        h('div', { className: 'tba-drow' },
          h('span', { className: 'tba-dkey' }, t('impact')),
          h('span', { className: 'tba-dval' }, d.impact))))

      // Two columns, not three: `impact` is a remark on the gap, not a third
      // version of the scene, so it sits underneath both.
      const sideCards = list.map((d) => h('div', { key: d.id, className: 'tba-diffcard' },
        h('h3', null, d.topic, h('span', { className: 'tba-badge', style: { marginLeft: 8 } }, d.media)),
        h('div', { className: 'tba-sbs' },
          h('div', { className: 'tba-sbs-col' },
            h('div', { className: 'tba-sbs-head' }, t('book')),
            h('p', { className: 'tba-sbs-body' }, d.book)),
          h('div', { className: 'tba-sbs-col' },
            h('div', { className: 'tba-sbs-head' }, t('screen')),
            h('p', { className: 'tba-sbs-body' }, d.screen))),
        h('div', { className: 'tba-sbs-impact' },
          h('b', null, t('impact')),
          h('span', null, d.impact))))

      return h(React.Fragment, null,
        h('p', { className: 'tba-kicker' }, t('diffHint')),
        h('div', { className: 'tba-chips' },
          h('button', {
            className: 'tba-chip' + (media === '' ? ' tba-on' : ''),
            onClick: () => setMedia(''),
          }, t('allMedia')),
          ...medias.map((m) => h('button', {
            key: m,
            className: 'tba-chip' + (media === m ? ' tba-on' : ''),
            onClick: () => setMedia(m),
          }, m)),
          h('button', {
            className: 'tba-chip' + (view === 'side' ? ' tba-on' : ''),
            onClick: () => setView((v) => (v === 'side' ? 'list' : 'side')),
          }, view === 'side' ? t('diffViewList') : t('diffViewSide'))),
        h('div', { className: view === 'side' ? 'tba-one' : 'tba-two' },
          ...(view === 'side' ? sideCards : cards)))
    }

    /**
     * Flashcard quiz.
     *
     * The score is deliberately session-only: this is a self-check, not an exam,
     * and persisting a streak would turn it into one.
     */
    const QuizTab = ({ data, t, tier }) => {
      const cards = React.useMemo(() => buildCards(data, tier), [data, tier])
      const [index, setIndex] = React.useState(0)
      const [picked, setPicked] = React.useState(null)
      const [score, setScore] = React.useState({ right: 0, total: 0 })

      if (!cards.length) {
        return h('p', { className: 'tba-kicker' }, t('quizEmpty'))
      }
      const card = cards[index % cards.length]
      const answered = picked !== null
      const correct = answered && picked === card.answer

      const choose = (option) => {
        if (answered) return
        setPicked(option)
        setScore((s) => ({ right: s.right + (option === card.answer ? 1 : 0), total: s.total + 1 }))
      }
      const next = () => {
        setPicked(null)
        setIndex((i) => (i + 1) % cards.length)
      }
      const reset = () => {
        setPicked(null)
        setIndex(0)
        setScore({ right: 0, total: 0 })
      }
      const rate = score.total ? Math.round((score.right / score.total) * 100) : 0

      return h('div', null,
        h('p', { className: 'tba-kicker' }, t('quizHint')),
        h('div', { className: 'tba-quizbar' },
          h('span', { className: 'tba-badge' }, t('quizProgress', { n: (index % cards.length) + 1, total: cards.length })),
          h('span', { className: 'tba-badge' }, t('quizScore', { right: score.right, total: score.total, pct: rate })),
          h('button', { className: 'tba-chip', onClick: reset }, t('quizReset'))),
        h('div', { className: 'tba-quizcard' },
          h('div', { className: 'tba-quizkind' }, t(card.kind === 'glossary' ? 'quizKindGlossary' : card.kind === 'tech' ? 'quizKindTech' : 'quizKindCharacter')),
          h('p', { className: 'tba-quizstem' }, card.stem),
          h('div', { className: 'tba-quizoptions' },
            ...card.options.map((option) => {
              let cls = 'tba-quizopt'
              if (answered && option === card.answer) cls += ' tba-right'
              else if (answered && option === picked) cls += ' tba-wrong'
              else if (answered) cls += ' tba-dim'
              return h('button', {
                key: option,
                className: cls,
                onClick: () => choose(option),
                disabled: answered,
              }, option)
            })),
          answered ? h('div', { className: 'tba-quizresult' },
            h('b', null, correct ? '✓ ' + t('quizRight') : '✗ ' + t('quizWrong')),
            correct ? null : h('span', null, t('quizAnswerWas') + ' ' + card.answer),
            h('button', { className: 'tba-chip', onClick: next }, t('quizNext'))) : null))
    }

    /* ------------------------------------------------------------------ *
     * Ask
     * ------------------------------------------------------------------ */
    /* ------------------------------------------------------------------ *
     * Minimal answer renderer
     *
     * The Host answers in light Markdown (a heading, bold runs, bullets). This
     * renders exactly that subset — no HTML injection, no Markdown library.
     * ------------------------------------------------------------------ */
    const inlineMarkdown = (text, keyPrefix) => {
      const parts = String(text).split(/(\*\*[^*]+\*\*|“[^”]*”)/g).filter(Boolean)
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return h('b', { key: keyPrefix + 'b' + i }, part.slice(2, -2))
        }
        if (part.startsWith('“') && part.endsWith('”')) {
          return h('span', { key: keyPrefix + 'q' + i, style: { fontStyle: 'italic' } }, part)
        }
        return part
      })
    }

    const renderAnswer = (text) => {
      const lines = String(text).split('\n')
      const blocks = []
      let list = []
      const flush = () => {
        if (!list.length) return
        blocks.push(h('ul', { key: 'ul' + blocks.length, className: 'tba-answerlist' }, ...list))
        list = []
      }
      lines.forEach((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) { flush(); return }
        const heading = trimmed.match(/^#{1,3}\s+(.*)$/)
        const bullet = trimmed.match(/^[-*]\s+(.*)$/)
        if (heading) {
          flush()
          blocks.push(h('div', { key: 'h' + i, className: 'tba-answerhead' }, inlineMarkdown(heading[1], 'h' + i)))
        } else if (bullet) {
          list.push(h('li', { key: 'li' + i }, inlineMarkdown(bullet[1], 'li' + i)))
        } else {
          flush()
          blocks.push(h('p', { key: 'p' + i, className: 'tba-answerp' }, inlineMarkdown(trimmed, 'p' + i)))
        }
      })
      flush()
      return blocks
    }

    /* ------------------------------------------------------------------ *
     * Reading guide
     * ------------------------------------------------------------------ */

    const GuideTab = ({ data, t, tier }) => {
      const guides = data.guides || []
      const [done, setDone] = React.useState(() => {
        try {
          const raw = readPref(PREF_DONE, '[]')
          const parsed = JSON.parse(raw)
          return Array.isArray(parsed) ? parsed : []
        } catch { return [] }
      })

      const keyOf = (pathId, index) => pathId + ':' + index
      const isDone = (pathId, index) => done.includes(keyOf(pathId, index))
      const toggle = (pathId, index) => {
        const key = keyOf(pathId, index)
        const next = done.includes(key) ? done.filter((x) => x !== key) : [...done, key]
        setDone(next)
        writePref(PREF_DONE, JSON.stringify(next))
      }
      const clear = () => { setDone([]); writePref(PREF_DONE, '[]') }

      const total = guides.reduce((sum, g) => sum + g.steps.length, 0)
      const doneCount = done.length

      return h('div', null,
        h('h2', { className: 'tba-h2' }, '🧭 ' + t('guideTitle')),
        h('p', { className: 'tba-p', style: { marginBottom: 12 } }, t('guideHint')),
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 } },
          h('span', { className: 'tba-badge' }, t('guideProgress', { done: doneCount, total })),
          doneCount ? h('button', { className: 'tba-chip', onClick: clear }, t('guideClear')) : null),
        h('div', { className: 'tba-guideprog' },
          h('i', { style: { width: (total ? Math.round((doneCount / total) * 100) : 0) + '%' } })),

        ...guides.map((g) => h('div', { key: g.id, className: 'tba-guide' },
          h('div', { className: 'tba-guidehead' },
            h('h3', null, (g.icon || '') + ' ' + g.name),
            h('span', { className: 'tba-badge' }, t('guideSteps', { n: g.steps.length }))),
          h('p', { className: 'tba-guideblurb' }, g.blurb),
          h('div', { className: 'tba-guidesteps' },
            ...g.steps.map((step) => {
              const finished = isDone(g.id, step.index)
              return h('div', {
                key: step.index,
                className: 'tba-guidestep' + (finished ? ' tba-done' : '') + (step.locked ? ' tba-lockedstep' : ''),
              },
                h('div', { className: 'tba-guidenum' }, finished ? '✓' : String(step.index)),
                h('div', { className: 'tba-guidebody' },
                  h('div', { className: 'tba-guidetitle' },
                    h('span', null, step.title),
                    step.kind ? h('span', { className: 'tba-badge' }, step.kind) : null,
                    step.year ? h('span', { className: 'tba-badge' }, String(step.year)) : null,
                    h('span', { className: 'tba-badge' }, t('guideEvents', { n: step.eventCount }))),
                  h('p', { className: 'tba-guidewhy' }, step.why),
                  step.locked
                    ? h('div', { className: 'tba-guidewhy', style: { marginTop: 6, opacity: .75 } },
                      '🔒 ' + t('guideLocked', { label: t(TIER_KEYS[step.tier] || 'tierB3') }))
                    : (step.cast && step.cast.length
                      ? h('div', { className: 'tba-guidecast' },
                        ...step.cast.map((c) => h('span', { key: c.id, className: 'tba-chip' }, c.name)))
                      : null),
                  h('button', {
                    className: 'tba-chip',
                    style: { marginTop: 8 },
                    onClick: () => toggle(g.id, step.index),
                  }, finished ? t('guideMarkedDone') : t('guideMarkDone'))))
            })))))
    }

    /* ------------------------------------------------------------------ *
     * Character journey
     * ------------------------------------------------------------------ */

    const JourneyTab = ({ data, t, tier, open }) => {
      const characters = (data.characters || []).slice().sort((a, b) => {
        const na = (a.relations || []).length
        const nb = (b.relations || []).length
        return nb - na
      })
      const [picked, setPicked] = React.useState('')
      const [query, setQuery] = React.useState('')
      const [journey, setJourney] = React.useState(null)
      const [busy, setBusy] = React.useState(false)

      React.useEffect(() => {
        if (!picked) { setJourney(null); return }
        let alive = true
        setBusy(true)
        getJSON(JOURNEY_PATH + '?id=' + encodeURIComponent(picked) + '&maxTier=' + tier)
          .then((r) => { if (alive) setJourney(r && r.error ? null : r) })
          .catch(() => { if (alive) setJourney(null) })
          .finally(() => { if (alive) setBusy(false) })
        return () => { alive = false }
      }, [picked, tier])

      const filtered = query
        ? characters.filter((c) => (c.name + ' ' + (c.nameEn || '') + ' ' + (c.alias || []).join(' '))
          .toLowerCase().includes(query.toLowerCase()))
        : characters

      const roleBadge = { focus: 'journeyRoleFocus', named: 'journeyRoleNamed', present: 'journeyRolePresent' }

      let body = null
      if (busy) {
        body = h('div', { className: 'tba-loading', style: { height: 'auto', paddingTop: 30 } },
          h('div', { className: 'tba-spin' }, '🛰️'), h('div', null, t('loading')))
      } else if (journey && !journey.hasStory) {
        body = h('div', { className: 'tba-empty' },
          h('div', { className: 'tba-eicon' }, '👥'),
          h('div', null, t('journeyEmpty')),
          h('div', { className: 'tba-chips', style: { justifyContent: 'center', marginTop: 10 } },
            ...(journey.neighbours || []).map((n) => h('button', {
              key: n.id, className: 'tba-chip', onClick: () => open('character', n.id),
            }, n.name))))
      } else if (journey) {
        const nodes = journey.nodes || []
        let lastWork = ''
        body = h('div', null,
          h('div', { className: 'tba-jhead', style: { marginBottom: 12 } },
            h('h3', { style: { margin: '0 0 4px', fontSize: 16 } }, journey.character.name),
            h('div', { style: { fontSize: 12.6, color: 'var(--dsw-alias-label-secondary)' } },
              journey.character.factionLabel,
              journey.character.firstWorkTitle ? ' · ' + t('journeySpan') + '：' + journey.character.firstWorkTitle : ''),
            h('div', { className: 'tba-chips', style: { marginTop: 8, marginBottom: 0 } },
              h('span', { className: 'tba-badge' }, t('journeyTotal', { n: journey.total })),
              h('span', { className: 'tba-badge' }, t('journeyFocus', { n: journey.focusCount })))),
          h('div', { className: 'tba-journey' },
            ...nodes.map((node, i) => {
              const parts = []
              if (node.workTitle && node.workTitle !== lastWork) {
                lastWork = node.workTitle
                parts.push(h('div', { key: 'c' + i, className: 'tba-jchapter' }, node.workTitle))
              }
              parts.push(h('div', { key: node.kind + node.id + i, className: 'tba-jnode' },
                h('div', { className: 'tba-jline' },
                  h('div', { className: 'tba-jdot', 'data-role': node.role }),
                  h('div', { className: 'tba-jstem' })),
                h('div', { className: 'tba-jbody' },
                  h('div', { className: 'tba-jtitle' },
                    h('span', null, node.title),
                    h('span', { className: 'tba-badge' }, t(roleBadge[node.role] || 'journeyRolePresent'))),
                  node.locked
                    ? h('div', { className: 'tba-lockedmsg', style: { marginTop: 4 } },
                      '🔒 ' + t('tierLocked', { label: t(TIER_KEYS[node.tier] || 'tierB3') }))
                    : (node.desc ? h('p', { className: 'tba-jdesc' }, node.desc) : null),
                  h('div', { className: 'tba-jmeta' },
                    [node.year, node.eraName, node.people ? node.people.slice(0, 4).join('、') : '']
                      .filter(Boolean).join(' · ')))))
              return parts
            })))
      }

      return h('div', null,
        h('h2', { className: 'tba-h2' }, '👤 ' + t('journeyTitle')),
        h('p', { className: 'tba-p', style: { marginBottom: 12 } }, t('journeyHint')),
        h('div', { className: 'tba-pathrow', style: { marginBottom: 10 } },
          h('input', {
            className: 'tba-input tba-grow', value: query, placeholder: t('journeySearch'),
            onChange: (e) => setQuery(e.target.value),
          })),
        h('div', { className: 'tba-chips', style: { marginBottom: 16 } },
          ...filtered.slice(0, 24).map((c) => h('button', {
            key: c.id,
            className: 'tba-chip' + (picked === c.id ? ' tba-on' : ''),
            onClick: () => setPicked(c.id),
          }, c.name))),
        body)
    }

    /* ------------------------------------------------------------------ *
     * Concept graph
     * ------------------------------------------------------------------ */

    const ConceptTab = ({ t, tier, open }) => {
      const [rootId, setRootId] = React.useState('')
      const [depth, setDepth] = React.useState(2)
      const [graph, setGraph] = React.useState(null)
      const [busy, setBusy] = React.useState(false)

      React.useEffect(() => {
        let alive = true
        setBusy(true)
        const url = CONCEPT_PATH + '?depth=' + depth + '&maxTier=' + tier
          + (rootId ? '&id=' + encodeURIComponent(rootId) : '')
        getJSON(url)
          .then((r) => { if (alive) setGraph(r && r.error ? null : r) })
          .catch(() => { if (alive) setGraph(null) })
          .finally(() => { if (alive) setBusy(false) })
        return () => { alive = false }
      }, [rootId, depth, tier])

      const kindLabel = { glossary: '术语', tech: '技术', character: '人物', place: '地点' }
      const nodeButton = (node) => h('button', {
        key: node.id,
        className: 'tba-conceptnode',
        'data-kind': node.kind,
        onClick: () => (node.kind === 'glossary' ? setRootId(node.id) : open(node.kind, node.id)),
      },
        h('div', { className: 'tba-conceptname' }, node.name),
        node.locked
          ? h('p', { className: 'tba-conceptsum' }, '🔒 ' + t('tierLocked', { label: t(TIER_KEYS[node.tier] || 'tierB3') }))
          : (node.summary ? h('p', { className: 'tba-conceptsum' }, node.summary) : null),
        h('div', { className: 'tba-conceptmeta' },
          [kindLabel[node.kind] || node.kind, node.category,
            typeof node.degree === 'number' ? t('conceptDegree', { n: node.degree }) : '']
            .filter(Boolean).join(' · ')))

      let body = null
      if (busy) {
        body = h('div', { className: 'tba-loading', style: { height: 'auto', paddingTop: 30 } },
          h('div', { className: 'tba-spin' }, '🛰️'), h('div', null, t('loading')))
      } else if (!graph) {
        body = h(Empty, { t, icon: '🕸️' })
      } else if (!graph.root) {
        body = h('div', { className: 'tba-conceptgrid' }, ...(graph.nodes || []).map(nodeButton))
      } else {
        body = h('div', null,
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } },
            h('h3', { style: { margin: 0, fontSize: 16 } }, graph.root.name),
            h('button', { className: 'tba-chip', onClick: () => setRootId('') }, t('conceptBack'))),
          graph.root.summary ? h('p', { className: 'tba-p', style: { marginBottom: 12 } }, graph.root.summary) : null,
          h('div', { className: 'tba-conceptgrid', style: { marginBottom: 16 } },
            ...(graph.nodes || []).filter((n) => n.id !== graph.root.id).map(nodeButton)),
          (graph.edges || []).length
            ? h('div', null,
              h('h4', { className: 'tba-h3sm', style: { fontSize: 13 } }, '🔗 ' + t('conceptKinds')),
              ...(graph.edges || []).map((e, i) => {
                const from = (graph.nodes || []).find((n) => n.id === e.from)
                const to = (graph.nodes || []).find((n) => n.id === e.to)
                if (!from || !to) return null
                return h('div', { key: i, className: 'tba-edge' },
                  h('span', null, from.name),
                  h('span', { className: 'tba-edgearrow' }, '→'),
                  h('span', null, to.name),
                  h('span', { className: 'tba-badge' }, kindLabel[to.kind] || to.kind))
              }))
            : h('div', { className: 'tba-empty' }, t('conceptNone')))
      }

      return h('div', null,
        h('h2', { className: 'tba-h2' }, '🕸️ ' + t('conceptTitle')),
        h('p', { className: 'tba-p', style: { marginBottom: 12 } }, t('conceptHint')),
        h('div', { className: 'tba-pathrow', style: { marginBottom: 14 } },
          h('span', { className: 'tba-tierlabel' }, t('conceptDepth')),
          ...[1, 2, 3].map((d) => h('button', {
            key: d,
            className: 'tba-tierbtn' + (depth === d ? ' tba-on' : ''),
            onClick: () => setDepth(d),
          }, String(d)))),
        body)
    }

    const AskTab = ({ t }) => {
      const [q, setQ] = React.useState('')
      const [answer, setAnswer] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [chips, setChips] = React.useState([])

      React.useEffect(() => {
        let alive = true
        getJSON(ASK_PATH + '?q=')
          .then((r) => { if (alive && r && r.suggestions) setChips(r.suggestions) })
          .catch(() => { /* suggestions are optional */ })
        return () => { alive = false }
      }, [])

      const ask = async (question) => {
        const text = (question === undefined ? q : question).trim()
        if (!text) return
        if (question !== undefined) setQ(question)
        setBusy(true); setAnswer('')
        try {
          const r = await getJSON(ASK_PATH + '?q=' + encodeURIComponent(text))
          setAnswer(r.answer || t('askFail'))
        } catch {
          setAnswer(t('askFail'))
        } finally { setBusy(false) }
      }

      return h('div', { className: 'tba-askbox' },
        h('h3', null, '💬 ' + t('askTitle')),
        h('div', { className: 'tba-pathrow' },
          h('input', {
            className: 'tba-input tba-grow', value: q, placeholder: t('askPlaceholder'),
            onChange: (e) => setQ(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Enter') ask() },
          }),
          h('button', { className: 'tba-btn tba-primary', onClick: () => ask(), disabled: busy },
            busy ? t('askThinking') : t('askButton'))),
        chips.length
          ? h('div', { className: 'tba-chips', style: { marginTop: 12 } },
            h('span', { className: 'tba-badge' }, t('askTryThese')),
            ...chips.map((c) => h('button', { key: c, className: 'tba-chip', onClick: () => ask(c) }, c)))
          : null,
        answer ? h('div', { className: 'tba-answer' }, ...renderAnswer(answer)) : null)
    }

    /* ------------------------------------------------------------------ *
     * Page shell
     * ------------------------------------------------------------------ */
    const AtlasPage = ({ t, onBack }) => {
      const [data, setData] = React.useState(null)
      const [error, setError] = React.useState(false)
      const [tab, setTab] = React.useState('overview')
      const [drawer, setDrawer] = React.useState(null)
      // Default to "everything visible": a first-time reader should not meet a
      // wall of locks. The picker narrows it, and the choice is remembered.
      //
      // Reading progress, when recorded, supplies the ceiling instead — but a
      // manual pick wins from then on, because a control that silently undoes
      // the reader's last action is worse than no automation at all.
      const [tier, setTierState] = React.useState(() => {
        const manual = readPref(PREF_TIER_MANUAL, '')
        if (manual === '1') {
          const raw = readPref(PREF_TIER, '3')
          const n = Number(raw)
          return Number.isFinite(n) ? Math.min(3, Math.max(0, n)) : 3
        }
        const raw = readPref(PREF_TIER, '3')
        const n = Number(raw)
        return Number.isFinite(n) ? Math.min(3, Math.max(0, n)) : 3
      })
      const setTier = (value) => {
        setTierState(value)
        writePref(PREF_TIER, value)
        // A pick is a decision: stop letting progress override it.
        writePref(PREF_TIER_MANUAL, '1')
      }
      const followProgress = (derived) => {
        if (derived === null) return
        writePref(PREF_TIER_MANUAL, '0')
        setTierState(derived)
        writePref(PREF_TIER, derived)
      }

      const [progress, setProgress] = React.useState(() => {
        try {
          const raw = readPref(PREF_PROGRESS, '{}')
          const parsed = JSON.parse(raw)
          return parsed && typeof parsed === 'object' ? parsed : {}
        } catch {
          return {}
        }
      })
      const [manual, setManual] = React.useState(() => readPref(PREF_TIER_MANUAL, '0') === '1')

      const load = () => {
        setError(false); setData(null)
        getJSON(BUNDLE_PATH).then(setData).catch(() => setError(true))
      }
      React.useEffect(load, [])

      const open = (kind, id) => setDrawer({ kind, id })

      // Switching tabs must land at the top of the new page: the scroll
      // container is shared, and a 52-event timeline would otherwise drop the
      // reader into the middle of an unrelated tab.
      const scrollRef = React.useRef(null)
      const go = (id) => {
        setTab(id)
        if (scrollRef.current) scrollRef.current.scrollTop = 0
      }

      if (error) {
        return h('div', { className: 'tba-error' },
          h('div', { style: { fontSize: 36 } }, '🛰️'),
          h('div', { style: { fontSize: 16, fontWeight: 600 } }, t('errorTitle')),
          h('div', null, t('errorHint')),
          h('button', { className: 'tba-btn tba-primary', onClick: load }, t('retry')))
      }
      if (!data) {
        return h('div', { className: 'tba-loading' },
          h('div', { className: 'tba-spin' }, '☄️'), h('div', null, t('loading')))
      }

      const tabs = [
        ['overview', '🧭 ' + t('tabOverview')],
        ['guide', '📔 ' + t('tabGuide')],
        ['plot', '📖 ' + t('tabPlot')],
        ['characters', '👤 ' + t('tabCharacters')],
        ['journey', '🎭 ' + t('tabJourney')],
        ['graph', '🕸️ ' + t('tabGraph')],
        ['concept', '🔗 ' + t('tabConcept')],
        ['timeline', '📜 ' + t('tabTimeline')],
        ['game', '🕹️ ' + t('tabGame')],
        ['quiz', '🎯 ' + t('tabQuiz')],
        ['sim', '☄️ ' + t('tabSim')],
        ['tech', '💎 ' + t('tabTech')],
        ['places', '🏔️ ' + t('tabPlaces')],
        ['lore', '📚 ' + t('tabLore')],
        ['themes', '⚖️ ' + t('tabThemes')],
        ['diff', '🎬 ' + t('tabDiff')],
        ['ask', '💬 ' + t('tabAsk')],
      ]

      return h('div', { className: 'tba-root' },
        h('div', { className: 'tba-scroll', ref: scrollRef },
          h('div', { className: 'tba-head' },
            h(Crest),
            h('div', null,
              h('h1', null, t('title')),
              h('div', { className: 'tba-sub' }, t('subtitle')),
              h('button', { className: 'tba-chip', style: { marginTop: 8 }, onClick: onBack }, '← ' + t('back')))),
          h('div', { className: 'tba-tabs', role: 'tablist' }, tabs.map(([id, label]) =>
            h('button', {
              key: id,
              className: 'tba-tab' + (tab === id ? ' tba-active' : ''),
              role: 'tab',
              'aria-selected': tab === id,
              onClick: () => go(id),
            }, label))),
          h('div', { style: { padding: '0 18px' } },
            h(TierPicker, { tiers: data.tiers, value: tier, onChange: setTier, t }),
            h(ProgressPicker, {
              data, t, progress, manual,
              onChange: (next) => {
                setProgress(next)
                writePref(PREF_PROGRESS, JSON.stringify(next))
                followProgress(tierFromProgress(next))
              },
              onFollow: () => followProgress(tierFromProgress(progress)),
            })),
          tab === 'overview' && h(OverviewTab, { data, t, go, open }),
          tab === 'guide' && h(GuideTab, { data, t, tier }),
          tab === 'plot' && h(PlotTab, { data, t, open }),
          tab === 'characters' && h(CharactersTab, { data, t, open, go }),
          tab === 'journey' && h(JourneyTab, { data, t, tier, open }),
          tab === 'graph' && h(GraphTab, { data, t, open }),
          tab === 'concept' && h(ConceptTab, { t, tier, open }),
          tab === 'timeline' && h(TimelineTab, { data, t }),
          tab === 'game' && h(GameTab, { data, t }),
          tab === 'quiz' && h(QuizTab, { data, t, tier }),
          tab === 'sim' && h(SimTab, { data, t }),
          tab === 'tech' && h(TechTab, { data, t, open }),
          tab === 'places' && h(PlacesTab, { data, t, open }),
          tab === 'lore' && h(LoreTab, { data, t, open }),
          tab === 'themes' && h(ThemesTab, { data, t, open }),
          tab === 'diff' && h(DiffTab, { data, t }),
          tab === 'ask' && h(AskTab, { t }),
          h('div', { className: 'tba-footer' }, t('footer'))),
        drawer && h(Drawer, {
          kind: drawer.kind, id: drawer.id, data, t, tier,
          onClose: () => setDrawer(null),
          onOpen: (kind, id) => setDrawer({ kind, id }),
        }))
    }

    /* ------------------------------------------------------------------ *
     * Registration
     * ------------------------------------------------------------------ */
    return {
      inject: ['slots'],
      /* Pure helpers, exposed so the self-check can assert them in Node. The
         panel never reads this; it exists because these functions have no DOM
         dependency and testing them through a browser would be slower and
         weaker than testing the strings they return. */
      __test__: {
        dossierToMarkdown,
        timelineToMarkdown,
        pathToMarkdown,
        tierFromProgress,
        buildCards,
      },
      apply(ctx) {
        const locale = ctx.get('locale')
        const currentMessages = () => (isEnglish(locale) ? EN : ZH)
        const t = () => makeTranslator(locale, currentMessages())

        /* Keep the module-level language in step with the active locale, so the
           narrative requests ask the server for the same language the UI shows. */
        const syncLang = () => { activeLang = isEnglish(locale) ? 'en' : 'zh' }
        syncLang()
        ctx.effect(() => {
          if (!locale || typeof locale.subscribe !== 'function') return undefined
          return locale.subscribe(syncLang)
        }, NS + ': lang')

        ctx.effect(() => {
          if (!locale || typeof locale.register !== 'function') return undefined
          try { return locale.register(NS, { zh: ZH, en: EN }) } catch { return undefined }
        }, NS + ': locale')

        ctx.effect(() => installStyleSheet(), NS + ': styles')

        function useLocaleVersion() {
          const [, bump] = React.useReducer((v) => v + 1, 0)
          React.useEffect(() => {
            if (!locale || typeof locale.subscribe !== 'function') return undefined
            return locale.subscribe(() => bump())
          }, [locale])
        }

        const backToConversation = () => {
          const layout = ctx.get('layout')
          if (layout && typeof layout.selectPanel === 'function') layout.selectPanel(null)
        }

        const Page = () => {
          useLocaleVersion()
          return h(AtlasPage, { t: t(), onBack: backToConversation })
        }
        const PanelIcon = () => h('span', { style: { fontSize: 16 } }, '☄️')

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register({
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 34,
            label: () => t()('nav'),
          }, PanelIcon))

        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID }, Page))
      },
    }
  },
})
