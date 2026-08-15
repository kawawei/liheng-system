/**
 * @file client.controller.ts
 * @description CRM 客戶管理控制器 / Client Controller
 * @description_en Handles HTTP requests for client CRUD and interaction activity logs
 * @description_zh 處理客戶清單、資料詳情、建檔、修改、軟刪除與跟進日誌之 HTTP 請求與響應
 */

import { Request, Response, NextFunction } from 'express';
import { clientService } from '../services/client.service';
import { createClientSchema, updateClientSchema, createActivityLogSchema } from '../schemas/client.schema';

export class ClientController {
  /**
   * 取得客戶清單 / Get Clients List
   * GET /api/v1/clients
   */
  async getClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const clients = await clientService.getClients({ status, search });

      res.status(200).json({
        success: true,
        data: clients,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得單一客戶詳情 / Get Client By ID
   * GET /api/v1/clients/:id
   */
  async getClientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const client = await clientService.getClientById(id);

      res.status(200).json({
        success: true,
        data: client,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 建立客戶 / Create Client
   * POST /api/v1/clients
   */
  async createClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = createClientSchema.parse(req.body);
      const newClient = await clientService.createClient(validatedInput);

      res.status(201).json({
        success: true,
        data: newClient,
        message: '客戶建檔成功',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新客戶 / Update Client
   * PUT /api/v1/clients/:id
   */
  async updateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedInput = updateClientSchema.parse(req.body);
      const updatedClient = await clientService.updateClient(id, validatedInput);

      res.status(200).json({
        success: true,
        data: updatedClient,
        message: '客戶資料更新成功',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刪除客戶 / Delete Client
   * DELETE /api/v1/clients/:id
   */
  async deleteClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await clientService.deleteClient(id);

      res.status(200).json({
        success: true,
        message: '客戶資料已成功刪除',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 新增跟進聯繫日誌 / Add Client Activity Log
   * POST /api/v1/clients/:id/activity-logs
   */
  async addActivityLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedInput = createActivityLogSchema.parse(req.body);
      const log = await clientService.addActivityLog(id, validatedInput, req.user);

      res.status(201).json({
        success: true,
        data: log,
        message: '聯繫紀錄已新增',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const clientController = new ClientController();
