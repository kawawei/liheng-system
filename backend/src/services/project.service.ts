/**
 * @file project.service.ts
 * @description WBS 專案管理業務邏輯層 / Project & WBS Service
 * @description_en Handles project chartering, atomic code generation, WBS tree assembly, and change orders
 * @description_zh 負責專案正式立案、Redis 案號生成、WBS 樹狀工項計算與需求變更單管理
 */

import { projectRepository } from '../repositories/project.repository';
import { clientRepository } from '../repositories/client.repository';
import { generateSequentialCode } from '../utils/generator';
import { CreateProjectInput, UpdateProjectInput, CreateChangeOrderInput } from '../schemas/project.schema';

export class ProjectService {
  /**
   * 取得專案清單 / Get projects list
   */
  async getProjects(filter?: { stage?: string; search?: string; clientId?: string }) {
    const projects = await projectRepository.findAll(filter);
    return projects.map((p) => ({
      id: p.id,
      projectCode: p.projectCode,
      name: p.name,
      clientId: p.clientId,
      clientName: p.clientName,
      stage: p.stage,
      healthStatus: p.healthStatus,
      progressPercent: p.progressPercent,
      assignedEngineers: (p.assignedEngineers as string[]) || [],
      startDate: p.startDate,
      durationDays: p.durationDays,
      expectedDeliveryDate: p.expectedDeliveryDate,
      taxType: p.taxType,
      isTaxAdded: p.isTaxAdded,
      amountUntaxed: Number(p.amountUntaxed) || 0,
      taxAmount: Number(p.taxAmount) || 0,
      amountTotal: Number(p.amountTotal) || 0,
      paymentStages: (p.paymentStages as any[]) || [],
      changeOrders: (p.changeOrders as any[]) || [],
      createdAt: p.createdAt
    }));
  }

