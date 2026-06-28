<template>
  <!-- 离屏画布：移到屏幕外保持可绘制 -->
  <canvas
    canvas-id="galShareCanvas"
    id="galShareCanvas"
    class="sc-canvas"
    :style="{ width: CW + 'px', height: CH + 'px' }"
  />

  <view v-if="visible" class="sc-mask">
    <image class="sc-mask-bg" :src="bgImg" mode="aspectFill" />
    <view class="sc-mask-veil"></view>

    <!-- 关闭 -->
    <view class="sc-close" @click="close">✕</view>

    <view class="sc-body" @click.stop>
      <!-- 分享卡预览（Canvas 生成的霓虹图） -->
      <view class="sc-preview">
        <image
          v-if="shotUrl"
          :src="shotUrl"
          class="sc-img"
          mode="widthFix"
          show-menu-by-longpress
        />
        <view v-else class="sc-loading">
          <view class="sc-spin"></view>
          <text class="sc-loading-tx">正在生成你的长夜档案…</text>
        </view>
      </view>

      <!-- 三个操作按钮 -->
      <view class="sc-actions">
        <view class="act" :class="{ disabled: !shotUrl || saving }" @click="save">
          <view class="act-circle"><view class="ic ic-dl"><view class="dl-head"></view></view></view>
          <text class="act-label">保存到相册</text>
        </view>
        <view class="act" @click="copyLink">
          <view class="act-circle"><view class="ic ic-link"></view></view>
          <text class="act-label">复制链接</text>
        </view>
        <view class="act" @click="shareWx">
          <view class="act-circle"><view class="ic ic-share"><view class="sh-head"></view></view></view>
          <text class="act-label">微信分享</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref, watch } from 'vue'
import { session, tagCloud } from '@/game/store'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const bgImg = '/static/game/ui/report/starfield-bg.png'
const starMain = '/static/game/ui/report/star-main.png'
const heartStar = '/static/game/ui/report/heart-star.png'

// 画布逻辑尺寸（9:16 竖版分享图）
const CW = 750
const CH = 1334

const inst = getCurrentInstance()
const shotUrl = ref('')
const saving = ref(false)

watch(
  () => props.visible,
  (v) => {
    if (v) {
      shotUrl.value = ''
      setTimeout(() => render(), 120)
    }
  }
)

const close = () => emit('close')

/* ---------------- Canvas 辅助 ---------------- */

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function measureText(ctx: any, s: string, fontSize: number): number {
  try {
    const m = ctx.measureText(s)
    if (m && m.width) return m.width
  } catch (e) {
    /* ignore */
  }
  let w = 0
  for (const ch of s) w += /[\x00-\xff]/.test(ch) ? fontSize * 0.55 : fontSize
  return w
}

function wrapText(ctx: any, text: string, fontSize: number, maxWidth: number, maxLines: number): string[] {
  ctx.setFontSize(fontSize)
  const chars = Array.from(text || '')
  const lines: string[] = []
  let line = ''
  for (const ch of chars) {
    if (measureText(ctx, line + ch, fontSize) > maxWidth && line) {
      lines.push(line)
      line = ch
      if (lines.length >= maxLines) break
    } else {
      line += ch
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  if (lines.length >= maxLines) {
    const consumed = lines.join('').length
    if (consumed < chars.length) {
      let last = lines[maxLines - 1]
      while (last && measureText(ctx, last + '…', fontSize) > maxWidth) last = last.slice(0, -1)
      lines[maxLines - 1] = last + '…'
    }
  }
  return lines
}

function loadImg(src: string): Promise<{ path: string; w: number; h: number } | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    uni.getImageInfo({
      src,
      success: (info) => resolve({ path: info.path, w: info.width, h: info.height }),
      fail: () => resolve(null),
    })
  })
}

/* ---------------- Canvas 绘制（深紫霓虹分享图） ---------------- */

