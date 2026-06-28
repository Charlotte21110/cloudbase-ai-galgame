<template>
  <view class="play" :style="themeVars">
    <!-- stage：移动端满宽，桌面端定宽居中（响应式核心） -->
    <view class="stage" :class="{ shake: shaking }" @click="onScreenTap">
      <image v-if="bg" class="bg" :src="bg" mode="aspectFill" />
    <view class="bg-mask"></view>

    <!-- 左上角：章节标题条（素材底图） -->
    <view class="hud-chapter">
      <image class="hud-chapter-bg" :src="chapterBar" mode="scaleToFill" />
      <view class="hud-chapter-text">
        <text class="hud-name">{{ char?.name }}</text>
        <text class="hud-step">第 {{ session.step }} 幕</text>
      </view>
    </view>

    <!-- 右上角：横向羁绊条（爱心 + 进度 + 数值 + 标签） -->
    <view class="affinity">
      <view class="affinity-heart"></view>
      <view class="affinity-track">
        <view
          class="affinity-fill"
          :class="{ bump: bumping }"
          :style="{ width: session.score + '%' }"
        ></view>
        <text class="affinity-num">{{ session.score }}</text>
      </view>
      <text class="affinity-label">羁绊</text>
    </view>

    <!-- 飘分 / 心形粒子 -->
    <view v-if="deltaText" class="delta" :class="deltaClass">{{ deltaText }}</view>
    <view v-if="showHearts" class="hearts">
      <view v-for="i in 6" :key="i" class="heart" :style="heartStyle(i)"></view>
    </view>

    <!-- 立绘 -->
    <image v-if="portrait && showPortrait" class="portrait" :class="{ in: portraitIn }" :src="portrait" mode="aspectFit" />

    <!-- 左下角罗盘装饰 -->
    <image class="compass" :src="compass" mode="widthFix" />

    <!-- 对话框 / 操作区 -->
    <view class="dock">
      <!-- 操作区：选项 / 开放题 / 加载 —— 出现在对话框「上方」，半透明玻璃风 -->
      <view v-if="showActions" class="actions">
        <!-- 关键抉择：选项（2 列网格并列） -->
        <view v-if="phase === 'choosing'" class="opt-grid">
          <button
            v-for="(opt, idx) in options"
            :key="idx"
            class="opt-btn"
            @click.stop="pickOption(opt)"
          >{{ txt(opt.text) }}</button>
        </view>

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
      </view>

      <!-- 对话框：固定最小高度、常驻底部，玻璃透明气泡 -->
      <view class="bubble" :class="bubbleClass">
        <image class="bubble-bg" :src="textbox" mode="scaleToFill" />
        <view class="bubble-content">
          <text v-if="bubbleLabel" class="bubble-label">{{ bubbleLabel }}</text>
          <text class="bubble-text" :class="{ os: phase === 'react' && curOS }">{{ typed }}</text>
          <text v-if="phase === 'react' && curOS && doneTyping" class="os-text">（{{ curOS }}）</text>
        </view>
        <!-- 纯三角形「继续」：仅推进态显示 -->
        <view v-if="canTap" class="tap-tri" :class="{ ready: doneTyping }"></view>
      </view>
    </view>

    <!-- 底部控制栏：上一句 / 下一句 / 跳过 / 自动播放 -->
    <view class="ctrl-bar">
      <view class="ctrl-btn" :class="{ disabled: !canPrev }" @click.stop="goPrev">
        <image class="ctrl-ico" :src="ctrlPrev" mode="aspectFit" />
        <text class="ctrl-tip">上一句</text>
      </view>
      <view class="ctrl-btn" :class="{ disabled: !canNext }" @click.stop="goNext">
        <image class="ctrl-ico" :src="ctrlNext" mode="aspectFit" />
        <text class="ctrl-tip">下一句</text>
      </view>
      <view class="ctrl-btn" :class="{ disabled: !canSkip }" @click.stop="goSkip">
        <image class="ctrl-ico" :src="ctrlSkip" mode="aspectFit" />
        <text class="ctrl-tip">跳过</text>
      </view>
      <view class="ctrl-btn" :class="{ active: autoPlay }" @click.stop="toggleAuto">
        <image class="ctrl-ico" :src="ctrlAuto" mode="aspectFit" />
        <text class="ctrl-tip">{{ autoPlay ? '自动中' : '自动' }}</text>
      </view>
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

// 剧情页 UI 素材
const compass = '/static/game/ui/compass.png'
const textbox = '/static/game/ui/textbox.png'
const chapterBar = '/static/game/ui/chapter-bar.png'

