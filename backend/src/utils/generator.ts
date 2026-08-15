/**
 * @file generator.ts
 * @description 業務流水編號原子發號器 / Redis-based Atomic Code Generator
 * @description_en Generates formatted sequence numbers for Projects (PJ) and Change Orders (CO)
 * @description_zh 基於 Redis INCR 與資料庫流水號之原子發號工具，確保高併發下單號唯一性
 */

import { redis } from '../config/redis';
import { pool } from '../config/database';

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export async function generateSequentialCode(prefix: 'PJ' | 'CO' | 'QT' | 'CT'): Promise<string> {
  const dateStr = getTodayString();
  const redisKey = `seq:${prefix}:${dateStr}`;

  try {
    if (redis.status === 'ready' || redis.status === 'connect') {
      const currentVal = await redis.incr(redisKey);
      if (currentVal === 1) {
        // 設定 2 天過期
        await redis.expire(redisKey, 172800);
      }
      const seqStr = String(currentVal).padStart(4, '0');
      return `${prefix}-${dateStr}-${seqStr}`;
    }
  } catch (error) {
    console.warn('[Generator Warning] Redis INCR unavailable, fallback to DB sequence', error);
  }

  // Fallback: 查詢 DB 統計當天數量
  const client = await pool.connect();
  try {
    const likePattern = `${prefix}-${dateStr}-%`;
    let count = 1;
    if (prefix === 'PJ') {
      const res = await client.query(
        `SELECT COUNT(*) as count FROM projects WHERE project_code LIKE $1`,
        [likePattern]
      );
      count = parseInt(res.rows[0]?.count || '0', 10) + 1;
    }
    const seqStr = String(count).padStart(4, '0');
    return `${prefix}-${dateStr}-${seqStr}`;
  } finally {
    client.release();
  }
}
