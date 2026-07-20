/**
 * 静态资源路径助手（素材已上传至 CloudBase 静态托管 CDN）
 *
 * CDN 基础地址：https://newtest-6gzd5kqm6c4eaa2b-1308771514.tcloudbaseapp.com/game-assets
 *
 * 立绘：{CDN_BASE}/game/people/{style}/{charId}/{face}.png
 *   - style: real | anime（与素材文件夹一致）
 *   - face : happy | shy | angry | sad（无 normal，normal 自动用 happy 顶替）
 * 背景：{CDN_BASE}/game/bg/{style}/{sceneKey}_{n}.png
 *   - 同一 sceneKey 可能有多张变体图（_1/_2/...），bgImg 会在变体里随机取一张，
 *     用来「连玩不重样」。变体数量记录在 SCENE_VARIANTS（按画风分别计数），
 *     未登记的 sceneKey 默认只有 _1。
 *   - 因为变体都是「同一地点」的不同张，随机取并不会破坏剧情与画面的吻合。
 */
import type { ArtStyle, Face } from './types'

/** CloudBase 静态托管 CDN 基础地址 */
export const CDN_BASE = 'https://newtest-6gzd5kqm6c4eaa2b-1308771514.tcloudbaseapp.com/game-assets'

/**
 * 将旧的本地 /static/... 路径转为 CDN 地址
 * 用法：cdnUrl('/static/game/ui/starry-bg.png')
 */
export function cdnUrl(path: string): string {
  return CDN_BASE + path.replace('/static', '')
}

/**
 * 各 sceneKey 在两套画风下的「可用变体张数」。
 * 只在这里登记 >1 的；没登记的一律按 1 张（仅 _1）处理。
 * 维护方式：CDN 上 {sceneKey}_2.png 存在后，把这里数字 +1。
 */
const SCENE_VARIANTS: Record<string, { real: number; anime: number }> = {
  cafe_window: { real: 2, anime: 2 },
  piano_room: { real: 2, anime: 2 },
  rain_street: { real: 2, anime: 2 },
  rooftop_dusk: { real: 2, anime: 2 },
  sakura_path: { real: 2, anime: 2 },
  office_night: { real: 4, anime: 1 },
}

/** 立绘路径（normal → happy 兜底） */
export function faceImg(style: ArtStyle, charId: string, face: Face): string {
  const f = face === 'normal' ? 'happy' : face
  return `${CDN_BASE}/game/people/${style}/${charId}/${f}.png`
}

/**
 * 背景路径：多变体场景随机取一张（同地点不同张，不影响剧情吻合）。
 * 调用方（play/opening 的 bg computed）只在场景切换时重算，故同一幕内不会闪烁。
 */
export function bgImg(style: ArtStyle, sceneKey: string): string {
  const conf = SCENE_VARIANTS[sceneKey]
  const count = conf ? conf[style] : 1
  const n = count > 1 ? 1 + Math.floor(Math.random() * count) : 1
  return `${CDN_BASE}/game/bg/${style}/${sceneKey}_${n}.png`
}
