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
      <text class="cb-link" @click="openCloudbase">云开发 CloudBase</text>
      <text class="cb-dot">|</text>
      <text class="cb-link" @click="openToolkit">CloudBase AI ToolKit</text>
    </view>

    <!-- 版权 -->
    <text class="cb-copy">© {{ year }} {{ title }} · 基于腾讯云开发构建</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineProps<{ title?: string }>()

const year = new Date().getFullYear()

const openUrl = (url: string) => {
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
  // #ifndef H5
  uni.setClipboardData({ data: url, success: () => uni.showToast({ title: '链接已复制', icon: 'none' }) })
  // #endif
}

const openCloudbase = () => openUrl('https://tcb.cloud.tencent.com/')
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
</style>
