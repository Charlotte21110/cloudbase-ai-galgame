import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

export type Locale = 'zh-CN' | 'en-US'

export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
]

const STORAGE_KEY = 'app_locale'

/** 读取初始语言：本地缓存 > 系统语言 > 默认中文 */
function detectLocale(): Locale {
  const saved = uni.getStorageSync(STORAGE_KEY)
  if (saved === 'zh-CN' || saved === 'en-US') return saved

  try {
    const sys = uni.getSystemInfoSync()
    const lang = (sys.language || '').toLowerCase()
    if (lang.startsWith('en')) return 'en-US'
    if (lang.startsWith('zh')) return 'zh-CN'
  } catch (e) {
    console.warn('[i18n] getSystemInfoSync failed, fallback to zh-CN', e)
  }

  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true, // Options API 组件 / 模板可直接用 $t
  locale: detectLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

/**
 * 全局 t 函数，供非组件的 .ts 文件使用（如 utils 里的默认提示文案）。
 * 组件内请优先用 `const { t } = useI18n()` 以获得响应式。
 */
export const t = i18n.global.t

export default i18n
