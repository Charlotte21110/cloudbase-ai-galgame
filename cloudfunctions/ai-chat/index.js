/**
 * AI 对话云函数（服务端调 AI，可做：
 *   - 系统 Prompt 保密
 *   - 调用频率限制
 *   - 把对话历史写库
 * ）
 *
 * 部署：npx @cloudbase/cli fn deploy ai-chat -e 你的envId
 *
 * 调用（端上）：
 *   import { callFunction } from '@/utils/cloudfn'
 *   const res = await callFunction('ai-chat', {
 *     messages: [{ role: 'user', content: '你好' }]
 *   })
 */
const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });

// Node SDK 的 AI 模块
const ai = app.ai();

const DEFAULT_MODEL = 'deepseek-v4-flash';

// 你的 Galgame 系统设定（在这里改人设、剧情风格）
const SYSTEM_PROMPT = `你是一个 Galgame 剧情助手，请用细腻、富有画面感的中文与玩家互动。
保持角色一致性，回复控制在 200 字以内，避免说教。`;

exports.main = async (event, context) => {
  try {
    const { messages = [], model = DEFAULT_MODEL } = event;

    if (!Array.isArray(messages) || messages.length === 0) {
      return { success: false, error: 'messages 不能为空' };
    }

    // 在最前面注入系统设定
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    const m = ai.createModel('cloudbase'); // ⚠️ 固定写 "cloudbase"
    const result = await m.generateText({
      model,
      messages: fullMessages,
    });

    return {
      success: true,
      text: result.text,
      usage: result.usage,
    };
  } catch (err) {
    console.error('ai-chat error:', err);
    return {
      success: false,
      error: err.message || String(err),
    };
  }
};
