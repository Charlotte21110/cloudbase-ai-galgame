<template>
  <view class="report">
    <!-- 星空背景 -->
    <image class="bg" :src="bgImg" mode="aspectFill" />
    <view class="bg-veil"></view>

    <view class="wrap">
      <!-- 顶部标题 -->
      <view class="page-title">
        <image class="title-star left" :src="starMain" mode="aspectFit" />
        <text class="title-text">RELATIONSHIP REPORT</text>
        <image class="title-star right" :src="starMain" mode="aspectFit" />
      </view>

      <!-- 主卡片：霓虹玻璃画框 -->
      <view class="card">
        <!-- 角落星群装饰 -->
        <image class="corner-star tl" :src="starCluster" mode="aspectFit" />
        <image class="corner-star br" :src="starCluster" mode="aspectFit" />

        <!-- 头部：CG 缩略 + 标题 -->
        <view class="card-head">
          <view class="cg-thumb">
            <image class="cg-thumb-img" :src="cgThumb" mode="aspectFill" />
            <text class="cg-badge">CG</text>
          </view>
          <view class="head-meta">
            <view class="with-pill">与 {{ char?.name }} · 长夜档案</view>
            <text class="ending-title">{{ ending?.title }}</text>
          </view>
        </view>

        <!-- 契合度 -->
        <view class="match">
          <view class="match-num">
            <text class="num">{{ session.matchRate }}</text><text class="pct">%</text>
          </view>
          <text class="match-label">灵魂契合度</text>
          <view class="match-bar">
            <view class="match-fill" :style="{ width: barWidth }">
              <view class="bar-heart"></view>
            </view>
          </view>
        </view>

        <!-- 标签云 -->
        <view class="tags">
          <text class="tags-label">你的关系人格画像</text>
          <view class="tag-cloud">
            <text v-for="(t, i) in tags" :key="i" class="tag-chip">✦ {{ t }}</text>
            <text v-if="!tags.length" class="tag-chip">✦ 神秘玩家</text>
          </view>
        </view>

        <!-- 小结 -->
        <view class="summary">
          <text class="summary-text">{{ session.aiReport }}</text>
        </view>

        <text class="brand">辰星 · 长夜文游 · {{ char?.style === 'anime' ? '新海诚画风' : '电影写实风' }}</text>
      </view>

      <!-- 底部按钮：半透明磨砂 + 发光描边 -->
      <view class="btns">
        <view class="rbtn ghost" @click="saveShot">
          <view class="ico ico-upload"><view class="up-head"></view></view>
          <text class="rbtn-tx">保存 / 分享</text>
        </view>
        <view class="rbtn replay" @click="again">
          <view class="ico ico-refresh"></view>
          <text class="rbtn-tx">再玩一次</text>
        </view>
      </view>

      <!-- Powered by CloudBase 广告徽章 -->
      <cloudbase-footer title="辰星 · 长夜文游" />
    </view>

    <!-- 一键生成结局分享图 -->
    <share-card :visible="showShare" @close="showShare = false" />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { session, tagCloud, resetGame } from '@/game/store'
import shareCard from '@/components/share-card.vue'
import cloudbaseFooter from '@/components/cloudbase-footer.vue'

const bgImg = '/static/game/ui/report/starfield-bg.png'
const starMain = '/static/game/ui/report/star-main.png'
const starCluster = '/static/game/ui/report/star-cluster.png'

const char = computed(() => session.char)
const ending = computed(() => session.ending)
const tags = computed(() => tagCloud())
const cgThumb = computed(() => session.cgUrl)
const barWidth = computed(() => Math.max(8, Math.min(100, session.matchRate)) + '%')

onMounted(() => {
  if (!session.char || !session.ending) {
    uni.reLaunch({ url: '/pages/game/pick/pick' })
  }
})

const showShare = ref(false)
const saveShot = () => {
  showShare.value = true
}

const again = () => {
  resetGame()
  uni.reLaunch({ url: '/pages/game/pick/pick' })
}
</script>

<style scoped>
.report {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #140a26;
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
  background: radial-gradient(120% 80% at 50% 0%, rgba(124, 80, 200, 0.18), rgba(15, 8, 30, 0.55) 70%);
}
.wrap {
  position: relative;
  z-index: 2;
  padding: calc(40rpx + env(safe-area-inset-top)) 40rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  max-width: 750rpx;
  margin: 0 auto;
}

