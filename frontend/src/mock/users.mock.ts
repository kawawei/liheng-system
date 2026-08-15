/**
 * @file users.mock.ts
 * @description 帳號管理初始模擬資料 / Account Management Mock Data
 * @description_en Initial mock dataset for user accounts with defined roles (super_admin, engineer)
 * @description_zh 提供系統帳號管理初始模擬資料，包含超級管理員與軟體工程師帳號
 */

import { UserAccount } from '../types';

export const INITIAL_USERS_MOCK: UserAccount[] = [
  {
    id: 'usr_001',
    name: '系統管理員',
    account: 'admin',
    password: 'password123',
    role: 'super_admin',
    createdAt: '2026-01-01',
    status: 'active'
  },
  {
    id: 'usr_002',
    name: '林書豪 (RD)',
    account: 'engineer_lin',
    password: 'password123',
    role: 'engineer',
    createdAt: '2026-02-15',
    status: 'active'
  },
  {
    id: 'usr_003',
    name: '陳柏宇 (RD)',
    account: 'engineer_chen',
    password: 'password123',
    role: 'engineer',
    createdAt: '2026-03-10',
    status: 'active'
  },
  {
    id: 'usr_004',
    name: '黃雅琪 (RD)',
    account: 'engineer_huang',
    password: 'password123',
    role: 'engineer',
    createdAt: '2026-04-20',
    status: 'active'
  }
];
