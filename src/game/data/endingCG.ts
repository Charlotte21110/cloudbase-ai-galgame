/**
 * endingCG 结局图库（兜底 D1）· 对应设计方案第八节集合 3
 *
 * ⚠️ 数据源 = ./endingCG.json（唯一真源）。当前为空 []，引擎取不到结局图时
 * 会自动回退到该角色的 happy 立绘做占位。
 *
 * 补图后，把图片放到 src/static/game/ending/{style}/{charId}/{endingId}.png，
 * 再往 endingCG.json 加一条（见 docs/剧本编写指南.md）：
 * {
 *   "id": "cg_guchenzhou_good_real",
 *   "charId": "guchenzhou",
 *   "endingId": "good",
 *   "artStyle": "real",
 *   "url": "/static/game/ending/real/guchenzhou/good.png",
 *   "caption": "他终于把你拥进怀里，城市灯火成了背景。"
 * }
 */
import type { EndingCG, ArtStyle } from '../types'
import endingCGData from './endingCG.json'

export const ENDING_CG: EndingCG[] = endingCGData as unknown as EndingCG[]

export function getEndingCG(
  charId: string,
  endingId: string,
  style: ArtStyle
): EndingCG | undefined {
  return ENDING_CG.find(
    (cg) => cg.charId === charId && cg.endingId === endingId && cg.artStyle === style
  )
}
