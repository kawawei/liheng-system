/**
 * @file user.schema.ts
 * @description 使用者管理 Zod 校驗規則 / User Management Zod Schemas
 * @description_en Validation schema for creating and updating user accounts
 * @description_zh 新增與編輯使用者帳號之 Zod 參數校驗規則
 */

import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(1, '請輸入帳號').max(50, '帳號過長'),
  password: z.string().min(6, '密碼長度至少需 6 個字元'),
  realName: z.string().min(1, '請輸入真實姓名').max(50, '姓名過長'),
  role: z.enum(['super_admin', 'engineer'], {
    errorMap: () => ({ message: '角色僅限 super_admin 或 engineer' })
  }),
  isActive: z.boolean().optional().default(true)
});

export const updateUserSchema = z.object({
  realName: z.string().min(1, '請輸入真實姓名').max(50, '姓名過長').optional(),
  role: z.enum(['super_admin', 'engineer']).optional(),
  password: z.string().min(6, '密碼長度至少需 6 個字元').optional().or(z.literal('')),
  isActive: z.boolean().optional()
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
