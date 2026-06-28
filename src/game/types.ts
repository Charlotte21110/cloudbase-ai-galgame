/**
 * 赛博恋爱文游 · 核心类型定义（节点图版）
 *
 * 设计要点（对应「史诗叙事 + 少量关键抉择 + 分支个人线」）：
 *  - 节点是一张「图」，靠 goto / option.goto 跳转，不再按数组顺序线性播放。
 *  - story 节点：纯剧情，beats 逐条点出来（旁白 / TA 对话 / 主角心声），看完 goto 下一节点。
 *  - choice 节点：关键抉择，先放 beats 铺垫，再给 options；不同 option 可 goto 到不同节点 → 个人线分支。
 *  - open 节点：开放输入题（喂结局生图/判词）。
 *  - goto 为 'END' 时进入结局结算。
 */

/** 画风：real=写实电影风 / anime=新海诚二次元风 */
export type ArtStyle = 'real' | 'anime'

/** 立绘表情（素材只有这 4 种，normal 自动用 happy 顶替） */
export type Face = 'happy' | 'shy' | 'angry' | 'sad' | 'normal'

/** 主题色板 key：甜系粉樱 / 高冷暗夜紫 */
export type ThemeKey = 'sakura' | 'night'

/** 人物库 */
export interface Character {
  id: string
  name: string
  gender: 'male' | 'female'
  style: ArtStyle
  persona: string
  tagline: string
  intro?: string
  themeKey: ThemeKey
  scriptId: string
}

/** 一条剧情文本（玩家点一下出一条） */
export interface Beat {
  /**
   * 说话主体：
   *  - 'narration'（或省略）：旁白
   *  - 'name'：当前角色开口（配合立绘）
   *  - 'self'：主角心声
   *  - 其它字符串：具名旁白/第三者（直接当作前缀显示）
   */
  who?: 'narration' | 'name' | 'self' | string
  /** 文本，支持 {name} {ta} {TA} 占位符 */
  text: string
  /** 这条出现时切换 TA 表情（可选） */
  face?: Face
  /** 这条出现时切换背景（可选） */
  sceneKey?: string
  /**
   * 显示条件（可选，「业力回收」核心）：满足才显示这条，否则跳过。
   * 支持：tag:真心>=3 / tag:渣<2 / score>=60 / flag:并肩 / !flag:独行 / top:真心
   */
  when?: string
}

/** 关键抉择的一个选项 */
export interface NodeOption {
  text: string
  /**
   * 选项文案的「变体池」（可选）：连玩不重样。
   * 进入抉择节点时，引擎会在 [text, ...textVariants] 里随机取一句展示，
   * 但 score / tag / goto / flag 不变——只是「同一选择的不同说法」。
   */
  textVariants?: string[]
  /** 羁绊值增减 */
  score: number
  /** 关系人格标签：真心 / 海王 / 忠犬 / 渣（决定结局人格） */
  tag: string
  /** 选后 TA 的表情 */
  face?: Face
  /** 选后 TA 的回应台词（AI 失败/超时时兜底） */
  reply?: string
  /** 选后 TA 的内心 OS（兜底） */
  os?: string
  /** 选后跳转到的节点 id（'END' 进入结局）——这是「分支个人线」的关键 */
  goto: string
  /** 选后写下的「印记」（可选）：供后续 beat 的 when:flag:xxx 回收，如 并肩 / 破轮回 */
  flag?: string
}

/** 节点 */
export interface GameNode {
  id: string
  type: 'story' | 'choice' | 'open'
  /** 进入该节点时的背景 */
  sceneKey?: string
  /** 进入该节点时的 TA 表情 */
  face?: Face
  /** 章节/幕标题（可选，HUD 顶部展示，烘托史诗感） */
  chapter?: string
  /** 逐条展示的剧情文本 */
  beats?: Beat[]
  /** choice 节点的选项 */
  options?: NodeOption[]
  /** open 节点题面 */
  prompt?: string
  /** story / open 节点看完后跳转的节点 id；'END' 进入结局 */
  goto?: string
}

/** 结局 */
export interface Ending {
  endingId: string
  title: string
  /** 兜底结局的羁绊值下限 */
  min?: number
  /** 触发条件：'top:标签'（主导人格）/ 'tag:标签>=数字'（固定阈值） */
  trigger?: string
  caption: string
  report: string
}

/** 剧本（节点图） */
export interface Script {
  id: string
  title: string
  openingTip: string
  prologue?: string
  initScore: number
  /** 起始节点 id */
  start: string
  nodes: GameNode[]
  endings: Ending[]
}

/** 结局图库（兜底 D1） */
export interface EndingCG {
  id: string
  charId: string
  endingId: string
  artStyle: ArtStyle
  url: string
  caption: string
}
