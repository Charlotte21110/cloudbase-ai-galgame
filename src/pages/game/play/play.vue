<template>
  <view class="play" :class="{ shake: shaking }" :style="themeVars">
    <image v-if="bg" class="bg" :src="bg" mode="aspectFill" />
    <view class="bg-mask"></view>

    <!-- 顶部：角色名 + 当前幕 -->
    <view class="hud">
      <view class="hud-chip">
        <text class="hud-name">{{ char?.name }}</text>
        <text class="hud-step">第 {{ stepNo }} 幕</text>
      </view>
    </view>

    <!-- 侧边羁绊竖条 -->
    <view class="affinity">
      <text class="affinity-num" :class="{ bump: bumping }">{{ session.score }}</text>
      <view class="affinity-track">
        <view class="affinity-fill" :style="{ height: session.score + '%' }"></view>
      </view>
      <text class="affinity-label">羁绊</text>
    </view>

    <!-- 飘分 / 心形粒子 -->
    <view v-if="deltaText" class="delta" :class="deltaClass">{{ deltaText }}</view>
    <view v-if="showHearts" class="hearts">
      <text v-for="i in 6" :key="i" class="heart" :style="heartStyle(i)">💗</text>
    </view>

    <!-- 立绘：贴底，从底部升起，下部由对话框自然覆盖 -->
    <view v-if="portrait" class="portrait-wrap" :class="{ in: portraitIn }">
      <image class="portrait-img" :src="portrait" mode="aspectFill" />
    </view>

    <!-- 对话框 / 操作区 -->
    <view class="dock">
      <!-- 情境 / 旁白 -->
      <view v-if="phase === 'scene' || phase === 'narration'" class="bubble narr">
        <text class="narr-label">{{ phase === 'narration' ? '旁白' : '' }}</text>
        <text class="narr-text">{{ typed }}</text>
      </view>

      <!-- TA 回应 -->
      <view v-else-if="phase === 'react' || phase === 'reacting'" class="bubble line">
        <text class="speaker">{{ char?.name }}</text>
        <text class="line-text">{{ phase === 'reacting' ? '……' : typed }}</text>
        <text v-if="phase === 'react' && os" class="os-text">（{{ os }}）</text>
      </view>

      <!-- 开放题题面 -->
      <view v-else-if="phase === 'open'" class="bubble narr">
        <text class="narr-text">{{ typed }}</text>
      </view>

      <!-- 操作区 -->
      <view class="actions">
        <!-- 选择题选项 -->
        <template v-if="phase === 'scene' && node?.type === 'choice' && sceneDone">
          <button
            v-for="(opt, idx) in options"
            :key="idx"
            class="opt-btn"
            @click="pickOption(opt)"
          >{{ txt(opt.text) }}</button>
        </template>

        <!-- 开放题输入 -->
        <template v-else-if="phase === 'open' && sceneDone">
          <textarea
            class="open-input"
            v-model="openText"
            :maxlength="100"
            placeholder="写下你最想说的那句话…（≤100字）"
            :adjust-position="true"
          />
          <view class="open-row">
            <text class="open-count">{{ openText.length }}/100</text>
            <button class="opt-btn primary" :disabled="!openText.trim()" @click="submitOpen">说出口</button>
          </view>
        </template>

        <!-- 继续 -->
        <template v-else-if="phase === 'react' && reactDone">
          <button class="opt-btn primary" @click="nextStep">继续 →</button>
        </template>
        <template v-else-if="phase === 'narration' && sceneDone">
          <button class="opt-btn primary" @click="afterNarration">继续 →</button>
        </template>

        <!-- 加载态 -->
        <view v-else-if="phase === 'reacting'" class="loading">TA 正在回应…</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  session,
  currentNode,
  currentVariant,
  applyChoice,
  advance,
  isOpenNode,
} from '@/game/store'
import { replaceTokens } from '@/game/engine'
import { faceImg, bgImg } from '@/game/assets'
import { themeCssVars } from '@/game/theme'
import { aiLine, aiOpenLine } from '@/game/ai'
import type { ScriptOption } from '@/game/types'

type Phase = 'scene' | 'reacting' | 'react' | 'narration' | 'open'

const char = computed(() => session.char)
const node = computed(() => currentNode())
const variant = computed(() => currentVariant())

const phase = ref<Phase>('scene')
const typed = ref('')
const os = ref('')
const sceneDone = ref(false)
const reactDone = ref(false)
const openText = ref('')
const portraitIn = ref(true)

// 视觉反馈
const deltaText = ref('')
const deltaClass = ref('')
const showHearts = ref(false)
const bumping = ref(false)
const shaking = ref(false)

const themeVars = computed(() => (char.value ? themeCssVars(char.value.themeKey) : {}))
const bg = computed(() =>
  char.value && variant.value ? bgImg(char.value.style, variant.value.sceneKey) : ''
)
const portrait = computed(() =>
  char.value ? faceImg(char.value.style, char.value.id, session.face) : ''
)
const options = computed<ScriptOption[]>(() =>
  variant.value?.options ? variant.value.options : []
)

