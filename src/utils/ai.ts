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
 * 3. 已用真实身份登录（手机号/邮箱/微信/账号密码），匿名用户没有 AI 权限
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

// 默认模型（可在调用时覆盖）
export const DEFAULT_MODEL = 'deepseek-v4-flash';

/** 调用前的登录态校验：匿名用户会被拒绝调用 AI */
async function ensureSignedIn() {
  const { data } = await auth.getSession();
  if (!data?.session || (data.session as any).user?.is_anonymous) {
    throw new Error('AI 调用前请先登录（手机号/邮箱/微信/账号密码），匿名用户不能调用 AI');
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
