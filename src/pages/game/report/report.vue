<template>
  <view class="report" :style="themeVars">
    <view class="report-bg"></view>

    <view class="card">
      <view class="card-head">
        <image class="card-avatar" :src="cgThumb" mode="aspectFill" />
        <view class="card-head-meta">
          <text class="card-with">与 {{ char?.name }} · 长夜档案</text>
          <text class="card-ending">{{ ending?.title }}</text>
        </view>
      </view>

      <!-- 契合度 -->
      <view class="match">
        <text class="match-num">{{ session.matchRate }}<text class="match-pct">%</text></text>
        <text class="match-label">灵魂契合度</text>
        <view class="match-bar"><view class="match-fill" :style="{ width: session.matchRate + '%' }"></view></view>
      </view>

      <!-- 标签云 -->
      <view class="tags">
        <text class="tags-label">你的关系人格画像</text>
        <view class="tag-cloud">
          <text v-for="(t, i) in tags" :key="i" class="tag-chip">{{ t }}</text>
          <text v-if="!tags.length" class="tag-chip">神秘玩家</text>
        </view>
      </view>

      <!-- 小结 -->
      <view class="summary">
        <text class="summary-text">{{ session.aiReport }}</text>
      </view>

      <view class="brand">辰星 · 长夜文游 · {{ char?.style === 'anime' ? '新海诚画风' : '电影写实风' }}</view>
    </view>

    <view class="btns">
      <button class="rbtn ghost" @click="saveShot">保存 / 分享</button>
      <button class="rbtn primary" @click="again">再玩一次 ↻</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { session, tagCloud, resetGame } from '@/game/store'
import { themeCssVars } from '@/game/theme'

const char = computed(() => session.char)
const ending = computed(() => session.ending)
const tags = computed(() => tagCloud())
const cgThumb = computed(() => session.cgUrl)
const themeVars = computed(() => (char.value ? themeCssVars(char.value.themeKey) : {}))

onMounted(() => {
  if (!session.char || !session.ending) {
    uni.reLaunch({ url: '/pages/game/pick/pick' })
  }
})

// 保存图片：阶段4 接 html2canvas / canvas 导出（见进度文档）。当前给出引导。
const saveShot = () => {
  uni.showToast({ title: '长按页面截图即可保存分享 💗', icon: 'none', duration: 2200 })
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
  padding: 60rpx 40rpx;
  box-sizing: border-box;
  background: var(--c-bg);
}
.report-bg {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 0%, var(--c-soft), var(--c-bg) 70%);
}
.card {
  position: relative;
  z-index: 2;
  background: #fff;
  border-radius: 28rpx;
  padding: 36rpx 34rpx;
  box-shadow: 0 16rpx 44rpx rgba(0,0,0,0.12);
}
.card-head { display: flex; align-items: center; }
.card-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 20rpx;
  border: 4rpx solid var(--c-soft);
}
.card-head-meta { margin-left: 22rpx; }
.card-with { display: block; font-size: 24rpx; color: #a89db3; }
.card-ending {
  display: block;
  margin-top: 8rpx;
  font-size: 40rpx;
  font-weight: 800;
  color: var(--c-deep);
}
.match {
  margin-top: 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.match-num { font-size: 92rpx; font-weight: 800; color: var(--c-primary); line-height: 1; }
.match-pct { font-size: 40rpx; }
.match-label { font-size: 24rpx; color: #a89db3; margin-top: 8rpx; }
.match-bar {
  margin-top: 18rpx;
  width: 100%;
  height: 18rpx;
  background: var(--c-soft);
  border-radius: 12rpx;
  overflow: hidden;
}
.match-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--c-primary), var(--c-up));
  border-radius: 12rpx;
}
.tags { margin-top: 36rpx; }
.tags-label { font-size: 24rpx; color: #a89db3; }
.tag-cloud { display: flex; flex-wrap: wrap; margin-top: 16rpx; }
.tag-chip {
  font-size: 24rpx;
  color: var(--c-deep);
  background: var(--c-soft);
  padding: 8rpx 22rpx;
  border-radius: 24rpx;
  margin: 0 14rpx 14rpx 0;
}
.summary {
  margin-top: 30rpx;
  background: var(--c-bg);
  border-radius: 18rpx;
  padding: 24rpx;
}
.summary-text { font-size: 26rpx; line-height: 1.7; color: var(--c-text); }
.brand {
  margin-top: 30rpx;
  text-align: center;
  font-size: 20rpx;
  color: #c4bcd0;
}
.btns {
  position: relative;
  z-index: 2;
  display: flex;
  margin-top: 44rpx;
}
.rbtn {
  flex: 1;
  font-size: 28rpx;
  font-weight: 700;
  border-radius: 48rpx;
  padding: 22rpx 0;
  border: none;
}
.rbtn.ghost {
  background: #fff;
  color: var(--c-deep);
  margin-right: 20rpx;
  border: 2rpx solid var(--c-soft);
}
.rbtn.primary {
  background: linear-gradient(90deg, var(--c-primary), var(--c-deep));
  color: #fff;
}
</style>
