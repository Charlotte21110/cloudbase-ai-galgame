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
      <text class="cb-link" @click="showModal = true">{{ t('cloudbaseFooter.authorNote') }}</text>
      <text class="cb-dot">|</text>
      <text class="cb-link" @click="openToolkit">CloudBase AI ToolKit</text>
    </view>

    <!-- 版权 -->
    <text class="cb-copy">{{ t('cloudbaseFooter.copyright', { year, title: title || '' }) }}</text>

    <!-- 弹窗遮罩 -->
    <view class="modal-mask" v-if="showModal" @click="showModal = false">
      <view class="modal-box" @click.stop>
        <text class="modal-title">{{ t('cloudbaseFooter.modalTitle') }}</text>
        <view class="memo-content">
          <text class="memo-text">{{ t('cloudbaseFooter.memoText') }}</text>
          <text class="memo-text">{{ t('cloudbaseFooter.memoTip') }}</text>
          <text class="memo-email">charlotte21110@icloud.com</text>
          <text class="memo-text" style="display: flex; justify-content: right;">update: 2026.7.1</text>
        </view>
        <view class="modal-btn" @click="showModal = false">
          <text class="modal-btn-text">{{ t('cloudbaseFooter.closeBtn') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

const { t } = useI18n()

defineProps<{ title?: string }>()

const year = new Date().getFullYear()
const showModal = ref(false)

const openUrl = (url: string) => {
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
  // #ifndef H5
  uni.setClipboardData({ data: url, success: () => uni.showToast({ title: t('cloudbaseFooter.toastLinkCopied'), icon: 'none' }) })
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
