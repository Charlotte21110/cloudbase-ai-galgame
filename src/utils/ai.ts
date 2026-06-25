/**
 * CloudBase AI 能力封装（基于 @cloudbase/js-sdk 的 ai() 模块）
 *
 * ⚠️ 使用前提（一次性开通，按顺序）：
 *
 * 1. 已开通 Token Credits 资源包（AI 调用的"油"）：
 *    https://buy.cloud.tencent.com/lowcode?buyType=resPack&envId=你的envId&resourceType=token
 *
 * 2. 已在 CloudBase 控制台开通至少一个 AI 模型：
 *    https://tcb.cloud.tencent.com/dev?envId=你的envId#/ai
 *    推荐先开 deepseek-v4-flash（便宜快）+ hunyuan-2.0-instruct-20251111
 *
 * 3. 游戏项目【不强制登录】—— 已放开匿名限制（设计要求"进来就能玩"）。
 *    注意：真实业务里匿名用户用 AI 通常需要控制台开"匿名可访问 AI"。
 *    如果遇到 Anonymous 用户被拒，去控制台 → AI+ → 调用方设置中放行匿名。
 *
 * 模型选择速查：
 * - deepseek-v4-flash       便宜、快，日常对话/简单生成
 * - deepseek-v3.2           性价比高，复杂推理
 * - hunyuan-2.0-instruct    腾讯混元，中文友好
 * - glm-5                   智谱 GLM-5，中文强
 * - kimi-k2.6               月之暗面 Kimi，长上下文
 *
 * 具体支持的模型名以 CloudBase 控制台 → AI+ 页面显示为准（会持续更新）
 */
import { app } from './cloudbase';
import { auth } from './cloudbase';

// 创建 AI 实例
export const ai = app.ai();

// 默认模型（可在调用时覆盖）。newtest 环境已开通：hy3-preview / glm-5 / glm-5.1
export const DEFAULT_MODEL = 'hy3-preview';

/** 调用前确保有登录会话：游戏不强制账号登录，这里自动做【匿名登录】拿到会话。
 *  纯 Publishable Key（无会话）直调 AI 会报 EXCEED_AUTHORITY，匿名会话可解决。
 *  ⚠️ 需在控制台【身份认证 → 登录方式】开启「匿名登录」。
 */
async function ensureSignedIn() {
  try {
    const { data } = await auth.getSession();
    if (data?.session) return true;
  } catch (e) {
    // 无会话，继续走匿名登录
  }
  try {
    await auth.signInAnonymously();
    console.log('%c[AI] 匿名登录成功', 'color:#7C6FE0');
    return true;
  } catch (e) {
    console.warn('[AI] 匿名登录失败（请在控制台开启「匿名登录」登录方式）：', e);
    return false;
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * 一次性生成（非流式），适合短回复
 */
export async function generateText(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}) {
  await ensureSignedIn();

  const model = ai.createModel('cloudbase'); // ⚠️ 固定写 "cloudbase"，不要写模型名
  const res = await model.generateText({
    model: opts.model || DEFAULT_MODEL,
    messages: opts.messages,
    temperature: opts.temperature,
  });

  return {
    text: res.text as string,
    usage: res.usage, // { prompt_tokens, completion_tokens, total_tokens }
  };
}

/**
 * 流式生成（推荐用于聊天，体验好）
 *
 * 用法：
 *   const stream = await streamText({ messages: [...] });
 *   for await (const chunk of stream.textStream) {
 *     // 把 chunk 追加到界面上
 *   }
 */
export async function streamText(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}) {
  await ensureSignedIn();

  const model = ai.createModel('cloudbase');
  const res = await model.streamText({
    model: opts.model || DEFAULT_MODEL,
    messages: opts.messages,
    temperature: opts.temperature,
  });

  return res; // { textStream, dataStream, messages, usage }
}
