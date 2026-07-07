/**
 * Galgame AI 云函数 · 对应设计方案第十一节 Prompt 模板
 *
 * 为什么走云函数：CloudBase 端上匿名用户不能调 AI；云函数在服务端用环境凭证调用，
 * 不受匿名限制，从而实现「不登录也能玩 + AI」。（见 docs/开发进度与待确认.md Q1）
 *
 * 支持 action：
 *   - line     模板A  ：选择题后 TA 的回应台词 + 内心 OS（返回 {line, os}）
 *   - openLine 模板A2 ：开放题专属回应台词（返回 {line}）
 *   - report   模板B  ：结局总结报告（返回 {text}）
 *   - image    模板C  ：结局 Q 版纪念图（返回 {url}）—— 见文末说明
 *
 * 部署：npx @cloudbase/cli fn deploy galgame-ai -e 你的envId
 *
 * 前置：① 已买 Token Credits 资源包 ② 控制台已开通模型
 */
const tcb = require('@cloudbase/node-sdk')

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV })

/** 懒加载 AI 实例：放到运行时，避免顶层初始化出错导致进程直接退出 */
let _ai = null
function getAI() {
  if (!_ai) {
    if (typeof app.ai !== 'function') {
      throw new Error('当前 @cloudbase/node-sdk 版本不支持 ai()，请升级到 >=3.16.0')
    }
    _ai = app.ai()
  }
  return _ai
}

// 默认文本模型（newtest 环境已开通：hy3-preview / glm-5 / glm-5.1 / glm-5v-turbo）
const TEXT_MODEL = process.env.GALGAME_TEXT_MODEL || 'hy3-preview'
// 生图模型（newtest 环境已开通 HY-Image-3.0-Plus-4090-Tob-v1.0）
const IMAGE_MODEL = process.env.GALGAME_IMAGE_MODEL || 'HY-Image-3.0-Plus-4090-Tob-v1.0'

function ok(data) {
  return { success: true, data }
}
function fail(error) {
  return { success: false, error: String(error && error.message ? error.message : error) }
}

/** 从模型返回里尽力解析出 JSON 对象 */
function safeParseJSON(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (e) {
    // 容错：截取第一个 { 到最后一个 }
    const s = text.indexOf('{')
    const e2 = text.lastIndexOf('}')
    if (s >= 0 && e2 > s) {
      try {
        return JSON.parse(text.slice(s, e2 + 1))
      } catch (_) {
        return null
      }
    }
    return null
  }
}

async function genText(messages, model) {
  const m = getAI().createModel('cloudbase') // ⚠️ 固定写 "cloudbase"
  const res = await m.generateText({ model: model || TEXT_MODEL, messages })
  return res.text
}

/** raw：前端把拼好的 prompt 直接透传过来，云函数代调（绕开端上匿名权限问题） */
async function genRaw(event) {
  const { prompt, model } = event
  if (!prompt) return fail('prompt 不能为空')
  const text = await genText([{ role: 'user', content: prompt }], model)
  if (text && text.trim()) return ok({ text: text.trim() })
  return fail('AI 未返回内容')
}

/** 模板 A：台词 + 内心 OS */
async function genLine(event) {
  const { name, persona, score, scene, optionText, language } = event
  const isEn = language === 'en-US'
  const mood = isEn
    ? (score >= 60
        ? 'You feel quite trusting and close to the other person right now'
        : score >= 35
          ? 'You feel some attraction but remain somewhat reserved'
          : 'You still feel distant and guarded toward the other person')
    : (score >= 60
        ? '你此刻对对方颇为信任、愿意亲近'
        : score >= 35
          ? '你对对方有些好感，仍带着几分克制'
          : '你对对方还较为疏离、戒备')
  const prompt = isEn
    ? `You are roleplaying as "${name}". Personality: ${persona}. ${mood}.\n` +
      `Scene (set during the "Long Night", a city-wide anomaly): ${scene}\n` +
      `The other person just said to you: "${optionText}"\n` +
      `Output ONLY this JSON: { "line":"<spoken response, 1-2 sentences, in character, natural and heartfelt>", "os":"<true inner thoughts, 1 sentence, contrasting with spoken words>" }\n` +
      `Do NOT mention any numbers, scores, or system terms like "bond level", "affinity", "compatibility", "rating", etc. Output pure JSON, nothing else.`
    : `你扮演「${name}」，人设：${persona}。${mood}。\n` +
      `情境（发生在「长夜」这场城市异变中）：${scene}\n` +
      `对方刚对你说："${optionText}"\n` +
      `请只输出 JSON：{ "line":"<口头回应,1~2句≤40字,贴合人设、有戏剧张力>", "os":"<真实内心想法,1句≤25字,与口头有反差>" }\n` +
      `台词要自然走心；严禁出现任何数字、分数，以及「羁绊值/好感度/契合度/标准/达标/未达标/等级/系统」之类的系统化字眼。只输出 JSON，不要其它文字。`
  const text = await genText([{ role: 'user', content: prompt }])
  const obj = safeParseJSON(text)
  if (obj && obj.line) {
    return ok({ line: String(obj.line).slice(0, 60), os: String(obj.os || '').slice(0, 40) })
  }
  // 解析失败也别报错，让前端走兜底
  return fail('AI 返回无法解析为 JSON')
}

