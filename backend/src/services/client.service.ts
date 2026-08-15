/**
 * @file client.service.ts
 * @description CRM 客戶業務邏輯層 / Client Service
 * @description_en Handles business logic for client management and interaction history
 * @description_zh 處理客戶建檔、資料更新、軟刪除與聯繫歷史記錄之商業邏輯
 */

import { clientRepository } from '../repositories/client.repository';
import { projectRepository } from '../repositories/project.repository';
import { CreateClientInput, UpdateClientInput, CreateActivityLogInput } from '../schemas/client.schema';

export class ClientService {
  /**
   * 取得客戶清單 (附帶名下專案資訊) / Get clients list with associated projects
   */
  async getClients(filter?: { status?: string; search?: string }) {
    const clientList = await clientRepository.findAll(filter);
    const allProjects = await projectRepository.findAll();

    return clientList.map((client) => {
      const relatedProjects = allProjects.filter((p) => p.clientId === client.id);
      return {
        ...client,
        projectsCount: relatedProjects.length,
        projects: relatedProjects.map((p) => ({
          id: p.id,
          projectCode: p.projectCode,
          name: p.name,
          stage: p.stage,
          progressPercent: p.progressPercent
        }))
      };
    });
  }

  /**
   * 取得單一客戶詳情 (包含聯繫歷史日誌與專案) / Get client details by ID
   */
  async getClientById(id: string) {
    const client = await clientRepository.findById(id);
    if (!client) {
      const error: any = new Error('找不到該客戶資料');
      error.statusCode = 404;
      error.code = 'CLIENT_NOT_FOUND';
      throw error;
    }

    const logs = await clientRepository.findActivityLogsByClientId(id);
    const relatedProjects = await projectRepository.findAll({ clientId: id });

    return {
      ...client,
      logs: logs.map((log) => ({
        id: log.id,
        clientId: log.clientId,
        date: log.activityDate ? new Date(log.activityDate).toISOString().replace('T', ' ').substring(0, 16) : '',
        type: log.contactType,
        summary: log.summary,
        createdByName: log.createdByName
      })),
      projects: relatedProjects
    };
  }

  /**
   * 建立新客戶 / Create new client
   */
  async createClient(input: CreateClientInput) {
    const created = await clientRepository.create({
      name: input.name,
      companyName: input.companyName || null,
      taxId: input.taxId || null,
      contactPerson: input.contactPerson,
      contactPhone: input.contactPhone,
      companyPhone: input.companyPhone || null,
      email: input.email || null,
      address: input.address || null,
      systemType: input.systemType || null,
      requirementSummary: input.requirementSummary || null,
      status: input.status || 'pending'
    });

    return created;
  }

  /**
   * 更新客戶 / Update client
   */
  async updateClient(id: string, input: UpdateClientInput) {
    const existing = await clientRepository.findById(id);
    if (!existing) {
      const error: any = new Error('找不到該客戶資料');
      error.statusCode = 404;
      error.code = 'CLIENT_NOT_FOUND';
      throw error;
    }

    const updated = await clientRepository.update(id, input as any);
    return updated;
  }

  /**
   * 軟刪除客戶 / Delete client
   */
  async deleteClient(id: string) {
    const existing = await clientRepository.findById(id);
    if (!existing) {
      const error: any = new Error('找不到該客戶資料');
      error.statusCode = 404;
      error.code = 'CLIENT_NOT_FOUND';
      throw error;
    }

    const success = await clientRepository.softDelete(id);
    return { success };
  }

  /**
   * 新增客戶聯繫日誌 / Add activity log
   */
  async addActivityLog(clientId: string, input: CreateActivityLogInput, user?: any) {
    const existing = await clientRepository.findById(clientId);
    if (!existing) {
      const error: any = new Error('找不到該客戶資料');
      error.statusCode = 404;
      error.code = 'CLIENT_NOT_FOUND';
      throw error;
    }

    const createdByName = input.createdByName || user?.username || '專案業務代表';

    const log = await clientRepository.addActivityLog({
      clientId,
      userId: user?.userId || null,
      createdByName,
      contactType: input.contactType,
      summary: input.summary,
      activityDate: new Date()
    });

    return {
      id: log.id,
      clientId: log.clientId,
      date: new Date(log.activityDate).toISOString().replace('T', ' ').substring(0, 16),
      type: log.contactType,
      summary: log.summary,
      createdByName: log.createdByName
    };
  }
}

export const clientService = new ClientService();
