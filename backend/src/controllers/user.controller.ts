/**
 * @file user.controller.ts
 * @description 使用者管理控制器 / User Management Controller
 * @description_en Handles HTTP requests for user CRUD operations
 * @description_zh 處理使用者帳號清單、新增、更新與軟刪除之 HTTP 請求與響應
 */

import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';

export class UserController {
  /**
   * 取得使用者清單 / Get Users List
   * GET /api/v1/users
   */
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.query.role as string | undefined;
      const search = req.query.search as string | undefined;

      const users = await userService.getUsers({ role, search });

      res.status(200).json({
        success: true,
        data: users,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得單一使用者 / Get User By ID
   * GET /api/v1/users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 新增使用者 / Create User
   * POST /api/v1/users
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = createUserSchema.parse(req.body);
      const newUser = await userService.createUser(validatedInput);

      res.status(201).json({
        success: true,
        data: newUser,
        message: '帳號建立成功',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新使用者 / Update User
   * PUT /api/v1/users/:id
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedInput = updateUserSchema.parse(req.body);
      const updatedUser = await userService.updateUser(id, validatedInput);

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: '帳號更新成功',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刪除使用者 (軟刪除) / Soft Delete User
   * DELETE /api/v1/users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUserId = req.user?.userId;
      await userService.deleteUser(id, currentUserId);

      res.status(200).json({
        success: true,
        message: '帳號已成功刪除',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