/** 模板 A2：开放题专属回应 */
async function genOpenLine(event) {
  const { name, persona, score, userText, language } = event
  const safeUser = String(userText || '').slice(0, 100)
  const isEn = language === 'en-US'
  const mood = isEn
    ? (score >= 60
        ? 'You have let your guard down completely and grown deeply attached'
        : score >= 35
          ? 'You feel affection but still hold some restraint and hesitation'
          : 'You keep a certain distance, but not out of indifference')
    : (score >= 60
        ? '此刻你已对对方卸下防备、心生依恋'
        : score >= 35
          ? '你对对方有好感，却仍带着几分克制与试探'
          : '你对对方仍存着距离与保留，但并非冷漠')
  const prompt = isEn
    ? `You are roleplaying as "${name}". Personality: ${persona}. ${mood}.\n` +
      `The "Long Night" is about to end and all memories will soon be sealed. The other person says these heartfelt words to you: "${safeUser}"\n` +
      `Respond sincerely in ${name}'s voice, 1-3 sentences, heartfelt and vivid with emotional depth.\n` +
      `Do NOT mention any numbers, scores, or system terms. Output only the dialogue line itself — no quotes, no explanation.`
    : `你扮演「${name}」，人设：${persona}。${mood}。\n` +
      `在「长夜」即将结束、记忆即将封存之际，对方对你说了一段心里话："${safeUser}"\n` +
      `请用 ${name} 的口吻真诚回应这段话，1~3句、≤50字，像真人倾诉般自然走心、有画面感与情感张力。\n` +
      `严禁出现任何数字、分数，以及「羁绊值/好感度/契合度/标准/达标/未达标/等级/系统」之类的系统化字眼。\n` +
      `只输出台词本身，不要引号、不要解释。`
  const text = await genText([{ role: 'user', content: prompt }])
  if (text && text.trim()) return ok({ line: text.trim().slice(0, 80) })
  return fail('AI 未返回内容')
}

/** 模板 B：结局报告 */
async function genReport(event) {
  const { name, endingTitle, score, tags, language } = event
  const tagStr = Array.isArray(tags) ? tags.join('、') : ''
  const isEn = language === 'en-US'
  const prompt = isEn
    ? `In the city anomaly known as the "Long Night", the player spent time with "${name}" and was judged to have the relationship persona "${endingTitle}", with a final bond score of ${score}, and behavior tags: ${tagStr}.\n` +
      `Write a short "relationship persona verdict" of ≤80 words, sharp and fun like an MBTI-style critique (can be warm or sassy). Comment on how this person navigates intimacy. Output only the verdict text.`
    : `在「长夜」这场城市异变里，玩家与「${name}」相处下来，被判定的关系人格是「${endingTitle}」，最终羁绊值 ${score}，行为标签：${tagStr}。\n` +
      `写一段 ≤80 字的「关系人格判词」，像 MBTI 人格点评那样犀利又有趣（可暖可毒舌），点评 TA 在一段关系里待人的方式与底色。只输出正文。`
  const text = await genText([{ role: 'user', content: prompt }])
  if (text && text.trim()) return ok({ text: text.trim().slice(0, 160) })
  return fail('AI 未返回内容')
}

/**
 * 模板 C：结局 Q 版纪念图（运行时生图）
 *
 * ⚠️ 文生图需 node-sdk 的 createImageModel/generateImage。不同版本/开通情况下 API 可能不同，
 * 这里做了「能力探测 + 失败即返回 fail」，前端会自动回退到预设图(D1)/立绘，主流程不受影响。
 * 真正接通生图时，把下方拼好的 prompt 传给图像模型，返回可访问的图片 URL 即可。
 */
async function genImage(event) {
  const { name, persona, endingId, userText, style } = event
  // 四段拼接
  const situation =
    endingId === 'good'
      ? '樱花树下甜蜜牵手'
      : endingId === 'mid'
      ? '黄昏里暧昧对望'
      : endingId === 'bad'
      ? '雨夜背身离别'
      : '夸张搞笑的单恋名场面'
  const safeUser = String(userText || '').replace(/[\n\r]/g, ' ').slice(0, 60)
  const prompt =
    `${persona.slice(0, 20)}（${name}）与恋人, ${situation}, ${safeUser}, ` +
    `chibi Q版萌系, 大头娃娃比例, 可爱贴纸风, 圆润线条, 明快色彩, 卡通治愈, 简洁背景, 方形构图`

  try {
    const aiInst = getAI()
    if (typeof aiInst.createImageModel !== 'function') {
      return fail('当前环境 AI SDK 暂不支持 createImageModel，前端将回退预设图')
    }
    const imgModel = aiInst.createImageModel('hunyuan-image')
    const res = await imgModel.generateImage({
      model: IMAGE_MODEL,
      prompt,
      // 具体参数以控制台开通的图像模型为准
    })
    // 兼容多种返回结构
    const url =
      (res && res.url) ||
      (res && res.data && res.data[0] && (res.data[0].url || res.data[0].b64_image)) ||
      ''
    if (url) return ok({ url })
    return fail('生图返回为空')
  } catch (e) {
    return fail(e)
  }
}

exports.main = async (event, context) => {
  // 兼容两种调用方式：
  //  - SDK callFunction：event 直接就是参数对象（event.action 有值）
  //  - HTTP 访问触发：真正的 JSON 参数在 event.body（字符串）里
  if (event && typeof event.body === 'string' && event.action === undefined) {
    try {
      event = JSON.parse(event.body)
    } catch (_) {
      /* body 不是 JSON，保持原样 */
    }
  }

  const { action } = event || {}
  try {
    switch (action) {
      case 'raw':
        return await genRaw(event)
      case 'line':
        return await genLine(event)
      case 'openLine':
        return await genOpenLine(event)
      case 'report':
        return await genReport(event)
      case 'image':
        return await genImage(event)
      default:
        return fail('unknown action: ' + action)
    }
  } catch (e) {
    console.error('galgame-ai error:', e)
    return fail(e)
  }
}
