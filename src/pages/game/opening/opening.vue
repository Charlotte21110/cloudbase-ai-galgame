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

      <view class="opening-card prologue-card" v-if="prologue">
        <image class="opening-card-icon doc" :src="cdnUrl('/static/game/ui/opening/doc-icon.png')" mode="aspectFit" />
        <text class="prologue-text">{{ prologue }}</text>
      </view>

      <view class="opening-card tip-card">
        <image class="opening-card-icon sparkle" :src="cdnUrl('/static/game/ui/opening/sparkle-icon.png')" mode="aspectFit" />
        <view class="tip-copy">
          <text class="tip-title">{{ t('opening.introTitle') }}</text>
          <text class="tip-text">{{ tip }}</text>
        </view>
      </view>

      <button class="start-btn" @click="start">{{ t('opening.startBtn') }}</button>
      <text class="back" @click="back">{{ t('opening.backBtn') }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, onMounted } from 'vue'
import { session } from '@/game/store'
import { replaceTokens } from '@/game/engine'
import { faceImg, bgImg, cdnUrl } from '@/game/assets'
import { themeCssVars } from '@/game/theme'

const { t } = useI18n()

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
  background:
    radial-gradient(70% 42% at 50% 28%, rgba(111, 112, 190, 0.12), rgba(7, 11, 24, 0) 70%),
    linear-gradient(180deg, rgba(7, 11, 24, 0.24) 0%, rgba(7, 11, 24, 0.58) 100%);
}
.opening-inner {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(88rpx + env(safe-area-inset-top)) 40rpx calc(64rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.who {
  width: 560rpx;
  display: flex;
  align-items: center;
  margin-bottom: 38rpx;
  align-self: center;
}
.who-avatar {
  width: 124rpx;
  height: 124rpx;
  border-radius: 50%;
  border: 5rpx solid rgba(166, 151, 255, 0.85);
  box-shadow: 0 0 22rpx rgba(144, 130, 255, 0.48), inset 0 0 0 2rpx rgba(255, 255, 255, 0.34);
  flex-shrink: 0;
}
.who-meta { margin-left: 24rpx; max-width: 410rpx; }
.who-name {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.96);
  line-height: 1.15;
  text-shadow: 0 3rpx 12rpx rgba(0, 0, 0, 0.55);
}
.who-tag {
  display: block;
  font-size: 24rpx;
  color: rgba(171, 166, 238, 0.95);
  margin-top: 12rpx;
  line-height: 1.35;
  text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.5);
}
.opening-card {
  width: 640rpx;
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border-radius: 22rpx;
  background: linear-gradient(180deg, rgba(21, 28, 48, 0.78), rgba(17, 25, 44, 0.66));
  border: 2rpx solid rgba(156, 168, 221, 0.36);
  box-shadow:
    0 18rpx 42rpx rgba(2, 7, 18, 0.36),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.09),
    inset 0 -1rpx 0 rgba(138, 152, 214, 0.12);
  backdrop-filter: blur(18rpx);
  -webkit-backdrop-filter: blur(18rpx);
}
.opening-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 22rpx;
  background: radial-gradient(80% 120% at 100% 0%, rgba(118, 132, 202, 0.16), rgba(255, 255, 255, 0) 60%);
  pointer-events: none;
}
.prologue-card {
  min-height: 184rpx;
  padding: 34rpx 34rpx 34rpx 146rpx;
}
.tip-card {
  min-height: 170rpx;
  margin-top: 28rpx;
  padding: 34rpx 34rpx 34rpx 122rpx;
}
.opening-card-icon {
  position: absolute;
  left: 26rpx;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}
.opening-card-icon.doc { width: 82rpx; height: 82rpx; }
.opening-card-icon.sparkle { width: 74rpx; height: 74rpx; }
.tip-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.tip-title {
  display: block;
  font-size: 29rpx;
  line-height: 1.45;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.94);
  text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.45);
}
.tip-text {
  display: block;
  font-size: 24rpx;
  line-height: 1.75;
  color: rgba(188, 188, 242, 0.94);
}
.prologue-text {
  position: relative;
  z-index: 1;
  display: block;
  font-size: 24rpx;
  line-height: 1.78;
  color: rgba(191, 190, 247, 0.96);
}
.start-btn {
  margin-top: 56rpx;
  width: 620rpx;
  min-height: 112rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(100deg, #9368f1 0%, #7864f0 48%, #4d6bf2 100%);
  color: #fff;
  font-size: 34rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
  border: none;
  border-radius: 58rpx;
  padding: 0;
  box-shadow: 0 16rpx 42rpx rgba(76, 96, 242, 0.48), inset 0 2rpx 0 rgba(255,255,255,0.22);
}
.start-btn::after { border: none; }
.start-btn:active { opacity: 0.9; transform: scale(0.98); }
.back {
  margin-top: 30rpx;
  font-size: 24rpx;
  letter-spacing: 1rpx;
  color: rgba(209, 210, 238, 0.82);
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.45);
}
</style>
