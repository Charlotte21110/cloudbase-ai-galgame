/**
 * characters 人物库（多语言支持）
 *
 * 数据源：
 *  - ./characters.json         中文原始数据（唯一真源）
 *  - ./i18n/characters.en-US.json  英文翻译覆盖（仅 persona/tagline/intro，name 保持拼音）
 *
 * 用法：
 *   import { getCharacters, getCharacter } from '@/game/data/characters'
 *   const all = getCharacters()            // 当前语言的所有角色
 *   const c   = getCharacter('guchenzhou') // 单个角色
 *
 * ⚠️ 不要在模块顶层直接用 getCharacters() 赋值给常量再导出，
 *    因为语言可能在运行中切换，使用方应该每次调用 getCharacters()
 *    或在 computed/watchEffect 里获取。
 */
import type { Character } from '../types'
import charactersData from './characters.json'
import enOverrides from './i18n/characters.en-US.json'
import { getLocale } from '@/locale/lang'
import type { Locale } from '@/locale'

const rawCharacters: Character[] = charactersData as unknown as Character[]

// 英文翻译覆盖（按 id 索引）
const enMap = new Map<string, Partial<Character>>()
for (const item of enOverrides as Array<{ id: string } & Partial<Character>>) {
  const { id, ...rest } = item
  enMap.set(id, rest)
}

/**
 * 获取当前语言的角色列表
 * - zh-CN: 返回原始数据
 * - en-US: 合并英文 persona/tagline/intro，name 保持拼音
 */
export function getCharacters(): Character[] {
  const locale: Locale = getLocale()
  if (locale === 'en-US') {
    return rawCharacters.map((c) => {
      const en = enMap.get(c.id)
      if (!en) return c
      return { ...c, ...en }
    })
  }
  return rawCharacters
}

/** 获取单个角色（当前语言） */
export function getCharacter(id: string): Character | undefined {
  return getCharacters().find((c) => c.id === id)
}

// ───── 兼容旧导出（模块加载时快照，切换语言后需刷新页面）─────
export const CHARACTERS: Character[] = getCharacters()
export const MALE_CHARACTERS = CHARACTERS.filter((c) => c.gender === 'male')
export const FEMALE_CHARACTERS = CHARACTERS.filter((c) => c.gender === 'female')
