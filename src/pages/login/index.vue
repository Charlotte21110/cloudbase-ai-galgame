<template>
  <view class="login-container">
    <view class="login-header">
      <text class="title">{{ t('login.title') }}</text>
      <text class="subtitle">{{ t('login.subtitle') }}</text>
    </view>
    
    <view class="login-options">
      <!-- 匿名登录 -->
      <view class="login-option" @click="anonymousLogin">
        <view class="option-icon">👤</view>
        <view class="option-content">
          <text class="option-title">{{ t('login.anonymous.title') }}</text>
          <text class="option-desc">{{ t('login.anonymous.desc') }}</text>
        </view>
        <view class="option-arrow">></view>
      </view>

      <!-- 微信 OpenID 登录 -->
      <view class="login-option" @click="openIdLogin">
        <view class="option-icon">💬</view>
        <view class="option-content">
          <text class="option-title">{{ t('login.openid.title') }}</text>
          <text class="option-desc">{{ t('login.openid.desc') }}</text>
        </view>
        <view class="option-arrow">></view>
      </view>

      <!-- 微信小程序手机号授权登录 -->
      <button 
        open-type="getPhoneNumber" 
        @getphonenumber="handleGetPhoneNumber"
        class="login-option-button"
      >
        <view class="option-icon">📞</view>
        <view class="option-content">
          <text class="option-title">{{ t('login.phoneAuth.title') }}</text>
          <text class="option-desc">{{ t('login.phoneAuth.desc') }}</text>
        </view>
        <view class="option-arrow">></view>
      </button>
      
      <!-- 手机验证码登录 -->
      <view class="login-option" @click="phoneLogin">
        <view class="option-icon">📱</view>
        <view class="option-content">
          <text class="option-title">{{ t('login.phone.title') }}</text>
          <text class="option-desc">{{ t('login.phone.desc') }}</text>
        </view>
        <view class="option-arrow">></view>
      </view>

      <!-- 密码登录 -->
      <view class="login-option" @click="passwordLogin">
        <view class="option-icon">🔐</view>
        <view class="option-content">
          <text class="option-title">{{ t('login.password.title') }}</text>
          <text class="option-desc">{{ t('login.password.desc') }}</text>
        </view>
        <view class="option-arrow">></view>
      </view>
      
      <!-- 邮箱验证码登录 -->
      <view class="login-option" @click="emailLogin">
        <view class="option-icon">📧</view>
        <view class="option-content">
          <text class="option-title">{{ t('login.email.title') }}</text>
          <text class="option-desc">{{ t('login.email.desc') }}</text>
        </view>
        <view class="option-arrow">></view>
      </view>
    </view>
    
    <view class="footer-text">
      <text>{{ t('login.footer.prefix') }}</text>
      <text class="link-text">{{ t('login.footer.terms') }}</text>
      <text>{{ t('login.footer.and') }}</text>
      <text class="link-text">{{ t('login.footer.privacy') }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { initCloudBase, signInWithPhoneAuth, signInWithOpenId, login } from '../../utils/cloudbase'

const { t } = useI18n()

// 匿名登录
const anonymousLogin = async () => {
  try {
    uni.showLoading({
      title: t('login.toast.loading')
    })
    
    // 使用现有的初始化函数，若没登录会自动进行匿名登录
    await login()
    
    uni.hideLoading()
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/index/index'
      })
    }, 1000)
  } catch (error: unknown) {
    uni.hideLoading()
    uni.showToast({
      title: (error as Error)?.message || t('login.toast.fail'),
      icon: 'none'
    })
  }
}

// 添加 openIdLogin 方法
const openIdLogin = async () => {
  uni.showLoading({
    title: t('login.toast.loggingIn')
  })

  try {
    const loginResult = await signInWithOpenId()
    console.log('微信 OpenID 登录成功:', loginResult)
    uni.hideLoading()

    uni.showToast({
      title: t('login.toast.success'),
      icon: 'success'
    })
    // 登录成功后，跳转到首页并关闭所有历史页面
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/index/index'
      })
    }, 1000)

  } catch (error: unknown) {
    uni.hideLoading()
    console.error('微信 OpenID 登录失败:', error)
    uni.showToast({
      title: (error as Error)?.message || t('login.toast.retry'),
      icon: 'none'
    })
  }
}

// 微信小程序手机号授权登录
const handleGetPhoneNumber = async (event: any) => {
  // console.log("event:", event)
  if(!event.detail.code){
    console.error('获取手机号失败:', event.detail.errMsg)
    uni.showToast({
      title: t('login.toast.phoneFail'),
      icon: 'none'
    })
    return
  }
  console.log('获取到动态令牌(code):', event.detail.code)
  uni.showLoading({
    title: t('login.toast.loading')
  })
  try {
    // 手机号授权登录
    const loginResult = await signInWithPhoneAuth( event.detail.code )
    console.log('手机号授权登录结果:', loginResult)
    uni.hideLoading()
    uni.showToast({
      title: t('login.toast.success'),
      icon: 'success'
    })
    // 延迟跳转到首页
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/index/index'
      })
    }, 1000)

  }catch (error: unknown) {
    // 处理登录失败
    console.error('手机号授权登录失败:', error)
    uni.showToast({
      title: (error as Error)?.message || t('login.toast.fail'),
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}

// 密码登录
const passwordLogin = () => {
  uni.navigateTo({
    url: '/pages/login/password-login'
  })
}

// 手机验证码登录
const phoneLogin = () => {
  uni.navigateTo({
    url: '/pages/login/phone-login'
  })
}

// 邮箱验证码登录
const emailLogin = () => {
  uni.navigateTo({
    url: '/pages/login/email-login'
  })
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
}

.login-options {
  background: white;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 60rpx;
}

.login-option {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.3s;
}

.login-option:last-child {
  border-bottom: none;
}

.login-option:active {
  background-color: #f8f9fa;
}

.login-option-button {
  /* 复制 .login-option 的样式 */
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.3s;
  /* 重置 button 的默认样式 */
  background-color: white;
  border-radius: 0;
  margin: 0;
  line-height: 1.4;
  text-align: left;
}

.login-option-button::after {
  border: none; /* 移除按钮的默认边框 */
}

.login-option-button:active {
  background-color: #f8f9fa;
}

.option-icon {
  font-size: 48rpx;
  margin-right: 30rpx;
  width: 80rpx;
  text-align: center;
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.option-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.option-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.option-arrow {
  font-size: 32rpx;
  color: #ccc;
  font-weight: bold;
}

.footer-text {
  text-align: center;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

.link-text {
  color: white;
  text-decoration: underline;
}
</style>
