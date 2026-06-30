<template>
  <view class="stats">
    <image class="bg" src="/static/game/ui/report/starfield-bg.png" mode="aspectFill" />
    <view class="bg-veil"></view>

    <scroll-view class="wrap" scroll-y>
      <!-- 顶部 Banner -->
      <view class="banner">
        <text class="banner-title">✨ 长夜众生相 ✨</text>
        <text class="banner-count" v-if="totalPlays >= 1000">已有 {{ formatNum(totalPlays) }} 人走过长夜</text>
        <text class="banner-count" v-else>内测中</text>
        <text class="banner-sub">以下数据匿名实时更新</text>
      </view>

      <view v-if="loadErr" class="err-box">
        <text class="err-text">数据加载失败，请稍后再试</text>
        <button class="retry-btn" @click="loadStats">
          <text class="retry-text">重新加载</text>
        </button>
      </view>

      <template v-if="loaded && !loadErr">
        <!-- 模块 ① 角色热度榜 Top5 -->
        <view class="section">
          <text class="sec-title">🔥 角色热度榜 Top5</text>
          <view class="bar-list">
            <view v-for="(item, idx) in charRankTop5" :key="item.id" class="bar-row">
              <text class="bar-rank" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</text>
              <text class="bar-name">{{ charNameMap[item.id] || item.id }}</text>
              <view class="bar-track">
                <view class="bar-fill" :style="{ width: item.pct + '%' }"></view>
              </view>
              <text class="bar-pct">{{ item.pct }}%</text>
            </view>
          </view>
        </view>

        <!-- 模块 ② 五大关系人格分布 -->
        <view class="section">
          <text class="sec-title">🌟 五大关系人格分布</text>
          <view class="persona-list">
            <view
              v-for="p in personaDist"
              :key="p.id"
              class="persona-row"
              :class="{ mine: p.id === myPersona }"
            >
              <view class="persona-dot" :style="{ background: personaColors[p.id] }"></view>
              <text class="persona-name">{{ personaNames[p.id] }}</text>
              <view class="bar-track sm">
                <view class="bar-fill" :style="{ width: p.pct + '%', background: personaColors[p.id] }"></view>
              </view>
              <text class="bar-pct">{{ p.pct }}%</text>
              <text v-if="p.id === myPersona" class="mine-tag">← 你</text>
            </view>
          </view>
        </view>

        <!-- 模块 ③ 角色 × 变体人格配对榜 -->
        <view class="section">
          <text class="sec-title">💫 角色 × 人格配对榜</text>
          <view v-for="cid in charIds" :key="cid" class="collapse-card">
            <view class="collapse-head" @click="toggleCard(cid)">
              <text class="collapse-name">{{ charNameMap[cid] || cid }}</text>
              <text class="collapse-arrow">{{ expandedCards[cid] ? '▾' : '▸' }}</text>
            </view>
            <view v-if="expandedCards[cid]" class="collapse-body">
              <view v-for="p in charPersonaDist(cid)" :key="p.id" class="mini-bar-row">
                <text class="mini-name">{{ personaNames[p.id] }}</text>
                <view class="bar-track xs">
                  <view class="bar-fill" :style="{ width: p.pct + '%', background: personaColors[p.id] }"></view>
                </view>
                <text class="bar-pct sm">{{ p.pct }}%</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 模块 ④ 玩家画像 -->
        <view class="section">
          <text class="sec-title">🌏 玩家画像</text>
          <view class="meta-card">
            <view class="meta-row" v-if="genderDist">
              <text class="meta-label">性别分布</text>
              <text class="meta-val">♀ 女生 {{ genderDist.female }}% · ♂ 男生 {{ genderDist.male }}% · 🌙 保密 {{ genderDist.secret }}%</text>
            </view>
            <view class="meta-row" v-if="deviceDist">
              <text class="meta-label">使用设备</text>
              <text class="meta-val">📱 手机 {{ deviceDist.mobile }}% · 💻 电脑 {{ deviceDist.desktop }}% · 📟 平板 {{ deviceDist.tablet }}%</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 底部按钮 -->
      <view class="bottom-btn" @click="goBack">
        <text class="bottom-btn-text">← 返回人格档案</text>
      </view>

      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { session } from '@/game/store'
import { CHARACTERS as characters } from '@/game/data/characters'

/** 统计云函数的公开 HTTP 端点（和 galgame-ai 同环境，免登录、自带 CORS） */
const STATS_FN_URL =
  (import.meta.env.VITE_STATS_FN_URL as string) ||
  'https://newtest-6gzd5kqm6c4eaa2b-1308771514.ap-shanghai.app.tcloudbase.com/galgame-stats'

