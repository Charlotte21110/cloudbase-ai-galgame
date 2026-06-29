<template>
  <view class="ending" :class="{ 'ending--result': !loading && !showCG }">
    <!-- 暗色星空背景：仅「生成中 / 全屏CG」阶段 -->
    <template v-if="loading || showCG">
      <image class="bg" :src="bgImg" mode="aspectFill" />
      <view class="bg-veil"></view>
    </template>

    <!-- 生成中 -->
    <view v-if="loading" class="loading-box">
      <view class="spinner"></view>
      <text class="loading-text">长夜正在为你封存这一夜…</text>
      <text class="loading-sub">{{ char?.name }} 与你的故事，正落下最后一笔</text>
    </view>

    <!-- 全屏 CG：生成完成后先整图展示，点击进入结局 -->
    <view v-else-if="showCG" class="cg-full" @click="enterResult">
      <image class="cg-full-img" :src="session.cgUrl" mode="aspectFit" />
      <view class="cg-full-tag">{{ ending?.title }}</view>
      <view class="cg-full-tip">
        <text class="cg-full-tip-text">轻触继续</text>
        <view class="cg-full-tri"></view>
      </view>
    </view>

    <!-- 结局展示 -->
    <view v-else class="result-box">
      <view class="result-card">
        <!-- 顶部立绘 / CG -->
        <view class="hero-frame">
          <image class="hero-img" :src="session.cgUrl" mode="aspectFill" />
          <view class="hero-glow"></view>
        </view>

        <!-- 标题（渐变） + 两侧装饰 -->
        <view class="title-row">
          <view class="title-deco left"></view>
          <text class="result-title">{{ ending?.title }}</text>
          <view class="title-deco right"></view>
        </view>
        <text class="result-caption">{{ caption }}</text>

        <!-- 长夜判词卡 -->
        <view class="verdict">
          <view class="verdict-head">
            <view class="verdict-star"></view>
            <text class="verdict-label">长夜判词</text>
            <view class="verdict-star"></view>
          </view>
          <text class="verdict-text">{{ session.aiReport }}</text>
        </view>

        <!-- 主按钮：渐变胶囊 + 渐变星 -->
        <button class="result-btn" @click="goReport">
          <view class="btn-star"></view>
          <text class="btn-tx">查看关系人格档案 →</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { session, finalize, tagCloud } from '@/game/store'
import { replaceTokens } from '@/game/engine'
import { aiReport, aiEndingImage } from '@/game/ai'

const bgImg = '/static/game/ui/report/starfield-bg.png'

const loading = ref(true)
const showCG = ref(false)
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
  // 先进入全屏 CG，轻触后才展开结局
  showCG.value = true
})

