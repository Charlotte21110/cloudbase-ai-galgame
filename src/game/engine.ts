/**
 * 游戏引擎纯函数（计分、占位符替换、结局判定）· 对应设计方案第七节
 * 全部内置 JS、零容错，不依赖 AI。
 */
import type { Character, Script, Ending, Variant } from './types'

/** 文案占位符替换：{name}→角色名，{ta}→他/她，{TA}→TA */
export function replaceTokens(text: string, char: Character | null): string {
  if (!text) return ''
  if (!char) return text
  const ta = char.gender === 'male' ? '他' : '她'
  return text
    .replace(/\{name\}/g, char.name)
    .replace(/\{ta\}/g, ta)
    .replace(/\{TA\}/g, 'TA')
}

/** 好感度夹紧到 [0,100] */
export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, n))
}

/** 数组随机取一 */
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 最少选够几次，才算形成一种「主导人格」（节点变多后相应提高，避免轻易定型） */
const DOMINANT_MIN = 5

/**
 * 解析结局触发条件，支持两种写法：
 *  - 'tag:标签>=数字'  某标签被选够 N 次（用于固定阈值结局）
 *  - 'top:标签'        该标签是「主导人格」：被选次数最多，且 ≥ DOMINANT_MIN
 *                      （并列最高时，按 endings 数组顺序优先）
 */
function matchTrigger(trigger: string, tagsCount: Record<string, number>): boolean {
  const t = trigger.trim()

  const ge = /^tag:(.+?)>=(\d+)$/.exec(t)
  if (ge) {
    return (tagsCount[ge[1]] || 0) >= Number(ge[2])
  }

  const top = /^top:(.+)$/.exec(t)
  if (top) {
    const tag = top[1].trim()
    const count = tagsCount[tag] || 0
    if (count < DOMINANT_MIN) return false
    const max = Math.max(0, ...Object.values(tagsCount))
    return count === max
  }

  return false
}

/**
 * 结局判定：带 trigger 的结局优先（按数据顺序，含主导人格/隐藏结局），
 * 否则回退到按好感度阈值（min）匹配——用作「无明显主导」的兜底结局。
 */
export function judgeEnding(
  script: Script,
  score: number,
  tagsCount: Record<string, number>
): Ending {
  // 1. 隐藏结局（带 trigger）优先
  for (const e of script.endings) {
    if (e.trigger && matchTrigger(e.trigger, tagsCount)) {
      return e
    }
  }
  // 2. 普通结局按 min 从高到低匹配
  const normals = script.endings
    .filter((e) => typeof e.min === 'number')
    .sort((a, b) => (b.min as number) - (a.min as number))
  for (const e of normals) {
    if (score >= (e.min as number)) return e
  }
  // 兜底返回最后一个
  return normals[normals.length - 1] || script.endings[0]
}

/** 灵魂契合度%（成绩单展示用，按关系人格 + 羁绊值换算） */
export function computeMatchRate(score: number, endingId: string): number {
  if (endingId === 'toxic') return 13 // 噬星者（渣）：最低
  if (endingId === 'playboy') return Math.min(66, Math.max(40, Math.round(score * 0.6 + 18))) // 逐光者（海王）：中等封顶
  if (endingId === 'devoted') return Math.min(92, Math.max(60, Math.round(score * 0.9 + 8))) // 拾光者（忠犬）：偏高
  if (endingId === 'wanderer') return 50 // 漫游者（多面体）：居中
  return Math.min(99, Math.max(15, Math.round(score * 0.9 + 12))) // 同行者（真心）等
}

/** 取节点已选中的变体（pickedVariants 里存了 variantId） */
export function resolveVariant(
  variants: Variant[],
  pickedId: string | undefined
): Variant {
  if (pickedId) {
    const v = variants.find((x) => x.variantId === pickedId)
    if (v) return v
  }
  return variants[0]
}

/** 标签云文案：{ '主动':3 } → ['主动×3'] */
export function formatTags(tagsCount: Record<string, number>): string[] {
  return Object.entries(tagsCount)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, n]) => `${tag}×${n}`)
}
