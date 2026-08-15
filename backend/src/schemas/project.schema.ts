/**
 * @file project.schema.ts
 * @description WBS 專案模組 Zod 校驗規則 / WBS Project Zod Schemas
 * @description_en Validation schema for project chartering, status update, WBS tree, and change orders
 * @description_zh 專案正式立案、階段更新、WBS 工作分解結構節點與需求變更單校驗
 */

import { z } from 'zod';

export const paymentStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  percentage: z.number().min(0).max(100),
  amount: z.number().min(0),
  status: z.enum(['pending', 'invoiced', 'received']),
  dueDate: z.string().optional(),
  invoiceNumber: z.string().optional()
});

export const changeOrderSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string().min(1, '請輸入變更單標題'),
  amountUntaxed: z.number().min(0),
  taxAmount: z.number().min(0),
  amountTotal: z.number().min(0),
  addedDays: z.number().min(0),
  status: z.enum(['pending', 'approved', 'rejected']).default('approved'),
  createdAt: z.string()
});

export const createProjectSchema = z.object({
  name: z.string().min(1, '請輸入專案名稱').max(150),
  projectCode: z.string().optional(),
  clientId: z.string().optional().nullable(),
  clientName: z.string().min(1, '請輸入客戶名稱'),
  stage: z.enum(['development', 'testing', 'delivery', 'closed', 'maintenance']).optional().default('development'),
  healthStatus: z.enum(['healthy', 'warning', 'error']).optional().default('healthy'),
  progressPercent: z.number().min(0).max(100).optional().default(0),
  assignedEngineers: z.array(z.string()).optional().default([]),
  startDate: z.string().optional(),
  durationDays: z.number().min(0).optional().default(0),
  expectedDeliveryDate: z.string().optional(),
  taxType: z.enum(['tax_exclusive', 'tax_inclusive']).optional().default('tax_exclusive'),
  isTaxAdded: z.boolean().optional().default(true),
  amountUntaxed: z.number().min(0).optional().default(0),
  taxAmount: z.number().min(0).optional().default(0),
  amountTotal: z.number().min(0).optional().default(0),
  paymentStages: z.array(paymentStageSchema).optional().default([]),
  changeOrders: z.array(changeOrderSchema).optional().default([])
});

export const updateProjectSchema = createProjectSchema.partial();

export const wbsNodeSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  parentId: z.string().optional().nullable(),
  wbsCode: z.string(),
  name: z.string().min(1, '工項名稱不可為空'),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  plannedStartDate: z.string().optional().nullable(),
  plannedEndDate: z.string().optional().nullable(),
  plannedDurationDays: z.number().optional().nullable(),
  actualStartDate: z.string().optional().nullable(),
  actualEndDate: z.string().optional().nullable(),
  actualDurationDays: z.number().optional().nullable(),
  progress: z.number().min(0).max(100).default(0),
  assignees: z.array(z.string()).optional().default([]),
  isMilestone: z.boolean().optional().default(false),
  predecessorCode: z.string().optional().nullable(),
  dependencyType: z.enum(['FS', 'FF', 'SS', 'SF']).optional().nullable(),
  allowPullForward: z.boolean().optional().default(false),
  isExpanded: z.boolean().optional().default(true)
});

export const saveWbsNodesSchema = z.object({
  nodes: z.array(wbsNodeSchema)
});

export const createChangeOrderInputSchema = z.object({
  title: z.string().min(1, '請輸入變更單主題'),
  amountUntaxed: z.number().min(0),
  taxAmount: z.number().min(0),
  amountTotal: z.number().min(0),
  addedDays: z.number().min(0),
  status: z.enum(['pending', 'approved', 'rejected']).optional().default('approved')
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type WbsNodeInput = z.infer<typeof wbsNodeSchema>;
export type CreateChangeOrderInput = z.infer<typeof createChangeOrderInputSchema>;
