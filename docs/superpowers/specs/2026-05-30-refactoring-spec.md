# 项目优化与重构方案

## 1. 后端优化 (Backend Refactoring)

### 1.1 引入 Pydantic 数据模型 (Schemas)
创建 `backend/schemas.py`，定义输入输出数据的强类型约束，提升 API 的安全性与文档化水平。

**主要模型包括**:
*   `FuturesQuoteBase`, `FuturesQuoteOut`
*   `FuturesKlineOut`
*   `ExpertAdviceOut` (包含建议、结论、雷达图数据)
*   `YijingForecastOut` (包含卦象数据、预测走势)

### 1.2 异常处理与日志
*   完善 `backend/scraper.py` 中的错误捕获。
*   引入 `logging` 模块替换 `print`。

## 2. 前端重构 (Frontend Refactoring)

### 2.1 组件化拆分
将 1300+ 行的 `App.tsx` 拆分为独立组件，存放在 `frontend/src/components` 目录下：

*   **KPI 面板**: `KpiDashboard.tsx` (展示价格、利润等核心指标卡片)
*   **合约列表**: `FuturesTable.tsx` (左侧合约实时报价列表)
*   **决策雷达与专家建议**: `ExpertPanel.tsx` (右侧决策结论与建议)
*   **图表视口**: `MainCharts.tsx` (期现收敛、基差、产能等图表切换)
*   **养殖计算器**: `BreedingCalculator.tsx` (成本利润模拟器)
*   **易经预测面板**: `YijingPanel.tsx` (卦象渲染与走势推演)

### 2.2 逻辑抽离 (Hooks)
创建 `frontend/src/hooks` 目录，封装业务逻辑：

*   `useAppData.ts`: 统一管理所有基本面数据的获取与定时刷新逻辑。
*   `useYijing.ts`: 专门管理易经起卦与预测状态。

---

## 执行步骤 (Implementation Steps)

1.  **后端重构**:
    *   [ ] 编写 `backend/schemas.py`。
    *   [ ] 修改 `backend/main.py` 路由，添加 `response_model`。
2.  **前端目录初始化**:
    *   [ ] 创建 `frontend/src/components` 和 `frontend/src/hooks`。
3.  **前端组件提取**:
    *   [ ] 依次提取各个功能模块至独立组件。
    *   [ ] 提取通用类型定义至 `frontend/src/types.ts`。
4.  **最终测试**:
    *   [ ] 验证数据流向是否正确，UI 交互是否无损。
