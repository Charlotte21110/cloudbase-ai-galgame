/**
 * scripts 剧本树（内置 · 核心）· 对应设计方案第六/八节
 *
 * 数据源：
 *  - ./scripts.json        —— 史诗主线 script_default + 测试短章 script_test（共用）
 *  - ./scripts/*.json      —— 12 角色专属剧本，每个角色一个文件（一文件 = 一个剧本对象）
 *
 * 扩展方式（详见 docs/剧本编写指南.md）：
 *  - 改某角色剧情：直接编辑 ./scripts/ 下对应的那个 JSON。
 *  - 新增角色专属剧本：在 ./scripts/ 下加一个 JSON（含唯一 id），在下方 import 进来并加入 EXTRA_SCRIPTS，
 *    再到 characters.json 把该角色的 scriptId 指过去即可。
 *  - 加节点 / 加选项变体（textVariants，连玩不重样）/ 加结局：见指南。
 *
 * 标签与计分约定：真心(+) / 忠犬(小+) / 海王(小+) / 渣(-)；开放题(open 节点)不参与硬计分。
 */
import type { Script } from '../types'
import scriptsData from './scripts.json'

// ↓ 12 角色专属剧本（folder: ./scripts/）
import bizMerger from './scripts/biz_merger.json'
import urbanAmour from './scripts/urban_amour.json'
import summerChildhood from './scripts/summer_childhood.json'
import bandFriends from './scripts/band_friends.json'
import campusFirstlove from './scripts/campus_firstlove.json'
import dailyKonbini from './scripts/daily_konbini.json'
import officeRookie from './scripts/office_rookie.json'
import oldHouseFamily from './scripts/old_house_family.json'
import campusAmbiguity from './scripts/campus_ambiguity.json'
import wuxiaSword from './scripts/wuxia_sword.json'
import queenRise from './scripts/queen_rise.json'

/** 专属剧本集合 */
const EXTRA_SCRIPTS: Script[] = [
  bizMerger,
  urbanAmour,
  summerChildhood,
  bandFriends,
  campusFirstlove,
  dailyKonbini,
  officeRookie,
  oldHouseFamily,
  campusAmbiguity,
  wuxiaSword,
  queenRise,
].map((s) => s as unknown as Script)

export const SCRIPTS: Script[] = [
  ...(scriptsData as unknown as Script[]),
  ...EXTRA_SCRIPTS,
]

export const DEFAULT_SCRIPT_ID = 'script_default'

/** 取剧本；找不到时回退默认剧本，保证任何角色都能玩通 */
export function getScript(id: string): Script | undefined {
  return SCRIPTS.find((s) => s.id === id) || SCRIPTS.find((s) => s.id === DEFAULT_SCRIPT_ID)
}