  /**
   * 取得單一專案詳情與 WBS 節點 / Get project by ID or code
   */
  async getProjectById(idOrCode: string) {
    const project = await projectRepository.findById(idOrCode);
    if (!project) {
      const error: any = new Error('找不到該專案資料');
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    const wbsNodes = await projectRepository.findWbsNodes(project.id);

    return {
      id: project.id,
      projectCode: project.projectCode,
      name: project.name,
      clientId: project.clientId,
      clientName: project.clientName,
      stage: project.stage,
      healthStatus: project.healthStatus,
      progressPercent: project.progressPercent,
      assignedEngineers: (project.assignedEngineers as string[]) || [],
      startDate: project.startDate,
      durationDays: project.durationDays,
      expectedDeliveryDate: project.expectedDeliveryDate,
      taxType: project.taxType,
      isTaxAdded: project.isTaxAdded,
      amountUntaxed: Number(project.amountUntaxed) || 0,
      taxAmount: Number(project.taxAmount) || 0,
      amountTotal: Number(project.amountTotal) || 0,
      paymentStages: (project.paymentStages as any[]) || [],
      changeOrders: (project.changeOrders as any[]) || [],
      wbsNodes: wbsNodes.map((n) => ({
        id: n.id,
        projectId: n.projectId,
        parentId: n.parentId,
        wbsCode: n.wbsCode,
        name: n.name,
        status: n.status,
        plannedStartDate: n.plannedStartDate,
        plannedEndDate: n.plannedEndDate,
        plannedDurationDays: n.plannedDurationDays,
        actualStartDate: n.actualStartDate,
        actualEndDate: n.actualEndDate,
        actualDurationDays: n.actualDurationDays,
        progress: n.progress,
        assignees: (n.assignees as string[]) || [],
        isMilestone: n.isMilestone,
        predecessorCode: n.predecessorCode,
        dependencyType: n.dependencyType,
        allowPullForward: n.allowPullForward,
        isExpanded: n.isExpanded
      })),
      createdAt: project.createdAt
    };
  }

  /**
   * 建立新專案 (正式立案) / Create project
   */
  async createProject(input: CreateProjectInput) {
    const projectCode = input.projectCode || (await generateSequentialCode('PJ'));

    // 若關聯客戶，自動推進客戶狀態為合作中
    if (input.clientId) {
      await clientRepository.update(input.clientId, { status: 'in_cooperation' });
    }

    const created = await projectRepository.create({
      projectCode,
      name: input.name,
      clientId: input.clientId || null,
      clientName: input.clientName,
      stage: input.stage || 'development',
      healthStatus: input.healthStatus || 'healthy',
      progressPercent: input.progressPercent || 0,
      assignedEngineers: input.assignedEngineers || [],
      startDate: input.startDate || new Date().toISOString().split('T')[0],
      durationDays: input.durationDays || 90,
      expectedDeliveryDate: input.expectedDeliveryDate || null,
      taxType: input.taxType || 'tax_exclusive',
      isTaxAdded: input.isTaxAdded !== false,
      amountUntaxed: String(input.amountUntaxed || 0),
      taxAmount: String(input.taxAmount || 0),
      amountTotal: String(input.amountTotal || 0),
      paymentStages: input.paymentStages || [],
      changeOrders: input.changeOrders || []
    });

    return created;
  }

  /**
   * 更新專案 / Update project
   */
  async updateProject(id: string, input: UpdateProjectInput) {
    const existing = await projectRepository.findById(id);
    if (!existing) {
      const error: any = new Error('找不到該專案資料');
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    const updateData: any = { ...input };
    if (input.amountUntaxed !== undefined) updateData.amountUntaxed = String(input.amountUntaxed);
    if (input.taxAmount !== undefined) updateData.taxAmount = String(input.taxAmount);
    if (input.amountTotal !== undefined) updateData.amountTotal = String(input.amountTotal);

    const updated = await projectRepository.update(existing.id, updateData);
    return updated;
  }

  /**
   * 軟刪除專案 / Soft delete project
   */
  async deleteProject(id: string) {
    const existing = await projectRepository.findById(id);
    if (!existing) {
      const error: any = new Error('找不到該專案資料');
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    const success = await projectRepository.softDelete(existing.id);
    return { success };
  }

  /**
   * 查詢 WBS 節點 / Get WBS nodes
   */
  async getWbsNodes(projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const error: any = new Error('找不到該專案資料');
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    return await projectRepository.findWbsNodes(project.id);
  }

  /**
   * 儲存 WBS 節點清冊 / Batch save WBS nodes
   */
  async saveWbsNodes(projectId: string, nodes: any[]) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const error: any = new Error('找不到該專案資料');
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    return await projectRepository.saveWbsNodes(project.id, nodes);
  }

  /**
   * 追加需求變更單 / Add change order
   */
  async addChangeOrder(projectId: string, input: CreateChangeOrderInput) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const error: any = new Error('找不到該專案資料');
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    const coCode = await generateSequentialCode('CO');
    const newCO = {
      id: `co_${Date.now()}`,
      code: coCode,
      title: input.title,
      amountUntaxed: input.amountUntaxed,
      taxAmount: input.taxAmount,
      amountTotal: input.amountTotal,
      addedDays: input.addedDays,
      status: input.status || 'approved',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const currentChangeOrders = (project.changeOrders as any[]) || [];
    const updatedChangeOrders = [newCO, ...currentChangeOrders];

    // 若工期有增加，更新專案預計交付日期
    let updatePayload: any = { changeOrders: updatedChangeOrders };
    if (input.addedDays > 0 && project.expectedDeliveryDate) {
      const currentEnd = new Date(project.expectedDeliveryDate);
      currentEnd.setDate(currentEnd.getDate() + input.addedDays);
      updatePayload.expectedDeliveryDate = currentEnd.toISOString().split('T')[0];
      updatePayload.durationDays = (project.durationDays || 0) + input.addedDays;
    }

    await projectRepository.update(project.id, updatePayload);
    return newCO;
  }
}

export const projectService = new ProjectService();