function requestStatsFn(body: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: STATS_FN_URL,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: body,
      timeout: 10000,
      success: (res) => resolve(res.data),
      fail: (err) => reject(err),
    })
  })
}

// 人格常量
const PERSONA_IDS = ['genuine', 'playboy', 'toxic', 'devoted', 'wanderer'] as const
const personaNames: Record<string, string> = {
  genuine: '同行者（安全型）',
  playboy: '逐光者（海王型）',
  toxic: '噬星者（渣型）',
  devoted: '拾光者（忠犬型）',
  wanderer: '漫游者（漫游型）',
}
const personaColors: Record<string, string> = {
  genuine: '#6fbaff',
  playboy: '#ff8fd0',
  toxic: '#ff6b6b',
  devoted: '#a78bfa',
  wanderer: '#8dd9a8',
}

// 角色名映射
const charNameMap: Record<string, string> = {}
const charIds: string[] = []
for (const c of characters) {
  charNameMap[c.id] = c.name
  charIds.push(c.id)
}

const myPersona = computed(() => session.ending?.endingId || '')

// 数据状态
const loaded = ref(false)
const loadErr = ref(false)
const stats = ref<any>(null)

const totalPlays = computed(() => stats.value?.totalPlays || 0)

// 角色热度榜 Top5
const charRankTop5 = computed(() => {
  if (!stats.value?.byChar) return []
  const total = totalPlays.value || 1
  return Object.entries(stats.value.byChar as Record<string, number>)
    .map(([id, n]) => ({ id, pct: +((n as number) / total * 100).toFixed(1) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)
})

// 人格分布
const personaDist = computed(() => {
  if (!stats.value?.byPersona) return []
  const total = totalPlays.value || 1
  return PERSONA_IDS.map(id => ({
    id,
    pct: +((stats.value.byPersona[id] || 0) / total * 100).toFixed(1),
  }))
})

// 角色 × 人格
function charPersonaDist(charId: string) {
  if (!stats.value?.byCharPersona) return []
  const sums = PERSONA_IDS.reduce((s, p) => s + (stats.value.byCharPersona[`${charId}_${p}`] || 0), 0)
  if (!sums) return []
  return PERSONA_IDS.map(id => ({
    id,
    pct: +((stats.value.byCharPersona[`${charId}_${id}`] || 0) / sums * 100).toFixed(1),
  }))
}

// 性别
const genderDist = computed(() => {
  if (!stats.value?.byGender) return null
  const g = stats.value.byGender
  const total = (g.male || 0) + (g.female || 0) + (g.secret || 0) || 1
  return {
    male: +((g.male || 0) / total * 100).toFixed(1),
    female: +((g.female || 0) / total * 100).toFixed(1),
    secret: +((g.secret || 0) / total * 100).toFixed(1),
  }
})

// 设备
const deviceDist = computed(() => {
  if (!stats.value?.byDevice) return null
  const d = stats.value.byDevice
  const total = (d.mobile || 0) + (d.desktop || 0) + (d.tablet || 0) || 1
  return {
    mobile: +((d.mobile || 0) / total * 100).toFixed(1),
    desktop: +((d.desktop || 0) / total * 100).toFixed(1),
    tablet: +((d.tablet || 0) / total * 100).toFixed(1),
  }
})

// 折叠
const expandedCards = reactive<Record<string, boolean>>({})

function toggleCard(id: string) {
  expandedCards[id] = !expandedCards[id]
}

function formatNum(n: number): string {
  return n.toLocaleString()
}

async function loadStats() {
  loadErr.value = false
  try {
    const res = await requestStatsFn({ action: 'getStats' })
    if (res && res.success !== false) {
      stats.value = res.data || res
      loaded.value = true
    } else {
      loadErr.value = true
    }
  } catch (e) {
    console.warn('getStats 失败', e)
    loadErr.value = true
  }
}

function goBack() {
  uni.navigateBack({ delta: 1 })
}

onMounted(() => {
  // 默认展开当前玩家选的角色
  if (session.char) {
    expandedCards[session.char.id] = true
  }
  loadStats()
})
</script>

<style scoped>
.stats {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #0a0618;
}
.bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}
.bg-veil {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: radial-gradient(120% 80% at 50% 10%, rgba(124, 80, 200, 0.2), rgba(10, 6, 24, 0.8) 70%);
}
.wrap {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100vh;
  padding: calc(20rpx + env(safe-area-inset-top)) 32rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

/* Banner */
.banner {
  text-align: center;
  padding: 40rpx 0 20rpx;
}
.banner-title {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  background: linear-gradient(135deg, #c79bff, #ff8fd0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.banner-count {
  display: block;
  margin-top: 18rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #e8ddf8;
  text-shadow: 0 0 14rpx rgba(196, 150, 255, 0.6);
}
.banner-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: rgba(200, 180, 230, 0.55);
}

/* 错误 */
.err-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
}
.err-text {
  color: #c4b3e8;
  font-size: 28rpx;
  text-align: center;
}
.retry-btn {
  margin-top: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 22rpx 64rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, rgba(155, 123, 255, 0.6), rgba(176, 107, 255, 0.5));
  border: 1rpx solid rgba(200, 170, 255, 0.6);
  backdrop-filter: blur(12rpx);
  -webkit-backdrop-filter: blur(12rpx);
  box-shadow: 0 6rpx 20rpx rgba(176, 107, 255, 0.3);
  transition: transform 0.12s ease;
}
.retry-btn::after { border: none; }
.retry-btn:active { transform: scale(0.95); }
.retry-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
  letter-spacing: 2rpx;
}