const stepNo = computed(() => session.index + 1)

// —— 打字机 ——
let typingTimer: any = null
function typeOut(full: string, done?: () => void) {
  clearInterval(typingTimer)
  typed.value = ''
  let i = 0
  typingTimer = setInterval(() => {
    i += 1
    typed.value = full.slice(0, i)
    if (i >= full.length) {
      clearInterval(typingTimer)
      done && done()
    }
  }, 32)
}

function txt(s?: string) {
  return replaceTokens(s || '', session.char)
}

// —— 进入节点 ——
function enterNode() {
  sceneDone.value = false
  reactDone.value = false
  os.value = ''
  portraitIn.value = false
  // 立绘淡入
  setTimeout(() => (portraitIn.value = true), 30)

  if (isOpenNode()) {
    phase.value = 'open'
    typeOut(txt(variant.value?.scene), () => (sceneDone.value = true))
  } else {
    phase.value = 'scene'
    typeOut(txt(variant.value?.scene), () => (sceneDone.value = true))
  }
}

// —— 视觉反馈 ——
function feedback(delta: number) {
  bumping.value = false
  setTimeout(() => (bumping.value = true), 10)
  if (delta > 0) {
    deltaText.value = `+${delta} 💗`
    deltaClass.value = 'up'
    showHearts.value = false
    setTimeout(() => (showHearts.value = true), 10)
    setTimeout(() => (showHearts.value = false), 1200)
  } else if (delta < 0) {
    deltaText.value = `${delta}`
    deltaClass.value = 'down'
    shaking.value = false
    setTimeout(() => (shaking.value = true), 10)
    setTimeout(() => (shaking.value = false), 480)
  } else {
    deltaText.value = '±0'
    deltaClass.value = 'flat'
  }
  setTimeout(() => (deltaText.value = ''), 1100)
}

function heartStyle(i: number) {
  const left = 20 + i * 10
  const delay = (i % 6) * 0.08
  return `left:${left}%;animation-delay:${delay}s;`
}

// —— 选择题：选项 ——
async function pickOption(opt: ScriptOption) {
  const delta = applyChoice({ score: opt.score, tag: opt.tag, face: opt.face })
  feedback(delta)

  phase.value = 'reacting'
  reactDone.value = false

  const res = await aiLine({
    name: char.value!.name,
    persona: char.value!.persona,
    score: session.score,
    scene: txt(variant.value?.scene),
    optionText: txt(opt.text),
  })

  const line = res?.line || txt(opt.fallbackLine)
  os.value = res?.os || txt(opt.fallbackOS)

  phase.value = 'react'
  typeOut(line, () => (reactDone.value = true))
}

// —— 开放题提交 ——
async function submitOpen() {
  const text = openText.value.trim()
  if (!text) return
  if (text.length > 100) {
    uni.showToast({ title: '不能超过 100 字哦', icon: 'none' })
    return
  }
  session.openAnswer = text
  // 深情注视
  session.face = 'shy'
  phase.value = 'reacting'
  reactDone.value = false

  const res = await aiOpenLine({
    name: char.value!.name,
    persona: char.value!.persona,
    score: session.score,
    userText: text,
  })

  const fallback =
    session.score >= 50
      ? `${char.value!.name}久久看着你，轻声说：「这句话，我会记一辈子。」`
      : `${char.value!.name}沉默了一会儿：「……谢谢你，告诉我这些。」`
  const line = res || fallback

  phase.value = 'react'
  typeOut(line, () => (reactDone.value = true))
}

// —— 继续逻辑 ——
function nextStep() {
  // react 之后：选择题→若有旁白先放旁白，否则进下一节点；开放题→去结局
  if (isOpenNode()) {
    uni.redirectTo({ url: '/pages/game/ending/ending' })
    return
  }
  const narr = variant.value?.narration
  if (narr) {
    phase.value = 'narration'
    sceneDone.value = false
    typeOut(txt(narr), () => (sceneDone.value = true))
  } else {
    advance()
    enterNode()
  }
}

function afterNarration() {
  advance()
  enterNode()
}

onMounted(() => {
  if (!session.char || !session.script) {
    uni.reLaunch({ url: '/pages/game/pick/pick' })
    return
  }
  enterNode()
})

onUnmounted(() => clearInterval(typingTimer))
</script>

<style scoped>
.play {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: var(--c-bg);
}
.play.shake { animation: shake 0.45s; }
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-12rpx); }
  40% { transform: translateX(12rpx); }
  60% { transform: translateX(-8rpx); }
  80% { transform: translateX(8rpx); }
}
.bg { position: absolute; inset: 0; width: 100%; height: 100%; }
.bg-mask {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.55) 100%);
}