/* 顶部标题 */
.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16rpx 0 34rpx;
}
.title-text {
  font-size: 38rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  color: #f3e9ff;
  text-shadow: 0 0 18rpx rgba(196, 150, 255, 0.9), 0 0 40rpx rgba(150, 110, 255, 0.5);
}
.title-star { width: 44rpx; height: 44rpx; }
.title-star.left { margin-right: 14rpx; }
.title-star.right { margin-left: 14rpx; }

/* 主卡片：霓虹玻璃 */
.card {
  position: relative;
  border-radius: 32rpx;
  padding: 40rpx 36rpx 34rpx;
  background: linear-gradient(160deg, rgba(60, 40, 110, 0.55), rgba(30, 18, 60, 0.62));
  border: 2rpx solid rgba(196, 160, 255, 0.55);
  box-shadow:
    0 0 0 1rpx rgba(255, 150, 230, 0.25),
    0 0 32rpx rgba(170, 110, 255, 0.55),
    inset 0 0 40rpx rgba(150, 110, 255, 0.12);
  backdrop-filter: blur(18rpx);
  -webkit-backdrop-filter: blur(18rpx);
  overflow: hidden;
}
.corner-star {
  position: absolute;
  width: 120rpx;
  height: 120rpx;
  opacity: 0.6;
  pointer-events: none;
}
.corner-star.tl { top: -18rpx; right: 30rpx; }
.corner-star.br { bottom: -10rpx; left: 18rpx; transform: scale(0.8); }

