/**
 * @file index.ts
 * @description 後端伺服器入口檔案 / Backend Server Entry Point
 * @description_en Initializes Express app, registers API routes, middlewares, and connects to DB
 * @description_zh 初始化 Express 伺服器、註冊 RESTful 路由、驗證中間件與啟動資料庫自動種子初始化
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authController } from './controllers/auth.controller';
import { userController } from './controllers/user.controller';
import { clientController } from './controllers/client.controller';
import { projectController } from './controllers/project.controller';
import { healthController } from './controllers/health.controller';
import { kbController, uploadMiddleware } from './controllers/kb.controller';
import { authenticateToken, requireSuperAdmin } from './middlewares/auth.middleware';

import { errorHandler } from './middlewares/error.middleware';
import { initDatabaseAndSeed } from './utils/seed';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ========================================
// 基礎中介軟體 / Global Middlewares
// ========================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ========================================
// 路由註冊 (RESTful API /api/v1) / Routes
// ========================================
const apiRouter = express.Router();

// 1. 健康檢查 / Health Checks
apiRouter.get('/health', (req, res) => healthController.getHealth(req, res));
apiRouter.get('/health/liveness', (req, res) => healthController.getLiveness(req, res));
apiRouter.get('/health/readiness', (req, res) => healthController.getReadiness(req, res));

// 2. 認證模組 / Auth Module
apiRouter.post('/auth/login', (req, res, next) => authController.login(req, res, next));
apiRouter.post('/auth/logout', authenticateToken, (req, res, next) => authController.logout(req, res, next));
apiRouter.get('/auth/me', authenticateToken, (req, res, next) => authController.getMe(req, res, next));

// 3. 帳號管理 / Users Module
apiRouter.get('/users', authenticateToken, (req, res, next) => userController.getUsers(req, res, next));
apiRouter.get('/users/:id', authenticateToken, (req, res, next) => userController.getUserById(req, res, next));
apiRouter.post('/users', authenticateToken, requireSuperAdmin, (req, res, next) => userController.createUser(req, res, next));
apiRouter.put('/users/:id', authenticateToken, requireSuperAdmin, (req, res, next) => userController.updateUser(req, res, next));
apiRouter.delete('/users/:id', authenticateToken, requireSuperAdmin, (req, res, next) => userController.deleteUser(req, res, next));

// 4. 客戶關係管理 (CRM) / Clients Module
apiRouter.get('/clients', authenticateToken, (req, res, next) => clientController.getClients(req, res, next));
apiRouter.get('/clients/:id', authenticateToken, (req, res, next) => clientController.getClientById(req, res, next));
apiRouter.post('/clients', authenticateToken, requireSuperAdmin, (req, res, next) => clientController.createClient(req, res, next));
apiRouter.put('/clients/:id', authenticateToken, requireSuperAdmin, (req, res, next) => clientController.updateClient(req, res, next));
apiRouter.delete('/clients/:id', authenticateToken, requireSuperAdmin, (req, res, next) => clientController.deleteClient(req, res, next));
apiRouter.post('/clients/:id/activity-logs', authenticateToken, (req, res, next) => clientController.addActivityLog(req, res, next));

// 5. WBS 專案管理 / Projects Module
apiRouter.get('/projects', authenticateToken, (req, res, next) => projectController.getProjects(req, res, next));
apiRouter.get('/projects/:id', authenticateToken, (req, res, next) => projectController.getProjectById(req, res, next));
apiRouter.post('/projects', authenticateToken, requireSuperAdmin, (req, res, next) => projectController.createProject(req, res, next));
apiRouter.put('/projects/:id', authenticateToken, (req, res, next) => projectController.updateProject(req, res, next));
apiRouter.delete('/projects/:id', authenticateToken, requireSuperAdmin, (req, res, next) => projectController.deleteProject(req, res, next));
apiRouter.get('/projects/:id/wbs', authenticateToken, (req, res, next) => projectController.getWbsNodes(req, res, next));
apiRouter.put('/projects/:id/wbs', authenticateToken, (req, res, next) => projectController.saveWbsNodes(req, res, next));
apiRouter.post('/projects/:id/change-orders', authenticateToken, (req, res, next) => projectController.addChangeOrder(req, res, next));

// 6. 知識庫管理與檢索 / Knowledge Base Module
apiRouter.post('/kb/documents', authenticateToken, uploadMiddleware.single('file'), (req, res, next) => kbController.uploadDocument(req, res, next));
apiRouter.get('/kb/documents', authenticateToken, (req, res, next) => kbController.getDocuments(req, res, next));
apiRouter.get('/kb/documents/:id', authenticateToken, (req, res, next) => kbController.getDocumentById(req, res, next));
apiRouter.get('/kb/documents/:id/chunks', authenticateToken, (req, res, next) => kbController.getDocumentChunks(req, res, next));
apiRouter.delete('/kb/documents/:id', authenticateToken, requireSuperAdmin, (req, res, next) => kbController.deleteDocument(req, res, next));
apiRouter.post('/kb/search', authenticateToken, (req, res, next) => kbController.searchChunks(req, res, next));

app.use('/api/v1', apiRouter);


// ========================================
// 404 與全局錯誤攔截 / Error Handling
// ========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `找不到請求路徑 ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

// ========================================
// 啟動伺服器與資料庫種子初始化 / Server Start
// ========================================
async function startServer() {
  // 初始化資料庫擴充、表格與管理員種子
  try {
    await initDatabaseAndSeed();
  } catch (err) {
    console.warn('⚠️ 資料庫初次連線初始化未完成，伺服器將持續嘗試重試連線...');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Liheng Backend] 伺服器成功運行於 http://0.0.0.0:${PORT}`);
    console.log(`👉 健康檢查端點: http://localhost:${PORT}/api/v1/health`);
  });
}

startServer();
