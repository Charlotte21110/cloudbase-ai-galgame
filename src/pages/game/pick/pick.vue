<template>
  <view class="pick">
    <!-- 星空背景 -->
    <image class="pick-bg" :src="starryBg" mode="aspectFill" />
    <view class="pick-bg-mask"></view>

    <view class="pick-inner">
      <view class="pick-header">
        <image class="pick-title-art" :src="titleArt" mode="widthFix" />
        <text class="pick-sub">长夜将至 · 在抉择中照见你的关系人格 · 选一位同行者</text>
      </view>

      <!-- 男生线 -->
      <view class="line-block">
        <view class="line-head">
          <view class="line-gem male"></view>
          <text class="line-name">男生线</text>
          <text class="line-tip">高富帅 / 竹马 / 精英</text>
        </view>
        <view class="card-row">
          <view
            v-for="c in males"
            :key="c.id"
            class="char-card male"
            @click="choose(c.id)"
          >
            <view class="avatar-wrap">
              <image class="avatar" :src="avatar(c)" mode="aspectFill" />
              <text class="style-badge" :class="c.style">{{ c.style === 'anime' ? '二次元' : '写实' }}</text>
            </view>
            <text class="char-name">{{ c.name }}</text>
            <view class="persona-chip"><text>{{ shortPersona(c.persona) }}</text></view>
            <text class="char-tagline">「{{ c.tagline }}」</text>
          </view>
        </view>
      </view>

      <!-- 女生线 -->
      <view class="line-block">
        <view class="line-head">
          <view class="line-gem female"></view>
          <text class="line-name">女生线</text>
          <text class="line-tip">大女主 / 萌妹 / 御姐</text>
        </view>
        <view class="card-row">
          <view
            v-for="c in females"
            :key="c.id"
            class="char-card female"
            @click="choose(c.id)"
          >
            <view class="avatar-wrap">
              <image class="avatar" :src="avatar(c)" mode="aspectFill" />
              <text class="style-badge" :class="c.style">{{ c.style === 'anime' ? '二次元' : '写实' }}</text>
            </view>
            <text class="char-name">{{ c.name }}</text>
            <view class="persona-chip"><text>{{ shortPersona(c.persona) }}</text></view>
            <text class="char-tagline">「{{ c.tagline }}」</text>
          </view>
        </view>
      </view>

      <view class="pick-foot">
        <text>点一张卡 → 选对象（画风随 TA 而定）→ 开始你们的故事</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { MALE_CHARACTERS, FEMALE_CHARACTERS } from '@/game/data/characters'
import { faceImg } from '@/game/assets'
import { startGame } from '@/game/store'
import type { Character } from '@/game/types'

const males = MALE_CHARACTERS
const females = FEMALE_CHARACTERS

const starryBg = '/static/game/ui/starry-bg.png'
const titleArt = '/static/game/ui/title-art.png'

const avatar = (c: Character) => faceImg(c.style, c.id, 'happy')

const shortPersona = (p: string) => {
  // 取人设第一个短语作为标签
  const seg = p.split(/[，,、]/)[0]
  return seg.length > 8 ? seg.slice(0, 8) : seg
}

const choose = (id: string) => {
  if (startGame(id)) {
    uni.navigateTo({ url: '/pages/game/opening/opening' })
  } else {
    uni.showToast({ title: '角色加载失败', icon: 'none' })
  }
}
</script>

<style scoped>
.pick {
  position: relative;
  min-height: 100vh;
  background: #0c0a1c;
}
/* 星空背景：固定铺满，随页面滚动盖在底层 */
.pick-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}
.pick-bg-mask {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: linear-gradient(180deg, rgba(12, 10, 28, 0.35) 0%, rgba(12, 10, 28, 0.55) 50%, rgba(12, 10, 28, 0.78) 100%);
}
.pick-inner {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 750rpx;
  margin: 0 auto;
  padding: 56rpx 28rpx 70rpx;
  box-sizing: border-box;
}
.pick-header {
  text-align: center;
  margin-bottom: 48rpx;
}
.pick-title-art {
  width: 70%;
  max-width: 460rpx;
}
.pick-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #b9b0d8;
  letter-spacing: 1rpx;
}
.line-block {
  margin-bottom: 44rpx;
}
.line-head {
  display: flex;
  align-items: center;
  margin: 0 6rpx 24rpx;
}
/* 用菱形宝石代替 emoji */
.line-gem {
  width: 22rpx;
  height: 22rpx;
  border-radius: 6rpx;
  transform: rotate(45deg);
  margin-right: 16rpx;
}
.line-gem.male {
  background: linear-gradient(135deg, #74b6ff, #5b7bff);
  box-shadow: 0 0 14rpx rgba(91, 123, 255, 0.8);
}
.line-gem.female {
  background: linear-gradient(135deg, #ff9ad2, #ff6fb0);
  box-shadow: 0 0 14rpx rgba(255, 111, 176, 0.8);
}
.line-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #f3effa;
  margin-right: 16rpx;
  letter-spacing: 2rpx;
}
.line-tip {
  font-size: 22rpx;
  color: #8d85ad;
}
.card-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.char-card {
  width: 31.5%;
  border-radius: 22rpx;
  padding: 12rpx 12rpx 18rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
  background: rgba(46, 38, 84, 0.42);
  border: 1rpx solid rgba(154, 139, 255, 0.28);
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.4), inset 0 1rpx 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.char-card.male { border-color: rgba(110, 168, 255, 0.32); }
.char-card.female { border-color: rgba(255, 143, 199, 0.32); }
.char-card:active {
  transform: scale(0.96);
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.5);
}
.avatar-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 16rpx;
  overflow: hidden;
  background: rgba(20, 16, 40, 0.6);
}
.avatar { width: 100%; height: 100%; }
.style-badge {
  position: absolute;
  left: 8rpx;
  top: 8rpx;
  font-size: 18rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  color: #fff;
  backdrop-filter: blur(4rpx);
}
.style-badge.anime { background: rgba(124, 111, 224, 0.85); }
.style-badge.real { background: rgba(224, 77, 128, 0.85); }
.char-name {
  display: block;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #f3effa;
  margin-top: 14rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
}
.persona-chip {
  display: flex;
  justify-content: center;
  margin: 8rpx 0;
}
.persona-chip text {
  font-size: 18rpx;
  color: #cbbfff;
  background: rgba(124, 111, 224, 0.22);
  border: 1rpx solid rgba(154, 139, 255, 0.3);
  padding: 3rpx 14rpx;
  border-radius: 20rpx;
}
.char-tagline {
  display: block;
  text-align: center;
  font-size: 19rpx;
  color: #a79fc2;
  line-height: 1.4;
  min-height: 52rpx;
}
.pick-foot {
  text-align: center;
  margin-top: 18rpx;
  font-size: 22rpx;
  color: #8d85ad;
}
</style>
