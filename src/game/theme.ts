/**
 * 主题色板（对应设计方案第九节「双主题色板」）
 * 好感涨用暖色、跌用冷灰。
 */
import type { ThemeKey } from './types'

export interface Theme {
  primary: string
  deep: string
  soft: string
  bg: string
  up: string
  down: string
  text: string
}

export const THEMES: Record<ThemeKey, Theme> = {
  // 甜系线 — 粉樱主题
  sakura: {
    primary: '#FF7EA8',
    deep: '#E04D80',
    soft: '#FFD6E3',
    bg: '#FFF5F8',
    up: '#FF5A8A',
    down: '#9AA0A6',
    text: '#3A2A30',
  },
  // 高冷线 — 暗夜紫主题
  night: {
    primary: '#7C6FE0',
    deep: '#4A3F9E',
    soft: '#E6E1FA',
    bg: '#F6F4FC',
    up: '#8A6BFF',
    down: '#9AA0A6',
    text: '#2A2536',
  },
}

export function getTheme(key: ThemeKey): Theme {
  return THEMES[key] || THEMES.sakura
}

/** 生成可注入到 :style 的 CSS 变量字符串 */
export function themeCssVars(key: ThemeKey): Record<string, string> {
  const t = getTheme(key)
  return {
    '--c-primary': t.primary,
    '--c-deep': t.deep,
    '--c-soft': t.soft,
    '--c-bg': t.bg,
    '--c-up': t.up,
    '--c-down': t.down,
    '--c-text': t.text,
  }
}
