/* =====================================================================
 * 三体宇宙 · 地点 / 技术造物 / 术语 / 名句
 * ---------------------------------------------------------------------
 * 导出：PLACES、TECH、GLOSSARY、QUOTES
 * 约定：字段与枚举见 ../SCHEMA.md；canon 标注来源层级；
 *       角色只引用「固定角色名单」中的 id；不确定的精确数字用纪元记法。
 *       名句中凡非逐字原文，均在 context 内注明「大意 / 概括」。
 * ===================================================================== */

/* ---------------------------------------------------------------------
 * 地点 PLACES
 * faction: earth | pdc | fleet | wallfacer | eso | trisolarians |
 *          blue-space | singer | zeroers | four-dim
 * ------------------------------------------------------------------- */
export const PLACES = [
  {
    id: 'trisolaris',
    name: '三体世界',
    nameEn: 'Trisolaris',
    region: '半人马座 α 星系',
    type: '行星文明',
    canon: '原著与剧集',
    faction: 'trisolarians',
    summary: '三颗太阳下的行星，三体文明的母星，也是全书一切灾难的源头。',
    desc: '三体行星被三颗恒星的引力反复撕扯，轨道无法长期稳定。文明在烈焰与严寒之间一次次毁灭又重生，把「恒纪元」写成了神话。三体人由此进化出脱水、集体思维与极端的生存理性，并把逃离母星当作文明唯一的出路，这才有了向太阳系的那次呼叫与远征。',
    characters: ['trisolaris-lord', 'listener-1379', 'sophon'],
    works: ['three-body', 'dark-forest', 'tencent-series']
  },
  {
    id: 'proxima',
    name: '比邻星',
    nameEn: 'Proxima Centauri',
    region: '半人马座 α 星系',
    type: '恒星',
    canon: '原著',
    faction: 'trisolarians',
    summary: '距离太阳系最近的恒星，三体世界所在的方向，四光年外的邻居。',
    desc: '比邻星是半人马座 α 三合星中离太阳最近的一颗，也是人类抬头就能指认的「他们」的方向。叶文洁发出的信号以光速飞向这里，八年后收到回复；三体舰队也从这里启航。四光年的距离既是天文的巧合，也是全书最残忍的尺度：一次回答要用八年，一支舰队要用四百年。',
    characters: ['trisolaris-lord', 'ye-wenjie'],
    works: ['three-body', 'dark-forest']
  },
  {
    id: 'solar-system',
    name: '太阳系',
    nameEn: 'Solar System',
    region: '银河系猎户臂',
    type: '恒星系统',
    canon: '原著',
    faction: 'earth',
    summary: '人类全部历史所在的恒星系统，最终被二维化，成为一幅巨画。',
    desc: '从危机纪元的舰队扩张，到掩体纪元的木星轨道城市，人类把太阳系改造成了一座巨大的堡垒，却始终没有解决最根本的问题：它太亮了。二向箔落下之后，八大行星与整个太阳系被压成没有厚度的平面，成为银河系里一幅缓慢旋转的巨画，只有程心和 AA 在远处看见它最后的模样。',
    characters: ['luo-ji', 'cheng-xin', 'aa'],
    works: ['three-body', 'dark-forest', 'deaths-end']
  },
  {
    id: 'earth-planet',
    name: '地球',
    nameEn: 'Earth',
    region: '太阳系第三行星',
    type: '行星',
    canon: '原著与剧集',
    faction: 'earth',
    summary: '人类的故乡，也是被反复出卖、拯救、审判与放弃的那颗蓝色行星。',
    desc: '地球承载了全书的绝大部分故事：红岸的密林、科学边界的沙龙、联合国的面壁计划会议、掩体城市与最后的撤离。它既是「主」想要的新家，也是人类自己最想逃离的地方。三体危机把人类逼成两个物种——留下来的人和走掉的人，而地球最后成了所有人都回不去的地方。',
    characters: ['wang-miao', 'shi-qiang', 'ye-wenjie', 'luo-ji'],
    works: ['three-body', 'dark-forest', 'deaths-end', 'tencent-series', 'netflix-series']
  },
  {
    id: 'red-coast',
    name: '红岸基地',
    nameEn: 'Red Coast Base',
    region: '中国 · 大兴安岭',
    type: '秘密军事基地',
    canon: '原著与剧集',
    faction: 'earth',
    summary: '建于冷战年代的绝密射电基地，人类第一声向宇宙的呼喊从这里发出。',
    desc: '红岸对外是一座国防通讯设施，实际用途是以太阳为天线放大器，向宇宙发送大功率信号。叶文洁在这里度过了青年与中年，也在这里按下了那个改变一切的按钮。基地后来废弃、拆除，雷达峰上的天线基座成了纪念碑式的水泥残骸，几十年后仍有人回到这里寻找答案。',
    characters: ['ye-wenjie', 'lei-zhicheng', 'yang-weining'],
    works: ['three-body', 'tencent-series']
  },
  {
    id: 'radar-peak',
    name: '雷达峰',
    nameEn: 'Radar Peak',
    region: '中国 · 大兴安岭',
    type: '山峰与天线阵地',
    canon: '原著与剧集',
    faction: 'earth',
    summary: '红岸天线所在的山峰，叶文洁晚年回望人类落日的那个高点。',
    desc: '雷达峰顶着巨大的抛物面天线，冬天积雪没过膝盖，山下的林场与村庄与世隔绝。叶文洁在这里第一次感到宇宙的安静，也在这里说出「这是人类的落日」。基地撤销后，山峰归还给森林，只剩水泥基座和锈蚀的钢架，像一块被遗忘的墓碑。',
    characters: ['ye-wenjie', 'yang-weining', 'lei-zhicheng'],
    works: ['three-body', 'tencent-series']
  },
  {
    id: 'three-body-game',
    name: '三体游戏世界',
    nameEn: 'Three Body Game World',
    region: '互联网 · V 装具',
    type: '虚拟现实世界',
    canon: '原著与剧集',
    faction: 'eso',
    summary: 'ETO 用来筛选同类的虚拟世界，用一个个荒诞时代讲述三体文明的真相。',
    desc: '玩家戴上 V 装具进入一个永远处于乱纪元的荒原，遇见周文王、墨子、哥白尼、牛顿与秦始皇，看文明在三日凌空与大撕裂中反复归零。游戏不是娱乐，而是 ETO 的筛选器：能看懂「三体问题无解」的人，才值得被邀请加入。汪淼正是从这里一步步走到科学边界与ETO 的门口。',
    characters: ['wang-miao', 'pan-han', 'shen-yufei'],
    works: ['three-body', 'tencent-series']
  },
  {
    id: 'trisolaris-fleet',
    name: '三体舰队',
    nameEn: 'Trisolaris Fleet',
    region: '星际空间 · 半人马座 α 至太阳系',
    type: '星际舰队',
    canon: '原著',
    faction: 'trisolarians',
    summary: '一千艘恒星际战舰的远征，四百光年航程里的文明孤注一掷。',
    desc: '第一舰队在收到叶文洁回复后启航，随后是三体世界的第二次、第三次远征。舰队以亚光速穿越星际尘埃，用智子保持对地球的实时监视，用探测器水滴担任前锋。末日战役中它们几乎全歼人类舰队，也在此后漫长的航程里被黑暗森林的阴影逐一吞没。',
    characters: ['trisolaris-lord', 'sophon'],
    works: ['three-body', 'dark-forest', 'deaths-end']
  },
  {
    id: 'droplet-departure',
    name: '水滴出发地',
    nameEn: 'Droplet Launch Point',
    region: '太阳系外缘 · 三体舰队编队',
    type: '舰队锚地',
    canon: '原著',
    faction: 'trisolarians',
    summary: '三体第一舰队释放探测器的位置，人类舰队在那里迎来末日。',
    desc: '三体舰队在接近太阳系时释放了十个强互作用力探测器，人类称之为水滴。它们在木星轨道外与人类联合舰队相遇，以近乎无损的方式穿过阵列。出发地本身没有名字，只有坐标；但对人类而言，那片空域是「末日战役」的同义词，是两千艘战舰变成金属碎片的坟场。',
    characters: ['sophon', 'ding-yi'],
    works: ['dark-forest']
  },
  {
    id: 'doomsday-battle',
    name: '末日战役战场',
    nameEn: 'Doomsday Battle Field',
    region: '外太阳系 · 木星轨道外',
    type: '战场与残骸带',
    canon: '原著',
    faction: 'trisolarians',
    summary: '人类联合舰队覆灭的空域，两千艘恒星级战舰在半小时内被一枚水滴击穿。',
    desc: '末日战役中，人类把几乎所有恒星级战舰排成检阅队形，等待「和平的使者」。一枚水滴从队列的尾部穿到头部，把战舰逐一点燃；丁仪的「量子号」在接触瞬间解体。战场后来成为漂浮数十年的残骸带，也成了「人类舰队国际」这个短暂霸权唯一的墓志铭。',
    characters: ['ding-yi', 'zhang-beihai', 'dongfang-yanxu'],
    works: ['dark-forest']
  },
  {
    id: 'gravity-broadcast-station',
    name: '引力波发射台',
    nameEn: 'Gravitational Wave Broadcast Station',
    region: '地球 · 各大陆与「万有引力」号',
    type: '战略威慑设施',
    canon: '原著',
    faction: 'pdc',
    summary: '能把坐标广播到全宇宙的装置，执剑人手里的那把枪，也是黑域之外的唯一筹码。',
    desc: '引力波发射系统建于威慑纪元，是黑暗森林威慑得以成立的技术基础：一旦按下，三体世界与太阳系的坐标都会暴露。发射台在地球上由多座站点组成，同时在「万有引力」号等恒星级战舰上部署。执剑人交接的从来不是权力，而是这几组开关。',
    characters: ['luo-ji', 'cheng-xin', 'wade'],
    works: ['dark-forest', 'deaths-end']
  },
  {
    id: 'bunker-city',
    name: '掩体城市',
    nameEn: 'Bunker City',
    region: '木星、土星轨道背后',
    type: '太空城市',
    canon: '原著',
    faction: 'earth',
    summary: '躲在巨行星阴影里的城市群，人类对黑暗森林打击最后的物理防护。',
    desc: '掩体纪元的人类把城市搬到木星与土星的背面，用行星本身挡住可能的辐射与冲击。城市由巨型圆柱体与环形结构组成，在轨道上缓慢自转以制造重力。它挡住了光粒，却挡不住二向箔：掩体计划解决的从来不是根本问题，只是把死亡推迟到太阳系被压成平面那一天。',
    characters: ['cheng-xin', 'aa', 'wade'],
    works: ['deaths-end']
  },
  {
    id: 'pluto-museum',
    name: '冥王星地球文明博物馆',
    nameEn: 'Pluto Museum of Earth Civilization',
    region: '冥王星',
    type: '博物馆与纪念地',
    canon: '原著',
    faction: 'earth',
    summary: '罗辑守了一辈子的文明墓碑，把人类的一切刻在石头上留给后来者。',
    desc: '太阳系即将被二维化时，罗辑在冥王星的地下建起地球文明博物馆，把画作、书籍、器物与人类的一切记忆封存。他拒绝撤离，说「把字刻在石头上」。程心与 AA 最后一次见到他就在这里。博物馆最终随太阳系一起被压进二维，成为人类存在过的最完整证据。',
    characters: ['luo-ji', 'cheng-xin', 'aa'],
    works: ['deaths-end']
  },
  {
    id: 'dx3906',
    name: 'DX3906 星系',
    nameEn: 'DX3906',
    region: '深空 · 太阳系外',
    type: '恒星系',
    canon: '原著',
    faction: 'blue-space',
    summary: '云天明送给程心的那颗星星，后来成了人类文明最后的落脚处。',
    desc: 'DX3906 是云天明用「只送大脑」换来的报酬，一颗装有行星的恒星，被登记在程心名下。威慑失败后「蓝色空间」号与「万有引力」号向它航行，在那里建立了殖民地。程心与关一帆最终也抵达这里，却发现时间在这里走得和宇宙不一样，错过了整整一个时代。',
    characters: ['cheng-xin', 'yun-tianming', 'guan-yifan', 'chu-yan'],
    works: ['deaths-end']
  },
  {
    id: 'ashes',
    name: '灰烬（蓝星 / 紫星）',
    nameEn: 'Ashes: Blue Star & Purple Star',
    region: 'DX3906 星系',
    type: '行星',
    canon: '原著',
    faction: 'blue-space',
    summary: 'DX3906 星系中的宜居行星与它的伴星，人类殖民地的家，也是灰烬中的遗迹。',
    desc: '蓝星有海洋、大陆与温和的气候，被逃亡舰队选为殖民地；紫星是它的伴星，在天空中以另一种颜色升起。程心和关一帆降落时，殖民地早已化为遗迹——某种灾难提前抹去了这里的一切，只留下「灰烬」。这一对行星是全书最温柔也最残酷的地方：人类终于到了家，家已经不在了。',
    characters: ['cheng-xin', 'guan-yifan', 'aa'],
    works: ['deaths-end']
  },
  {
    id: 'mini-universe-647',
    name: '647 号宇宙',
    nameEn: 'Universe 647',
    region: '时间之外 · 微型宇宙',
    type: '微型宇宙',
    canon: '原著',
    faction: 'earth',
    summary: '归零者广播之后留给幸运者的一个小宇宙，时间在这里被单独存放。',
    desc: '大宇宙走向塌缩时，一些高级文明建造了成千上万个微型宇宙，各自带走了质量与时间。程心与关一帆进入的这一个编号 647，里面有农田、房子和一条小溪，像被剪下来的田园。归零者的广播要求所有小宇宙归还质量；他们最后走出那扇门，把 647 号宇宙还给了大宇宙。',
    characters: ['cheng-xin', 'guan-yifan'],
    works: ['deaths-end']
  },
  {
    id: 'four-dim-fragment',
    name: '四维空间碎片',
    nameEn: 'Four-Dimensional Fragment',
    region: '太阳系外缘 · 「魔戒」遗迹',
    type: '空间异常',
    canon: '原著',
    faction: 'four-dim',
    summary: '漂浮在太空中的四维泡沫，进入其中的人能看见三维世界的一切内部。',
    desc: '「蓝色空间」号在逃亡途中闯入一片四维空间碎片，那是四维文明留下的废墟，被称为「魔戒」。在里面，人的视觉能穿透一切封闭结构，看见同伴的内脏与舰体的每一颗螺丝。碎片不断缩小，最终把舰队吐回三维。它证明了一件事：宇宙的维度本身就是可以被当作武器的东西。',
    characters: ['guan-yifan', 'chu-yan', 'pu-yijun'],
    works: ['deaths-end']
  },
  {
    id: 'singers-world',
    name: '歌者的世界',
    nameEn: "The Singer's World",
    region: '未知深空',
    type: '文明母世界',
    canon: '原著',
    faction: 'singer',
    summary: '一个把清理低熵体当作日常工作的古老文明，太阳系的死刑判决来自这里。',
    desc: '歌者的世界没有具体形象，只有一套高度分工的清理体系：长老们讨论宇宙的熵、数量与「质量点」，基层清理员按坐标投掷光粒与二向箔。对歌者而言，太阳系只是数据库里一个需要清理的条目，人类三千年的历史连一行备注都不值。这种彻底的漠然，比仇恨更可怕。',
    characters: ['singer'],
    works: ['deaths-end']
  },
  {
    id: 'great-trough-city',
    name: '大低谷后的城市',
    nameEn: 'Post-Trough City',
    region: '地球 · 重建区',
    type: '城市群',
    canon: '原著',
    faction: 'earth',
    summary: '大低谷之后重建的人类城市，人们在废墟上学会了享乐与遗忘。',
    desc: '大低谷中全球人口锐减、工业倒退，幸存者在饥饿与恐惧里熬过几十年。危机纪元后期，重建的城市突然繁盛起来：霓虹、广告、地下娱乐与「给岁月以文明」的口号同时出现。这种繁荣带着补偿性的狂热——人类刚刚从自己的疯狂里活下来，就急着把危机忘掉，而这正是威慑迟早失效的心理土壤。',
    characters: ['luo-ji', 'shi-qiang', 'cheng-xin'],
    works: ['dark-forest']
  }
];

