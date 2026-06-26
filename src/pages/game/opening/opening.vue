<template>
  <view class="opening" :style="themeVars">
    <image v-if="bg" class="bg" :src="bg" mode="aspectFill" />
    <view class="mask"></view>

    <view class="opening-inner">
      <view class="who">
        <image class="who-avatar" :src="avatar" mode="aspectFill" />
        <view class="who-meta">
          <text class="who-name">{{ char?.name }}</text>
          <text class="who-tag">{{ char?.tagline }}</text>
        </view>
      </view>

      <view class="tip-card">
        <text v-if="prologue" class="prologue-text">{{ prologue }}</text>
        <view v-if="prologue" class="tip-divider"></view>
        <text class="tip-text">{{ tip }}</text>
      </view>

      <button class="start-btn" @click="start">走进长夜 →</button>
      <text class="back" @click="back">← 换一个同行者</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { session } from '@/game/store'
import { replaceTokens } from '@/game/engine'
import { faceImg, bgImg } from '@/game/assets'
import { themeCssVars } from '@/game/theme'

const char = computed(() => session.char)

onMounted(() => {
  if (!session.char || !session.script) {
    uni.reLaunch({ url: '/pages/game/pick/pick' })
  }
})

const themeVars = computed(() => (char.value ? themeCssVars(char.value.themeKey) : {}))
const avatar = computed(() => (char.value ? faceImg(char.value.style, char.value.id, 'happy') : ''))
const bg = computed(() => {
  const s = session.script
  if (!char.value || !s) return ''
  const startNode = s.nodes.find((n) => n.id === s.start)
  const key = startNode?.sceneKey || 'office_night'
  return bgImg(char.value.style, key)
})
const tip = computed(() =>
  session.script ? replaceTokens(session.script.openingTip, session.char) : ''
)
const prologue = computed(() =>
  session.script?.prologue ? replaceTokens(session.script.prologue, session.char) : ''
)

const start = () => {
  uni.redirectTo({ url: '/pages/game/play/play' })
}
const back = () => {
  uni.reLaunch({ url: '/pages/game/pick/pick' })
}
</script>

<style scoped>
.opening {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}
.bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%);
}
.opening-inner {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 48rpx;
  box-sizing: border-box;
}
.who {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.85);
  border-radius: 40rpx;
  padding: 12rpx 28rpx 12rpx 12rpx;
  margin-bottom: 48rpx;
}
.who-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  border: 4rpx solid var(--c-soft);
}
.who-meta { margin-left: 16rpx; max-width: 460rpx; }
.who-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--c-text);
}
.who-tag {
  display: block;
  font-size: 20rpx;
  color: var(--c-deep);
  margin-top: 4rpx;
}
.tip-card {
  background: rgba(255,255,255,0.94);
  border-radius: 28rpx;
  padding: 40rpx 36rpx;
  box-shadow: 0 12rpx 40rpx rgba(0,0,0,0.18);
}
.tip-text {
  font-size: 30rpx;
  line-height: 1.7;
  color: var(--c-text);
}
.prologue-text {
  display: block;
  font-size: 26rpx;
  line-height: 1.8;
  color: var(--c-deep);
  font-style: italic;
}
.tip-divider {
  height: 2rpx;
  background: var(--c-soft);
  margin: 22rpx 0;
}
.start-btn {
  margin-top: 56rpx;
  width: 70%;
  background: linear-gradient(90deg, var(--c-primary), var(--c-deep));
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  border-radius: 48rpx;
  padding: 24rpx 0;
  box-shadow: 0 10rpx 28rpx rgba(0,0,0,0.25);
}
.start-btn:active { opacity: 0.9; }
.back {
  margin-top: 30rpx;
  font-size: 24rpx;
  color: rgba(255,255,255,0.9);
}
</style>
