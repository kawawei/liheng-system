/**
 * @file auth.schema.ts
 * @description 認證模組 Zod 校驗規則 / Auth Zod Schemas
 * @description_en Validation schema for login and authentication endpoints
 * @description_zh 登入與認證請求之 Zod 參數校驗規則
 */

import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, '請輸入帳號').max(50, '帳號過長'),
  password: z.string().min(6, '密碼長度至少需 6 個字元')
});

export type LoginInput = z.infer<typeof loginSchema>;
