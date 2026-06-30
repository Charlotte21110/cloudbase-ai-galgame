<template>
  <view class="cb-footer">
    <!-- Powered by CloudBase 徽章 -->
    <view class="cb-badge" @click="openToolkit">
      <image
        class="cb-badge-img"
        src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/powered-by-cloudbase-badge.svg"
        mode="heightFix"
      />
    </view>

    <!-- 链接行 -->
    <view class="cb-links">
      <text class="cb-link" @click="showModal = true">作者碎碎念</text>
      <text class="cb-dot">|</text>
      <text class="cb-link" @click="openToolkit">CloudBase AI ToolKit</text>
    </view>

    <!-- 版权 -->
    <text class="cb-copy">© {{ year }} {{ title }} · 基于腾讯云开发构建</text>

    <!-- 弹窗遮罩 -->
    <view class="modal-mask" v-if="showModal" @click="showModal = false">
      <view class="modal-box" @click.stop>
        <text class="modal-title">作者碎碎念</text>
        <view class="memo-content">
          <text class="memo-text">感谢你玩这个游戏！本人是一位最近速成编程糕手的coser少女，平时喜欢玩乙游和旮旯给木，这个文字游戏是我用心打造的agent小项目，里面有混合剧情变体，AI回应，每次的选项将有可能引发不同的故事发展。\n素材均感谢🍌、gpt、wb，可能切图得有点生草，token和服务费用在热爱里持续消耗中😭，希望能每次给你带来不一样的快乐。</text>
          <text class="memo-text">如果有任何建议或问题，欢迎联系我 💌</text>
          <text class="memo-email">charlotte21110@icloud.com</text>
          <text class="memo-text" style="display: flex; justify-content: right;">update: 2026.7.1</text>
        </view>
        <view class="modal-btn" @click="showModal = false">
          <text class="modal-btn-text">关闭</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ title?: string }>()

const year = new Date().getFullYear()
const showModal = ref(false)

const openUrl = (url: string) => {
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
  // #ifndef H5
  uni.setClipboardData({ data: url, success: () => uni.showToast({ title: '链接已复制', icon: 'none' }) })
  // #endif
}

const openToolkit = () => openUrl('https://github.com/TencentCloudBase/CloudBase-AI-ToolKit')
</script>

<style scoped>
.cb-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0 36rpx;
}
.cb-badge { line-height: 0; cursor: pointer; }
.cb-badge-img {
  height: 44rpx;
  width: 240rpx;
}
.cb-links {
  display: flex;
  align-items: center;
  margin-top: 22rpx;
}
.cb-link {
  font-size: 24rpx;
  color: #6b8afd;
  font-weight: 600;
  cursor: pointer;
}
.cb-dot {
  font-size: 22rpx;
  color: #c4bcd0;
  margin: 0 16rpx;
}
.cb-copy {
  margin-top: 18rpx;
  font-size: 22rpx;
  color: #a89db3;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-box {
  width: 580rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 32rpx;
}

.memo-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  width: 100%;
}

.memo-text {
  font-size: 28rpx;
  color: #555;
  line-height: 1.6;
}

.memo-email {
  font-size: 26rpx;
  color: #6b8afd;
  margin-top: 12rpx;
  font-weight: 500;
}

.modal-btn {
  margin-top: 40rpx;
  padding: 16rpx 80rpx;
  background: #6b8afd;
  border-radius: 40rpx;
  cursor: pointer;
}

.modal-btn:active {
  opacity: 0.8;
}

.modal-btn-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}
</style>
