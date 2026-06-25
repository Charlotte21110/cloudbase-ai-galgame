/**
 * 静态资源路径助手（指向 src/static/game 下拷贝好的素材）
 *
 * 立绘：/static/game/people/{style}/{charId}/{face}.png
 *   - style: real | anime（与素材文件夹一致）
 *   - face : happy | shy | angry | sad（无 normal，normal 自动用 happy 顶替）
 * 背景：/static/game/bg/{style}/{sceneKey}_1.png
 *   - 为兼容两套画风（anime 套 office_night 仅有 _1），统一只用 _1 变体
 */
import type { ArtStyle, Face } from './types'

/** 立绘路径（normal → happy 兜底） */
export function faceImg(style: ArtStyle, charId: string, face: Face): string {
  const f = face === 'normal' ? 'happy' : face
  return `/static/game/people/${style}/${charId}/${f}.png`
}

/** 背景路径 */
export function bgImg(style: ArtStyle, sceneKey: string): string {
  return `/static/game/bg/${style}/${sceneKey}_1.png`
}
