<template>
  <view class="login-container">
    <view class="login-header">
      <text class="title">{{ t('passwordLogin.title') }}</text>
      <text class="subtitle">{{ t('passwordLogin.subtitle') }}</text>
    </view>
    
    <view class="login-form">
      <!-- 用户名输入提示 -->
      <view class="input-hint">
        <text class="hint-text">{{ getInputHint() }}</text>
      </view>
      
      <!-- 账号输入 -->
      <view class="input-group">
        <text class="label">{{ t('passwordLogin.accountLabel') }}</text>
        <input 
          class="input-field"
          type="text"
          :placeholder="t('passwordLogin.accountPlaceholder')"
          v-model="username"
          @input="onUsernameInput"
        />
        <view v-if="usernameType" class="input-type-indicator">
          <text class="type-text">{{ usernameType }}</text>
        </view>
      </view>
      
      <!-- 密码输入 -->
      <view class="input-group">
        <text class="label">{{ t('passwordLogin.passwordLabel') }}</text>
        <view class="password-input-container">
          <input 
            class="input-field password-input"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="t('passwordLogin.passwordPlaceholder')"
            v-model="password"
          />
          <button class="toggle-password-btn" @click="togglePassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
        </view>
      </view>
      
      <!-- 登录按钮 -->
      <button 
        class="login-btn"
        :disabled="!canLogin"
        @click="handleLogin"
      >
        {{ loading ? t('passwordLogin.toast.loading') : t('passwordLogin.loginBtn') }}
      </button>
      
      <!-- 快捷链接 -->
      <view class="quick-links">
        <text @click="goToCodeLogin" class="link-text">{{ t('passwordLogin.codeLoginLink') }}</text>
        <text @click="goBack" class="link-text">{{ t('common.back') }}</text>
      </view>
    </view>
  </view>
  <show-captcha />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'
import { signInWithPassword } from '../../utils/cloudbase'

const { t } = useI18n()

// 响应式数据
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const usernameType = ref('')

// 计算属性
const canLogin = computed(() => {
  return username.value.trim().length >= 3 && password.value.length >= 6
})

// 判断用户名类型
const detectUsernameType = (value: string) => {
  if (!value) return ''
  
  if (/^1[3-9]\d{9}$/.test(value)) {
    return t('passwordLogin.typePhone')
  } else if (/^\+\d{1,3}\s\d{4,20}$/.test(value)) {
    return t('passwordLogin.typeIntlPhone')
  } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
    return t('passwordLogin.typeEmail')
  } else if (/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
    return t('passwordLogin.typeUser')
  } else if (value.length >= 3) {
    return t('passwordLogin.typeUser')
  }
  
  return ''
}

// 获取输入提示
const getInputHint = () => {
  if (!username.value) {
    return t('passwordLogin.hintDefault')
  }
  
  switch (usernameType.value) {
    case t('passwordLogin.typePhone'):
      return t('passwordLogin.hintPhone')
    case t('passwordLogin.typeIntlPhone'):
      return t('passwordLogin.hintIntlPhone')
    case t('passwordLogin.typeEmail'):
      return t('passwordLogin.hintEmail')
    case t('passwordLogin.typeUser'):
      return t('passwordLogin.hintUsername')
    default:
      return t('passwordLogin.hintInvalid')
  }
}

// 用户名输入事件
const onUsernameInput = () => {
  usernameType.value = detectUsernameType(username.value.trim())
}

// 切换密码显示
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// 处理登录
const handleLogin = async () => {
  if (!canLogin.value) {
    uni.showToast({
      title: t('passwordLogin.toast.incomplete'),
      icon: 'none'
    })
    return
  }
  
  try {
    loading.value = true
    uni.showLoading({
      title: t('passwordLogin.toast.loading')
    })
    
    const loginResult = await signInWithPassword(username.value.trim(), password.value)
    
    uni.showToast({
      title: t('passwordLogin.toast.success'),
      icon: 'success'
    })
    
    // 延迟跳转到首页
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }, 1500)
    
  } catch (error: any) {
    console.error('登录失败:', error)
    
    // 显示友好的错误信息
    let errorMessage = t('passwordLogin.toast.fail')
    if (error.message) {
      errorMessage = error.message
    }
    
    uni.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 3000
    })
  } finally {
    loading.value = false
    uni.hideLoading()
  }
}

// 跳转到验证码登录
const goToCodeLogin = () => {
  uni.navigateBack()
}

// 返回
const goBack = () => {
  uni.navigateBack()
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
  box-sizing: border-box;
}

.login-header {
  text-align: center;
  margin-bottom: 80rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  line-height: 1.4;
}

.login-form {
  background: white;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.1);
}

.input-hint {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border-left: 6rpx solid #667eea;
}

.hint-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}

.input-group {
  margin-bottom: 40rpx;
  position: relative;
}

.label {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.input-field {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  box-sizing: border-box;
  background: #fafafa;
  transition: all 0.3s ease;
}

.input-field:focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4rpx rgba(102, 126, 234, 0.1);
}

.input-type-indicator {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  margin-top: 14rpx;
}

.type-text {
  font-size: 20rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-weight: 500;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  flex: 1;
  padding-right: 100rpx;
}

.toggle-password-btn {
  position: absolute;
  right: 20rpx;
  width: 60rpx;
  height: 60rpx;
  background: transparent;
  border: none;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 40rpx;
  transition: all 0.3s ease;
}

.login-btn:disabled {
  background: #ccc;
  color: #999;
}

.login-btn:not(:disabled):active {
  background: #5a6fd8;
  transform: translateY(2rpx);
}

.quick-links {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
}

.link-text {
  font-size: 28rpx;
  color: #667eea;
  text-decoration: underline;
}

.loading-mask {
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

.loading-content {
  background: white;
  padding: 40rpx 60rpx;
  border-radius: 12rpx;
  text-align: center;
}

.loading-content text {
  font-size: 28rpx;
  color: #333;
}
</style>