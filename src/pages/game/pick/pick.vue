<template>
  <view class="pick">
    <view class="pick-header">
      <text class="pick-title">群星不眠之夜</text>
      <text class="pick-sub">长夜将至 · 在抉择中照见你的关系人格 · 选一位同行者</text>
    </view>

    <!-- 男生线 -->
    <view class="line-block">
      <view class="line-head">
        <text class="line-emoji">💙</text>
        <text class="line-name">男生线</text>
        <text class="line-tip">高富帅 / 竹马 / 精英</text>
      </view>
      <view class="card-row">
        <view
          v-for="c in males"
          :key="c.id"
          class="char-card"
          @click="choose(c.id)"
        >
          <view class="avatar-wrap">
            <image class="avatar" :src="avatar(c)" mode="aspectFill" />
            <text class="style-badge" :class="c.style">{{ c.style === 'anime' ? '✨二次元' : '📷写实' }}</text>
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
        <text class="line-emoji">💗</text>
        <text class="line-name">女生线</text>
        <text class="line-tip">大女主 / 萌妹 / 御姐</text>
      </view>
      <view class="card-row">
        <view
          v-for="c in females"
          :key="c.id"
          class="char-card"
          @click="choose(c.id)"
        >
          <view class="avatar-wrap">
            <image class="avatar" :src="avatar(c)" mode="aspectFill" />
            <text class="style-badge" :class="c.style">{{ c.style === 'anime' ? '✨二次元' : '📷写实' }}</text>
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
</template>

<script setup lang="ts">
import { MALE_CHARACTERS, FEMALE_CHARACTERS } from '@/game/data/characters'
import { faceImg } from '@/game/assets'
import { startGame } from '@/game/store'
import type { Character } from '@/game/types'

const males = MALE_CHARACTERS
const females = FEMALE_CHARACTERS

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
  min-height: 100vh;
  padding: 48rpx 28rpx 60rpx;
  box-sizing: border-box;
  background: linear-gradient(160deg, #fff5f8 0%, #f6f4fc 55%, #efeaff 100%);
}
.pick-header {
  text-align: center;
  margin-bottom: 44rpx;
}
.pick-title {
  display: block;
  font-size: 52rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  background: linear-gradient(90deg, #ff7ea8, #7c6fe0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.pick-sub {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #8a8398;
}
.line-block {
  margin-bottom: 40rpx;
}
.line-head {
  display: flex;
  align-items: center;
  margin: 0 6rpx 22rpx;
}
.line-emoji { font-size: 32rpx; }
.line-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #3a2a40;
  margin: 0 14rpx 0 8rpx;
}
.line-tip {
  font-size: 22rpx;
  color: #b0a8bd;
}
.card-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.char-card {
  width: 31.5%;
  background: #ffffff;
  border-radius: 22rpx;
  padding: 12rpx 12rpx 18rpx;
  margin-bottom: 22rpx;
  box-shadow: 0 8rpx 24rpx rgba(124, 111, 224, 0.12);
  box-sizing: border-box;
  transition: transform 0.15s ease;
}
.char-card:active { transform: scale(0.96); }
.avatar-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 16rpx;
  overflow: hidden;
  background: #f1edf9;
}
.avatar { width: 100%; height: 100%; }
.style-badge {
  position: absolute;
  left: 8rpx;
  top: 8rpx;
  font-size: 18rpx;
  padding: 4rpx 10rpx;
  border-radius: 20rpx;
  color: #fff;
}
.style-badge.anime { background: rgba(124, 111, 224, 0.9); }
.style-badge.real { background: rgba(224, 77, 128, 0.9); }
.char-name {
  display: block;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #3a2a40;
  margin-top: 12rpx;
}
.persona-chip {
  display: flex;
  justify-content: center;
  margin: 8rpx 0;
}
.persona-chip text {
  font-size: 18rpx;
  color: #9a86d8;
  background: #f0ecfb;
  padding: 3rpx 12rpx;
  border-radius: 20rpx;
}
.char-tagline {
  display: block;
  text-align: center;
  font-size: 19rpx;
  color: #a89db3;
  line-height: 1.4;
  min-height: 52rpx;
}
.pick-foot {
  text-align: center;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #b3abc0;
}
</style>
