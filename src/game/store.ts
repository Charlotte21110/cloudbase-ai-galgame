/**
 * 游戏会话状态（前端内存，不落库）· 符合设计"不强制登录、不存档、每次进来重开"
 *
 * 用一个 reactive 单例贯穿各页面（pick → opening → play → ending → report）。
 * 刷新即清空，等于重开一局。
 */
import { reactive } from 'vue'
import type { Character, Script, GameNode, Variant, Ending, Face } from './types'
import { getCharacter } from './data/characters'
import { getScript } from './data/scripts'
import { getEndingCG } from './data/endingCG'
import {
  clampScore,
  judgeEnding,
  computeMatchRate,
  resolveVariant,
  formatTags,
  pickRandom,
} from './engine'
import { faceImg } from './assets'

export interface GameSession {
  char: Character | null
  script: Script | null
  /** nodeId -> 选中的 variantId（开局随机抽） */
  pickedVariants: Record<string, string>
  score: number
  /** 最近一次好感度变化（用于视觉反馈） */
  lastDelta: number
  tagsCount: Record<string, number>
  /** 当前节点下标（指向 script.nodes） */
  index: number
  /** 当前 TA 表情 */
  face: Face
  /** 开放题玩家输入 */
  openAnswer: string
  /** 结局结算 */
  ending: Ending | null
  matchRate: number
  aiReport: string
  cgUrl: string
  status: 'idle' | 'playing' | 'open' | 'ended'
}

function createSession(): GameSession {
  return {
    char: null,
    script: null,
    pickedVariants: {},
    score: 50,
    lastDelta: 0,
    tagsCount: {},
    index: 0,
    face: 'happy',
    openAnswer: '',
    ending: null,
    matchRate: 0,
    aiReport: '',
    cgUrl: '',
    status: 'idle',
  }
}

export const session = reactive<GameSession>(createSession())

/** 开始一局 */
export function startGame(charId: string): boolean {
  const char = getCharacter(charId)
  if (!char) return false
  const script = getScript(char.scriptId)
  if (!script) return false

  Object.assign(session, createSession())
  session.char = char
  session.script = script
  session.score = script.initScore
  session.status = 'playing'

  // 每个节点随机抽 1 个变体
  for (const node of script.nodes) {
    const v = pickRandom(node.variants)
    session.pickedVariants[node.nodeId] = v.variantId
  }
  return true
}

/** 当前节点 */
export function currentNode(): GameNode | null {
  if (!session.script) return null
  return session.script.nodes[session.index] || null
}

/** 当前节点选中的变体 */
export function currentVariant(): Variant | null {
  const node = currentNode()
  if (!node) return null
  return resolveVariant(node.variants, session.pickedVariants[node.nodeId])
}

/** 应用一个选择题选项：更新好感度/标签/表情，并返回 delta（不在此处推进节点，UI 控制推进时机） */
export function applyChoice(opt: {
  score: number
  tag: string
  face: Face
}): number {
  const before = session.score
  session.score = clampScore(before + opt.score)
  session.lastDelta = session.score - before
  session.tagsCount[opt.tag] = (session.tagsCount[opt.tag] || 0) + 1
  session.face = opt.face
  return session.lastDelta
}

/** 推进到下一个节点 */
export function advance(): void {
  if (!session.script) return
  if (session.index < session.script.nodes.length - 1) {
    session.index += 1
    const node = currentNode()
    if (node && node.type === 'open') session.status = 'open'
  }
}

/** 是否到了开放题节点 */
export function isOpenNode(): boolean {
  const node = currentNode()
  return !!node && node.type === 'open'
}

/** 结算结局（开放题提交后调用） */
export function finalize(): Ending {
  const script = session.script as Script
  const ending = judgeEnding(script, session.score, session.tagsCount)
  session.ending = ending
  session.matchRate = computeMatchRate(session.score, ending.endingId)
  session.status = 'ended'

  // 结局图：优先 D1 预设图，缺失则回退该角色 happy 立绘做占位
  const char = session.char!
  const cg = getEndingCG(char.id, ending.endingId, char.style)
  session.cgUrl = cg ? cg.url : faceImg(char.style, char.id, 'happy')
  return ending
}

/** 成绩单标签云 */
export function tagCloud(): string[] {
  return formatTags(session.tagsCount)
}

export function resetGame(): void {
  Object.assign(session, createSession())
}
