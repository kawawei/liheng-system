/**
 * @file auth.service.ts
 * @description 認證與授權業務邏輯層 / Auth Service
 * @description_en Handles password verification, 8-hour JWT issuance, and Redis logout blacklisting
 * @description_zh 負責使用者登入密碼驗證、8 小時 JWT 憑證簽發、Token 註銷與黑名單管理
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { addTokenToBlacklist } from '../config/redis';
import { LoginInput } from '../schemas/auth.schema';

const JWT_SECRET = process.env.JWT_SECRET || 'liheng_dev_jwt_secret_key_8h_session_2026';
const EIGHT_HOURS_SECONDS = 8 * 60 * 60; // 28800 秒

export class AuthService {
  /**
   * 使用者登入處理 / Handle user login
   */
  async login(input: LoginInput) {
    const user = await userRepository.findByUsername(input.username);

    if (!user) {
      const error: any = new Error('帳號或密碼錯誤');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (!user.isActive) {
      const error: any = new Error('此帳號已被停用，請聯繫系統管理員');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DISABLED';
      throw error;
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('帳號或密碼錯誤');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // 簽發 8 小時 JWT
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + EIGHT_HOURS_SECONDS;
    const jti = `${user.id}_${Date.now()}`;

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        jti
      },
      JWT_SECRET,
      { expiresIn: EIGHT_HOURS_SECONDS }
    );

    return {
      token,
      expiresAt: expiresAt * 1000,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        role: user.role
      }
    };
  }

  /**
   * 使用者登出處理 / Handle user logout
   */
  async logout(token: string, tokenPayload?: any) {
    if (!token) return;

    // 計算剩餘有效秒數
    let ttl = EIGHT_HOURS_SECONDS;
    if (tokenPayload && tokenPayload.exp) {
      const now = Math.floor(Date.now() / 1000);
      ttl = Math.max(tokenPayload.exp - now, 60);
    }

    // 寫入 Redis 黑名單
    await addTokenToBlacklist(token, ttl);
  }
}

export const authService = new AuthService();
