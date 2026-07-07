<template>
  <view>
    <uni-popup ref="popup" type="center" :is-mask-click="false">
      <view class="popup-content">
        <view class="captcha-header">
          <text class="title">{{ t('captcha.title') }}</text>
        </view>
        <view class="captcha-body">
          <slot></slot>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const popup = ref<any>(null)

const open = () => {
  popup.value?.open()
}

const close = () => {
  popup.value?.close()
}

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
.popup-content {
  padding: 40rpx;
  background: #fff;
  border-radius: 24rpx;
}

.captcha-header {
  margin-bottom: 24rpx;

  .title {
    font-size: 32rpx;
    font-weight: bold;
  }
}
</style>
