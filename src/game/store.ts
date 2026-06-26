/**
 * 游戏会话状态（前端内存，不落库）· 节点图版
 *
 * 用一个 reactive 单例贯穿各页面（pick → opening → play → ending → report）。
 * 刷新即清空，等于重开一局。剧情走向由 node.goto / option.goto 决定（支持分支个人线）。
 */
import { reactive } from 'vue'
import type { Character, Script, GameNode, Beat, Ending, Face } from './types'
import { getCharacter } from './data/characters'
import { getScript } from './data/scripts'
import { getEndingCG } from './data/endingCG'
import { clampScore, judgeEnding, computeMatchRate, formatTags, evalWhen } from './engine'
import { faceImg } from './assets'

export interface GameSession {
  char: Character | null
  script: Script | null
  score: number
  /** 最近一次羁绊值变化（用于视觉反馈） */
  lastDelta: number
  tagsCount: Record<string, number>
  /** 选择留下的「印记」（供 beat 的 when:flag:xxx 回收） */
  flags: Record<string, number>
  /** 当前节点 id */
  nodeId: string
  /** 已进入的节点数（HUD「第 X 幕」） */
  step: number
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
    score: 50,
    lastDelta: 0,
    tagsCount: {},
    flags: {},
    nodeId: '',
    step: 0,
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
  session.nodeId = script.start
  session.step = 1
  session.status = 'playing'
  const start = currentNode()
  if (start && start.type === 'open') session.status = 'open'
  return true
}

/** 按 id 取节点 */
export function getNode(id: string): GameNode | null {
  if (!session.script) return null
  return session.script.nodes.find((n) => n.id === id) || null
}

/** 当前节点 */
export function currentNode(): GameNode | null {
  return session.nodeId ? getNode(session.nodeId) : null
}

/** 应用一个选择题选项：更新羁绊值/标签/表情/印记，返回 delta（不在此处推进，UI 控制推进时机） */
export function applyChoice(opt: { score: number; tag: string; face?: Face; flag?: string }): number {
  const before = session.score
  session.score = clampScore(before + opt.score)
  session.lastDelta = session.score - before
  session.tagsCount[opt.tag] = (session.tagsCount[opt.tag] || 0) + 1
  if (opt.flag) session.flags[opt.flag] = (session.flags[opt.flag] || 0) + 1
  if (opt.face) session.face = opt.face
  return session.lastDelta
}

/** 按当前状态过滤 beats（剔除 when 条件不满足的）——「业力回收」在这里生效 */
export function filterBeats(beats?: Beat[]): Beat[] {
  if (!beats || !beats.length) return []
  const ctx = { tags: session.tagsCount, score: session.score, flags: session.flags }
  return beats.filter((b) => evalWhen(b.when, ctx))
}

/** 跳转到指定节点（剧情分支的核心）。返回是否进入结局。 */
export function gotoNode(id: string): boolean {
  if (!id || id === 'END') {
    return true
  }
  session.nodeId = id
  session.step += 1
  const n = currentNode()
  if (n) {
    if (n.face) session.face = n.face
    if (n.type === 'open') session.status = 'open'
    else session.status = 'playing'
  }
  return false
}

/** 结算结局（开放题提交后调用） */
export function finalize(): Ending {
  const script = session.script as Script
  const ending = judgeEnding(script, session.score, session.tagsCount)
  session.ending = ending
  session.matchRate = computeMatchRate(session.score, ending.endingId)
  session.status = 'ended'

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
