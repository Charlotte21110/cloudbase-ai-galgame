<template>
  <view class="gender">
    <image class="bg" :src="cdnUrl('/static/game/ui/report/starfield-bg.png')" mode="aspectFill" />
    <view class="bg-veil"></view>

    <view class="wrap">
      <!-- 顶部装饰 -->
      <view class="top-deco">
        <view class="star s1"></view>
        <view class="star s2"></view>
        <view class="star s3"></view>
      </view>

      <!-- 主标题 -->
      <text class="title">{{ t('gender.title') }}</text>
      <text class="subtitle">{{ t('gender.subtitle') }}</text>

      <!-- 三选一按钮 -->
      <view class="options">
        <view
          class="opt-card"
          :class="{ selected: selected === 'male' }"
          @click="pick('male')"
        >
          <text class="opt-icon">♂</text>
          <text class="opt-label">{{ t('gender.male') }}</text>
        </view>

        <view
          class="opt-card"
          :class="{ selected: selected === 'female' }"
          @click="pick('female')"
        >
          <text class="opt-icon">♀</text>
          <text class="opt-label">{{ t('gender.female') }}</text>
        </view>

        <view
          class="opt-card"
          :class="{ selected: selected === 'secret' }"
          @click="pick('secret')"
        >
          <text class="opt-icon">🌙</text>
          <text class="opt-label">{{ t('gender.secret') }}</text>
        </view>
      </view>

      <!-- 确认按钮 -->
      <button class="confirm-btn" :disabled="!selected || submitting" @click="submit">
        <text class="btn-text">{{ submitting ? t('gender.submitting') : t('gender.confirmBtn') }}</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import { session, finalize } from '@/game/store'
import { cdnUrl } from '@/game/assets'

const { t } = useI18n()

/** 统计云函数的公开 HTTP 端点（免登录） */
const STATS_FN_URL =
  (import.meta.env.VITE_STATS_FN_URL as string) ||
  'https://newtest-6gzd5kqm6c4eaa2b-1308771514.ap-shanghai.app.tcloudbase.com/galgame-stats'

function requestStatsFn(body: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: STATS_FN_URL,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: body,
      timeout: 10000,
      success: (res) => resolve(res.data),
      fail: (err) => reject(err),
    })
  })
}

const selected = ref<'male' | 'female' | 'secret' | ''>('')
const submitting = ref(false)

onMounted(() => {
  if (!session.char || !session.script) {
    uni.reLaunch({ url: '/pages/game/pick/pick' })
    return
  }
  // 先结算结局（人格由系统硬判，不让用户改）
  finalize()
})

function pick(g: 'male' | 'female' | 'secret') {
  if (submitting.value) return
  selected.value = g
}

async function submit() {
  if (!selected.value || submitting.value) return
  submitting.value = true
  session.gender = selected.value

  // 调用 incStats 云函数上传匿名画像（HTTP 公开端点，免登录）
  try {
    await requestStatsFn({
      action: 'incStats',
      gender: selected.value,
      charId: session.char!.id,
      scriptId: session.script!.id,
      personaId: session.ending!.endingId,
    })
  } catch (e) {
    console.warn('incStats 失败，不影响主流程', e)
  }

  // 跳转到结局页
  uni.redirectTo({ url: '/pages/game/ending/ending' })
}
</script>

<style scoped>
.gender {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #0a0618;
  display: flex;
  justify-content: center;
}
.bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}
.bg-veil {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: radial-gradient(120% 80% at 50% 30%, rgba(124, 80, 200, 0.25), rgba(10, 6, 24, 0.7) 70%);
}

.wrap {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 720rpx;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(60rpx + env(safe-area-inset-top)) 48rpx calc(60rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

/* 装饰星点 */
.top-deco {
  position: absolute;
  top: calc(80rpx + env(safe-area-inset-top));
  left: 0;
  right: 0;
  height: 120rpx;
  pointer-events: none;
}
.star {
  position: absolute;
  border-radius: 50%;
  background: rgba(200, 170, 255, 0.7);
  box-shadow: 0 0 12rpx rgba(200, 170, 255, 0.8);
  animation: twinkle 2s ease-in-out infinite;
}
.s1 { width: 8rpx; height: 8rpx; left: 20%; top: 20rpx; animation-delay: 0s; }
.s2 { width: 6rpx; height: 6rpx; left: 72%; top: 50rpx; animation-delay: 0.7s; }
.s3 { width: 10rpx; height: 10rpx; left: 50%; top: 10rpx; animation-delay: 1.3s; }
@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.6); }
}

.title {
  font-size: 52rpx;
  font-weight: 800;
  letter-spacing: 6rpx;
  background: linear-gradient(135deg, #c79bff, #ff8fd0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2rpx 12rpx rgba(176, 107, 255, 0.5));
}
.subtitle {
  margin-top: 18rpx;
  font-size: 30rpx;
  color: #d4c5f0;
  letter-spacing: 3rpx;
  text-shadow: 0 0 16rpx rgba(196, 150, 255, 0.5);
}

/* 三选一 */
.options {
  margin-top: 64rpx;
  display: flex;
  gap: 28rpx;
  width: 100%;
  justify-content: center;
}
.opt-card {
  flex: 1;
  max-width: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 40rpx 20rpx;
  border-radius: 28rpx;
  background: rgba(38, 28, 72, 0.55);
  border: 2rpx solid rgba(180, 150, 255, 0.35);
  backdrop-filter: blur(16rpx);
  -webkit-backdrop-filter: blur(16rpx);
  box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.35);
  transition: all 0.25s ease;
}
.opt-card:active {
  transform: scale(0.95);
}
.opt-card.selected {
  border-color: rgba(200, 160, 255, 0.9);
  background: rgba(124, 80, 200, 0.45);
  box-shadow: 0 0 32rpx rgba(176, 107, 255, 0.5), 0 8rpx 28rpx rgba(0, 0, 0, 0.35);
  transform: scale(1.05);
}
.opt-icon {
  font-size: 56rpx;
  filter: drop-shadow(0 0 10rpx rgba(255, 180, 240, 0.6));
}
.opt-label {
  font-size: 28rpx;
  font-weight: 700;
  color: #e8ddf8;
  letter-spacing: 2rpx;
}
.opt-card.selected .opt-label {
  color: #fff;
  text-shadow: 0 0 12rpx rgba(200, 160, 255, 0.8);
}

.privacy {
  margin-top: 48rpx;
  font-size: 22rpx;
  color: rgba(200, 180, 230, 0.55);
  text-align: center;
  line-height: 1.6;
}

.confirm-btn {
  margin-top: 48rpx;
  width: 100%;
  max-width: 520rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 30rpx 0;
  border-radius: 52rpx;
  border: none;
  background: linear-gradient(90deg, #9b7bff, #b06bff, #e06bcc);
  box-shadow: 0 10rpx 30rpx rgba(176, 107, 255, 0.45);
  transition: all 0.2s ease;
}
.confirm-btn::after { border: none; }
.confirm-btn:active { transform: scale(0.97); }
.confirm-btn[disabled] {
  opacity: 0.4;
  box-shadow: none;
}
.btn-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2rpx;
}
</style>
