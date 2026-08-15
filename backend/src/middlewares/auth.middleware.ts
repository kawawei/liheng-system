/**
 * @file auth.middleware.ts
 * @description JWT 認證與角色權限守衛中間件 / Auth & Role Guard Middleware
 * @description_en Validates Bearer token, checks Redis blacklist, and enforces RBAC
 * @description_zh 驗證 Bearer JWT 憑證、校驗 Redis 登出黑名單，並提供 RBAC 角色授權守衛
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../config/redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'liheng_dev_jwt_secret_key_8h_session_2026';

export interface AuthJwtPayload {
  userId: string;
  username: string;
  role: 'super_admin' | 'engineer';
  jti?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthJwtPayload;
      token?: string;
    }
  }
}

// ========================================
// 認證中間件 / Authentication Middleware
// ========================================
export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: '未提供授權憑證，請先登入',
      code: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // 檢查 Redis 登出黑名單
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: '憑證已註銷或過期，請重新登入',
        code: 'TOKEN_REVOKED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const payload = jwt.verify(token, JWT_SECRET) as AuthJwtPayload;
    req.user = payload;
    req.token = token;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: '登入憑證已超過 8 小時效期，請重新登入',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: '無效的登入憑證',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }
}

// ========================================
// 角色授權守衛 / Role Guard Middleware
// ========================================
export function requireRole(allowedRoles: ('super_admin' | 'engineer')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '請先登入',
        code: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: '權限不足，無法執行此操作',
        code: 'FORBIDDEN',
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
}

export const requireSuperAdmin = requireRole(['super_admin']);
