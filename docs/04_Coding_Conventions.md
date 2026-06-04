# 生猪期货基本面数据监控与决策系统 - 编码规范与 AI 开发约束 (Coding Conventions)

本规范为本项目的编码标准与质量准绳。所有未来的 AI 编码助手或开发者在修改、重构或扩展本项目代码时，**必须严格遵守**本规范中所列之各项约束条件。

---

## 1. 后端开发约束 (Backend Standards)

后端采用 **FastAPI + SQLAlchemy + Pydantic**，业务代码设计需遵循以下约束：

### 1.1 ORM 实体与时序数据设计
- **主键与索引**：所有基本面时序表必须包含 `id` (Integer PK) 与 `date` (Date/DateTime)。涉及时间序列的查询，`date` 字段必须声明 `index=True`。
- **唯一约束**：防止数据重复拉取。如涉及合约的日K线或关键字的每日舆情，应在 `__table_args__` 中显式声明联合唯一索引：
  ```python
  __table_args__ = (
      Index('idx_keyword_date', 'keyword', 'date', unique=True),
  )
  ```

### 1.2 数据采集（Scraper）稳定性原则
- **超时拦截**：由于国内财经/行业数据接口存在网络波动，所有的外部 `requests.get/post` 必须配置明确的 `timeout`（行情抓取不得超过 5s，普通页面不得超过 10s）。
- **异常捕获与降级**：禁止发生因单个爬虫失败而阻塞整个同步线程的情况。每个采集点必须包含 `try-except` 并记录日志：
  ```python
  try:
      r = requests.get(url, headers=headers, timeout=8)
      # ... 解析与存库
  except Exception as e:
      logger.error(f"Error scraping X: {str(e)}")
  ```
- **数据连续性与 Seeding 机制**：
  - 不得使用静态硬编码的 placeholder 脏数据。
  - 新增时序数据表时，必须在 [scraper.py](file:///home/skn01/qihuo/backend/scraper.py) 中编写对应的历史模拟播种器（Seeder），生成自 `2025-01-01` 至今的合理时序数据，其波动需与生猪现货价格（`SpotPrice`）呈合理的数学相关或季节性波动，以确保时序图表的连贯性。

### 1.3 强类型 Pydantic Schema 校验
- 所有新增的 REST API 请求体（Request Body）与响应体（Response Payload）必须使用 Pydantic Model 在 `schemas.py` 中进行数据模型规约，并在路由声明中进行 `response_model` 绑定。

---

## 2. 前端开发约束 (Frontend Standards)

前端采用 **React + TypeScript + Vite + Recharts**，必须遵循严格的编译规范：

### 2.1 严格类型与无害编译
- **禁止使用 `any`**：所有组件 Props、API 响应和 Hook 数据状态必须使用严谨的 TypeScript Interface 或 Type 进行类型声明。
- **清理无用定义**：Vite 编译环境启用了极严格的 TypeScript 校验规则（如 `noUnusedLocals` / `noUnusedParameters`）。**禁止**保留任何未使用的变量定义、参数或未使用的 Type 导入（这会导致 `npm run build` 挂掉）。

### 2.2 响应式大屏与极客暗黑美学 (Aesthetics)
- **色调与 CSS 变量**：页面及图表配色必须融入原生的暗黑大屏极客风格，图表线条及填充需统一使用以下 CSS 变量或其半透明 RGBA 色值：
  - 上涨颜色（多头）：`var(--color-up)`
  - 下跌颜色（空头）：`var(--color-down)`
  - 辅助强调色（基差/舆情）：`var(--color-accent)`
  - 警示色：`var(--color-warn)`
  - 文本灰度色：`var(--text-muted)`
- **图表适配约束**：
  - 图表必须封装在 ResponsiveContainer 中。
  - 图表网格线统一使用极淡色值：`stroke="rgba(255,255,255,0.03)"`。
  - 所有的 Recharts 图表必须配置统一的自定义 Tooltip (`<Tooltip content={<CustomChartTooltip />} />`)，保证悬浮浮层样式一致，禁止使用浏览器默认 Tooltip。
  - 所有的图表必须包裹在具有 `.glass-panel` 类名的圆角毛玻璃容器中。

---

## 3. API 数据流与网络层约束 (Data Flow & Networking)

- **避免高频请求过载**：前端与后端的行情数据刷新应避免采用固定短周期的强轮询（Poller）。应使用 `useAppData` 中实现的“非均匀随机抖动倒计时机制”（例如在 60s 到 600s 间引入随机噪声进行重新计算），缓解高并发下对数据库的瞬时读取压力。
- **跨域与代理映射**：所有前端的底层 API 请求应通过相对路径发出（如 `/api/expert/advice`），而不能直接请求写死的 `http://localhost:8000`，以便于 Nginx 容器代理的反向映射。

---

## 4. 代码提交与变更核验约束 (Git Commit & Verification)

任何代码修改或功能提交（包括 AI 助手自动发起的 commit 推荐），**必须无条件通过**以下前置检验：

### 4.1 Git 提交信息规约 (Commit Message Format)
提交信息必须遵循语义化提交（Conventional Commits）规范，格式为：
```
<type>(<scope>): <subject>
```
*   `type` 限制为以下关键字：
    *   `feat`: 新增业务功能（如新版爬虫、新页面、新指标图表）。
    *   `fix`: 修复程序 Bug（如编译报错、时序断层、数据库事务死锁）。
    *   `docs`: 仅文档、README 及 docs/ 文件的增加与修改。
    *   `style`: 不影响代码逻辑的样式微调（CSS 修改、图表网格线色值微调等）。
    *   `refactor`: 代码重构（不增加新功能也不修复 Bug 的代码修改）。
    *   `test`: 运行、修改或添加自动化测试用例。
    *   `chore`: 构建配置修改、依赖包更新或 Docker 编排配置调整。
*   `scope`：写明受影响的模块（如 `backend`, `frontend`, `scraper`, `docs` 等）。
*   `subject`：简明扼要的中文或英文变更描述。
*   **示例**: `feat(scraper): 新增同花顺及东方财富舆情高频爬虫`

### 4.2 提交前强验证流程 (Pre-commit Testing)
在执行 `git commit` 前，开发端或 AI 代理必须在本地或沙箱容器内运行以下测试脚本：

1.  **前端无错编译校验**：
    - **命令**：`npm run build --prefix frontend`
    - **通过判定**：打包命令成功退出（Exit Code 0），无任何 TypeScript 语法或未使用的变量/类型编译阻断。
2.  **后端 API 安全覆盖测试**：
    - **命令**：在后端服务运行状态下执行 `venv/bin/python backend/test_api.py`
    - **通过判定**：控制台输出 `所有接口测试全部通过！`（验证 21/21 个接口均返回 200 及正确的 JSON 数据类型）。
3.  **数据库约束校验**：
    - **命令**：若修改了 `models.py`，必须重新执行 `venv/bin/python -m backend.seed_data` 校验新表结构和约束在数据存入时无约束冲突（Integrity Error）。

