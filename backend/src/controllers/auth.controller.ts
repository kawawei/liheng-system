/**
 * @file auth.controller.ts
 * @description 認證模組控制器 / Auth Controller
 * @description_en Handles HTTP requests for user login, logout, and self profile query
 * @description_zh 處理使用者登入、登出與個人資訊查詢之 HTTP 請求與響應
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { userService } from '../services/user.service.js';
import { loginSchema } from '../schemas/auth.schema.js';

export class AuthController {
  /**
   * 使用者登入 / User Login
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = loginSchema.parse(req.body);
      const result = await authService.login(validatedInput);

      res.status(200).json({
        success: true,
        data: result,
        message: '登入成功',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 使用者登出 / User Logout
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.token) {
        await authService.logout(req.token, req.user);
      }

      res.status(200).json({
        success: true,
        message: '已成功登出',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 獲取當前登入者資訊 / Get Current User Profile
   * GET /api/v1/auth/me
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '未登入',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const user = await userService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        data: user,
        message: '獲取成功',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
