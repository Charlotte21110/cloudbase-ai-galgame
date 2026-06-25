/**
 * 云数据库操作封装（基于 @cloudbase/js-sdk）
 *
 * 三端通用：微信小程序 / H5 / iOS / Android
 *
 * 使用前提：
 * 1. 已在 .env.local 配置 VITE_ENV_ID + VITE_PUBLISHABLE_KEY
 * 2. 已在 CloudBase 控制台创建对应集合（Collection）
 *    https://tcb.cloud.tencent.com/dev?envId=你的envId#/db/doc
 * 3. 已配置集合的「安全规则」（默认仅创建者可读写）
 *    控制台 → 数据库 → 选中集合 → 安全规则
 */
import { app } from './cloudbase';

// 获取数据库实例
export const db = app.database();
export const _ = db.command;

/**
 * 通用：列出集合中的文档（支持分页）
 * @param collection 集合名（如 'users' / 'games' / 'chat_history'）
 * @param where      查询条件，如 { uid: 'xxx' }
 * @param page       页码（从 1 开始）
 * @param pageSize   每页条数（默认 20，最大 100）
 */
export async function listDocs<T = any>(
  collection: string,
  where: Record<string, any> = {},
  page = 1,
  pageSize = 20
): Promise<{ data: T[]; total: number }> {
  const col = db.collection(collection);
  const skip = Math.max(0, (page - 1) * pageSize);

  // 并发查列表 + 总数
  const [listRes, countRes] = await Promise.all([
    col.where(where).skip(skip).limit(Math.min(pageSize, 100)).get(),
    col.where(where).count(),
  ]);

  return {
    data: (listRes.data || []) as T[],
    total: (countRes as any).total || 0,
  };
}

/**
 * 新增一条文档
 */
export async function addDoc<T extends Record<string, any>>(
  collection: string,
  data: T
): Promise<string> {
  const res = await db.collection(collection).add({
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  // SDK 返回 { id: '...' }
  return (res as any).id;
}

/**
 * 更新文档（按 ID）
 */
export async function updateDoc(
  collection: string,
  docId: string,
  patch: Record<string, any>
): Promise<number> {
  const res = await db.collection(collection).doc(docId).update({
    ...patch,
    updatedAt: Date.now(),
  });
  return (res as any).updated || 0;
}

/**
 * 删除文档（按 ID）
 */
export async function removeDoc(
  collection: string,
  docId: string
): Promise<number> {
  const res = await db.collection(collection).doc(docId).remove();
  return (res as any).deleted || 0;
}

/**
 * 查单条
 */
export async function getDoc<T = any>(
  collection: string,
  docId: string
): Promise<T | null> {
  const res = await db.collection(collection).doc(docId).get();
  const list = (res as any).data || [];
  return (list[0] as T) || null;
}