async function render() {
  const char = session.char
  const ending = session.ending
  if (!char || !ending) return

  const ctx = uni.createCanvasContext('galShareCanvas', inst as any)
  const cx = CW / 2

  const [cg, star, heart] = await Promise.all([
    loadImg(session.cgUrl),
    loadImg(starMain),
    loadImg(heartStar),
  ])

  // 1. 背景渐变
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CH)
  bgGrad.addColorStop(0, '#2a1652')
  bgGrad.addColorStop(0.5, '#1b1040')
  bgGrad.addColorStop(1, '#120a26')
  ctx.setFillStyle(bgGrad)
  ctx.fillRect(0, 0, CW, CH)

  // 2. 星星点缀
  if (star) {
    const pts = [
      [70, 150, 46], [660, 120, 40], [110, 1180, 38],
      [650, 1150, 50], [600, 470, 30], [120, 500, 28],
    ]
    for (const [sx, sy, ss] of pts) {
      ctx.save()
      ctx.setGlobalAlpha(0.85)
      ctx.drawImage(star.path, sx - ss / 2, sy - ss / 2, ss, ss)
      ctx.restore()
    }
  }

  // 3. 外层霓虹边框
  ctx.save()
  ctx.setShadow(0, 0, 24, 'rgba(180,120,255,0.9)')
  ctx.setStrokeStyle('rgba(214,176,255,0.95)')
  ctx.setLineWidth(3)
  roundRect(ctx, 40, 40, CW - 80, CH - 80, 40)
  ctx.stroke()
  ctx.restore()
  ctx.setShadow(0, 0, 0, 'rgba(0,0,0,0)')

  // 4. 顶部品牌：爱心 + 文字
  const label = '辰星 · 长夜文游'
  ctx.setFontSize(30)
  const tw = measureText(ctx, label, 30)
  const heartW = 46
  const gap = 14
  const groupW = heartW + gap + tw
  const startX = cx - groupW / 2
  if (heart) ctx.drawImage(heart.path, startX, 96, heartW, heartW)
  ctx.setTextAlign('left')
  ctx.setFillStyle('#ece0ff')
  ctx.setFontSize(30)
  ctx.fillText(label, startX + heartW + gap, 128)

  // 5. CG 霓虹相框
  const cgW = 510
  const cgH = 430
  const cgX = cx - cgW / 2
  const cgY = 184
  ctx.save()
  roundRect(ctx, cgX, cgY, cgW, cgH, 24)
  ctx.clip()
  if (cg) {
    const sr = cg.w / cg.h
    const dr = cgW / cgH
    let sw = cg.w
    let sh = cg.h
    let sxc = 0
    let syc = 0
    if (sr > dr) {
      // 图更宽：水平居中裁切
      sw = cg.h * dr
      sxc = (cg.w - sw) / 2
    } else {
      // 图更高：垂直居中裁切（双人 CG 居中，不再从顶部切）
      sh = cg.w / dr
      syc = (cg.h - sh) / 2
    }
    ctx.drawImage(cg.path, sxc, syc, sw, sh, cgX, cgY, cgW, cgH)
  } else {
    ctx.setFillStyle('#3a2a6a')
    ctx.fillRect(cgX, cgY, cgW, cgH)
  }
  ctx.restore()
  // 相框霓虹描边
  ctx.save()
  ctx.setShadow(0, 0, 18, 'rgba(190,130,255,0.85)')
  ctx.setStrokeStyle('rgba(220,180,255,0.95)')
  ctx.setLineWidth(3)
  roundRect(ctx, cgX, cgY, cgW, cgH, 24)
  ctx.stroke()
  ctx.restore()
  ctx.setShadow(0, 0, 0, 'rgba(0,0,0,0)')

  // 6. 标题（渐变）
  const title = `${ending.title} · 与${char.name}`
  let titleSize = 52
  while (measureText(ctx, title, titleSize) > CW - 160 && titleSize > 34) titleSize -= 2
  const titleGrad = ctx.createLinearGradient(120, 0, CW - 120, 0)
  titleGrad.addColorStop(0, '#7fa6ff')
  titleGrad.addColorStop(0.5, '#c79bff')
  titleGrad.addColorStop(1, '#ff8fd0')
  ctx.setTextAlign('center')
  ctx.setFontSize(titleSize)
  ctx.setFillStyle(titleGrad)
  const titleY = cgY + cgH + 90
  ctx.fillText(title, cx, titleY)
  ctx.fillText(title, cx + 0.8, titleY)

  // 7. 两栏数据
  const statY = titleY + 60
  const leftX = cx - 168
  const rightX = cx + 168
  // 分隔线
  ctx.save()
  ctx.setStrokeStyle('rgba(190,160,255,0.4)')
  ctx.setLineWidth(2)
  ctx.beginPath()
  ctx.moveTo(cx, statY - 6)
  ctx.lineTo(cx, statY + 70)
  ctx.stroke()
  ctx.restore()

  ctx.setTextAlign('center')
  ctx.setFontSize(24)
  ctx.setFillStyle('#b9a8e6')
  ctx.fillText('灵魂契合度', leftX, statY + 8)
  ctx.fillText('标签', rightX, statY + 8)

  ctx.setFontSize(46)
  ctx.setFillStyle('#ffd9f0')
  ctx.fillText(`${session.matchRate}%`, leftX, statY + 64)
  const firstTag = tagCloud()[0] || '神秘玩家'
  ctx.setFillStyle('#ffffff')
  ctx.fillText(firstTag, rightX, statY + 64)

  // 8. 小结
  const sumY = statY + 130
  const sumLines = wrapText(ctx, session.aiReport || '在长夜的尽头，你们的心跳跨越了数字的鸿沟。', 27, CW - 180, 4)
  ctx.setTextAlign('center')
  ctx.setFontSize(27)
  ctx.setFillStyle('#ddd0ff')
  sumLines.forEach((ln, i) => {
    ctx.fillText(ln, cx, sumY + i * 44)
  })

  // 9. 底部引导（二维码位先留空，以文字代替）
  const footY = CH - 150
  ctx.setTextAlign('center')
  ctx.setFontSize(24)
  ctx.setFillStyle('#c9b8ee')
  ctx.fillText('—— 扫码开启你的长夜 ——', cx, footY)
  ctx.setFontSize(22)
  ctx.setFillStyle('#8d7bc0')
  ctx.fillText('Powered by CloudBase · 云开发', cx, footY + 46)

  ctx.draw(false, () => {
    setTimeout(() => exportImage(), 150)
  })
}

