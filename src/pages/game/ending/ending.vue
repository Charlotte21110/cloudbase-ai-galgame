<template>
  <view class="ending">
    <image class="bg" :src="bgImg" mode="aspectFill" />
    <view class="bg-veil"></view>

    <!-- 生成中 -->
    <view v-if="loading" class="loading-box">
      <view class="spinner"></view>
      <text class="loading-text">长夜正在为你封存这一夜…</text>
      <text class="loading-sub">{{ char?.name }} 与你的故事，正落下最后一笔</text>
    </view>

    <!-- 结局展示 -->
    <view v-else class="result-box">
      <image class="float-star s1" :src="starMain" mode="aspectFit" />
      <image class="float-star s2" :src="starMain" mode="aspectFit" />

      <!-- CG 霓虹相框 -->
      <view class="cg-frame">
        <image class="cg" :src="session.cgUrl" mode="aspectFill" />
        <view class="cg-glow"></view>
        <view class="cg-tag">{{ ending?.title }}</view>
      </view>

      <text class="ending-title">{{ ending?.title }}</text>
      <text class="ending-caption">{{ caption }}</text>

      <view class="report-card">
        <text class="report-label">✦ 长夜判词 ✦</text>
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
import { aiReport, aiEndingImage } from '@/game/ai'

const bgImg = '/static/game/ui/report/starfield-bg.png'
const starMain = '/static/game/ui/report/star-main.png'

const loading = ref(true)
const char = computed(() => session.char)
const ending = computed(() => session.ending)
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
  overflow: hidden;
  background: #140a26;
  padding: calc(60rpx + env(safe-area-inset-top)) 40rpx calc(60rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
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
  background: radial-gradient(120% 80% at 50% 0%, rgba(124, 80, 200, 0.2), rgba(15, 8, 30, 0.55) 70%);
}

/* 生成中 */
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
  border: 8rpx solid rgba(180, 150, 255, 0.25);
  border-top-color: #c79bff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  box-shadow: 0 0 22rpx rgba(170, 110, 255, 0.6);
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text {
  margin-top: 40rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #f0e6ff;
  text-shadow: 0 0 18rpx rgba(196, 150, 255, 0.7);
}
.loading-sub { margin-top: 16rpx; font-size: 24rpx; color: #c4b3e8; }

.result-box {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.float-star { position: absolute; width: 50rpx; height: 50rpx; opacity: 0.85; }
.float-star.s1 { top: -10rpx; left: 30rpx; }
.float-star.s2 { top: 120rpx; right: 24rpx; width: 36rpx; height: 36rpx; }

/* CG 霓虹相框 */
.cg-frame {
  position: relative;
  width: 560rpx;
  height: 560rpx;
  border-radius: 28rpx;
  overflow: hidden;
  border: 3rpx solid rgba(210, 170, 255, 0.85);
  box-shadow:
    0 0 0 1rpx rgba(255, 150, 230, 0.3),
    0 0 40rpx rgba(170, 110, 255, 0.7);
}
.cg { width: 100%; height: 100%; }
.cg-glow {
  position: absolute;
  inset: 0;
  border-radius: 28rpx;
  box-shadow: inset 0 0 40rpx rgba(120, 70, 200, 0.35);
  pointer-events: none;
}
.cg-tag {
  position: absolute;
  left: 0; bottom: 0;
  background: linear-gradient(135deg, #b06bff, #ff7ec8);
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  padding: 10rpx 24rpx;
  border-top-right-radius: 20rpx;
  box-shadow: 0 0 16rpx rgba(255, 120, 200, 0.6);
}
.ending-title {
  margin-top: 40rpx;
  font-size: 56rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 6rpx;
  text-shadow: 0 0 24rpx rgba(196, 150, 255, 0.9);
}
.ending-caption {
  margin-top: 18rpx;
  font-size: 26rpx;
  color: #d8c8ff;
  text-align: center;
  line-height: 1.7;
  padding: 0 20rpx;
}
.report-card {
  margin-top: 40rpx;
  width: 100%;
  background: linear-gradient(160deg, rgba(60, 40, 110, 0.5), rgba(28, 16, 56, 0.6));
  border: 2rpx solid rgba(196, 160, 255, 0.5);
  border-radius: 24rpx;
  padding: 32rpx 30rpx;
  box-shadow: 0 0 28rpx rgba(170, 110, 255, 0.45), inset 0 0 30rpx rgba(150, 110, 255, 0.12);
  box-sizing: border-box;
  backdrop-filter: blur(16rpx);
  -webkit-backdrop-filter: blur(16rpx);
}
.report-label {
  display: block;
  text-align: center;
  font-size: 26rpx;
  font-weight: 700;
  color: #ffaee0;
  letter-spacing: 2rpx;
  text-shadow: 0 0 14rpx rgba(255, 130, 210, 0.6);
}
.report-text {
  display: block;
  margin-top: 18rpx;
  font-size: 28rpx;
  line-height: 1.8;
  color: #e7ddff;
  font-style: italic;
}
.go-btn {
  margin-top: 50rpx;
  width: 84%;
  background: linear-gradient(90deg, #b06bff, #ff7ec8);
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  border: none;
  border-radius: 48rpx;
  padding: 26rpx 0;
  box-shadow: 0 0 24rpx rgba(255, 120, 200, 0.6);
}
.go-btn::after { border: none; }
.go-btn:active { transform: scale(0.98); }
</style>