/* ---------------------------------------------------------------------
 * 技术造物 TECH
 * tier: 地球 | 三体 | 歌者 | 神级
 * category: 监视与信息 | 武器 | 飞船与推进 | 宇宙规律 | 生命与意识 | 社会工程
 * ------------------------------------------------------------------- */
export const TECH = [
  {
    id: 'sophon',
    name: '智子',
    nameEn: 'Sophon',
    tier: '三体',
    category: '监视与信息',
    era: '危机纪元',
    firstWork: 'three-body',
    danger: 4,
    summary: '一个被改造的质子，锁死人类基础物理，同时监视地球上的一切。',
    desc: '三体世界把单个质子二维展开，在上面蚀刻出巨型集成电路，再折叠回微观尺度，做成有智能的「智子」。它被发射到地球，驻扎在加速器里干扰实验结果，让人类的高能物理止步不前；同时它无处不在，能读到每一份文件、每一句话。智子后来还获得了人形躯体，成为三体世界在地球上的代言人。',
    related: ['sophon', 'ye-wenjie', 'trisolaris-lord', 'sophon-engineering']
  },
  {
    id: 'sophon-engineering',
    name: '智子工程（二维展开）',
    nameEn: 'Sophon Engineering: 2D Unfolding',
    tier: '三体',
    category: '宇宙规律',
    era: '危机纪元',
    firstWork: 'three-body',
    danger: 3,
    summary: '把质子从十一维展开成二维巨膜，蚀刻电路后再折叠回去的造物工艺。',
    desc: '一个质子内部还有十一维结构，展开到二维时面积可以铺满整颗行星。三体世界用这个空间做电路板，在上面建造精密到原子尺度的计算单元，再用引力技术把它折回微观。整个过程要躲开恒星风与引力扰动，失败了几次才成功。这是全书第一次展示：维度本身可以被当作材料使用。',
    related: ['sophon', 'trisolaris-lord', 'four-dim-space']
  },
  {
    id: 'droplet',
    name: '水滴',
    nameEn: 'Droplet / Strong-Interaction Probe',
    tier: '三体',
    category: '武器',
    era: '危机纪元',
    firstWork: 'dark-forest',
    danger: 5,
    summary: '强互作用力探测器，表面原子被锁死，像一颗完美的镜面泪滴。',
    desc: '水滴是十个一组的探测器，外形像一滴水银，表面绝对光滑，由强相互作用力把原子钉死在晶格上，因此几乎不可摧毁。它以锐角转向与极高速度穿过人类联合舰队，用撞击把两千艘恒星级战舰逐一点燃。丁仪在接触前一刻意识到它「不是探测器，是武器」，那是人类最后的清醒时刻。',
    related: ['ding-yi', 'sophon', 'stellar-battleship']
  },
  {
    id: 'stellar-battleship',
    name: '恒星级战舰',
    nameEn: 'Stellar-Class Battleship',
    tier: '地球',
    category: '飞船与推进',
    era: '危机纪元',
    firstWork: 'dark-forest',
    danger: 3,
    summary: '人类太空军的主力舰，核聚变推进，可长期在太阳系内作战。',
    desc: '恒星级战舰是危机纪元人类倾尽资源建造的舰队核心，排水量以百万吨计，靠聚变引擎在行星间机动。末日战役前，人类把两千艘这样的战舰排成队列迎接水滴，结果在半小时内全灭。残存的「青铜时代」号、「蓝色空间」号与「自然选择」号则成了黑暗战役与逃亡的主角。',
    related: ['zhang-beihai', 'dongfang-yanxu', 'chu-yan', 'droplet']
  },
  {
    id: 'space-elevator',
    name: '太空电梯',
    nameEn: 'Space Elevator',
    tier: '地球',
    category: '飞船与推进',
    era: '危机纪元',
    firstWork: 'dark-forest',
    danger: 2,
    summary: '用纳米材料缆绳把地面与同步轨道连起来的运输通道。',
    desc: '太空电梯的缆绳需要极高强度材料，汪淼的纳米材料研究正是它的关键。危机纪元里，人类靠电梯把建材与燃料廉价送上轨道，才有了后来的舰队与太空城。它也是「古筝行动」的技术前提被反向利用的地方：切船用的飞刃，和拉电梯的缆绳是同一种东西。',
    related: ['wang-miao', 'space-elevator']
  },
  {
    id: 'hibernation',
    name: '冬眠技术',
    nameEn: 'Hibernation',
    tier: '地球',
    category: '生命与意识',
    era: '危机纪元',
    firstWork: 'dark-forest',
    danger: 1,
    summary: '把人体降温到接近冰点长期保存，让人跨越几个世纪去见证未来。',
    desc: '冬眠让个体可以在数十年到数百年后醒来，是危机纪元人类对抗「四百年后」这个时间尺度最实用的办法。罗辑、程心、维德都多次冬眠，用几次醒来串起整部历史。它带来一个副作用：醒来的人发现法律、道德与亲人都已经换了一轮，自己成了时间里的外国人。',
    related: ['luo-ji', 'cheng-xin', 'wade']
  },
  {
    id: 'thought-print',
    name: '思想钢印',
    nameEn: 'Thought Seal',
    tier: '地球',
    category: '社会工程',
    era: '危机纪元',
    firstWork: 'dark-forest',
    danger: 4,
    summary: '直接用机器给大脑写入一条不可置疑的信念，绕过一切理性。',
    desc: '希恩斯在面壁计划中发明思想钢印，把人脑的信念当作可写入的数据，可以让受试者无条件相信「人类必胜」或「失败主义」。它高效得可怕：被钢印的人无法反思这条信念，也无法被说服。希恩斯自己被打上了「失败主义」的钢印，而这一设置究竟是疯狂还是清醒，全书没有给出答案。',
    related: ['hines', 'wallfacer-project', 'sophon-shield-room']
  },
  {
    id: 'wallfacer-project',
    name: '面壁计划',
    nameEn: 'Wallfacer Project',
    tier: '地球',
    category: '社会工程',
    era: '危机纪元',
    firstWork: 'dark-forest',
    danger: 2,
    summary: '让四个人的思想成为绝对黑箱，用战略欺骗对抗智子的全知监视。',
    desc: '既然智子能读到一切，人类索性把战略藏进四个人的脑子里：面壁者不必解释任何决定，可以调动巨量资源，唯一的对手是智子与破壁人。这个计划的精髓在于把「不可验证」变成武器。罗辑最终用它逼出了黑暗森林威慑，而另外三位面壁者的失败说明：黑箱里的东西，也可能是空的。',
    related: ['luo-ji', 'hines', 'tyler', 'rey-diaz']
  },
  {
    id: 'spell',
    name: '咒语（宇宙广播坐标）',
    nameEn: 'The Spell: Cosmic Broadcast',
    tier: '地球',
    category: '宇宙规律',
    era: '危机纪元',
    firstWork: 'dark-forest',
    danger: 4,
    summary: '向宇宙广播一颗恒星的坐标，让它被未知的猎手清除。',
    desc: '罗辑用面壁者的资源向宇宙广播了一颗恒星的坐标，声称这是「咒语」。多年后观测证实那颗恒星被摧毁，人类才第一次亲眼看到黑暗森林打击。咒语本身没有技术门槛，门槛在于理解：广播不是求救，而是判决；被广播的一方毫无还手之力，连凶手是谁都不会知道。',
    related: ['luo-ji', 'photoid', 'dual-vector-foil']
  },
  {
    id: 'gravitational-wave-transmitter',
    name: '引力波发射器',
    nameEn: 'Gravitational Wave Transmitter',
    tier: '地球',
    category: '监视与信息',
    era: '威慑纪元',
    firstWork: 'dark-forest',
    danger: 5,
    summary: '用引力波把坐标广播到全宇宙，威慑体系里唯一可靠的开关。',
    desc: '引力波能穿透一切物质，衰减极慢，是宇宙尺度上最可靠的通信方式。人类把发射系统建在地球站点与恒星级战舰上，形成「执剑人」手中的按钮网络。威慑纪元的一切政治都围绕它运转：谁控制发射台，谁就掌握两个世界的生死。威慑失败那天，第一批被摧毁的正是这些站点。',
    related: ['luo-ji', 'cheng-xin', 'gravitational-wave-transmitter']
  },
  {
    id: 'photoid',
    name: '光粒',
    nameEn: 'Photoid',
    tier: '歌者',
    category: '武器',
    era: '掩体纪元',
    firstWork: 'deaths-end',
    danger: 5,
    summary: '一枚接近光速的微小质量体，一发就能把一颗恒星打穿。',
    desc: '光粒是歌者文明最廉价的清理工具：把一个粒子加速到接近光速，让它撞进目标恒星。恒星被击穿后失控膨胀，整个行星系随之毁灭。它便宜、快速、难以预警，唯一的要求是知道坐标。人类后来发现，被光粒清理过的恒星在宇宙中并不罕见，那些孤零零的残骸就是黑暗森林的判决书。',
    related: ['singer', 'spell']
  },
  {
    id: 'dual-vector-foil',
    name: '二向箔',
    nameEn: 'Dual Vector Foil',
    tier: '歌者',
    category: '武器',
    era: '掩体纪元',
    firstWork: 'deaths-end',
    danger: 5,
    summary: '一片透明的小纸片，把三维空间永久降成二维，无法逆转。',
    desc: '二向箔触发后，三维空间在接触面上开始向二维跌落，并以光速扩散。被卷入的物体失去厚度，变成一幅无限延展的平面画；逃逸的唯一办法是进入光速航行。歌者向太阳系投掷二向箔时甚至不需要瞄准，因为代价只是宇宙又多了一个二维区域——在他们的账本上，这笔开销可以忽略不计。',
    related: ['singer', 'four-dim-space', 'light-speed-ship']
  },
  {
    id: 'black-domain',
    name: '黑域（低光速黑洞）',
    nameEn: 'Black Domain / Light-Speed Black Hole',
    tier: '地球',
    category: '宇宙规律',
    era: '掩体纪元',
    firstWork: 'deaths-end',
    danger: 3,
    summary: '把光速降到每秒十几公里的区域，让文明自我囚禁以换取安全。',
    desc: '黑域计划用降低光速的方式把太阳系包起来，形成一个谁也进不来、谁也出不去的低光速区。对外，它是一份宇宙安全声明：一个连光都跑不出的文明不可能构成威胁。对内，它是文明的坟：所有星际航行、所有未来都被锁死。人类最终选择了掩体计划，因为没有人愿意活着进坟墓。',
    related: ['light-speed-ship', 'curvature-drive']
  },
  {
    id: 'curvature-drive',
    name: '曲率驱动',
    nameEn: 'Curvature Drive',
    tier: '地球',
    category: '飞船与推进',
    era: '掩体纪元',
    firstWork: 'deaths-end',
    danger: 2,
    summary: '用飞船尾迹改变空间曲率，让船「被空间拖着走」实现光速航行。',
    desc: '曲率驱动的原理是让飞船后方的空间曲率升高、前方降低，船本身不动，是空间在流动。人类在掩体纪元通过云天明童话里的隐喻破解了它，维德与程心的团队造出了第一艘原型船。代价是航行会在身后留下无法抹平的低光速尾迹，所以每一艘光速飞船都在宇宙里留下自己的疤。',
    related: ['wade', 'cheng-xin', 'light-speed-ship', 'black-domain']
  },
  {
    id: 'light-speed-ship',
    name: '光速飞船',
    nameEn: 'Light-Speed Ship',
    tier: '地球',
    category: '飞船与推进',
    era: '掩体纪元',
    firstWork: 'deaths-end',
    danger: 2,
    summary: '能跑到光速的飞船，是逃离二维打击的唯一方式，也是黑域的死敌。',
    desc: '光速飞船用曲率驱动把速度推到接近光速，一旦启动，船外的时间与宇宙脱钩。它是太阳系唯一的逃生船票，但建造它会留下低光速尾迹，等于主动暴露，于是被人类立法禁止。程心放弃了大规模建造的机会，只有少数船在二维化时冲了出去——人类因此失去了延续的可能。',
    related: ['cheng-xin', 'wade', 'curvature-drive', 'black-domain']
  },
  {
    id: 'four-dim-space',
    name: '四维空间',
    nameEn: 'Four-Dimensional Space',
    tier: '神级',
    category: '宇宙规律',
    era: '掩体纪元',
    firstWork: 'deaths-end',
    danger: 3,
    summary: '比三维多一个方向的空域，在其中可以看见并触到三维物体的内部。',
    desc: '四维空间碎片是现代宇宙的遗迹：宇宙原本有更多维度，被高级文明用规律武器一寸寸降下来，「魔戒」就是四维文明最后的坟墓。进入四维的舰队发现封闭的舰体对它们毫无意义，一切内部结构都敞开。关一帆后来意识到，三维宇宙本身就是被战争改造过的残骸，而人类只是没被通知的居民。',
    related: ['guan-yifan', 'dual-vector-foil', 'cosmic-constant-weapon']
  },
  {
    id: 'human-computer',
    name: '人列计算机',
    nameEn: 'Human Formation Computer',
    tier: '三体',
    category: '监视与信息',
    era: '危机纪元',
    firstWork: 'three-body',
    danger: 1,
    summary: '用三千万士兵列阵充当逻辑门，组成一台人力机械计算机。',
    desc: '三体游戏里，冯·诺依曼向秦始皇提议：让士兵举黑白旗表示 0 与 1，按门电路排列，就能组成一台计算机，用来运算三体问题的轨道。整个阵列需要三千万人，靠鼓声与旗语同步。这个荒诞的设计其实是全书的隐喻：三体文明用整个文明的肉体去计算自己的命运，而答案依然是无解。',
    related: ['dehydration', 'sophon-engineering', 'sophon']
  },
  {
    id: 'antimatter-engine',
    name: '反物质发动机',
    nameEn: 'Antimatter Engine',
    tier: '地球',
    category: '飞船与推进',
    era: '危机纪元',
    firstWork: 'dark-forest',
    danger: 4,
    summary: '用正反物质湮灭释放能量推进，效率极高，也极难安全储存。',
    desc: '反物质推进是恒星级战舰之外的另一条技术路线，能量密度远高于聚变，但磁约束存储一旦失效就是灾难。掩体纪元的太空城与部分战舰使用它做姿控与高速机动。它也提醒读者：人类的技术进步始终是「更好的爆炸物」，而不是更好的判断力。',
    related: ['stellar-battleship', 'light-speed-ship']
  },
  {
    id: 'dehydration',
    name: '脱水与浸泡',
    nameEn: 'Dehydration and Rehydration',
    tier: '三体',
    category: '生命与意识',
    era: '危机纪元',
    firstWork: 'three-body',
    danger: 2,
    summary: '三体人把身体的水分排出变成一张纤维皮卷，躲过乱纪元的极端气候。',
    desc: '三体行星的气候在恒纪元与乱纪元之间切换，三体人进化出脱水能力：把体内的水排干，身体塌成一张可以卷起来储存的皮，等到环境适宜再浸泡复原。这种能力塑造了他们的文明形态——没有个体的连续生活，只有文明的连续存续。人类后来发现，自己的「冬眠」不过是同一件事的拙劣版本。',
    related: ['human-computer', 'sophon', 'sophon-engineering']
  },
  {
    id: 'three-body-helmet',
    name: '三体游戏头盔',
    nameEn: 'Three Body Game Headset (V-Suit)',
    tier: '地球',
    category: '监视与信息',
    era: '危机纪元',
    firstWork: 'three-body',
    danger: 2,
    summary: '让玩家完全沉浸在游戏世界里的 V 装具，也是 ETO 的准入装置。',
    desc: '这套全身式装具能屏蔽现实感官，把玩家送入三体游戏的虚拟世界，同时在后台记录玩家的生理与情绪数据。ETO 用它筛选成员：反应、理解力、对文明存亡的态度都被量化。汪淼戴上它之后，现实与游戏的边界开始溶解——这也是智子之外，另一种更温柔、更彻底的监视。',
    related: ['wang-miao', 'pan-han', 'sophon']
  },
  {
    id: 'sophon-shield-room',
    name: '智子屏蔽室',
    nameEn: 'Sophon-Proof Room',
    tier: '地球',
    category: '监视与信息',
    era: '危机纪元',
    firstWork: 'dark-forest',
    danger: 1,
    summary: '用特殊材料与结构屏蔽智子探测的房间，人类唯一能说真话的地方。',
    desc: '智子能读到一切公开的信息，于是人类造出屏蔽室：靠特殊屏蔽层与随机化设计，让智子无法稳定地观测室内的量子态，从而无法窃听。面壁者会议、执剑人交接、最机密的战略讨论都在这里进行。一个文明要靠一间小黑屋才能保住秘密，这本身就是威慑纪元的写照。',
    related: ['sophon', 'wallfacer-project', 'thought-print']
  },
  {
    id: 'macro-atom',
    name: '宏原子与球状闪电',
    nameEn: 'Macro-Atom and Ball Lightning',
    tier: '地球',
    category: '武器',
    era: '危机前',
    firstWork: 'ball-lightning',
    danger: 4,
    summary: '把电子放大到宏观尺度的「宏原子」，坍缩时释放球状闪电，可化为武器。',
    desc: '《球状闪电》里，林云与陈博士追查球状闪电的本质，发现它是宏电子被激发后的宏观量子现象。宏原子核聚变能造出能量远超核弹的武器，林云最终把自己也变成了量子态的存在。这套设定后来被《三体》继承：丁仪的球状闪电研究与宏原子理论，正是他日后解析水滴的知识背景。',
    related: ['lin-yun', 'chen-bo', 'ding-yi', 'droplet']
  },
  {
    id: 'mass-point',
    name: '质量点与歌者之眼',
    nameEn: "Mass Point & The Singer's Eye",
    tier: '歌者',
    category: '武器',
    era: '掩体纪元',
    firstWork: 'deaths-end',
    danger: 5,
    summary: '歌者的两种清理手段：扔一个质量点砸掉恒星，或用眼睛扫出坐标。',
    desc: '歌者在清理太阳系时，先考虑用质量点——一块被加速到极高速度的物质，足以击穿恒星；随后改用更省事的二向箔。「歌者之眼」是它检索宇宙的手段：扫过一片区域，读出所有可见的坐标与文明痕迹，再决定谁该被清理。对歌者而言这是日常工作，对人类而言这是末日审判。',
    related: ['singer', 'photoid', 'dual-vector-foil']
  },
  {
    id: 'cosmic-constant-weapon',
    name: '宇宙常数武器',
    nameEn: 'Cosmic Constant Weapon',
    tier: '神级',
    category: '宇宙规律',
    era: '掩体纪元',
    firstWork: 'deaths-end',
    danger: 5,
    summary: '改写物理常数本身，把宇宙的一部分改造成对自己有利的形态。',
    desc: '归零者与更古老的文明使用的手段远超武器范畴：他们能修改光速、维度与宇宙常数，把整个区域改写成另一种物理。二向箔只是这类技术的低端产物；更彻底的做法是让宇宙在某个局部「变成另一个宇宙」。这也是归零者最后要收回所有小宇宙质量的原因：常数被改得太多，大宇宙已经无法自己塌缩。',
    related: ['dual-vector-foil', 'black-domain', 'four-dim-space']
  }
];

