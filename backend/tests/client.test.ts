/**
 * @file client.test.ts
 * @description CRM 客戶管理模組自動化測試 / CRM Client Module Automated Test Suite
 * @description_en Validates client creation, querying, updating, activity logs, and soft deletion
 * @description_zh 驗證客戶模組之 CRUD 商業邏輯、搜尋篩選、聯繫歷史紀錄與軟刪除機制
 */

import { clientService } from '../src/services/client.service';
import { clientRepository } from '../src/repositories/client.repository';
import { pool } from '../src/config/database';

async function runClientTests() {
  console.log('🧪 開始執行 CRM 客戶管理模組自動化測試...');
  let testClientId: string | null = null;

  try {
    // 1. 測試建立客戶
    console.log('\n--- 1. 測試建立客戶 (含 LINE 資訊與選填電話) ---');
    const created = await clientService.createClient({
      name: '立衡自動化測試科技',
      companyName: '立衡測試股份有限公司',
      taxId: '88889999',
      contactPerson: '王測試',
      contactPhone: '0912-345-678',
      lineName: '王小試',
      lineId: 'wang_test_88',
      systemType: '物聯網監控系統',
      requirementSummary: '需求概要：自動化端對端測試專用紀錄',
      status: 'pending'
    });

    if (!created.id || created.name !== '立衡自動化測試科技') {
      throw new Error('客戶建檔失敗或回傳資料不相符');
    }
    testClientId = created.id;
    console.log(`✅ 客戶建檔成功，ID: ${created.id}`);

    // 2. 測試查詢列表與關鍵字搜尋
    console.log('\n--- 2. 測試客戶清單與關鍵字搜尋 ---');
    const searchResults = await clientService.getClients({ search: '王小試' });
    const foundByLineName = searchResults.some((c) => c.id === testClientId);
    if (!foundByLineName) {
      throw new Error('透過 LINE 名稱搜尋客戶失敗');
    }
    console.log('✅ 透過 LINE 名稱模糊搜尋成功！');

    const searchByLineId = await clientService.getClients({ search: 'wang_test_88' });
    const foundByLineId = searchByLineId.some((c) => c.id === testClientId);
    if (!foundByLineId) {
      throw new Error('透過 LINE ID 搜尋客戶失敗');
    }
    console.log('✅ 透過 LINE ID 模糊搜尋成功！');

    // 3. 測試取得單一客戶詳情
    console.log('\n--- 3. 測試取得單一客戶詳情 ---');
    const detail = await clientService.getClientById(testClientId);
    if (detail.contactPerson !== '王測試' || detail.lineName !== '王小試') {
      throw new Error('客戶詳情資料不正確');
    }
    console.log('✅ 成功取得客戶完整詳情！');

    // 4. 測試更新客戶資料
    console.log('\n--- 4. 測試更新客戶資料 ---');
    const updated = await clientService.updateClient(testClientId, {
      companyName: '立衡軟體研發股份有限公司',
      status: 'negotiating'
    });
    if (updated?.companyName !== '立衡軟體研發股份有限公司' || updated?.status !== 'negotiating') {
      throw new Error('更新客戶資料失敗');
    }
    console.log('✅ 客戶資料與合作狀態更新成功！');

    // 5. 測試新增客戶跟進日誌
    console.log('\n--- 5. 測試新增客戶跟進日誌 ---');
    const log = await clientService.addActivityLog(
      testClientId,
      {
        contactType: 'line',
        summary: '透過 LINE 確認初步系統架構與規格需求',
        createdByName: '測試工程師'
      },
      { username: 'admin', userId: 'd76f5692-46f1-4d7d-a72f-d568f6bca417', role: 'super_admin' }
    );
    if (!log.id || log.summary !== '透過 LINE 確認初步系統架構與規格需求') {
      throw new Error('新增客戶跟進日誌失敗');
    }
    console.log(`✅ 成功新增跟進日誌，ID: ${log.id}`);

    // 6. 測試軟刪除客戶
    console.log('\n--- 6. 測試軟刪除客戶 ---');
    const deleteResult = await clientService.deleteClient(testClientId);
    if (!deleteResult.success) {
      throw new Error('軟刪除客戶失敗');
    }

    // 驗證已軟刪除的客戶無法被一般查詢取得
    const afterDeleteList = await clientService.getClients({ search: '立衡自動化測試科技' });
    const isStillPresent = afterDeleteList.some((c) => c.id === testClientId);
    if (isStillPresent) {
      throw new Error('軟刪除後客戶依然存在於列表中');
    }
    console.log('✅ 軟刪除客戶驗證成功 (已標記 deleted_at 且自動於清單中排除)！');

    console.log('\n🎉 CRM 客戶管理模組所有測試案例皆 100% 通過！');
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  } finally {
    // 徹底清理資料庫測試資料
    if (testClientId) {
      await pool.query(`DELETE FROM client_activity_logs WHERE client_id = $1`, [testClientId]);
      await pool.query(`DELETE FROM clients WHERE id = $1`, [testClientId]);
    }
    await pool.end();
  }
}

runClientTests();