// 底部控制栏图标素材
const ctrlPrev = '/static/game/ui/ctrl-prev.png'
const ctrlNext = '/static/game/ui/ctrl-next.png'
const ctrlSkip = '/static/game/ui/ctrl-skip.png'
const ctrlAuto = '/static/game/ui/ctrl-auto.png'

// 自动播放
const autoPlay = ref(false)
let autoTimer: any = null

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

// 操作区（选项 / 开放题 / 加载）——出现在对话框「上方」
const showActions = computed(
  () =>
    phase.value === 'choosing' ||
    (phase.value === 'open' && doneTyping.value) ||
    phase.value === 'reacting'
)
// 是否处于「可轻触推进」态（只在这两种相位显示小三角）
const canTap = computed(() => phase.value === 'story' || phase.value === 'react')

// 底部控制栏可用性
const canPrev = computed(() => phase.value === 'story' && beatIdx.value > 0)
const canNext = computed(() => canTap.value)
const canSkip = computed(() => canTap.value)

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
      scheduleAuto()
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
    scheduleAuto()
    return
  }
  advanceTap()
}

// —— 底部控制栏 ——
function clearAuto() {
  if (autoTimer) {
    clearTimeout(autoTimer)
    autoTimer = null
  }
}
// 打字完成后，自动播放态下延时推进
function scheduleAuto() {
  clearAuto()
  if (!autoPlay.value) return
  if (phase.value !== 'story' && phase.value !== 'react') return
  autoTimer = setTimeout(() => {
    if (autoPlay.value) advanceTap()
  }, 1200)
}
function toggleAuto() {
  autoPlay.value = !autoPlay.value
  if (autoPlay.value) {
    if (doneTyping.value) scheduleAuto()
  } else {
    clearAuto()
  }
}
// 上一句：仅在当前节点 beats 内回看，直接显示完整文本
function goPrev() {
  clearAuto()
  if (phase.value !== 'story' || beatIdx.value <= 0) return
  clearInterval(typingTimer)
  beatIdx.value -= 1
  applyBeatVisual(curBeat.value)
  typed.value = txt(curBeat.value?.text)
  doneTyping.value = true
}
// 下一句：等同轻触推进（打字中先补全）
function goNext() {
  if (phase.value === 'choosing' || phase.value === 'reacting' || phase.value === 'open') return
  clearAuto()
  if (!doneTyping.value) {
    clearInterval(typingTimer)
    typed.value = phase.value === 'react' ? reactFull.value : txt(curBeat.value?.text)
    doneTyping.value = true
    scheduleAuto()
    return
  }
  advanceTap()
}
// 跳过：跳过当前节点剩余铺垫，直达交互 / 跳转
function goSkip() {
  clearAuto()
  if (phase.value === 'story') {
    clearInterval(typingTimer)
    beatIdx.value = Math.max(beats.value.length - 1, 0)
    afterBeats()
  } else if (phase.value === 'react') {
    clearInterval(typingTimer)
    proceedGoto(pendingGoto.value)
  }
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
    deltaText.value = `+${delta}`
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

onUnmounted(() => {
  clearInterval(typingTimer)
  clearAuto()
})
</script>

<style scoped>
/* 外层：全屏深色背板（桌面端两侧留黑） */
.play {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #07060f;
  display: flex;
  justify-content: center;
}
/* stage：移动端满宽，桌面端定宽（750rpx≈手机宽）居中 */
.stage {
  position: relative;
  width: 100%;
  max-width: 750rpx;
  min-height: 100vh;
  overflow: hidden;
  background: var(--c-bg);
  box-shadow: 0 0 60rpx rgba(0, 0, 0, 0.6);
}
.stage.shake { animation: shake 0.45s; }
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

/* 左上角：章节标题条（素材底图）—— 文字在整块内纯 flex 垂直居中（= banner 中线） */
.hud-chapter {
  position: absolute;
  top: calc(16rpx + env(safe-area-inset-top));
  left: 18rpx;
  z-index: 10;
  width: 350rpx;
  height: 98rpx;
  display: flex;
  align-items: center;
}
.hud-chapter-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}
/* 文字层：避开左侧罗盘和右侧箭头，竖直居中由父级 align-items 保证 */
.hud-chapter-text {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  padding-left: 70rpx;
  padding-right: 44rpx;
}
.hud-name {
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  line-height: 1;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.55);
}
.hud-step {
  color: rgba(255, 255, 255, 0.9);
  font-size: 23rpx;
  margin-left: 12rpx;
  letter-spacing: 1rpx;
  line-height: 1;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.55);
}

