/**
 * @file user.repository.ts
 * @description 使用者資料存取層 / User Repository
 * @description_en Handles database CRUD operations for users table using Drizzle ORM
 * @description_zh 負責使用者資料表之新增、查詢、更新與軟刪除資料庫操作
 */

import { eq, and, isNull, or, ilike, desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users, User, NewUser } from '../schemas/schema.js';

export class UserRepository {
  /**
   * 根據使用者名稱尋找啟用中的使用者 / Find active user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 根據 ID 尋找使用者 / Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 取得所有未刪除使用者列表 / Get all non-deleted users
   */
  async findAll(filter?: { role?: string; search?: string }): Promise<User[]> {
    const conditions = [isNull(users.deletedAt)];

    if (filter?.role && filter.role !== 'all') {
      conditions.push(eq(users.role, filter.role));
    }

    if (filter?.search && filter.search.trim()) {
      const searchPattern = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(users.username, searchPattern),
          ilike(users.realName, searchPattern)
        )!
      );
    }

    return await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));
  }

  /**
   * 新增使用者 / Create new user
   */
  async create(data: NewUser): Promise<User> {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  }

  /**
   * 更新使用者 / Update user by ID
   */
  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    const result = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();

    return result[0] || null;
  }

  /**
   * 軟刪除使用者 / Soft delete user by setting deletedAt
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        isActive: false
      })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning({ id: users.id });

    return result.length > 0;
  }

  /**
   * 統計使用者總數 / Count total active users
   */
  async count(): Promise<number> {
    const list = await db
      .select()
      .from(users)
      .where(isNull(users.deletedAt));
    return list.length;
  }
}

export const userRepository = new UserRepository();
