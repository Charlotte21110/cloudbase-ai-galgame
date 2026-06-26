<template>
  <view>
    <uni-popup ref="popup" type="center" :is-mask-click="false">
      <view class="popup-content">
        <view class="captcha-header">
          <text class="title">请完成安全验证</text>
        </view>
        <view class="captcha-body">
          <slot></slot>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
// uni-popup 通过 pages.json 的 easycom 自动引入，无需手动 import
export default {
  name: "show-captcha",
  data() {
    return {
      popup: null,
    };
  },
  methods: {
    open() {
      this.$refs.popup.open();
    },
    close() {
      this.$refs.popup.close();
    },
  },
};
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
