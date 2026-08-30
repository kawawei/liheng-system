/**
 * @file client.schema.ts
 * @description CRM 客戶模組 Zod 校驗規則 / CRM Client Zod Schemas
 * @description_en Validation schema for client creation, update, and activity logs
 * @description_zh 客戶資料新增、編輯與跟進紀錄之 Zod 參數校驗規則
 */

import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, '請輸入客戶名稱').max(100, '客戶名稱過長'),
  companyName: z.string().max(100).optional().nullable(),
  taxId: z.string().max(20).optional().nullable(),
  contactPerson: z.string().min(1, '請輸入主要聯絡人').max(50),
  contactPhone: z.string().max(30).optional().nullable(),
  lineName: z.string().max(100).optional().nullable(),
  lineId: z.string().max(100).optional().nullable(),
  companyPhone: z.string().max(30).optional().nullable(),
  email: z.string().email('請輸入有效電子郵件').optional().or(z.literal('')).nullable(),
  address: z.string().max(200).optional().nullable(),
  systemType: z.string().max(50).optional().nullable(),
  requirementSummary: z.string().optional().nullable(),
  status: z.enum(['pending', 'negotiating', 'pending_signature', 'in_cooperation', 'delivered', 'lost']).optional().default('pending')
});

export const updateClientSchema = createClientSchema.partial();

export const createActivityLogSchema = z.object({
  contactType: z.enum(['line', 'phone', 'fb', 'ig', 'threads']),
  summary: z.string().min(1, '請輸入溝通摘要與紀要內容'),
  createdByName: z.string().min(1, '請輸入填寫人姓名').optional()
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateActivityLogInput = z.infer<typeof createActivityLogSchema>;
