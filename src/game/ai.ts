/**
 * 游戏 AI 客户端 · 对应设计方案第十一节 Prompt 模板
 *
 * 调用策略（修复 EXCEED_AUTHORITY 后）：
 *   1) 端上直调 AI（需先匿名登录拿到会话，见 utils/ai.ts 的 ensureSignedIn）；
 *   2) 端上失败再尝试云函数 galgame-ai（服务端凭证，需先部署）；
 *   3) 都失败返回 null，由调用方使用内置兜底，保证主流程不崩。
 *
 * 全程 console 打印请求与 AI 回复，方便在浏览器控制台排查。
 */
import { callFunction } from '@/utils/cloudfn'

/** 模型名：取 .env.local 的 VITE_MODEL，缺省 hy3-preview。
 *  ⚠️ 必须是控制台「AI+」里已开通的模型 id，否则会报 model not found。 */
const MODEL = (import.meta.env.VITE_MODEL as string) || 'hy3-preview'

/** 云函数 galgame-ai 的公开 HTTP 访问地址（无需登录、自带 CORS，三端通用）。
 *  可用 .env.local 的 VITE_AI_FN_URL 覆盖（换环境时改这里）。 */
const AI_FN_URL =
  (import.meta.env.VITE_AI_FN_URL as string) ||
  'https://newtest-6gzd5kqm6c4eaa2b-1308771514.ap-shanghai.app.tcloudbase.com/galgame-ai'

const AI_TIMEOUT = 15000

function log(...args: any[]) {
  console.log('%c[GAL-AI]', 'color:#FF7EA8;font-weight:bold', ...args)
}
function logErr(...args: any[]) {
  console.error('%c[GAL-AI]', 'color:#E04D80;font-weight:bold', ...args)
}

function withTimeout<T>(p: Promise<T>, ms = AI_TIMEOUT): Promise<T | null> {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))])
}

/** 用 uni.request 调用公开 HTTP 端点（三端通用：H5/小程序/App） */
function requestFn(body: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: AI_FN_URL,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: body,
      timeout: AI_TIMEOUT,
      success: (res) => resolve(res.data),
      fail: (err) => reject(err),
    })
  })
}

/** 尽力把模型输出解析成 JSON 对象 */
function safeParseJSON(text: string): any | null {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (_) {
    const s = text.indexOf('{')
    const e = text.lastIndexOf('}')
    if (s >= 0 && e > s) {
      try {
        return JSON.parse(text.slice(s, e + 1))
      } catch (_) {
        return null
      }
    }
    return null
  }
}

/**
 * 统一对话入口：走云函数 galgame-ai（服务端管理员身份调 AI）。
 *
 * 为什么不端上直调：CloudBase 的 AI 不对匿名/未登录用户开放，端上直调会
 * ACTION_FORBIDDEN。所以必须由云函数代调（函数内是管理员身份，无此限制）。
 * 主路径：公开 HTTP 端点（uni.request，三端通用、零鉴权、自带 CORS）；
 * 兜底：SDK callFunction。
 */
async function chat(prompt: string, tag: string): Promise<string | null> {
  log(`▶ 请求[${tag}] model=${MODEL}\n`, prompt)

  // 1) 公开 HTTP 端点
  try {
    const res = await withTimeout(requestFn({ action: 'raw', prompt, model: MODEL }))
    if (res && res.success && res.data && res.data.text) {
      log(`✔ AI回复[${tag}]（HTTP galgame-ai）：`, res.data.text)
      return res.data.text
    }
    logErr(`✗ HTTP 端点返回异常[${tag}]`, res)
  } catch (e) {
    logErr(`✗ HTTP 端点调用失败[${tag}]`, e)
  }

  // 2) SDK callFunction 兜底
  try {
    const res = await withTimeout(
      callFunction<any>('galgame-ai', { action: 'raw', prompt, model: MODEL })
    )
    if (res && res.success && res.data && res.data.text) {
      log(`✔ AI回复[${tag}]（callFunction）：`, res.data.text)
      return res.data.text
    }
    logErr(`✗ callFunction 返回异常[${tag}]`, res)
  } catch (e) {
    logErr(`✗ callFunction 调用失败[${tag}]`, e)
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
  const prompt =
    `你扮演「${payload.name}」，人设：${payload.persona}。当前你与对方的羁绊值 ${payload.score}/100。\n` +
    `情境（发生在「长夜」这场城市异变中）：${payload.scene}\n` +
    `对方刚对你说："${payload.optionText}"\n` +
    `请只输出 JSON：{ "line":"<口头回应,1~2句≤40字,贴合人设、有戏剧张力>", "os":"<真实内心想法,1句≤25字,与口头有反差>" }\n` +
    `羁绊高→温和、愿意袒露；羁绊低→疏离、戒备。正常对话即可，不必刻意暧昧。只输出 JSON，不要其它文字。`
  const text = await chat(prompt, 'line')
  if (!text) return null
  const obj = safeParseJSON(text)
  if (obj && obj.line) {
    return { line: String(obj.line).slice(0, 60), os: String(obj.os || '').slice(0, 40) }
  }
  logErr('✗ line 无法解析为 JSON，走兜底：', text)
  return null
}

/** 模板 A2：开放题（第 6 题）专属回应台词 */
export async function aiOpenLine(payload: {
  name: string
  persona: string
  score: number
  userText: string
}): Promise<string | null> {
  const safeUser = String(payload.userText || '').slice(0, 100)
  const prompt =
    `你扮演「${payload.name}」，人设：${payload.persona}。当前你与对方的羁绊值 ${payload.score}/100。\n` +
    `在「长夜」即将结束、记忆即将封存之际，对方对你说了一段心里话："${safeUser}"\n` +
    `用 ${payload.name} 的口吻真诚回应这段话，1~3句、≤50字，符合人设、有情感张力。只输出台词本身，不要引号、不要解释。`
  const text = await chat(prompt, 'openLine')
  return text ? text.trim().slice(0, 80) : null
}

/** 模板 B：结局总结报告 */
export async function aiReport(payload: {
  name: string
  endingTitle: string
  score: number
  tags: string[]
}): Promise<string | null> {
  const tagStr = Array.isArray(payload.tags) ? payload.tags.join('、') : ''
  const prompt =
    `在「长夜」这场城市异变里，玩家与「${payload.name}」相处下来，被判定的关系人格是「${payload.endingTitle}」，最终羁绊值 ${payload.score}，行为标签：${tagStr}。\n` +
    `写一段 ≤80 字的「关系人格判词」，像 MBTI 人格点评那样犀利又有趣（可暖可毒舌），点评 TA 在一段关系里待人的方式与底色。只输出正文。`
  const text = await chat(prompt, 'report')
  return text ? text.trim().slice(0, 160) : null
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
  try {
    const res = await withTimeout(requestFn({ action: 'image', ...payload }), 25000)
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