/* ---------------------------------------------------------------------
 * 术语 GLOSSARY
 * category: 宇宙社会学 | 三体文明 | 人类组织 | 科技 | 纪元 | 哲学
 * 注：与 TECH 同名的条目（人列计算机 / 思想钢印 / 脱水 / 光速飞船 / 四维空间）
 *     术语 id 加 '-term' 后缀，避免与 TECH 条目 id 冲突。
 * ------------------------------------------------------------------- */
export const GLOSSARY = [
  {
    id: 'dark-forest',
    term: '黑暗森林法则',
    termEn: 'Dark Forest Law',
    category: '宇宙社会学',
    definition: '宇宙中任何暴露坐标的文明，都会被更强的猎手清除。',
    detail: '罗辑从叶文洁的提示出发，把宇宙社会学归结为两条公理：生存是文明的第一需要；文明不断扩张，而宇宙的物质总量不变。由此必然推出猜疑链与技术爆炸，于是「隐藏」成了唯一的生存策略。他用一颗恒星的毁灭向三体世界证明了这个推论，人类由此获得威慑，也从此明白自己一直住在黑暗森林里。',
    related: ['luo-ji', 'ye-wenjie', 'chain-of-suspicion', 'spell']
  },
  {
    id: 'chain-of-suspicion',
    term: '猜疑链',
    termEn: 'Chain of Suspicion',
    category: '宇宙社会学',
    definition: '双方无法确认对方是否善意，于是只能按最坏的可能行动。',
    detail: '猜疑链的可怕在于它无法被沟通打断：你不知道我是否善意，我不知道你是否知道我善意，如此无限递归。星际距离让任何交流都有几百年延迟，善意无法被验证，恶意却可以瞬间生效。因此两个文明相遇时，先动手的一方永远占优，而沉默与隐藏成了唯一理性的选择。',
    related: ['dark-forest', 'cosmic-sociology', 'singer']
  },
  {
    id: 'technological-explosion',
    term: '技术爆炸',
    termEn: 'Technological Explosion',
    category: '宇宙社会学',
    definition: '文明的技术可能在极短时间内跃升，瞬间反超先发者。',
    detail: '人类从农业到信息时代只用了几千年，而宇宙尺度上的「几千年」几乎等于瞬间。三体世界因此不敢等待：四百年后到达时，人类可能已经反超。技术爆炸让「强者恒强」的假设失效，也让黑暗森林中的每一次犹豫都变得危险——你今晚不清理的低熵体，明天可能就是猎手。',
    related: ['dark-forest', 'chain-of-suspicion', 'trisolaris']
  },
  {
    id: 'cosmic-sociology',
    term: '宇宙社会学',
    termEn: 'Cosmic Sociology',
    category: '宇宙社会学',
    definition: '把宇宙中的文明当作社会系统，研究其行为规律的学科。',
    detail: '这是叶文洁给罗辑留下的题目：假设宇宙中文明众多、距离遥远、彼此无法验证意图，那么它们的互动会呈现出什么规律。罗辑用两条公理与两个概念（猜疑链、技术爆炸）推出了黑暗森林。这套理论的迷人之处在于，它把天文学问题变成了博弈论问题，而结论是人类最不愿意听到的那一个。',
    related: ['luo-ji', 'ye-wenjie', 'dark-forest']
  },
  {
    id: 'wallfacer-plan',
    term: '面壁计划',
    termEn: 'Wallfacer Project',
    category: '人类组织',
    definition: '选出四人以绝对黑箱的方式制定对三体战略，对抗智子监视。',
    detail: '因为智子能读到一切，人类只能把战略藏进人脑。四位面壁者拥有几乎无限的资源与不必解释的权力，各自提出看似荒谬的方案：泰勒的量子舰队、雷迪亚兹的恒星型氢弹、希恩斯的思想钢印、罗辑的咒语。计划的核心是把「不可理解」变成武器，而破壁人的任务就是把这四个黑箱一一打开。',
    related: ['luo-ji', 'tyler', 'rey-diaz', 'hines', 'wall-breaker']
  },
  {
    id: 'wall-breaker',
    term: '破壁人',
    termEn: 'Wallbreaker',
    category: '人类组织',
    definition: '受三体世界指派，专门破解面壁者真实战略的人。',
    detail: '破壁人由 ETO 挑选，被赋予极高的分析权限，任务只有一个：看穿面壁者的真实计划并公之于众。三位面壁者先后被破壁，计划随之破产。罗辑的特殊之处在于他没有破壁人——因为三体世界亲自出面，而他真正藏着的东西，连他自己都要靠一颗恒星的死亡才敢确认。',
    related: ['wallfacer-plan', 'sophon', 'eto', 'luo-ji']
  },
  {
    id: 'swordholder',
    term: '执剑人',
    termEn: 'Swordholder',
    category: '人类组织',
    definition: '手握引力波发射开关、以同归于尽维持威慑的那个人。',
    detail: '执剑人的权力是纯粹的：只要按下按钮，两个世界的坐标就会暴露，文明同灭。罗辑守了五十四年，靠的不是善意而是可信的疯狂。程心接任十分钟后威慑就被打破，因为她的人性让三体世界确信她不会按下。这个职位衡量的从来不是道德，而是一个人在绝境中愿意承担多少罪。',
    related: ['luo-ji', 'cheng-xin', 'deterrence-degree', 'gravitational-wave-transmitter']
  },
  {
    id: 'deterrence-degree',
    term: '威慑度',
    termEn: 'Deterrence Index',
    category: '宇宙社会学',
    definition: '衡量一个执剑人真正敢于按下按钮的概率，决定威慑是否成立。',
    detail: '威慑不是靠武器，而是靠对方对你行为的预判。罗辑的威慑度长期维持在百分之九十以上，因为他让三体世界相信他真的会按；程心的威慑度只有个位数，于是威慑在交接的瞬间失效。这个指标冷酷地说明：在黑暗森林里，最可靠的和平来自一个不可预测的人。',
    related: ['swordholder', 'luo-ji', 'cheng-xin']
  },
  {
    id: 'deterrence-era',
    term: '威慑纪元',
    termEn: 'Deterrence Era',
    category: '纪元',
    definition: '罗辑建立黑暗森林威慑后，人类与三体世界共处的和平时期。',
    detail: '威慑纪元里，三体世界向人类输出技术，两个文明第一次「和平」交往：智子教人类基础科学，人类给三体人看艺术与诗歌。地球繁荣到近乎奢侈，人们把和平当成常态，把执剑人当成过时的怪物。这段和平的脆弱之处在于，它只依赖一个人的意志，而人类正在用文明的方式消解这种意志。',
    related: ['luo-ji', 'swordholder', 'great-trough']
  },
  {
    id: 'great-trough',
    term: '大低谷',
    termEn: 'The Great Trough',
    category: '纪元',
    definition: '危机纪元中期的全球性崩溃：经济瓦解、人口锐减、文明倒退。',
    detail: '三体舰队启航后，人类陷入长期恐慌，资源被军备与逃亡计划抽干，随后是饥荒、战乱与政权崩溃。大低谷持续数十年，全球人口锐减到不足原先的一半。走出低谷后，人类用「给岁月以文明，而不是给文明以岁月」自我安慰，转向享乐与遗忘——这种补偿性的乐观，是后来威慑失效的心理根源。',
    related: ['deterrence-era', 'great-trough-city']
  },
  {
    id: 'guzheng-operation',
    term: '古筝行动',
    termEn: 'Operation Guzheng',
    category: '人类组织',
    definition: '用纳米飞刃在巴拿马运河把「审判日」号连人带船切成薄片。',
    detail: '为了夺取 ETO 与三体世界的通讯记录，军方在运河两岸架起纳米丝「飞刃」，等「审判日」号通过时把它连同船上的伊文斯一起切成数十层薄片。行动成功了，人类拿到了智子与三体世界的全部对话，也第一次直面「为了生存可以多残忍」这个问题。汪淼的纳米材料因此从实验室走进了历史。',
    related: ['wang-miao', 'evans', 'shi-qiang', 'eto']
  },
  {
    id: 'red-coast-project',
    term: '红岸工程',
    termEn: 'Red Coast Project',
    category: '人类组织',
    definition: '冷战年代以太阳为放大器、向宇宙发送大功率信号的秘密计划。',
    detail: '红岸表面是国防通讯研究，真实目的是寻找并联络外星文明。它利用太阳对特定频率的电磁波进行放大，把信号送出数百光年。叶文洁在红岸完成了关键的理论与实验，也在这里收到三体世界的回复并作出回答。这个工程的讽刺在于：它本意是让人类不再孤独，结果让人类差点灭绝。',
    related: ['ye-wenjie', 'red-coast', 'lei-zhicheng']
  },
  {
    id: 'science-frontier',
    term: '科学边界',
    termEn: 'Science Frontier',
    category: '人类组织',
    definition: '由顶尖科学家组成的松散学术组织，实际是 ETO 的外围招募网。',
    detail: '科学边界以学术沙龙的形式存在，讨论基础科学的边界与哲学的尽头。它真正的功能是筛选：把对物理学绝望的科学家引向 ETO，再引向三体世界。杨冬、申玉菲、汪淼都曾在这里出现。一个看起来最纯粹的学术团体，成了人类历史上最大背叛的入口。',
    related: ['wang-miao', 'shen-yufei', 'yang-dong', 'eto']
  },
  {
    id: 'eto-factions',
    term: '降临派 / 拯救派 / 幸存派',
    termEn: 'Adventists / Redemptionists / Survivors',
    category: '人类组织',
    definition: 'ETO 内部三条路线：迎接主、拯救主、以及在末日里活下去。',
    detail: '降临派认为人类无可救药，主张让三体世界接管地球，伊文斯是代表；拯救派试图用人类的智慧帮助三体文明解决三体问题，以此换取和平，申玉菲属于这一支；幸存派则只关心自己和后代能否在末日中活下来。三派的分裂最终导致 ETO 内斗与被剿灭，但他们对人类的判断并没有错。',
    related: ['evans', 'shen-yufei', 'eto', 'pan-han']
  },
  {
    id: 'sophon-blockade',
    term: '智子封锁',
    termEn: 'Sophon Blockade',
    category: '科技',
    definition: '用智子干扰高能加速器，使人类基础物理无法前进。',
    detail: '智子驻扎在粒子加速器里，代替靶标与粒子发生反应，让实验结果变成一堆无意义的噪声。人类因此无法验证任何新理论，基础科学被钉死在二十世纪的水平。封锁的高明之处在于它不摧毁人类，只让人类确信「物理学不存在了」——从内部瓦解科学的信心。',
    related: ['sophon', 'science-frontier', 'three-body-problem']
  },
  {
    id: 'three-body-problem',
    term: '三体问题',
    termEn: 'Three-Body Problem',
    category: '三体文明',
    definition: '三个天体在引力作用下的运动没有一般解析解，长期不可预测。',
    detail: '三体问题是经典力学里著名的不可解问题：三颗恒星相互绕转，轨道对初始条件极度敏感，任何微小扰动都会导致完全不同的未来。三体行星就活在这样的混沌里，恒纪元与乱纪元随机交替。三体文明用尽一切办法预测，甚至造出人列计算机，最终只能承认：他们的世界没有稳定的未来。',
    related: ['human-computer', 'triple-sun', 'chaotic-era']
  },
  {
    id: 'triple-sun',
    term: '三日凌空',
    termEn: 'Three Suns in the Sky',
    category: '三体文明',
    definition: '三颗恒星同时升起，地表被烤成焦土的三体世界灾难。',
    detail: '三日凌空时，三体行星表面温度骤升，海洋沸腾，文明在烈焰中化为灰烬。这是三体游戏里最震撼的一幕，也是三体文明最深的历史创伤：他们不是在探索宇宙，而是在逃离自己的太阳。这个意象后来成了整个系列最有力的比喻——人类头顶的太阳，对另一个文明而言是屠刀。',
    related: ['three-body-problem', 'trisolaris', 'three-body-game']
  },
  {
    id: 'chaotic-era',
    term: '混沌 / 恒纪元 / 乱纪元',
    termEn: 'Chaos / Stable Era / Chaotic Era',
    category: '三体文明',
    definition: '三体世界气候的三种状态：稳定、剧烈交替、以及彻底无序。',
    detail: '恒纪元里太阳规律升起，文明得以发展农业与城市；乱纪元里昼夜与季节完全失序，文明只能脱水苟活；混沌则是连规律都不再存在的阶段，一切预测失效。三体人把「找到恒纪元」当作终极目标，这种对稳定的执念，解释了他们对地球的渴望，也解释了他们的冷酷。',
    related: ['triple-sun', 'dehydration', 'three-body-problem']
  },
  {
    id: 'dehydration-term',
    term: '脱水',
    termEn: 'Dehydration',
    category: '三体文明',
    definition: '三体人排干体内水分、塌缩成纤维皮卷以度过乱纪元的生存方式。',
    detail: '脱水后的三体人薄如一张皮，可以卷起来堆在仓库里，等到恒纪元来临再浸泡复原。这项能力让文明得以在一次次灾难中存续，却也塑造了他们的价值观：个体是可以被折叠、储存、牺牲的单位。人类第一次在游戏里看到这一幕时，感到的不是同情，而是寒意。',
    related: ['dehydration', 'chaotic-era', 'trisolaris']
  },
  {
    id: 'human-computer-term',
    term: '人列计算机',
    termEn: 'Human Formation Computer',
    category: '科技',
    definition: '用千万士兵列阵模拟逻辑门，组成一台人力机械计算机。',
    detail: '游戏里的冯·诺依曼设计了这套系统：士兵举黑白旗代表二进制，按与、或、非门排列，靠鼓声同步，整体运算三体问题的轨道。三千万人组成的计算机运转起来气势恢宏，算出的结果却是「无解」。这个设定既是硬核的科普，也是绝妙的讽刺：用整个文明去计算，也算不出自己的出路。',
    related: ['human-computer-term', 'three-body-problem', 'three-body-game']
  },
  {
    id: 'thought-print-term',
    term: '思想钢印',
    termEn: 'Thought Seal',
    category: '科技',
    definition: '直接向大脑写入不可置疑的信念，使被印者无法反思该信念。',
    detail: '思想钢印由希恩斯在面壁计划中发明，原理是绕过理性直接固化神经回路。它可以让士兵相信「人类必胜」，也可以让军官相信「人类必败」。可怕之处不在技术，而在伦理：被印者依然能思考，只是永远绕不开那一条。希恩斯给自己打上失败主义钢印，究竟是逃避，还是对人类最清醒的判断，全书没有回答。',
    related: ['thought-print-term', 'hines', 'wallfacer-plan']
  },
  {
    id: 'space-force',
    term: '太空军',
    termEn: 'Space Force',
    category: '人类组织',
    definition: '危机纪元组建的地球太空军事力量，人类第一支星际作战部队。',
    detail: '太空军由常伟思等人筹建，最初只有几艘试验舰与一批被嘲笑的军官。它承载了人类对「四百年后」的全部焦虑：建舰队、修太空电梯、训练星际战术。末日战役中它几乎全军覆没，但它留下的逃亡舰船成了人类文明延续的火种。',
    related: ['chang-weisi', 'zhang-beihai', 'stellar-battleship']
  },
  {
    id: 'fleet-international',
    term: '舰队国际',
    termEn: 'Fleet International',
    category: '人类组织',
    definition: '取代联合国的太空舰队政治实体，掌握人类几乎全部军事力量。',
    detail: '随着舰队规模膨胀，太空军从各国的联合部队演变为独立的超国家权力，最终形成舰队国际。它拥有恒星级战舰、太空城与自己的法律，地球反而成了它的辖区。末日战役后，舰队国际名存实亡，残存的舰船各自为战，黑暗战役就发生在这些「国家」之间。',
    related: ['stellar-battleship', 'space-force', 'dongfang-yanxu']
  },
  {
    id: 'pdc',
    term: 'PDC（行星防御理事会）',
    termEn: 'Planetary Defense Council',
    category: '人类组织',
    definition: '危机纪元成立的全球最高决策机构，负责统筹对三体的防御。',
    detail: 'PDC 由各国代表组成，掌握面壁计划的授权、舰队建设与冬眠名额分配。它既是人类集中力量的尝试，也是官僚与政治妥协的集合体：面壁者的荒唐方案必须经过它，执剑人的交接由它安排，掩体计划与光速飞船的取舍也在它手里。人类所有重大错误，几乎都盖着 PDC 的章。',
    related: ['garenin', 'kent', 'wallfacer-plan', 'space-force']
  },
  {
    id: 'eto',
    term: 'ETO（地球三体组织）',
    termEn: 'Earth-Trisolaris Organization',
    category: '人类组织',
    definition: '由叶文洁与伊文斯创立、以迎接三体世界为目标的秘密组织。',
    detail: 'ETO 在几十年间渗透进科学界、政界与军方，用科学边界招募信徒，用三体游戏筛选同类，用智子获取情报。它的成员大多受过最好的教育，正因为看得太清楚才选择背叛。组织内部三派分裂，最终被古筝行动与各国联合行动摧毁，但它的判断——人类自己解决不了自己的问题——被后来的历史反复验证。',
    related: ['ye-wenjie', 'evans', 'eto-factions', 'guzheng-operation']
  },
  {
    id: 'bunker-plan',
    term: '掩体计划',
    termEn: 'Bunker Plan',
    category: '人类组织',
    definition: '把城市建到巨行星背后，用以抵御光粒打击的防御方案。',
    detail: '掩体计划假设黑暗森林打击以光粒为主，于是人类把城市与工业迁到木星、土星轨道背面，用行星本体挡住辐射。它需要天文数字的资源，也让人类错过了光速飞船。二向箔落下时，掩体城市连挣扎的机会都没有——这个计划的根本错误在于，它用「挡住已知的武器」代替了「离开这个星系」。',
    related: ['bunker-city', 'photoid', 'light-speed-ship']
  },
  {
    id: 'black-domain-plan',
    term: '黑域计划',
    termEn: 'Black Domain Plan',
    category: '人类组织',
    definition: '降低太阳系光速、把文明封死在低光速区内的自囚方案。',
    detail: '黑域计划认为，只要让太阳系的光速降到每秒十几公里，外部文明就会判定这里不再构成威胁，从而放过人类。代价是永久的自我囚禁：没有星际航行，没有未来，只有安全。人类最终否决了它，因为在多数人看来，一个没有未来的安全，和死亡没有区别。',
    related: ['black-domain', 'cosmic-safety-statement', 'light-speed-ship']
  },
  {
    id: 'light-speed-ship-term',
    term: '光速飞船',
    termEn: 'Light-Speed Ship',
    category: '科技',
    definition: '以曲率驱动达到光速的飞船，是逃离二维打击的唯一工具。',
    detail: '光速飞船的技术难点不在能量，而在航迹：曲率驱动会在身后留下无法消除的低光速区，等于向全宇宙广播自己的位置。人类因此立法禁止大规模建造。掩体纪元末期，只有维德的星环城与少数几艘船掌握这项技术。当二向箔降临，能走的只有那几艘船，而它们带走的不是人类，只是人类的样品。',
    related: ['curvature-drive', 'light-speed-ship', 'bunker-plan']
  },
  {
    id: 'cosmic-safety-statement',
    term: '宇宙安全声明',
    termEn: 'Cosmic Safety Statement',
    category: '宇宙社会学',
    definition: '向宇宙证明自己无害、不会再扩张的公开姿态。',
    detail: '在黑暗森林里，唯一可信的安全声明是「我永远不会威胁你」。人类试过很多种：黑域把光速降下来，等于宣布放弃星际航行；也有文明选择自我降维或放弃技术。但任何声明都必须付出不可逆的代价，而人类始终不愿意付。于是太阳系没有发出任何有效的安全声明，只有一座黑暗森林。',
    related: ['black-domain', 'dark-forest', 'zeroers']
  },
  {
    id: 'zeroers',
    term: '归零者',
    termEn: 'Zeroers',
    category: '哲学',
    definition: '宇宙中最古老的文明之一，主张把宇宙的一切参数归零、重启大宇宙。',
    detail: '归零者认为宇宙被各文明用规律武器改得面目全非——光速被降低、维度被削去、质量被藏进小宇宙——因此必须把所有小宇宙的质量归还，让宇宙重新塌缩、再次爆炸。他们向全宇宙广播这条要求，语气平静得像通知。这个名字本身就是一种宣判：所有文明的努力，最终都要被清零。',
    related: ['cosmic-constant-weapon', 'mini-universe-647', 'pastoral-era']
  },
  {
    id: 'singer-civilization',
    term: '歌者文明',
    termEn: 'The Singer Civilization',
    category: '三体文明',
    definition: '一个古老而庞大的清理型文明，把消灭低熵体当作日常事务。',
    detail: '歌者文明的社会高度分工，有长老、清理员、数据库与遍布宇宙的观测网。他们对太阳系的处理流程化得可怕：查坐标、评估威胁、选择工具、投掷、记录。清理员甚至在开会时讨论宇宙的熵与母世界的危机，顺手就决定了人类的命运。这种彻底的官僚式冷漠，是黑暗森林最真实的模样。',
    related: ['singer', 'photoid', 'dual-vector-foil', 'mass-point']
  },
  {
    id: 'four-dim-space-term',
    term: '四维空间',
    termEn: 'Four-Dimensional Space',
    category: '科技',
    definition: '比三维多一个方向的空域，可以看到三维物体的全部内部。',
    detail: '四维空间碎片是宇宙被降维战争改造后留下的残迹。在四维里，封闭的舰体、人的身体都像摊开的图纸，一切内部结构暴露无遗。人类由此第一次直观理解「维度」是一种可以被剥夺的资源。关一帆后来提出，宇宙原本有更多维度，现在的三维宇宙本身就是战场遗迹。',
    related: ['four-dim-space', 'four-dim-fragment', 'dual-vector-foil']
  },
  {
    id: 'beyond-time',
    term: '时间之外',
    termEn: 'Beyond Time',
    category: '纪元',
    definition: '小宇宙内部独立于大宇宙的时间流，进入者可以等到宇宙重启。',
    detail: '647 号宇宙里有一扇门，门外是大宇宙，门内是独立的时间。程心与关一帆在里面生活了很久，出来时大宇宙已经过去了一千八百多万年。时间之外不是永生，而是一种错过：你保住了自己，却失去了所有与你有关的人与事。这是全书对「逃避」最温柔也最残酷的定义。',
    related: ['mini-universe-647', 'pastoral-era', 'zeroers']
  },
  {
    id: 'pastoral-era',
    term: '宇宙的田园时代',
    termEn: 'The Pastoral Age of the Universe',
    category: '哲学',
    definition: '宇宙最初的样子：高维、光速极高、文明稀少而和平。',
    detail: '关一帆告诉程心，宇宙曾经有过一个田园时代：十维空间，光速无限，星星之间可以随意往来，文明之间不必互相消灭。后来文明为了战争不断降维、降光速，把宇宙改造成现在的贫瘠模样。这个说法没有实证，却像一则创世神话——人类所恐惧的黑暗森林，也许只是别人战争之后的废墟。',
    related: ['four-dim-space', 'zeroers', 'beyond-time']
  },
  {
    id: 'trisolaran-civilization',
    term: '三体文明',
    termEn: 'Trisolaran Civilization',
    category: '三体文明',
    definition: '在半人马座 α 星系挣扎求生的文明，拥有集体思维与极端理性。',
    detail: '三体文明的个体可以脱水储存，思维通过电磁波直接交流，因此没有谎言，也没有隐私。他们的历史就是一部与三颗太阳搏斗的灾难史，所有文化都围绕「生存」展开。当他们得知地球的存在，第一反应不是交流而是占领——这不是邪恶，而是一个濒死文明唯一合乎逻辑的选择。',
    related: ['trisolaris', 'trisolaris-lord', 'chaotic-era']
  },
  {
    id: 'broadcast-era',
    term: '广播纪元',
    termEn: 'Broadcast Era',
    category: '纪元',
    definition: '太阳系坐标被广播之后，人类等待黑暗森林打击的时期。',
    detail: '威慑失败后，三体世界摧毁了引力波发射系统，但「蓝色空间」号与「万有引力」号仍然向宇宙广播了三体世界的坐标，太阳系的位置也随之暴露。广播纪元里人类知道判决已下，却不知道刑期多长。这个时期最荒诞的产物是「宇宙安全声明」的各种方案，以及人类对「也许不会来」的自我安慰。',
    related: ['gravity-broadcast-station', 'cosmic-safety-statement', 'bunker-era']
  },
  {
    id: 'bunker-era',
    term: '掩体纪元',
    termEn: 'Bunker Era',
    category: '纪元',
    definition: '人类迁入巨行星背后的掩体城市、等待打击降临的时代。',
    detail: '掩体纪元是人类技术最发达的时期：太空城、曲率驱动、冬眠与人工智能都已成熟。但整个社会的主题是「等待」——等待一枚光粒，或者别的什么。人们照常生活、恋爱、举办艺术展，把末日过成了日常。当二向箔出现时，这种日常只维持了几天。',
    related: ['bunker-city', 'bunker-plan', 'broadcast-era']
  }
];

