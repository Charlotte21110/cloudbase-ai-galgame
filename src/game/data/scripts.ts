/**
 * scripts 剧本树（内置 · 核心）· 对应设计方案第六/八节
 *
 * ⚠️ 数据源 = ./scripts.json（唯一真源，你要加/改剧情只动那个 JSON）。
 * 本文件只是带类型的加载器，正常无需改动。
 *
 * 扩展方式（详见 docs/剧本编写指南.md）：
 *  - 加节点：往某个剧本的 nodes 里加一个节点块。
 *  - 加变体（剧本池随机/连玩不重样）：往某节点的 variants 里加一个变体块。
 *  - 加选项：往某变体的 options 里加一项（score 正/负、tag 决定隐藏结局）。
 *  - 加结局：往 endings 里加一项（普通结局给 min，隐藏结局给 trigger）。
 *  - 加角色专属剧本：复制一个剧本对象、改 id 和文案，再到 characters.json 改 scriptId。
 *
 * 标签与计分约定：主动(+) / 舔狗(小+) / 强势(-)；开放题(open 节点)不参与硬计分。
 */
import type { Script } from '../types'
import scriptsData from './scripts.json'

export const SCRIPTS: Script[] = scriptsData as unknown as Script[]

export const DEFAULT_SCRIPT_ID = 'script_default'

/** 取剧本；找不到时回退默认剧本，保证任何角色都能玩通 */
export function getScript(id: string): Script | undefined {
  return SCRIPTS.find((s) => s.id === id) || SCRIPTS.find((s) => s.id === DEFAULT_SCRIPT_ID)
}
