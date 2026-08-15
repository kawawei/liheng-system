/**
 * @file health.controller.ts
 * @description 系統健康檢查控制器 / Health Check Controller
 * @description_en Health check endpoints for DB, Redis, and service liveness/readiness probes
 * @description_zh 提供容器與負載均衡器監控之健康檢查、存活探針 (Liveness) 與就緒探針 (Readiness)
 */

import { Request, Response } from 'express';
import { pool } from '../config/database';
import { redis } from '../config/redis';

export class HealthController {
  /**
   * 全域健康檢查 / Overall Health Check
   * GET /api/v1/health
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';
    let pgvectorStatus = 'available';

    // 檢查 PostgreSQL 連線與 pgvector
    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT 1 as test');
        if (!result.rows.length) dbStatus = 'unhealthy';

        // 檢查 vector 擴展
        const extResult = await client.query(
          "SELECT extname FROM pg_extension WHERE extname = 'vector'"
        );
        if (extResult.rows.length === 0) {
          pgvectorStatus = 'not_installed';
        }
      } finally {
        client.release();
      }
    } catch (err: any) {
      dbStatus = `unhealthy: ${err.message}`;
    }

    // 檢查 Redis 連線
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const pong = await redis.ping();
        if (pong !== 'PONG') redisStatus = 'unhealthy';
      } else {
        redisStatus = redis.status;
      }
    } catch (err: any) {
      redisStatus = `unhealthy: ${err.message}`;
    }

    const isAllHealthy = dbStatus === 'healthy' && (redisStatus === 'healthy' || redisStatus === 'ready');
    const statusCode = isAllHealthy ? 200 : 503;

    res.status(statusCode).json({
      success: isAllHealthy,
      status: isAllHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: dbStatus,
        pgvector: pgvectorStatus,
        redis: redisStatus
      }
    });
  }

  /**
   * 存活探針 / Liveness Probe
   * GET /api/v1/health/liveness
   */
  getLiveness(req: Request, res: Response): void {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 就緒探針 / Readiness Probe
   * GET /api/v1/health/readiness
   */
  async getReadiness(req: Request, res: Response): Promise<void> {
    try {
      const client = await pool.connect();
      client.release();
      res.status(200).json({
        status: 'READY',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(503).json({
        status: 'NOT_READY',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const healthController = new HealthController();
