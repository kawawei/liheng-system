/**
 * @file error.middleware.ts
 * @description 全局錯誤攔截與處理中間件 / Global Error Handling Middleware
 * @description_en Formats uncaught errors into unified RESTful error response
 * @description_zh 統一格式化未捕獲的伺服器與驗證錯誤，避免敏感堆疊資訊外洩
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[Unhandled Error]', err);

  // Zod 驗證錯誤
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => e.message).join('; ');
    res.status(400).json({
      success: false,
      message: errorMessages || '輸入參數格式驗證失敗',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 自訂 HTTP 錯誤
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = err.message || '伺服器內部發生未預期錯誤';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    message,
    code,
    timestamp: new Date().toISOString()
  });
}