const enterResult = () => {
  showCG.value = false
}

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
/* 结局态：整屏淡紫渐变铺满，无内边距（卡片自身全屏） */
.ending--result {
  padding: 0;
  background: linear-gradient(180deg, #d9c9f2 0%, #e7d8f3 42%, #f3e6f3 78%, #f8edf4 100%);
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

/* 全屏 CG：整图（aspectFit）展示，上下露出星空背景 */
.cg-full {
  position: fixed;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: cgFade 0.6s ease;
}
@keyframes cgFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.cg-full-img {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 40rpx rgba(170, 110, 255, 0.55));
}
.cg-full-tag {
  position: absolute;
  top: calc(48rpx + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(176, 107, 255, 0.85), rgba(255, 126, 200, 0.85));
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  padding: 14rpx 44rpx;
  border-radius: 40rpx;
  box-shadow: 0 0 24rpx rgba(255, 120, 200, 0.6);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
}
.cg-full-tip {
  position: absolute;
  bottom: calc(70rpx + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  animation: tipBreath 1.4s ease-in-out infinite;
}
.cg-full-tip-text {
  font-size: 26rpx;
  letter-spacing: 4rpx;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.6);
}
.cg-full-tri {
  width: 0;
  height: 0;
  border-left: 14rpx solid transparent;
  border-right: 14rpx solid transparent;
  border-top: 16rpx solid rgba(255, 255, 255, 0.92);
  filter: drop-shadow(0 1rpx 4rpx rgba(0, 0, 0, 0.5));
}
@keyframes tipBreath {
  0%, 100% { opacity: 0.5; transform: translate(-50%, 0); }
  50% { opacity: 1; transform: translate(-50%, 6rpx); }
}

.result-box {
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}
/* 淡紫梦幻卡片：撑满一屏，内部自适应，不需要滚动 */
.result-card {
  position: relative;
  width: 100%;
  max-width: 720rpx;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: calc(28rpx + env(safe-area-inset-top)) 36rpx calc(36rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #d9c9f2 0%, #e7d8f3 42%, #f3e6f3 78%, #f8edf4 100%);
  /* 内发光描边，呼应参考图的霓虹边框 */
  box-shadow:
    inset 0 0 0 3rpx rgba(255, 255, 255, 0.55),
    inset 0 0 40rpx rgba(200, 170, 245, 0.45);
  box-sizing: border-box;
}

/* 顶部立绘相框：高度约占一屏 4 成，避免过大需要滚动 */
.hero-frame {
  position: relative;
  width: 100%;
  height: 40vh;
  max-height: 720rpx;
  flex-shrink: 0;
  border-radius: 24rpx;
  overflow: hidden;
  border: 2rpx solid rgba(230, 210, 255, 0.95);
  box-shadow: 0 8rpx 26rpx rgba(120, 80, 200, 0.28);
}
.hero-img { width: 100%; height: 100%; }
.hero-glow {
  position: absolute;
  inset: 0;
  border-radius: 24rpx;
  /* 底部柔化，使立绘融入淡紫背景 */
  box-shadow: inset 0 -70rpx 70rpx rgba(243, 230, 243, 0.6);
  pointer-events: none;
}

/* 标题行：渐变标题 + 两侧麦穗式装饰 */
.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 30rpx;
  gap: 20rpx;
}
.result-title {
  font-size: 64rpx;
  font-weight: 800;
  letter-spacing: 6rpx;
  background: linear-gradient(135deg, #a979e8 0%, #c189e6 50%, #e58fc8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2rpx 6rpx rgba(180, 140, 230, 0.4));
}
/* 两侧叶饰：用 CSS 画的对称小弧叶 */
.title-deco {
  position: relative;
  width: 44rpx;
  height: 34rpx;
}
.title-deco::before,
.title-deco::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 22rpx;
  height: 12rpx;
  border-radius: 0 16rpx 0 16rpx;
  background: linear-gradient(135deg, #d9a35e, #f0c98a);
}
.title-deco.left::before { left: 0; transform: translateY(-9rpx) rotate(20deg); }
.title-deco.left::after { left: 6rpx; transform: translateY(4rpx) rotate(-20deg); }
.title-deco.right::before { right: 0; transform: translateY(-9rpx) rotate(-20deg) scaleX(-1); }
.title-deco.right::after { right: 6rpx; transform: translateY(4rpx) rotate(20deg) scaleX(-1); }

.result-caption {
  display: block;
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #9a82c0;
  text-align: center;
  line-height: 1.7;
  padding: 0 24rpx;
}

/* 长夜判词卡 */
.verdict {
  margin-top: 28rpx;
  width: 100%;
  background: rgba(255, 255, 255, 0.55);
  border: 2rpx solid rgba(216, 190, 255, 0.8);
  border-radius: 24rpx;
  padding: 26rpx 30rpx 30rpx;
  box-shadow: inset 0 0 24rpx rgba(220, 200, 255, 0.4);
  box-sizing: border-box;
}
.verdict-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}
.verdict-label {
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
  color: #9b6fd6;
}
/* 渐变四角星装饰 */
.verdict-star {
  width: 22rpx;
  height: 22rpx;
  background: linear-gradient(135deg, #c79bff, #ff9ed6);
  clip-path: polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%);
}
.verdict-text {
  display: block;
  margin-top: 22rpx;
  font-size: 27rpx;
  line-height: 1.85;
  color: #7d6aa8;
  text-align: left;
}

/* 主按钮：渐变胶囊 + 渐变星（推到卡片底部） */
.result-btn {
  margin-top: auto;
  margin-bottom: 6rpx;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background: linear-gradient(90deg, #b48cf0 0%, #d49ae0 55%, #f3a6d2 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  border: none;
  border-radius: 48rpx;
  padding: 28rpx 0;
  box-shadow: 0 12rpx 30rpx rgba(190, 130, 220, 0.55);
}
.result-btn::after { border: none; }
.result-btn:active { transform: scale(0.98); }
.btn-tx { line-height: 1; }
/* 渐变五角星图标 */
.btn-star {
  width: 40rpx;
  height: 40rpx;
  background: linear-gradient(135deg, #ffe27a, #ffb0d8);
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  filter: drop-shadow(0 2rpx 6rpx rgba(255, 170, 90, 0.5));
}
</style>
