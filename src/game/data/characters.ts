/**
 * characters 人物库（内置）· 对应设计方案第三节人设
 *
 * ⚠️ 数据源 = ./characters.json（唯一真源，你要加/改角色只动那个 JSON）。
 * 本文件只是带类型的加载器，正常无需改动。
 *
 * 说明：
 * - 画风跟随角色（素材现状每角色仅一套）：白时屿/林桃桃=anime，其余=real。
 * - 主题色 themeKey：暖萌角色用 sakura（粉樱），高冷角色用 night（暗夜紫）。
 * - scriptId 指向 scripts.json 里的剧本；找不到时引擎会回退 script_default。
 *   要给某角色配「专属剧本」：在 scripts.json 加一个新剧本，再把这里该角色的
 *   scriptId 改成新剧本 id 即可（见 docs/剧本编写指南.md）。
 */
import type { Character } from '../types'
import charactersData from './characters.json'

export const CHARACTERS: Character[] = charactersData as unknown as Character[]

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id)
}

export const MALE_CHARACTERS = CHARACTERS.filter((c) => c.gender === 'male')
export const FEMALE_CHARACTERS = CHARACTERS.filter((c) => c.gender === 'female')
