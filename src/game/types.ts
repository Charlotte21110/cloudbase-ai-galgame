/**
 * 赛博恋爱文游 · 核心类型定义
 * 对应设计方案第八节「数据库设计（CloudBase FlexDB）」
 */

/** 画风：与 material 素材文件夹一致（real=写实电影风 / anime=新海诚二次元风） */
export type ArtStyle = 'real' | 'anime'

/** 立绘表情：素材实际只有这 4 种（无 normal，默认用 happy 顶替） */
export type Face = 'happy' | 'shy' | 'angry' | 'sad' | 'normal'

/** 主题色板 key：甜系粉樱 / 高冷暗夜紫 */
export type ThemeKey = 'sakura' | 'night'

/** 集合 1：characters（人物库 · 内置） */
export interface Character {
  id: string
  name: string
  gender: 'male' | 'female'
  /** 该角色画风（画风跟随角色，不再单独选） */
  style: ArtStyle
  persona: string
  tagline: string
  themeKey: ThemeKey
  scriptId: string
}

/** 选项（仅选择题节点有） */
export interface ScriptOption {
  text: string
  /** 好感度增减，区间约 -15 ~ +15 */
  score: number
  /** 标签，用于隐藏结局判定（主动 / 舔狗 / 强势 等） */
  tag: string
  /** 选后 TA 的表情 */
  face: Face
  /** 下一节点 nodeId */
  next: string
  /** AI 失败时的兜底回应台词 */
  fallbackLine: string
  /** AI 失败时的兜底内心 OS */
  fallbackOS: string
}

/** 节点变体（剧本池随机抽 1） */
export interface Variant {
  variantId: string
  /** 场景 key，对应背景图 */
  sceneKey: string
  /** 情境文案 */
  scene: string
  /** 选完后的剧情旁白（串联故事） */
  narration?: string
  /** 选择题选项（开放题节点为空） */
  options?: ScriptOption[]
}

/** 节点 */
export interface GameNode {
  nodeId: string
  /** choice=选择题 / open=开放输入题 */
  type: 'choice' | 'open'
  /** 开放题题面 */
  prompt?: string
  variants: Variant[]
}

/** 结局 */
export interface Ending {
  endingId: string
  title: string
  /** 普通结局的好感度下限 */
  min?: number
  /** 隐藏结局触发条件，如 'tag:舔狗>=4' */
  trigger?: string
  /** 结局画面文案 */
  caption: string
  /** AI 报告失败时的兜底文案 */
  report: string
}

/** 集合 2：scripts（剧本树 · 内置） */
export interface Script {
  id: string
  title: string
  openingTip: string
  /** 开场旁白（可选，开场页展示） */
  prologue?: string
  initScore: number
  nodes: GameNode[]
  endings: Ending[]
}

/** 集合 3：endingCG（结局图库 · 兜底 D1） */
export interface EndingCG {
  id: string
  charId: string
  endingId: string
  artStyle: ArtStyle
  url: string
  caption: string
}
