/**
 * 游戏 AI 客户端 · 对应设计方案第十一节 Prompt 模板
 *
 * 调用策略：
 *   - Prompt 模板全部放在云函数 galgame-ai 里（前端看不到 prompt）
 *   - 前端只传业务参数（name/persona/score/scene/optionText 等）
 *   - 通过 SDK callFunction 调用，自带鉴权，外部裸 fetch 打不进来
 *   - 失败返回 null，由调用方使用内置兜底，保证主流程不崩
 */
import { callFunction } from '@/utils/cloudfn'
import { auth, login } from '@/utils/cloudbase'

const AI_TIMEOUT = 20000

function log(...args: any[]) {
  console.log('%c[GAL-AI]', 'color:#FF7EA8;font-weight:bold', ...args)
}
function logErr(...args: any[]) {
  console.error('%c[GAL-AI]', 'color:#E04D80;font-weight:bold', ...args)
}

function withTimeout<T>(p: Promise<T>, ms = AI_TIMEOUT): Promise<T | null> {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))])
}

// ── 确保已登录（匿名），拿到 session 才能调 callFunction ──
let _authReady = false
let _authPromise: Promise<boolean> | null = null

async function ensureAuth(): Promise<boolean> {
  if (_authReady) return true
  if (_authPromise) return _authPromise

  _authPromise = (async () => {
    try {
      const { data } = await auth.getSession()
      if (data?.session) {
        _authReady = true
        return true
      }
    } catch (_) { /* 无会话，继续登录 */ }

    try {
      await login()
      console.log('%c[GAL-AI] 匿名登录成功', 'color:#7C6FE0')
      _authReady = true
      return true
    } catch (e) {
      console.warn('[GAL-AI] 匿名登录失败，callFunction 将无法使用:', e)
      return false
    }
  })()

  return _authPromise
}

/**
 * 统一调用入口：先匿名登录拿到 session，再走 SDK callFunction。
 * callFunction 自带鉴权，外部裸 fetch 打不进来。
 * ⚠️ Prompt 模板在云函数里拼接，前端只传业务参数。
 */
async function callAI(action: string, payload: Record<string, any>, tag: string): Promise<any | null> {
  log(`▶ 请求[${tag}]`)

  const authed = await ensureAuth()
  if (!authed) {
    logErr('✗ 登录失败，无法调用 AI')
    return null
  }

  try {
    const res = await withTimeout(
      callFunction<any>('galgame-ai', { action, ...payload })
    )
    if (res && res.success && res.data) {
      log(`✔ AI回复[${tag}]：`, res.data)
      return res.data
    }
    logErr(`✗ AI返回异常[${tag}]`, res)
  } catch (e) {
    logErr(`✗ AI调用失败[${tag}]`, e)
  }

  log(`↩ [${tag}] 走内置兜底文案`)
  return null
}

export interface LineResult {
  line: string
  os: string
}

/** 模板 A：每道选择题后 TA 的回应台词 + 内心 OS */
export async function aiLine(payload: {
  name: string
  persona: string
  score: number
  scene: string
  optionText: string
}): Promise<LineResult | null> {
  const data = await callAI('line', payload, 'line')
  if (!data) return null
  if (data.line) {
    return { line: String(data.line).slice(0, 60), os: String(data.os || '').slice(0, 40) }
  }
  logErr('✗ line 返回格式异常，走兜底')
  return null
}

/** 模板 A2：开放题（第 6 题）专属回应台词 */
export async function aiOpenLine(payload: {
  name: string
  persona: string
  score: number
  userText: string
}): Promise<string | null> {
  const data = await callAI('openLine', payload, 'openLine')
  if (!data || !data.line) return null
  return String(data.line).slice(0, 80)
}

/** 模板 B：结局总结报告 */
export async function aiReport(payload: {
  name: string
  endingTitle: string
  score: number
  tags: string[]
}): Promise<string | null> {
  const data = await callAI('report', payload, 'report')
  if (!data || !data.text) return null
  return String(data.text).slice(0, 160)
}

/**
 * 模板 C：结局 Q 版纪念图（运行时生图）
 * 文生图必须用云函数端 node-sdk（createImageModel/generateImage），端上不支持。
 * 当前若云函数未部署/失败，返回 null，由调用方回退预设图(D1)/立绘。
 */
export async function aiEndingImage(payload: {
  name: string
  persona: string
  endingId: string
  userText: string
  style: string
}): Promise<string | null> {
  const authed = await ensureAuth()
  if (!authed) return null

  try {
    const res = await withTimeout(
      callFunction<any>('galgame-ai', { action: 'image', ...payload }),
      30000
    )
    if (res && res.success && res.data && res.data.url) {
      log('✔ 结局生图成功：', res.data.url)
      return String(res.data.url)
    }
    logErr('✗ 结局生图失败，回退预设图：', res)
  } catch (e) {
    logErr('✗ 结局生图调用失败，回退预设图：', e)
  }
  return null
}
