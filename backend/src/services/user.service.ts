/**
 * @file user.service.ts
 * @description 使用者管理業務邏輯層 / User Service
 * @description_en Handles business logic for user management, password hashing, and role checks
 * @description_zh 負責使用者管理業務邏輯，包含 BCrypt 密碼加密、重複帳號檢查與軟刪除安全防護
 */

import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { CreateUserInput, UpdateUserInput } from '../schemas/user.schema';

const SALT_ROUNDS = 10;

export class UserService {
  /**
   * 取得使用者清單 / Get users list
   */
  async getUsers(filter?: { role?: string; search?: string }) {
    const users = await userRepository.findAll(filter);
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      realName: u.realName,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));
  }

  /**
   * 取得單一使用者詳情 / Get user by ID
   */
  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error: any = new Error('找不到該使用者帳號');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * 建立新使用者 / Create new user
   */
  async createUser(input: CreateUserInput) {
    // 檢查帳號是否已存在
    const existing = await userRepository.findByUsername(input.username);
    if (existing) {
      const error: any = new Error(`帳號「${input.username}」已存在，請使用其他帳號`);
      error.statusCode = 400;
      error.code = 'USERNAME_EXISTS';
      throw error;
    }

    // BCrypt 密碼加鹽加密
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const newUser = await userRepository.create({
      username: input.username,
      passwordHash,
      realName: input.realName,
      role: input.role,
      isActive: input.isActive ?? true
    });

    return {
      id: newUser.id,
      username: newUser.username,
      realName: newUser.realName,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    };
  }

  /**
   * 更新使用者資料 / Update user
   */
  async updateUser(id: string, input: UpdateUserInput) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error: any = new Error('找不到該使用者帳號');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const updateData: any = {};
    if (input.realName !== undefined) updateData.realName = input.realName;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    // 若有提供新密碼，進行加密更新
    if (input.password && input.password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    }

    const updated = await userRepository.update(id, updateData);
    if (!updated) {
      const error: any = new Error('更新使用者失敗');
      error.statusCode = 500;
      error.code = 'UPDATE_FAILED';
      throw error;
    }

    return {
      id: updated.id,
      username: updated.username,
      realName: updated.realName,
      role: updated.role,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt
    };
  }

  /**
   * 軟刪除使用者 / Soft delete user
   */
  async deleteUser(id: string, currentUserId?: string) {
    if (id === currentUserId) {
      const error: any = new Error('無法刪除目前正在操作的本人帳號');
      error.statusCode = 400;
      error.code = 'CANNOT_DELETE_SELF';
      throw error;
    }

    const user = await userRepository.findById(id);
    if (!user) {
      const error: any = new Error('找不到該使用者帳號');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const success = await userRepository.softDelete(id);
    return { success };
  }
}

export const userService = new UserService();