/* 顶部 HUD：角色名 + 当前幕 */
.hud {
  position: absolute;
  top: calc(24rpx + env(safe-area-inset-top));
  left: 28rpx;
  z-index: 12;
}
.hud-chip {
  display: inline-flex;
  flex-direction: column;
  gap: 4rpx;
  padding: 14rpx 26rpx;
  border-radius: 24rpx;
  background: rgba(18, 14, 28, 0.34);
  backdrop-filter: blur(14rpx);
  -webkit-backdrop-filter: blur(14rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.18);
}
.hud-name {
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.35);
}
.hud-step {
  color: rgba(255, 255, 255, 0.72);
  font-size: 20rpx;
  letter-spacing: 1rpx;
}

/* 侧边羁绊竖条 */
.affinity {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-58%);
  z-index: 12;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 18rpx 14rpx;
  border-radius: 30rpx;
  background: rgba(18, 14, 28, 0.30);
  backdrop-filter: blur(14rpx);
  -webkit-backdrop-filter: blur(14rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.18);
}
.affinity-num {
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.3);
}
.affinity-num.bump { animation: numPop 0.5s; }
@keyframes numPop {
  0%, 100% { transform: scale(1); }
  45% { transform: scale(1.4); }
}
.affinity-track {
  position: relative;
  width: 14rpx;
  height: 240rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
}
.affinity-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12rpx;
  background: linear-gradient(180deg, var(--c-up), var(--c-primary));
  box-shadow: 0 0 14rpx var(--c-primary);
  transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.affinity-label {
  color: rgba(255, 255, 255, 0.78);
  font-size: 18rpx;
  letter-spacing: 2rpx;
}

/* 飘分 */
.delta {
  position: absolute;
  top: 180rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  font-size: 48rpx;
  font-weight: 800;
  animation: floatUp 1.1s ease-out forwards;
}
.delta.up { color: var(--c-up); }
.delta.down { color: var(--c-down); }
.delta.flat { color: #cfc8da; }
@keyframes floatUp {
  0% { opacity: 0; transform: translate(-50%, 20rpx) scale(0.6); }
  30% { opacity: 1; transform: translate(-50%, -10rpx) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, -80rpx) scale(1); }
}
.hearts { position: absolute; inset: 0; z-index: 19; pointer-events: none; }
.heart {
  position: absolute;
  bottom: 40%;
  font-size: 40rpx;
  animation: heartUp 1.2s ease-out forwards;
}
@keyframes heartUp {
  0% { opacity: 0; transform: translateY(0) scale(0.4); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-260rpx) scale(1.2); }
}

/* 立绘：贴底，从底部升起，下部由对话框自然覆盖，无缝衔接 */
.portrait-wrap {
  position: absolute;
  z-index: 5;
  left: 0;
  right: 0;
  bottom: 0;
  height: 82vh;
  opacity: 0;
  transform: translateY(24rpx);
  transition: opacity 0.6s ease, transform 0.6s ease;
  pointer-events: none;
}
.portrait-wrap.in {
  opacity: 1;
  transform: translateY(0);
}
.portrait-img {
  width: 100%;
  height: 100%;
}
/* 立绘底部渐隐，弱化照片硬边，自然过渡到对话区 */
.portrait-wrap::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 32%;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.55) 100%);
}

/* 对话框 / 操作 */
.dock {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 8;
  padding: 0 28rpx calc(36rpx + env(safe-area-inset-bottom));
}
.bubble {
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
  border-radius: 28rpx;
  padding: 30rpx 32rpx;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.22);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  min-height: 120rpx;
}
.narr-label { font-size: 20rpx; color: var(--c-deep); }
.narr-text { font-size: 28rpx; line-height: 1.65; color: var(--c-text); }
.speaker {
  display: inline-block;
  font-size: 24rpx;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(90deg, var(--c-primary), var(--c-deep));
  padding: 6rpx 22rpx;
  border-radius: 22rpx;
  margin-bottom: 14rpx;
  box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.18);
}
.line-text { display: block; font-size: 30rpx; line-height: 1.6; color: var(--c-text); }
.os-text { display: block; margin-top: 12rpx; font-size: 24rpx; color: #9a93a6; font-style: italic; }

.actions { margin-top: 20rpx; }
.opt-btn {
  width: 100%;
  background: rgba(255,255,255,0.95);
  color: var(--c-text);
  font-size: 28rpx;
  border: 2rpx solid var(--c-soft);
  border-radius: 18rpx;
  padding: 22rpx 24rpx;
  margin-bottom: 16rpx;
  line-height: 1.4;
  text-align: left;
}
.opt-btn:active { background: var(--c-soft); }
.opt-btn.primary {
  background: linear-gradient(90deg, var(--c-primary), var(--c-deep));
  color: #fff;
  text-align: center;
  font-weight: 700;
  border: none;
}
.opt-btn[disabled] { opacity: 0.5; }
.open-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 160rpx;
  background: rgba(255,255,255,0.96);
  border-radius: 18rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: var(--c-text);
}
.open-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}
.open-count { font-size: 22rpx; color: rgba(255,255,255,0.85); }
.open-row .opt-btn { width: auto; padding: 18rpx 48rpx; margin-bottom: 0; }
.loading {
  text-align: center;
  color: #fff;
  font-size: 26rpx;
  padding: 24rpx;
}
</style>
