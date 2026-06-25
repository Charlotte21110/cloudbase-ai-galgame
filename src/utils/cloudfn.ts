/**
 * 云函数调用封装
 *
 * 使用前提：
 * - 云函数已部署到 CloudBase
 *   部署命令：npx @cloudbase/cli fn deploy <函数名> -e 你的envId
 */
import { app } from './cloudbase';

/**
 * 调用云函数
 * @param name   云函数名（对应 cloudfunctions/ 下的目录名）
 * @param data   传给云函数的参数（会进入云函数的 event）
 */
export async function callFunction<TRes = any, TData extends Record<string, any> = Record<string, any>>(
  name: string,
  data?: TData
): Promise<TRes> {
  const res = await app.callFunction({ name, data: data || {} });
  // SDK 返回 { result, requestID, ... }
  return (res as any).result as TRes;
}