/* ---------------------------------------------------------------------
 * 名句 QUOTES
 * 说明：无法逐字确认的句子以「大意」形式给出，并在 context 中注明。
 * ------------------------------------------------------------------- */
export const QUOTES = [
  {
    id: 'do-not-answer',
    text: '不要回答！不要回答！不要回答！',
    textEn: 'Do not answer! Do not answer! Do not answer!',
    speaker: 'listener-1379',
    context: '1379 号监听员收到叶文洁发来的信号，在回复中反复警告她不要暴露位置。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'come-here',
    text: '到这里来吧，我将帮助你们获得这个世界。',
    textEn: 'Come here, I will help you take this world.',
    speaker: 'ye-wenjie',
    context: '叶文洁在红岸按下发射键，向四光年外的三体世界发出邀请，人类的历史从此改道。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'our-civilization-cannot-solve',
    text: '我的文明已无力解决自己的问题，需要你们的帮助。',
    speaker: 'trisolaris-lord',
    context: '三体世界对叶文洁的回复。一个濒死文明第一次向另一个世界求援。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'universe-will-flicker',
    text: '整个宇宙将为你闪烁。',
    speaker: 'shen-yufei',
    context: '申玉菲向汪淼暗示，他看到的宇宙背景辐射闪烁并非幻觉，而是智子的宣告。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'lord-does-not-care',
    text: '主不在乎。',
    speaker: 'pan-han',
    context: '潘寒面对人类的反抗与挣扎时给出的回答：在主眼里人类不值一提。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'down-with-human-tyranny',
    text: '消灭人类暴政，世界属于三体！',
    textEn: 'Eliminate human tyranny! The world belongs to Trisolaris!',
    speaker: 'narrator',
    context: 'ETO 集会上的口号，被信徒们在暗处反复呼喊，也是他们最后的自我安慰。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'shi-qiang-ghost',
    text: '邪乎到家必有鬼。',
    speaker: 'shi-qiang',
    context: '史强查案时的口头禅：越是解释不通的怪事，背后越有人在动手。剧集保留了这句台词。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'human-sunset',
    text: '这是人类的落日。',
    speaker: 'ye-wenjie',
    context: '晚年的叶文洁回到雷达峰，看着夕阳说出这句话，像一句预言也像一句忏悔。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'you-are-bugs',
    text: '你们是虫子。',
    speaker: 'sophon',
    context: '智子向全人类展示三体世界的态度：在这个宇宙里，人类只是虫子。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'bugs-never-lose',
    text: '虫子从来就没有被真正战胜过。',
    speaker: 'shi-qiang',
    context: '史强带汪淼去看漫天遍野的蝗虫，用一句大白话把人类的绝望顶了回去。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'physics-does-not-exist',
    text: '物理学不存在了。',
    speaker: 'sophon',
    context: '智子对地球科学界的宣告。大意概括自原著中科学家们的集体绝望。',
    work: 'three-body',
    canon: '原著'
  },
  {
    id: 'dark-forest-hunter',
    text: '宇宙就是一座黑暗森林，每个文明都是带枪的猎人。',
    textEn: 'The universe is a dark forest, and every civilization is a hunter with a gun.',
    speaker: 'luo-ji',
    context: '罗辑在面壁者听证会与联合国的场合解释黑暗森林，人类第一次听懂判决。',
    work: 'dark-forest',
    canon: '原著'
  },
  {
    id: 'speak-to-trisolaris',
    text: '我要对三体世界说话。',
    speaker: 'luo-ji',
    context: '罗辑以执剑人的身份回到零号基地，向三体世界发出最后通牒，威慑在此刻成立。',
    work: 'dark-forest',
    canon: '原著'
  },
  {
    id: 'your-wallbreaker',
    text: '面壁者罗辑，我是你的破壁人。',
    speaker: 'sophon',
    context: '三位面壁者相继被破壁后，三体世界亲自出面，承认罗辑没有破壁人。',
    work: 'dark-forest',
    canon: '原著'
  },
  {
    id: 'broadcast-coordinates',
    text: '现在，我将向宇宙广播三体世界的坐标。',
    speaker: 'luo-ji',
    context: '罗辑对决三体世界的台词，大意概括自原著中他按下威慑开关的场景。',
    work: 'dark-forest',
    canon: '原著'
  },
  {
    id: 'natural-selection-ahead',
    text: '自然选择，前进四！',
    speaker: 'zhang-beihai',
    context: '章北海夺取「自然选择」号控制权后下达的命令，人类逃亡就此开始。',
    work: 'dark-forest',
    canon: '原著'
  },
  {
    id: 'give-years-civilization',
    text: '给岁月以文明，而不是给文明以岁月。',
    textEn: 'Give years to civilization, not civilization to years.',
    speaker: 'narrator',
    context: '大低谷之后人类的自我安慰，帕斯卡名言的改写，被刻在重建城市的广场上。',
    work: 'dark-forest',
    canon: '原著'
  },
  {
    id: 'weakness-and-ignorance',
    text: '弱小和无知不是生存的障碍，傲慢才是。',
    speaker: 'narrator',
    context: '《死神永生》中对人类一次次错判的总结，也是全书最冷的一句判词。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'lose-humanity',
    text: '失去人性，失去很多；失去兽性，失去一切。',
    speaker: 'wade',
    context: '维德对程心说的话，为星环城与光速飞船之争定下基调，也成为全书最锋利的伦理判词。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'advance-advance',
    text: '前进！前进！不择手段地前进！',
    speaker: 'wade',
    context: '维德在星环城动员时的名言，把「手段」与「目标」的伦理彻底摊开在人类面前。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'only-the-brain',
    text: '只送大脑。',
    speaker: 'wade',
    context: '阶梯计划讨论中，维德提出把云天明的大脑单独送入太空，全场愕然。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'destroy-you-none-of-your-business',
    text: '毁灭你，与你何干？',
    speaker: 'singer',
    context: '歌者决定清理太阳系时的心声：对猎手而言，猎物没有申辩的资格。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'i-destroy-you',
    text: '清理员在数据库里查到一个坐标，就像在账本上划掉一行。',
    speaker: 'singer',
    context: '歌者投出二向箔前的工作流程描写。此句为叙述概括，非逐字原文。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'one-dual-vector-foil',
    text: '给我一片二向箔，清理用。',
    speaker: 'singer',
    context: '歌者向长老申请清理工具，太阳系的死刑就这样被一句日常对话批准。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'carve-in-stone',
    text: '把字刻在石头上。',
    speaker: 'luo-ji',
    context: '冥王星博物馆里，罗辑对程心谈如何保存文明：越古老的办法越可靠。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'love-not-your-business',
    text: '我爱你，与你有何相干。',
    speaker: 'narrator',
    context: '《死神永生》中关于爱与个体选择的评述，广为流传的转述句，措辞为大意。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'child-too-early',
    text: '孩子，你不该这么早见到这些。',
    speaker: 'narrator',
    context: '长者对年轻幸存者的感叹，大意概括自掩体纪元人类目睹末日时的场景。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'never-mind-all-the-same',
    text: '没关系，都一样。',
    speaker: 'narrator',
    context: '面对文明的所有选择与结局时的一句评述，措辞为大意，非逐字原文。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'pastoral-age',
    text: '宇宙曾经有过一个田园时代。',
    speaker: 'guan-yifan',
    context: '关一帆在 DX3906 向程心讲述宇宙的过去：高维、光速无限、文明稀少。',
    work: 'deaths-end',
    canon: '原著'
  },
  {
    id: 'give-years-to-civilization',
    text: '给岁月以文明。',
    speaker: 'narrator',
    context: '大低谷后重建城市里的标语简写，完整版本见「给岁月以文明，而不是给文明以岁月」。',
    work: 'dark-forest',
    canon: '原著'
  }
];
