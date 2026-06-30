/**
 * galgame-stats 云函数 · v7 全站匿名统计
 *
 * action:
 *   - incStats : 性别画像页提交时调一次（原子自增计数）
 *   - getStats : 获取全站统计数据（1 行 doc）
 *   - initStats: 初始化集合 + global 文档（只需跑一次）
 *
 * 集合名：galgame_stats（表名加 galgame 前缀）
 * 永远只有 1 行数据 _id = "global"
 *
 * 部署：npx tcb fn deploy galgame-stats -e newtest-6gzd5kqm6c4eaa2b --force
 */
const tcb = require('@cloudbase/node-sdk')

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV })
const db = app.database()
const _ = db.command

const COLLECTION = 'galgame_stats'

// ── 枚举白名单（严格校验，防脏数据） ──
const VALID_GENDERS = ['male', 'female', 'secret']
const VALID_PERSONAS = ['genuine', 'playboy', 'toxic', 'devoted', 'wanderer']
const VALID_CHARS = [
  'guchenzhou', 'luyan', 'baishiyu',
  'yunmobai', 'jianglinchuan', 'xiaye',
  'jiangzhaoyue', 'lintaotao', 'sumanqing',
  'shenbaishuang', 'chixiaoman', 'xuzhixia',
]
const VALID_SCRIPTS = [
  'script_default', 'script_amour', 'script_family',
  'script_campus', 'script_daily', 'script_biz',
  'script_summer', 'script_band', 'script_rookie',
  'script_test',
]

function isValid(val, list) {
  return typeof val === 'string' && list.includes(val)
}

function ok(data) {
  return { success: true, data }
}
function fail(msg) {
  return { success: false, error: String(msg) }
}

/** 从请求头解析设备类型 */
function parseDevice(ua) {
  if (!ua) return 'desktop'
  const lower = ua.toLowerCase()
  if (/ipad|tablet|kindle|silk/i.test(lower)) return 'tablet'
  if (/mobile|iphone|android|phone/i.test(lower)) return 'mobile'
  return 'desktop'
}

/** 从请求头解析浏览器 */
function parseBrowser(ua) {
  if (!ua) return 'other'
  const lower = ua.toLowerCase()
  if (lower.includes('micromessenger')) return 'wechat'
  if (lower.includes('chrome') && !lower.includes('edge')) return 'chrome'
  if (lower.includes('safari') && !lower.includes('chrome')) return 'safari'
  return 'other'
}

/**
 * incStats: 性别画像页提交时调一次
 * 入参: { gender, charId, scriptId, personaId }
 */
async function incStats(event, context) {
  const { gender, charId, scriptId, personaId } = event

  // 枚举严格校验
  if (!isValid(gender, VALID_GENDERS)) return fail('invalid gender')
  if (!isValid(charId, VALID_CHARS)) return fail('invalid charId')
  if (!isValid(scriptId, VALID_SCRIPTS)) return fail('invalid scriptId')
  if (!isValid(personaId, VALID_PERSONAS)) return fail('invalid personaId')

  // 从请求头取设备/浏览器信息（前端不传，防伪造）
  const headers = (context && context.headers) || {}
  const ua = headers['user-agent'] || ''
  const device = parseDevice(ua)
  const browser = parseBrowser(ua)

  // 原子自增
  try {
    await db.collection(COLLECTION).doc('global').update({
      totalPlays: _.inc(1),
      [`byGender.${gender}`]: _.inc(1),
      [`byChar.${charId}`]: _.inc(1),
      [`byScript.${scriptId}`]: _.inc(1),
      [`byPersona.${personaId}`]: _.inc(1),
      [`byCharPersona.${charId}_${personaId}`]: _.inc(1),
      [`byScriptPersona.${scriptId}_${personaId}`]: _.inc(1),
      [`byDevice.${device}`]: _.inc(1),
      [`byBrowser.${browser}`]: _.inc(1),
      updatedAt: Date.now(),
    })
    return ok({ ok: true })
  } catch (e) {
    console.error('incStats error:', e)
    return fail(e.message || e)
  }
}

/** getStats: 返回整张 stats 文档 */
async function getStats() {
  try {
    const { data } = await db.collection(COLLECTION).doc('global').get()
    const doc = Array.isArray(data) ? data[0] : data
    return ok(doc || null)
  } catch (e) {
    console.error('getStats error:', e)
    return fail(e.message || e)
  }
}

/** initStats: 初始化集合 + 插入 global 文档（幂等，强制覆盖） */
async function initStats() {
  try {
    // 尝试创建集合
    try {
      await db.createCollection(COLLECTION)
    } catch (e) {
      if (!String(e).includes('already exist') && !String(e).includes('ResourceInUse')) {
        console.warn('createCollection warning:', e.message || e)
      }
    }

    // 删掉旧文档（如果存在）
    try {
      await db.collection(COLLECTION).doc('global').remove()
    } catch (_) {}

    // 插入干净的初始文档
    await db.collection(COLLECTION).add({
      _id: 'global',
      totalPlays: 0,
      byGender: { male: 0, female: 0, secret: 0 },
      byChar: {},
      byScript: {},
      byPersona: { genuine: 0, playboy: 0, toxic: 0, devoted: 0, wanderer: 0 },
      byCharPersona: {},
      byScriptPersona: {},
      byDevice: { mobile: 0, desktop: 0, tablet: 0 },
      byBrowser: { wechat: 0, chrome: 0, safari: 0, other: 0 },
      updatedAt: Date.now(),
    })
    return ok({ msg: 'galgame_stats 已重新初始化（无 byRegion）' })
  } catch (e) {
    console.error('initStats error:', e)
    return fail(e.message || e)
  }
}

exports.main = async (event, context) => {
  // 兼容 HTTP 触发（body 解析）
  if (event && typeof event.body === 'string' && event.action === undefined) {
    try {
      event = JSON.parse(event.body)
    } catch (_) { /* 保持原样 */ }
  }

  const { action } = event || {}
  try {
    switch (action) {
      case 'incStats':
        return await incStats(event, context)
      case 'getStats':
        return await getStats()
      case 'initStats':
        return await initStats()
      default:
        return fail('unknown action: ' + action)
    }
  } catch (e) {
    console.error('galgame-stats error:', e)
    return fail(e.message || e)
  }
}