/* 头部 */
.card-head { display: flex; align-items: center; }
.cg-thumb {
  position: relative;
  width: 150rpx;
  height: 150rpx;
  border-radius: 22rpx;
  overflow: hidden;
  border: 2rpx solid rgba(210, 170, 255, 0.8);
  box-shadow: 0 0 22rpx rgba(170, 110, 255, 0.7);
  flex-shrink: 0;
}
.cg-thumb-img { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
.cg-badge {
  position: absolute;
  top: 8rpx; left: 8rpx;
  font-size: 18rpx;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #b06bff, #ff7ec8);
  padding: 2rpx 12rpx;
  border-radius: 10rpx;
  box-shadow: 0 0 10rpx rgba(255, 120, 200, 0.7);
}
.head-meta { margin-left: 24rpx; flex: 1; min-width: 0; }
.with-pill {
  display: inline-block;
  font-size: 22rpx;
  color: #e8dcff;
  background: rgba(120, 90, 190, 0.35);
  border: 1rpx solid rgba(200, 165, 255, 0.5);
  padding: 6rpx 20rpx;
  border-radius: 24rpx;
}
.ending-title {
  display: block;
  margin-top: 14rpx;
  font-size: 64rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  color: #fff;
  text-shadow: 0 0 20rpx rgba(196, 150, 255, 0.85);
  line-height: 1.1;
}

/* 契合度 */
.match {
  margin-top: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.match-num {
  display: flex;
  align-items: baseline;
  line-height: 1;
}
.match-num .num {
  font-size: 132rpx;
  font-weight: 800;
  background: linear-gradient(180deg, #ffd9f0 0%, #ff8fd0 45%, #b06bff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 22rpx rgba(255, 130, 210, 0.6));
}
.match-num .pct {
  font-size: 56rpx;
  font-weight: 800;
  color: #ff9cd9;
  margin-left: 4rpx;
  text-shadow: 0 0 16rpx rgba(255, 130, 210, 0.6);
}
.match-label {
  font-size: 24rpx;
  color: #d8c8ff;
  margin-top: 6rpx;
  letter-spacing: 2rpx;
}
.match-bar {
  margin-top: 26rpx;
  width: 100%;
  height: 22rpx;
  background: rgba(30, 20, 60, 0.7);
  border: 1rpx solid rgba(180, 150, 255, 0.45);
  border-radius: 14rpx;
  box-shadow: inset 0 0 10rpx rgba(0, 0, 0, 0.5);
}
.match-fill {
  position: relative;
  height: 100%;
  border-radius: 14rpx;
  background: linear-gradient(90deg, #6f8bff, #b06bff, #ff8fd0);
  box-shadow: 0 0 16rpx rgba(176, 107, 255, 0.85);
  min-width: 30rpx;
}
.bar-heart {
  position: absolute;
  right: -6rpx;
  top: 50%;
  width: 26rpx;
  height: 24rpx;
  transform: translateY(-50%);
  filter: drop-shadow(0 0 8rpx rgba(255, 143, 208, 0.95));
}
.bar-heart::before,
.bar-heart::after {
  content: '';
  position: absolute;
  top: 0;
  width: 13rpx;
  height: 21rpx;
  border-radius: 14rpx 14rpx 0 0;
  background: #fff;
}
.bar-heart::before { left: 13rpx; transform: rotate(-45deg); transform-origin: 0 100%; }
.bar-heart::after { left: 0; transform: rotate(45deg); transform-origin: 100% 100%; }

/* 标签云 */
.tags { margin-top: 38rpx; text-align: center; }
.tags-label { font-size: 24rpx; color: #d8c8ff; letter-spacing: 2rpx; }
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 22rpx;
}
.tag-chip {
  font-size: 24rpx;
  color: #f0e6ff;
  background: rgba(120, 80, 190, 0.28);
  border: 1rpx solid rgba(210, 160, 255, 0.65);
  padding: 10rpx 26rpx;
  border-radius: 30rpx;
  margin: 0 12rpx 16rpx;
  box-shadow: 0 0 12rpx rgba(170, 110, 255, 0.35);
}

/* 小结 */
.summary {
  margin-top: 14rpx;
  background: rgba(20, 12, 44, 0.55);
  border: 1rpx solid rgba(170, 140, 240, 0.35);
  border-radius: 20rpx;
  padding: 28rpx 26rpx;
}
.summary-text {
  font-size: 27rpx;
  line-height: 1.8;
  color: #e3d7ff;
  font-style: italic;
}
.brand {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  font-size: 20rpx;
  color: #a895d0;
  letter-spacing: 1rpx;
}

/* 底部按钮：半透明磨砂 + 发光描边 */
.btns {
  display: flex;
  gap: 24rpx;
  margin-top: 44rpx;
}
.rbtn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  font-size: 30rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  border-radius: 48rpx;
  padding: 26rpx 0;
  box-sizing: border-box;
  backdrop-filter: blur(14rpx);
  -webkit-backdrop-filter: blur(14rpx);
  transition: transform 0.12s ease;
}
.rbtn:active { transform: scale(0.97); }
.rbtn.ghost {
  color: #ecdfff;
  background: rgba(48, 32, 84, 0.45);
  border: 2rpx solid rgba(200, 160, 255, 0.7);
  box-shadow: 0 0 18rpx rgba(150, 110, 255, 0.45), inset 0 0 16rpx rgba(150, 110, 255, 0.12);
}
.rbtn.replay {
  color: #ffe6f5;
  background: rgba(110, 46, 104, 0.42);
  border: 2rpx solid rgba(255, 150, 210, 0.78);
  box-shadow: 0 0 18rpx rgba(255, 120, 200, 0.5), inset 0 0 16rpx rgba(255, 120, 200, 0.14);
}
.rbtn-tx { line-height: 1; }

/* CSS 绘制图标（跟随文字色 currentColor） */
.ico { position: relative; flex-shrink: 0; }
/* 上传 / 分享：托盘 + 上箭头 */
.ico-upload { width: 34rpx; height: 34rpx; }
.ico-upload::before {
  content: '';
  position: absolute;
  left: 2rpx; right: 2rpx; bottom: 1rpx;
  height: 15rpx;
  border: 4rpx solid currentColor;
  border-top: none;
  border-radius: 0 0 7rpx 7rpx;
}
.ico-upload::after {
  content: '';
  position: absolute;
  left: 50%; top: 5rpx;
  transform: translateX(-50%);
  width: 4rpx; height: 17rpx;
  background: currentColor;
  border-radius: 2rpx;
}
.ico-upload .up-head {
  position: absolute;
  left: 50%; top: 0;
  transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-bottom: 9rpx solid currentColor;
}
/* 刷新：环形缺口 + 箭头 */
.ico-refresh {
  width: 30rpx; height: 30rpx;
  border: 4rpx solid currentColor;
  border-radius: 50%;
  border-right-color: transparent;
  transform: rotate(-45deg);
}
.ico-refresh::after {
  content: '';
  position: absolute;
  top: -4rpx; right: -4rpx;
  width: 0; height: 0;
  border: 7rpx solid transparent;
  border-bottom-color: currentColor;
  transform: rotate(135deg);
}
</style>