function exportImage() {
  uni.canvasToTempFilePath(
    {
      canvasId: 'galShareCanvas',
      fileType: 'png',
      quality: 1,
      success: (r) => {
        shotUrl.value = r.tempFilePath
      },
      fail: (e) => {
        console.error('[share-card] export fail', e)
        uni.showToast({ title: '生成失败，可长按页面截图', icon: 'none' })
      },
    },
    inst as any
  )
}

/* ---------------- 操作 ---------------- */

function save() {
  if (!shotUrl.value || saving.value) return
  saving.value = true
  // #ifdef H5
  try {
    const a = document.createElement('a')
    a.href = shotUrl.value
    a.download = '辰星-长夜档案.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
    uni.showToast({ title: '已开始下载 💜', icon: 'none' })
  } catch (e) {
    uni.showToast({ title: '请长按图片保存', icon: 'none' })
  }
  saving.value = false
  // #endif
  // #ifndef H5
  uni.saveImageToPhotosAlbum({
    filePath: shotUrl.value,
    success: () => {
      uni.showToast({ title: '已保存到相册 💜', icon: 'none' })
      saving.value = false
    },
    fail: (e) => {
      saving.value = false
      if (/auth|deny/i.test(JSON.stringify(e))) {
        uni.showModal({
          title: '需要相册权限',
          content: '请在设置中允许保存到相册后重试',
          confirmText: '去设置',
          success: (m) => {
            if (m.confirm) uni.openSetting()
          },
        })
      } else {
        uni.showToast({ title: '保存失败，可长按图片保存', icon: 'none' })
      }
    },
  })
  // #endif
}

function shareLink(): string {
  // #ifdef H5
  if (typeof window !== 'undefined' && window.location) return window.location.href
  // #endif
  return 'https://tcb.cloud.tencent.com'
}

function copyLink() {
  uni.setClipboardData({
    data: shareLink(),
    success: () => uni.showToast({ title: '链接已复制 💜', icon: 'none' }),
    fail: () => uni.showToast({ title: '复制失败', icon: 'none' }),
  })
}

function shareWx() {
  // #ifdef MP-WEIXIN
  uni.showToast({ title: '点击右上角 ··· 分享给好友', icon: 'none' })
  // #endif
  // #ifndef MP-WEIXIN
  uni.setClipboardData({
    data: shareLink(),
    success: () => uni.showToast({ title: '链接已复制，粘贴到微信分享吧', icon: 'none' }),
  })
  // #endif
}
</script>

