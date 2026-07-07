import i18n, { type Locale, LOCALES } from './index'

const STORAGE_KEY = 'app_locale'

/** 当前语言 */
export function getLocale(): Locale {
  return i18n.global.locale.value as Locale
}

/** 切换语言并持久化 */
export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  uni.setStorageSync(STORAGE_KEY, locale)
}

/** 可选语言列表（供语言切换 UI 使用） */
export function getLocaleOptions() {
  return LOCALES
}
