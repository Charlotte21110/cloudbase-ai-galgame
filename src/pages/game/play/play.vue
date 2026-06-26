<template>
  <view class="play" :class="{ shake: shaking }" :style="themeVars" @click="onScreenTap">
    <image v-if="bg" class="bg" :src="bg" mode="aspectFill" />
    <view class="bg-mask"></view>

    <!-- 顶部 HUD -->
    <view class="hud">
      <view class="hud-row">
        <text class="hud-name">{{ char?.name }}</text>
        <text class="hud-score">羁绊 {{ session.score }}/100</text>
      </view>
      <view class="bar">
        <view class="bar-fill" :class="{ bump: bumping }" :style="{ width: session.score + '%' }"></view>
      </view>
      <text class="hud-step">{{ node?.chapter || '长夜' }} · 第 {{ session.step }} 幕</text>
    </view>

    <!-- 飘分 / 心形粒子 -->
    <view v-if="deltaText" class="delta" :class="deltaClass">{{ deltaText }}</view>
    <view v-if="showHearts" class="hearts">
      <text v-for="i in 6" :key="i" class="heart" :style="heartStyle(i)">💗</text>
    </view>

    <!-- 立绘 -->
    <image v-if="portrait && showPortrait" class="portrait" :class="{ in: portraitIn }" :src="portrait" mode="aspectFit" />

    <!-- 对话框 / 操作区 -->
    <view class="dock">
      <!-- 文本气泡：旁白 / TA 对话 / 主角心声 / TA 回应 -->
      <view class="bubble" :class="bubbleClass">
        <text v-if="bubbleLabel" class="bubble-label">{{ bubbleLabel }}</text>
        <text class="bubble-text" :class="{ os: phase === 'react' && curOS }">{{ typed }}</text>
        <text v-if="phase === 'react' && curOS && doneTyping" class="os-text">（{{ curOS }}）</text>
      </view>

      <view class="actions">
        <!-- 关键抉择：选项 -->
        <template v-if="phase === 'choosing'">
          <button
            v-for="(opt, idx) in options"
            :key="idx"
            class="opt-btn"
            @click.stop="pickOption(opt)"
          >{{ txt(opt.text) }}</button>
        </template>

        <!-- 开放题输入 -->
        <template v-else-if="phase === 'open' && doneTyping">
          <textarea
            class="open-input"
            v-model="openText"
            :maxlength="100"
            placeholder="写下你最想说的那句话…（≤100字）"
            :adjust-position="true"
            @click.stop
          />
          <view class="open-row">
            <text class="open-count">{{ openText.length }}/100</text>
            <button class="opt-btn primary" :disabled="!openText.trim()" @click.stop="submitOpen">说出口</button>
          </view>
        </template>

        <!-- 加载态 -->
        <view v-else-if="phase === 'reacting'" class="loading">{{ char?.name }} 正在回应…</view>

        <!-- 继续（剧情/回应推进）。点屏幕任意处也可推进。 -->
        <view v-else class="tap-hint">{{ doneTyping ? '轻触继续 →' : '轻触跳过 ▸' }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  session,
  currentNode,
  applyChoice,
  gotoNode,
  filterBeats,
} from '@/game/store'
import { replaceTokens } from '@/game/engine'
import { faceImg, bgImg } from '@/game/assets'
import { themeCssVars } from '@/game/theme'
import { aiLine, aiOpenLine } from '@/game/ai'
import type { NodeOption, Beat } from '@/game/types'

// phase：
//  story   逐条展示 beats（旁白/对话/心声）
//  choosing 展示选项
//  reacting 选后等 AI 回应
//  react    展示 TA 回应（+OS）
//  open     开放题输入
type Phase = 'story' | 'choosing' | 'reacting' | 'react' | 'open'

const char = computed(() => session.char)
const node = computed(() => currentNode())

const phase = ref<Phase>('story')
const beatIdx = ref(0)
const typed = ref('')
const doneTyping = ref(false)
const curOS = ref('')
const openText = ref('')
const portraitIn = ref(true)

// 当前展示用的背景 / 表情（beat 可临时覆盖）
const curScene = ref('')
const curFace = ref<string>('happy')

// 视觉反馈
const deltaText = ref('')
const deltaClass = ref('')
const showHearts = ref(false)
const bumping = ref(false)
const shaking = ref(false)

