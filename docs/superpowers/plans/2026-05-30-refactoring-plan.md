# 生猪期货监控系统优化重构计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 通过引入后端 Pydantic 校验和前端组件化重构，提升代码可读性、健壮性和维护效率。

**Architecture:** 后端采用 Pydantic 定义 API 契约；前端采用组件拆分与自定义 Hooks 逻辑解耦。

**Tech Stack:** FastAPI, Pydantic, React 19, TypeScript.

---

### Task 1: 后端 Pydantic Schemas 引入

**Files:**
- Create: `backend/schemas.py`
- Modify: `backend/main.py`

- [ ] **Step 1: 创建 schemas.py 并定义基本模型**

```python
from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional, Dict

class FuturesQuoteOut(BaseModel):
    symbol: str
    name: str
    last_price: float
    volume: float
    open_interest: float
    time: str

    class Config:
        from_attributes = True

class ExpertAdviceOut(BaseModel):
    status: str
    date: date
    spot_price: float
    futures_price: float
    warning_level: str
    conclusion: Dict
    advice: Dict
```

- [ ] **Step 2: 修改 main.py 使用 response_model**

```python
from . import schemas

@app.get("/api/futures/realtime", response_model=List[schemas.FuturesQuoteOut])
def get_realtime_futures(db: Session = Depends(get_db)):
    # ... logic
```

- [ ] **Step 3: 验证后端 API 文档**

运行: `curl http://localhost:8000/docs` 并检查 Schema 是否正确显示。

---

### Task 2: 前端类型与 Hooks 抽离

**Files:**
- Create: `frontend/src/types.ts`
- Create: `frontend/src/hooks/useAppData.ts`

- [ ] **Step 1: 提取所有 TypeScript 接口到 types.ts**

将 `App.tsx` 中定义的 `FuturesQuote`, `ExpertAdvice` 等接口移至新文件。

- [ ] **Step 2: 创建 useAppData Hook**

将 `App.tsx` 中的数据获取逻辑 (`fetchStaticData`, `fetchRealtimeQuotes`, `setInterval` 刷新逻辑) 封装进 `useAppData`。

---

### Task 3: 前端 UI 组件拆分

**Files:**
- Create: `frontend/src/components/KpiDashboard.tsx`
- Create: `frontend/src/components/ExpertPanel.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 提取 KPI 面板组件**
- [ ] **Step 2: 提取专家决策建议组件**
- [ ] **Step 3: 在 App.tsx 中引用新组件并验证渲染**

---

### Task 4: 易经预测面板模块化

**Files:**
- Create: `frontend/src/components/YijingPanel.tsx`

- [ ] **Step 1: 提取 YijingPanel 及其子组件 MiniGuaSymbol**
- [ ] **Step 2: 验证易经起卦功能与图表渲染**

---