<style scoped>
.sc-canvas {
  position: fixed;
  left: -9999px;
  top: 0;
  z-index: -1;
}
.sc-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 48rpx calc(60rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow: hidden;
}
.sc-mask-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}
.sc-mask-veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(15, 8, 30, 0.78);
}
.sc-close {
  position: absolute;
  top: calc(40rpx + env(safe-area-inset-top));
  right: 44rpx;
  z-index: 5;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #e0d2ff;
  background: rgba(50, 34, 86, 0.6);
  border: 2rpx solid rgba(200, 160, 255, 0.5);
}
.sc-body {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 640rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sc-preview {
  width: 100%;
  border-radius: 24rpx;
  overflow: hidden;
  min-height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sc-img {
  width: 100%;
  display: block;
  border-radius: 24rpx;
}
.sc-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}
.sc-spin {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(180, 150, 255, 0.25);
  border-top-color: #c79bff;
  animation: sc-rotate 0.8s linear infinite;
  box-shadow: 0 0 18rpx rgba(170, 110, 255, 0.6);
}
@keyframes sc-rotate { to { transform: rotate(360deg); } }
.sc-loading-tx {
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #c4b3e8;
}

/* 三个操作按钮 */
.sc-actions {
  display: flex;
  width: 100%;
  justify-content: space-around;
  margin-top: 48rpx;
}
.act {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.act.disabled { opacity: 0.45; }
.act-circle {
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(48, 32, 84, 0.55);
  border: 2rpx solid rgba(200, 160, 255, 0.65);
  box-shadow: 0 0 18rpx rgba(160, 110, 255, 0.4), inset 0 0 16rpx rgba(150, 110, 255, 0.18);
}
.act:active .act-circle { transform: scale(0.94); }
.act-label {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #d8c8ff;
  letter-spacing: 1rpx;
}

/* CSS 图标（规范绘制：托盘+箭头 / 链条） */
.ic { position: relative; }
/* 保存到相册：托盘 + 下箭头 */
.ic-dl { width: 40rpx; height: 40rpx; }
.ic-dl::before {
  content: '';
  position: absolute;
  left: 4rpx; right: 4rpx; bottom: 2rpx;
  height: 14rpx;
  border: 5rpx solid #ecdfff;
  border-top: none;
  border-radius: 0 0 7rpx 7rpx;
}
.ic-dl::after {
  content: '';
  position: absolute;
  left: 50%; top: 2rpx;
  transform: translateX(-50%);
  width: 5rpx; height: 13rpx;
  background: #ecdfff;
  border-radius: 3rpx;
}
.ic-dl .dl-head {
  position: absolute;
  left: 50%; top: 12rpx;
  transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 9rpx solid transparent;
  border-right: 9rpx solid transparent;
  border-top: 11rpx solid #ecdfff;
}
/* 复制链接：两节链条 */
.ic-link { width: 46rpx; height: 46rpx; }
.ic-link::before,
.ic-link::after {
  content: '';
  position: absolute;
  width: 26rpx;
  height: 15rpx;
  border: 5rpx solid #ecdfff;
  border-radius: 10rpx;
}
.ic-link::before { left: 3rpx; top: 9rpx; transform: rotate(-45deg); }
.ic-link::after { right: 3rpx; bottom: 9rpx; transform: rotate(-45deg); }
/* 微信分享：托盘 + 上箭头 */
.ic-share { width: 40rpx; height: 40rpx; }
.ic-share::before {
  content: '';
  position: absolute;
  left: 4rpx; right: 4rpx; bottom: 2rpx;
  height: 14rpx;
  border: 5rpx solid #ecdfff;
  border-top: none;
  border-radius: 0 0 7rpx 7rpx;
}
.ic-share::after {
  content: '';
  position: absolute;
  left: 50%; top: 7rpx;
  transform: translateX(-50%);
  width: 5rpx; height: 16rpx;
  background: #ecdfff;
  border-radius: 3rpx;
}
.ic-share .sh-head {
  position: absolute;
  left: 50%; top: 0;
  transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 9rpx solid transparent;
  border-right: 9rpx solid transparent;
  border-bottom: 11rpx solid #ecdfff;
}
</style>