const themeVars = computed(() => (char.value ? themeCssVars(char.value.themeKey) : {}))
const bg = computed(() =>
  char.value && curScene.value ? bgImg(char.value.style, curScene.value) : ''
)
const portrait = computed(() =>
  char.value ? faceImg(char.value.style, char.value.id, (curFace.value as any) || 'happy') : ''
)
const options = computed<NodeOption[]>(() => (node.value?.options ? node.value.options : []))

const beats = computed<Beat[]>(() => filterBeats(node.value?.beats))
const curBeat = computed<Beat | null>(() => beats.value[beatIdx.value] || null)

// 立绘仅在「有角色开口 / 抉择 / 回应」时强调显示，纯旁白也保留但弱化
const showPortrait = computed(() => !!portrait.value)

const bubbleClass = computed(() => {
  if (phase.value === 'react') return 'line'
  if (phase.value === 'reacting') return 'line'
  const who = curBeat.value?.who
  if (who === 'name') return 'line'
  if (who === 'self') return 'self'
  return 'narr'
})
const bubbleLabel = computed(() => {
  if (phase.value === 'react' || phase.value === 'reacting') return char.value?.name || ''
  const who = curBeat.value?.who
  if (who === 'name') return char.value?.name || ''
  if (who === 'self') return '我'
  if (who && who !== 'narration') return who // 具名第三者
  return '' // 旁白无标签
})

function txt(s?: string) {
  return replaceTokens(s || '', session.char)
}

// —— 打字机 ——
let typingTimer: any = null
function typeOut(full: string, done?: () => void) {
  clearInterval(typingTimer)
  doneTyping.value = false
  typed.value = ''
  let i = 0
  const text = full
  typingTimer = setInterval(() => {
    i += 1
    typed.value = text.slice(0, i)
    if (i >= text.length) {
      clearInterval(typingTimer)
      doneTyping.value = true
      done && done()
    }
  }, 30)
}

function applyBeatVisual(b: Beat | null) {
  if (!b) return
  if (b.sceneKey) curScene.value = b.sceneKey
  if (b.face) curFace.value = b.face
}

// —— 进入节点 ——
function enterNode() {
  const n = node.value
  if (!n) {
    uni.redirectTo({ url: '/pages/game/ending/ending' })
    return
  }
  // 背景 / 表情初始化
  if (n.sceneKey) curScene.value = n.sceneKey
  if (n.face) curFace.value = n.face
  curOS.value = ''
  beatIdx.value = 0
  portraitIn.value = false
  setTimeout(() => (portraitIn.value = true), 30)

  if (n.beats && n.beats.length) {
    phase.value = 'story'
    applyBeatVisual(curBeat.value)
    typeOut(txt(curBeat.value?.text))
  } else {
    // 没有铺垫文本：直接进入交互
    afterBeats()
  }
}

// 所有 beats 看完后的去向
function afterBeats() {
  const n = node.value
  if (!n) return
  if (n.type === 'choice') {
    phase.value = 'choosing'
  } else if (n.type === 'open') {
    phase.value = 'open'
    typeOut(txt(n.prompt))
  } else {
    // story：直接跳转
    proceedGoto(n.goto)
  }
}

// —— 屏幕轻触：推进剧情 / 跳过打字 ——
function onScreenTap() {
  if (phase.value === 'choosing' || phase.value === 'reacting' || phase.value === 'open') return
  // 打字中：先把当前这句补全
  if (!doneTyping.value) {
    clearInterval(typingTimer)
    typed.value = phase.value === 'react' ? typed.value : txt(curBeat.value?.text)
    if (phase.value === 'react') {
      // react 文案在 pickOption 里已设置 typed 目标，这里直接补全
      typed.value = reactFull.value
    }
    doneTyping.value = true
    return
  }
  advanceTap()
}

// 打字完成后，轻触的推进逻辑
function advanceTap() {
  if (phase.value === 'story') {
    if (beatIdx.value < beats.value.length - 1) {
      beatIdx.value += 1
      applyBeatVisual(curBeat.value)
      typeOut(txt(curBeat.value?.text))
    } else {
      afterBeats()
    }
  } else if (phase.value === 'react') {
    proceedGoto(pendingGoto.value)
  }
}

// —— 关键抉择 ——
const reactFull = ref('')
const pendingGoto = ref('')
async function pickOption(opt: NodeOption) {
  const delta = applyChoice({ score: opt.score, tag: opt.tag, face: opt.face, flag: opt.flag })
  feedback(delta)
  pendingGoto.value = opt.goto

  phase.value = 'reacting'
  doneTyping.value = false

  const res = await aiLine({
    name: char.value!.name,
    persona: char.value!.persona,
    score: session.score,
    scene: txt(lastStoryText()),
    optionText: txt(opt.text),
  })

  const line = res?.line || txt(opt.reply || '……')
  curOS.value = res?.os || txt(opt.os || '')
  reactFull.value = line

  phase.value = 'react'
  typeOut(line)
}

