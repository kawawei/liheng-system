/**
 * @file redis.ts
 * @description Redis 客戶端配置與 Token 黑名單管理 / Redis Client & Token Blacklist
 * @description_en Configures Redis client and manages token blacklisting for logout invalidation
 * @description_zh 配置 Redis 客戶端，並提供 Token 黑名單標記與過期查詢，實現登出憑證即刻作廢
 */

import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// ========================================
// Redis 連線實例 / Redis Instance
// ========================================
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6381', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword || undefined,
  retryStrategy: (times) => {
    if (times > 5) return null;
    return Math.min(times * 200, 2000);
  }
});

redis.on('error', (err) => {
  console.warn('[Redis Warning]', err.message);
});

// ========================================
// Token 黑名單管理 / Token Blacklist Methods
// ========================================
const BLACKLIST_PREFIX = 'auth:blacklist:';

/**
 * 將 Token 或 JTI 加入黑名單 / Add token to blacklist
 * @param tokenIdentifier - Token 或 JWT ID
 * @param ttlSeconds - 過期時間 (秒)，通常設為 JWT 剩餘效期
 */
export async function addTokenToBlacklist(tokenIdentifier: string, ttlSeconds: number = 28800): Promise<void> {
  try {
    if (redis.status === 'ready' || redis.status === 'connect') {
      await redis.set(`${BLACKLIST_PREFIX}${tokenIdentifier}`, '1', 'EX', Math.max(ttlSeconds, 60));
    }
  } catch (error) {
    console.error('Failed to add token to Redis blacklist:', error);
  }
}

/**
 * 檢查 Token 是否在黑名單中 / Check if token is blacklisted
 * @param tokenIdentifier - Token 或 JWT ID
 */
export async function isTokenBlacklisted(tokenIdentifier: string): Promise<boolean> {
  try {
    if (redis.status === 'ready' || redis.status === 'connect') {
      const result = await redis.get(`${BLACKLIST_PREFIX}${tokenIdentifier}`);
      return result !== null;
    }
    return false;
  } catch (error) {
    console.error('Failed to check Redis blacklist:', error);
    return false;
  }
}
