<template>
  <view class="ending" :style="themeVars">
    <view class="ending-bg"></view>

    <!-- 生成中 -->
    <view v-if="loading" class="loading-box">
      <view class="spinner"></view>
      <text class="loading-text">长夜正在为你封存这一夜…</text>
      <text class="loading-sub">{{ char?.name }} 与你的故事，正落下最后一笔 ✍️</text>
    </view>

    <!-- 结局展示 -->
    <view v-else class="result-box">
      <view class="cg-frame">
        <image class="cg" :src="session.cgUrl" mode="aspectFill" />
        <view class="cg-tag">{{ ending?.title }}</view>
      </view>

      <text class="ending-title">{{ ending?.title }}</text>
      <text class="ending-caption">{{ caption }}</text>

      <view class="report-card">
        <text class="report-label">🌌 长夜判词</text>
        <text class="report-text">{{ session.aiReport }}</text>
      </view>

      <button class="go-btn" @click="goReport">查看关系人格档案 →</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { session, finalize, tagCloud } from '@/game/store'
import { replaceTokens } from '@/game/engine'
import { themeCssVars } from '@/game/theme'
import { aiReport, aiEndingImage } from '@/game/ai'

const loading = ref(true)
const char = computed(() => session.char)
const ending = computed(() => session.ending)
const themeVars = computed(() => (char.value ? themeCssVars(char.value.themeKey) : {}))
const caption = computed(() => replaceTokens(ending.value?.caption || '', session.char))

onMounted(async () => {
  if (!session.char || !session.script) {
    uni.reLaunch({ url: '/pages/game/pick/pick' })
    return
  }
  const e = finalize()
  // 先填兜底报告，AI 成功再覆盖
  session.aiReport = replaceTokens(e.report, session.char)

  const minDelay = new Promise((r) => setTimeout(r, 1500))

  const reportP = aiReport({
    name: char.value!.name,
    endingTitle: e.title,
    score: session.score,
    tags: tagCloud(),
  }).then((txt) => {
    if (txt) session.aiReport = txt
  })

  // 结局 Q 版生图（失败自动回退已设好的 D1/立绘）
  const imageP = aiEndingImage({
    name: char.value!.name,
    persona: char.value!.persona,
    endingId: e.endingId,
    userText: session.openAnswer,
    style: char.value!.style,
  }).then((url) => {
    if (url) session.cgUrl = url
  })

  await Promise.all([minDelay, reportP, imageP])
  loading.value = false
})

const goReport = () => {
  uni.redirectTo({ url: '/pages/game/report/report' })
}
</script>

<style scoped>
.ending {
  position: relative;
  min-height: 100vh;
  padding: 60rpx 40rpx;
  box-sizing: border-box;
  background: var(--c-bg);
}
.ending-bg {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 0%, var(--c-soft), var(--c-bg) 70%);
}
.loading-box {
  position: relative;
  z-index: 2;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.spinner {
  width: 90rpx;
  height: 90rpx;
  border: 8rpx solid var(--c-soft);
  border-top-color: var(--c-primary);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text {
  margin-top: 36rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--c-deep);
}
.loading-sub { margin-top: 14rpx; font-size: 24rpx; color: #a89db3; }

.result-box {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cg-frame {
  position: relative;
  width: 480rpx;
  height: 480rpx;
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 44rpx rgba(0,0,0,0.18);
  border: 8rpx solid #fff;
}
.cg { width: 100%; height: 100%; }
.cg-tag {
  position: absolute;
  left: 0; bottom: 0;
  background: var(--c-primary);
  color: #fff;
  font-size: 22rpx;
  padding: 8rpx 20rpx;
  border-top-right-radius: 18rpx;
}
.ending-title {
  margin-top: 36rpx;
  font-size: 48rpx;
  font-weight: 800;
  color: var(--c-deep);
  letter-spacing: 4rpx;
}
.ending-caption {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: var(--c-text);
  text-align: center;
  line-height: 1.6;
  padding: 0 20rpx;
}
.report-card {
  margin-top: 36rpx;
  width: 100%;
  background: rgba(255,255,255,0.95);
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  box-sizing: border-box;
}
.report-label { font-size: 26rpx; font-weight: 700; color: var(--c-primary); }
.report-text {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: var(--c-text);
}
.go-btn {
  margin-top: 48rpx;
  width: 80%;
  background: linear-gradient(90deg, var(--c-primary), var(--c-deep));
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  border: none;
  border-radius: 48rpx;
  padding: 24rpx 0;
}
</style>