// 取当前节点最后一条铺垫文本，作为 AI 的情境上下文
function lastStoryText(): string {
  const b = beats.value
  return b.length ? b[b.length - 1].text : ''
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
  session.face = 'shy'
  curFace.value = 'shy'
  pendingGoto.value = node.value?.goto || 'END'

  phase.value = 'reacting'
  doneTyping.value = false

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
  reactFull.value = res || fallback
  curOS.value = ''

  phase.value = 'react'
  typeOut(reactFull.value)
}

// —— 跳转 ——
function proceedGoto(goto?: string) {
  const isEnd = gotoNode(goto || 'END')
  if (isEnd) {
    uni.redirectTo({ url: '/pages/game/ending/ending' })
    return
  }
  enterNode()
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

onMounted(() => {
  if (!session.char || !session.script) {
    uni.reLaunch({ url: '/pages/game/pick/pick' })
    return
  }
  curFace.value = session.face || 'happy'
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
  background: linear-gradient(180deg, rgba(0,0,0,0.12) 30%, rgba(0,0,0,0.6) 100%);
}

/* HUD */
.hud {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 10;
  padding: 24rpx 32rpx 16rpx;
  background: linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0));
}
.hud-row { display: flex; justify-content: space-between; align-items: center; }
.hud-name { color: #fff; font-size: 26rpx; font-weight: 700; }
.hud-score { color: #fff; font-size: 24rpx; }
.bar {
  margin-top: 12rpx;
  height: 16rpx;
  border-radius: 12rpx;
  background: rgba(255,255,255,0.3);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 12rpx;
  background: linear-gradient(90deg, var(--c-primary), var(--c-up));
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bar-fill.bump { animation: bump 0.5s; }
@keyframes bump {
  0% { transform: scaleY(1); }
  50% { transform: scaleY(1.8); }
  100% { transform: scaleY(1); }
}
.hud-step { display: block; color: rgba(255,255,255,0.85); font-size: 20rpx; margin-top: 8rpx; letter-spacing: 2rpx; }

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

/* 立绘 */
.portrait {
  position: absolute;
  z-index: 5;
  left: 50%;
  bottom: 440rpx;
  transform: translateX(-50%);
  width: 560rpx;
  height: 720rpx;
  filter: drop-shadow(0 12rpx 24rpx rgba(0,0,0,0.3));
  opacity: 0;
  transition: opacity 0.5s ease;
}
.portrait.in { opacity: 1; }

/* 对话框 / 操作 */
.dock {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 8;
  padding: 0 28rpx calc(36rpx + env(safe-area-inset-bottom));
}
.bubble {
  background: rgba(255,255,255,0.96);
  border-radius: 24rpx;
  padding: 28rpx 30rpx;
  box-shadow: 0 -4rpx 24rpx rgba(0,0,0,0.12);
  min-height: 150rpx;
}
.bubble.narr { background: rgba(20,16,32,0.78); }
.bubble.narr .bubble-text { color: #f3effa; }
.bubble.self { background: rgba(255,255,255,0.92); }
.bubble.self .bubble-text { color: #6b5f86; font-style: italic; }
.bubble-label {
  display: inline-block;
  font-size: 24rpx;
  font-weight: 700;
  color: #fff;
  background: var(--c-primary);
  padding: 4rpx 18rpx;
  border-radius: 20rpx;
  margin-bottom: 12rpx;
}
.bubble.narr .bubble-label { background: rgba(255,255,255,0.18); }
.bubble-text { display: block; font-size: 29rpx; line-height: 1.7; color: var(--c-text); }
.os-text { display: block; margin-top: 12rpx; font-size: 24rpx; color: #9a93a6; font-style: italic; }

.actions { margin-top: 18rpx; min-height: 64rpx; }
.opt-btn {
  width: 100%;
  background: rgba(255,255,255,0.96);
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
  background: rgba(255,255,255,0.98);
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
  padding: 18rpx;
}
.tap-hint {
  text-align: right;
  color: rgba(255,255,255,0.85);
  font-size: 24rpx;
  padding: 8rpx 4rpx;
  animation: blink 1.4s ease-in-out infinite;
}
@keyframes blink { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
</style>
