/**
 * scripts 剧本树（多语言支持）
 *
 * 数据源：
 *  - ./scripts.json                        中文默认剧本（script_default + script_test）
 *  - ./scripts/*.json                      中文专属剧本（11 个角色）
 *  - ./scripts/*.en-US.json                英文专属剧本（翻译版）
 *
 * 用法：
 *   await loadScripts()        // 先预加载（在 startGame 前调用一次即可）
 *   const s = getScript(id)    // 取单个剧本
 *   const all = getScripts()   // 全部剧本
 *
 * ⚠️ 切换语言后需要刷新页面 / reLaunch，才会加载对应语言的剧本。
 */
import type { Script } from '../types'
import { getLocale } from '@/locale/lang'
import type { Locale } from '@/locale'

// ───── 中文默认剧本（脚本内置，永远加载）─────
import defaultScriptsZh from './scripts.json'

// ───── 中文专属剧本（同步 import，中文环境直接可用）─────
import bizMergerZh from './scripts/biz_merger.json'
import urbanAmourZh from './scripts/urban_amour.json'
import summerChildhoodZh from './scripts/summer_childhood.json'
import bandFriendsZh from './scripts/band_friends.json'
import campusFirstloveZh from './scripts/campus_firstlove.json'
import dailyKonbiniZh from './scripts/daily_konbini.json'
import officeRookieZh from './scripts/office_rookie.json'
import oldHouseFamilyZh from './scripts/old_house_family.json'
import campusAmbiguityZh from './scripts/campus_ambiguity.json'
import wuxiaSwordZh from './scripts/wuxia_sword.json'
import queenRiseZh from './scripts/queen_rise.json'

const ZH_EXTRA: Script[] = [
  bizMergerZh, urbanAmourZh, summerChildhoodZh, bandFriendsZh,
  campusFirstloveZh, dailyKonbiniZh, officeRookieZh, oldHouseFamilyZh,
  campusAmbiguityZh, wuxiaSwordZh, queenRiseZh,
].map((s) => s as unknown as Script)

/** 默认剧本 + 中文专属 = 中文全量 */
const ZH_SCRIPTS: Script[] = [
  ...(defaultScriptsZh as unknown as Script[]),
  ...ZH_EXTRA,
]

// ───── 已加载的剧本缓存 ─────
let loadedScripts: Script[] = ZH_SCRIPTS
let enLoaded = false

/** 预加载剧本（在 startGame 前调用）。首次调用时会判断 locale，英文环境懒加载英文 JSON */
export async function loadScripts(): Promise<void> {
  const locale: Locale = getLocale()
  if (locale !== 'en-US' || enLoaded) return

  try {
    const [defaultEn, ...enExtras] = await Promise.all([
      import('./scripts.en-US.json'),
      import('./scripts/biz_merger.en-US.json'),
      import('./scripts/urban_amour.en-US.json'),
      import('./scripts/summer_childhood.en-US.json'),
      import('./scripts/band_friends.en-US.json'),
      import('./scripts/campus_firstlove.en-US.json'),
      import('./scripts/daily_konbini.en-US.json'),
      import('./scripts/office_rookie.en-US.json'),
      import('./scripts/old_house_family.en-US.json'),
      import('./scripts/campus_ambiguity.en-US.json'),
      import('./scripts/wuxia_sword.en-US.json'),
      import('./scripts/queen_rise.en-US.json'),
    ])

    const enExtra: Script[] = [
      ...((defaultEn as any).default as Script[]),
      ...enExtras.map((m) => (m as any).default as Script),
    ]

    loadedScripts = enExtra
    enLoaded = true

    console.log(`[scripts] 英文剧本加载完成 (${enExtra.length} 本)`)
  } catch (e) {
    console.warn('[scripts] 英文剧本加载失败，回退中文版', e)
    loadedScripts = ZH_SCRIPTS
  }
}

/** 获取全部剧本（需先 await loadScripts()） */
export function getScripts(): Script[] {
  return loadedScripts
}

/** 取剧本；找不到回退默认剧本 */
export function getScript(id: string): Script | undefined {
  return loadedScripts.find((s) => s.id === id)
    || loadedScripts.find((s) => s.id === DEFAULT_SCRIPT_ID)
}

export const DEFAULT_SCRIPT_ID = 'script_default'

// ───── 旧版兼容（同步导出中文版，英文异步加载前可用）─────
export const SCRIPTS: Script[] = ZH_SCRIPTS