/* Section */
.section {
  margin-top: 40rpx;
}
.sec-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #e8ddf8;
  letter-spacing: 2rpx;
  margin-bottom: 24rpx;
  text-shadow: 0 0 12rpx rgba(176, 107, 255, 0.4);
}

/* 条形图 */
.bar-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.bar-rank {
  width: 40rpx;
  font-size: 26rpx;
  font-weight: 800;
  text-align: center;
  flex-shrink: 0;
  color: #c4b3e8;
}
.bar-rank.rank-1 { color: #ffd700; text-shadow: 0 0 10rpx rgba(255, 215, 0, 0.6); }
.bar-rank.rank-2 { color: #c0c0c0; text-shadow: 0 0 8rpx rgba(192, 192, 192, 0.5); }
.bar-rank.rank-3 { color: #cd7f32; text-shadow: 0 0 8rpx rgba(205, 127, 50, 0.5); }
.bar-name {
  width: 120rpx;
  font-size: 24rpx;
  color: #d4c5f0;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar-track {
  flex: 1;
  height: 20rpx;
  border-radius: 12rpx;
  background: rgba(40, 30, 80, 0.6);
  overflow: hidden;
}
.bar-track.sm { height: 16rpx; }
.bar-track.xs { height: 14rpx; }
.bar-fill {
  height: 100%;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #9b7bff, #ff8fd0);
  transition: width 0.5s ease;
}
.bar-pct {
  width: 80rpx;
  font-size: 22rpx;
  color: #c4b3e8;
  text-align: right;
  flex-shrink: 0;
}
.bar-pct.sm { width: 70rpx; font-size: 20rpx; }

/* 人格分布 */
.persona-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.persona-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 8rpx 16rpx;
  border-radius: 14rpx;
  transition: background 0.2s;
}
.persona-row.mine {
  background: rgba(124, 80, 200, 0.25);
  border: 1rpx solid rgba(180, 150, 255, 0.4);
}
.persona-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.persona-name {
  width: 200rpx;
  font-size: 24rpx;
  color: #d4c5f0;
  flex-shrink: 0;
}
.mine-tag {
  font-size: 20rpx;
  color: #ff8fd0;
  margin-left: 8rpx;
}

/* 折叠卡片 */
.collapse-card {
  margin-bottom: 16rpx;
  border-radius: 18rpx;
  background: rgba(38, 28, 72, 0.45);
  border: 1rpx solid rgba(180, 150, 255, 0.25);
  overflow: hidden;
}
.collapse-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
}
.collapse-name {
  font-size: 26rpx;
  color: #e8ddf8;
  font-weight: 600;
}
.collapse-arrow {
  font-size: 28rpx;
  color: #c4b3e8;
}
.collapse-body {
  padding: 6rpx 24rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.mini-bar-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.mini-name {
  width: 160rpx;
  font-size: 22rpx;
  color: #c4b3e8;
  flex-shrink: 0;
}

/* 地区/设备 */
.meta-card {
  background: rgba(38, 28, 72, 0.45);
  border: 1rpx solid rgba(180, 150, 255, 0.25);
  border-radius: 18rpx;
  padding: 24rpx 28rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.meta-row {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.meta-label {
  font-size: 22rpx;
  color: #c4b3e8;
}
.meta-val {
  font-size: 24rpx;
  color: #e8ddf8;
  line-height: 1.6;
}

/* 底部返回按钮 */
.bottom-btn {
  margin-top: 48rpx;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 0;
  border-radius: 48rpx;
  background: rgba(60, 40, 110, 0.3);
  border: 1rpx solid rgba(200, 170, 255, 0.35);
  backdrop-filter: blur(16rpx);
  -webkit-backdrop-filter: blur(16rpx);
  transition: transform 0.12s ease;
}
.bottom-btn:active { transform: scale(0.97); }
.bottom-btn-text {
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 3rpx;
  color: rgba(232, 221, 248, 0.85);
}

.bottom-spacer { height: 40rpx; }
</style>
