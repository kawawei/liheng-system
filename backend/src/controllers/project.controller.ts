/**
 * @file project.controller.ts
 * @description WBS 專案管理控制器 / Project Controller
 * @description_en Handles HTTP requests for project CRUD, WBS tree sync, and change orders
 * @description_zh 處理專案主表清單、詳情、立案、更新、軟刪除、WBS 樹狀節點與追加變更單之 HTTP 請求與響應
 */

import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import {
  createProjectSchema,
  updateProjectSchema,
  saveWbsNodesSchema,
  createChangeOrderInputSchema
} from '../schemas/project.schema';

export class ProjectController {
  /**
   * 取得專案清單 / Get Projects List
   * GET /api/v1/projects
   */
  async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stage = req.query.stage as string | undefined;
      const search = req.query.search as string | undefined;
      const clientId = req.query.clientId as string | undefined;

      const projects = await projectService.getProjects({ stage, search, clientId });

      res.status(200).json({
        success: true,
        data: projects,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得單一專案詳情 / Get Project By ID
   * GET /api/v1/projects/:id
   */
  async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const project = await projectService.getProjectById(id);

      res.status(200).json({
        success: true,
        data: project,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 建立專案 (正式立案) / Create Project
   * POST /api/v1/projects
   */
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = createProjectSchema.parse(req.body);
      const newProject = await projectService.createProject(validatedInput);

      res.status(201).json({
        success: true,
        data: newProject,
        message: '專案立案成功',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新專案 / Update Project
   * PUT /api/v1/projects/:id
   */
  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedInput = updateProjectSchema.parse(req.body);
      const updatedProject = await projectService.updateProject(id, validatedInput);

      res.status(200).json({
        success: true,
        data: updatedProject,
        message: '專案資料更新成功',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刪除專案 / Delete Project
   * DELETE /api/v1/projects/:id
   */
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await projectService.deleteProject(id);

      res.status(200).json({
        success: true,
        message: '專案已成功刪除',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得專案 WBS 節點清單 / Get WBS Nodes
   * GET /api/v1/projects/:id/wbs
   */
  async getWbsNodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const nodes = await projectService.getWbsNodes(id);

      res.status(200).json({
        success: true,
        data: nodes,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批次儲存 WBS 節點清冊 / Batch Save WBS Nodes
   * PUT /api/v1/projects/:id/wbs
   */
  async saveWbsNodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedInput = saveWbsNodesSchema.parse(req.body);
      const savedNodes = await projectService.saveWbsNodes(id, validatedInput.nodes);

      res.status(200).json({
        success: true,
        data: savedNodes,
        message: 'WBS 里程碑工項已同步儲存',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 追加需求變更單 / Add Change Order
   * POST /api/v1/projects/:id/change-orders
   */
  async addChangeOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedInput = createChangeOrderInputSchema.parse(req.body);
      const co = await projectService.addChangeOrder(id, validatedInput);

      res.status(201).json({
        success: true,
        data: co,
        message: '需求變更單已成功追加',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