/* 右上角：横向羁绊条 —— 与章节条同一水平中线 */
.affinity {
  position: absolute;
  top: calc(19rpx + env(safe-area-inset-top));
  right: 22rpx;
  z-index: 10;
  height: 92rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}
/* CSS 发光爱心（标准构造，包围盒对称、居中不偏） */
.affinity-heart {
  position: relative;
  width: 40rpx;
  height: 36rpx;
  filter: drop-shadow(0 0 8rpx rgba(255, 143, 208, 0.85));
}
.affinity-heart::before,
.affinity-heart::after {
  content: '';
  position: absolute;
  top: 0;
  width: 20rpx;
  height: 32rpx;
  border-radius: 20rpx 20rpx 0 0;
  background: linear-gradient(135deg, #ff8fd0, #b06bff);
}
.affinity-heart::before {
  left: 20rpx;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
}
.affinity-heart::after {
  left: 0;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
}
.affinity-track {
  position: relative;
  width: 176rpx;
  height: 26rpx;
  border-radius: 16rpx;
  background: rgba(20, 16, 40, 0.55);
  border: 1rpx solid rgba(180, 160, 255, 0.5);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.35), inset 0 0 8rpx rgba(124, 111, 224, 0.3);
  overflow: hidden;
}
.affinity-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  border-radius: 16rpx;
  background: linear-gradient(90deg, #6f8bff, #b06bff, #ff8fd0);
  box-shadow: 0 0 12rpx rgba(176, 107, 255, 0.7);
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.affinity-fill.bump { animation: bumpH 0.5s; }
@keyframes bumpH {
  0% { transform: scaleY(1); }
  50% { transform: scaleY(1.5); }
  100% { transform: scaleY(1); }
}
.affinity-num {
  position: absolute;
  left: 0; right: 0; top: 50%;
  transform: translateY(-50%);
  text-align: center;
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.7);
}
.affinity-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 20rpx;
  letter-spacing: 2rpx;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.5);
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
/* CSS 绘制的心形粒子（替代 emoji） */
.heart {
  position: absolute;
  bottom: 40%;
  width: 28rpx;
  height: 28rpx;
  transform: rotate(-45deg);
  background: linear-gradient(135deg, #ff8fd0, #b06bff);
  border-radius: 0 0 5rpx 0;
  filter: drop-shadow(0 0 6rpx rgba(255, 143, 208, 0.7));
  animation: heartUp 1.2s ease-out forwards;
}
.heart::before,
.heart::after {
  content: '';
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff8fd0, #b06bff);
}
.heart::before { top: -14rpx; left: 0; }
.heart::after { top: 0; right: -14rpx; }
@keyframes heartUp {
  0% { opacity: 0; transform: rotate(-45deg) translate(0, 0) scale(0.4); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: rotate(-45deg) translate(130rpx, 130rpx) scale(1.1); }
}

/* 左下角罗盘装饰 */
.compass {
  position: absolute;
  left: 22rpx;
  bottom: calc(420rpx + env(safe-area-inset-bottom));
  z-index: 6;
  width: 110rpx;
  opacity: 0.85;
  filter: drop-shadow(0 0 10rpx rgba(176, 150, 255, 0.5));
}

/* 立绘：底部贴着对话框上沿（藏进气泡后方，无空隙） */
.portrait {
  position: absolute;
  z-index: 5;
  left: 50%;
  /* 让立绘底部落到对话框上沿之下一点，被气泡盖住，从而无缝衔接 */
  bottom: calc(300rpx + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  /* 用 rem 控制立绘整体尺寸；宽高比保持 7:9 = 560:720 */
  width: 25.28rem;
  height: 32.5rem;
  filter: drop-shadow(0 12rpx 24rpx rgba(0,0,0,0.3));
  opacity: 0;
  transition: opacity 0.5s ease;
}
.portrait.in { opacity: 1; }

/* 对话框 / 操作 */
.dock {
  position: absolute;
  left: 0; right: 0;
  /* 底部预留出「上一句 / 下一句」操作栏的空间，整体上移 */
  bottom: 0;
  z-index: 8;
  padding: 0 28rpx calc(116rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
}
.bubble {
  position: relative;
  border-radius: 24rpx;
  padding: 28rpx 34rpx 40rpx;
  /* 固定最小高度，文字增减不跳动 */
  min-height: 200rpx;
  box-sizing: border-box;
}
.bubble-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}
.bubble-content {
  position: relative;
  z-index: 1;
}
.bubble-label {
  display: inline-flex;
  align-items: center;
  font-size: 24rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  color: #fff;
  background: linear-gradient(135deg, #c79bff, #7b6ee6);
  padding: 6rpx 24rpx;
  border-radius: 24rpx;
  margin-bottom: 14rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 4rpx 14rpx rgba(124, 111, 224, 0.5);
}
.bubble-text {
  display: block;
  font-size: 29rpx;
  line-height: 1.7;
  color: #f3effa;
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.4);
}
.bubble.self .bubble-text { font-style: italic; color: #e7defb; }
.os-text { display: block; margin-top: 12rpx; font-size: 24rpx; color: #c7bce0; font-style: italic; }
/* 纯三角形「继续」：固定对话框右下角，无任何底框 */
.tap-tri {
  position: absolute;
  right: 26rpx;
  bottom: 22rpx;
  z-index: 2;
  width: 0;
  height: 0;
  border-left: 15rpx solid transparent;
  border-right: 15rpx solid transparent;
  border-top: 18rpx solid rgba(255, 255, 255, 0.85);
  opacity: 0.55;
  filter: drop-shadow(0 1rpx 3rpx rgba(0, 0, 0, 0.5));
}
.tap-tri.ready { animation: blink 1.2s ease-in-out infinite; }
@keyframes blink { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

/* 操作区：在对话框「上方」 */
.actions { margin-bottom: 16rpx; }
/* 选项：一行一个，纵向排列 */
.opt-grid {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}
.opt-btn {
  width: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  margin: 0;
  background: rgba(38, 30, 66, 0.46);
  color: #f3effa;
  font-size: 27rpx;
  border: 1rpx solid rgba(180, 160, 255, 0.42);
  border-radius: 16rpx;
  padding: 20rpx 26rpx;
  line-height: 1.4;
  text-align: left;
  box-sizing: border-box;
  backdrop-filter: blur(12rpx);
  -webkit-backdrop-filter: blur(12rpx);
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.3), inset 0 1rpx 0 rgba(255, 255, 255, 0.08);
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.4);
  transition: transform 0.12s ease, background 0.12s ease;
}
/* 去掉 uni-app button 默认 1px 边框 */
.opt-btn::after { border: none; }
.opt-btn:active {
  background: rgba(124, 111, 224, 0.5);
  transform: scale(0.97);
}
.opt-btn.primary {
  justify-content: center;
  background: linear-gradient(90deg, var(--c-primary), var(--c-deep));
  color: #fff;
  text-align: center;
  font-weight: 700;
  border: none;
  box-shadow: 0 6rpx 20rpx rgba(124, 111, 224, 0.4);
}
.opt-btn[disabled] { opacity: 0.5; }
.open-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 160rpx;
  background: rgba(38, 30, 66, 0.55);
  border: 1rpx solid rgba(180, 160, 255, 0.42);
  border-radius: 18rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #f3effa;
  backdrop-filter: blur(12rpx);
  -webkit-backdrop-filter: blur(12rpx);
}
.open-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}
.open-count { font-size: 22rpx; color: rgba(255, 255, 255, 0.85); }
.open-row .opt-btn { width: auto; padding: 18rpx 48rpx; margin-bottom: 0; }
.loading {
  text-align: center;
  color: #fff;
  font-size: 26rpx;
  padding: 18rpx;
}

/* 底部控制栏：上一句 / 下一句 / 跳过 / 自动播放 */
.ctrl-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(26rpx + env(safe-area-inset-bottom));
  z-index: 12;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 30rpx;
  padding: 0 28rpx;
  pointer-events: none;
}
.ctrl-btn {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  transition: transform 0.12s ease, opacity 0.2s ease;
}
.ctrl-btn:active {
  transform: scale(0.88);
}
.ctrl-btn.disabled {
  opacity: 0.28;
  pointer-events: none;
}
.ctrl-ico {
  width: 78rpx;
  height: 78rpx;
  filter: drop-shadow(0 2rpx 8rpx rgba(176, 107, 255, 0.55));
}
.ctrl-btn.active .ctrl-ico {
  filter: drop-shadow(0 0 16rpx rgba(255, 143, 208, 0.95));
  animation: autoPulse 1.1s ease-in-out infinite;
}
@keyframes autoPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
}
.ctrl-tip {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.82);
  letter-spacing: 1rpx;
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.6);
}
.ctrl-btn.active .ctrl-tip {
  color: #ff8fd0;
}
</style>
