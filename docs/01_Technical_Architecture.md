# 技术架构设计 (Technical Architecture)

本项目是一个高度集成的生猪期货基本面数据监控与智能化决策分析系统。系统采用了现代化、前后端分离的容器化部署架构，旨在提供高并发、低延迟的数据监控与可视化大屏体验。

## 1. 架构概览 (Architecture Overview)

系统基于 Docker Compose 编排，分为三个核心服务容器：

*   **数据持久层 (Database)**: PostgreSQL 15 (Alpine)
*   **后端服务层 (Backend)**: FastAPI + Uvicorn + SQLAlchemy
*   **前端展示层 (Frontend)**: React + TypeScript + Vite + Recharts

### 拓扑图

```text
┌────────────────────────────────────────────────────────┐
│                        前端页面                        │
│            (React + TypeScript + Vite + Recharts)      │
│                     [Port: 5173]                       │
└───────────────────────────┬────────────────────────────┘
                            │ (RESTful API / HTTP)
                            ▼
┌────────────────────────────────────────────────────────┐
│                        后端服务                        │
│                  (FastAPI + Uvicorn)                   │
│                     [Port: 8000]                       │
└─────────────────────┬───────────▲──────────────────────┘
                      │           │ (SQLAlchemy / TCP)
   (后台定时任务)     │           │
   APScheduler        ▼           │
┌───────────────────────────┐   ┌────────────────────────┐
│      外部数据源源         │   │      PostgreSQL        │
│ (AkShare, Sina Finance)   │   │      (Docker 容器)     │
│                           │   │      [Port: 5432]      │
└───────────────────────────┘   └────────────────────────┘
```

## 2. 后端设计 (Backend Design)

后端采用 Python 的 **FastAPI** 框架，兼具高性能与自动生成 API 文档的优势。

### 2.1 模块划分

*   `main.py`: 应用入口，定义了所有的 RESTful 路由（Endpoints，新增动保/饲料/深加工需求/物流等多维度接口），并处理应用的启动与关闭事件。
*   `models.py`: 定义了基于 SQLAlchemy 的 ORM 数据模型，将数据库表结构映射为 Python 类（包括 SentimentIndex, BiopharmaceuticalProcurement, FeedSalesBreakdown, HogLogisticsAndSafety, PorkDownstreamDemand 等舆情与替代指标表）。
*   `database.py`: 处理数据库连接池和 Session 管理。
*   `scraper.py`: 核心数据采集模块，集成了搜猪网、东方财富、同花顺等多渠道舆情爬虫引擎，以及动保/饲料/物流等多维替代数据拟合推演器。
*   `scheduler.py`: 实现了基于 `APScheduler` 的后台定时任务，负责在交易时段或特定周期自动轮询并更新数据。
*   `yijing.py`: 独立的预测算法引擎模块。

### 2.2 数据持久化策略

*   系统采用关系型数据库 PostgreSQL 进行数据存储，确保财务级数据的 ACID 事务特性。
*   `models.py` 中为高频查询的字段（如 `symbol`, `date`, `keyword`）建立了联合索引（`Index`），以优化时间序列数据的查询性能。
*   提供了 `init_db.py` 和 `seed_data.py` 用于快速初始化表结构和灌入历史种子数据。

### 2.3 核心数据表结构规约 (AI 视角)

为了便于未来 AI 编码助手直接解析，以下是新增舆情及替代指标的完整 Schema 定义：

| 物理表名 | 对应 ORM 类名 | 字段名称 & 类型 | 索引 & 约束 | 业务释义 |
| :--- | :--- | :--- | :--- | :--- |
| `sentiment_indices` | `SentimentIndex` | `id` (INTEGER, PK)<br>`date` (DATE)<br>`keyword` (VARCHAR(50))<br>`frequency` (INTEGER)<br>`sentiment_score` (FLOAT) | Unique(`keyword`, `date`) | 社交舆情词频及情绪打分 |
| `biopharmaceutical_procurements` | `BiopharmaceuticalProcurement` | `id` (INTEGER, PK)<br>`date` (DATE, UNIQUE)<br>`swine_fever_vaccine` (FLOAT)<br>`prrs_vaccine` (FLOAT)<br>`fmd_vaccine` (FLOAT)<br>`diarrhea_vaccine` (FLOAT)<br>`altrenogest_sales` (FLOAT)<br>`oxytocin_sales` (FLOAT)<br>`vaccine_index` (FLOAT) | Unique(`date`) | 兽医疫苗采购数据（万支），用药量物理校验 |
| `breeding_consumable_consumptions` | `BreedingConsumableConsumption` | `id` (INTEGER, PK)<br>`date` (DATE, UNIQUE)<br>`insemination_catheters` (FLOAT)<br>`semen_extender` (FLOAT)<br>`farrowing_dry_powder` (FLOAT)<br>`iron_injection` (FLOAT)<br>`ear_tags` (FLOAT) | Unique(`date`) | 母猪产房耗材用量，校验育肥前置产能 |
| `feed_sales_breakdowns` | `FeedSalesBreakdown` | `id` (INTEGER, PK)<br>`date` (DATE, UNIQUE)<br>`sow_feed` (FLOAT)<br>`piglet_feed` (FLOAT)<br>`grower_feed` (FLOAT)<br>`finisher_feed` (FLOAT)<br>`overall_feed_volume` (FLOAT) | Unique(`date`) | 饲料细分（母猪、仔猪、中猪、大猪）销量（万吨） |
| `hog_logistics_and_safety` | `HogLogisticsAndSafety` | `id` (INTEGER, PK)<br>`date` (DATE, UNIQUE)<br>`quarantine_certificates` (INTEGER)<br>`transport_freight_index` (FLOAT)<br>`mortality_waste_disposal` (FLOAT) | Unique(`date`) | 跨省调运检疫票（张）、运费指数、病死猪处理量（吨） |
| `pork_downstream_demand` | `PorkDownstreamDemand` | `id` (INTEGER, PK)<br>`date` (DATE, UNIQUE)<br>`pork_production` (FLOAT)<br>`pork_consumption` (FLOAT)<br>`feed_supply` (FLOAT)<br>`processed_pork_demand` (FLOAT)<br>`catering_pork_demand` (FLOAT) | Unique(`date`) | 猪肉生产消费量、深加工制品、餐饮渠道实际需求（万吨） |

### 2.4 后端 REST API 接口定义 (AI 视角)

AI 消费或扩展系统时可调用的前瞻印证相关 REST API 路由列表：

1.  **`/api/fundamentals/biopharm` (GET)**
    *   **返回格式**: `Array<BiopharmaceuticalProcurement>`
    *   **业务描述**: 暴露兽用疫苗、动保相关采购统计时序。
2.  **`/api/fundamentals/consumables` (GET)**
    *   **返回格式**: `Array<BreedingConsumableConsumption>`
    *   **业务描述**: 暴露产房输精管、稀释剂等辅助用品销量时序。
3.  **`/api/fundamentals/feed_breakdown` (GET)**
    *   **返回格式**: `Array<FeedSalesBreakdown>`
    *   **业务描述**: 暴露四阶段饲料消耗明细时序。
4.  **`/api/fundamentals/logistics_safety` (GET)**
    *   **返回格式**: `Array<HogLogisticsAndSafety>`
    *   **业务描述**: 暴露省际生猪调运检疫车次、运费指数及病死量时序。
5.  **`/api/fundamentals/downstream_demand` (GET)**
    *   **返回格式**: `Array<PorkDownstreamDemand>`
    *   **业务描述**: 暴露白条批发、深加工食品制品及商用餐饮肉类需求。
6.  **`/api/analysis/report` (GET)**
    *   **返回格式**: 综合决策 JSON（包含 `summary`, `dimensions` 包括 `sentiment` 与 `speculation` 动态评分, `narrative` 段落描述）。
7.  **`/api/sync/all` (POST)**
    *   **返回格式**: `{"status": "success", "message": "..."}`
    *   **业务描述**: 激活后台爬虫执行链（Sina, AkShare + Soozhu/EastMoney/Flush 舆情爬虫网）。

## 3. 前端设计 (Frontend Design)

前端是一个单页面应用（SPA），以数据可视化大屏（Dashboard）的形式呈现。

### 3.1 技术栈选型

*   **构建工具**: Vite（提供极速的冷启动和热更新）。
*   **核心框架**: React 19 + TypeScript（保证类型安全，降低运行时错误）。
*   **图表库**: Recharts（基于 D3.js，提供响应式的 React 图表组件，适合时序数据展示）。
*   **图标库**: Lucide React。

### 3.2 状态管理与数据流

*   目前未使用复杂的状态管理库（如 Redux 或 Zustand），而是依赖 React 原生的 `useState` 和 `useEffect` 进行组件级状态管理。
*   `App.tsx` 作为主容器，负责管理所有宏观指标和图表的数据状态。
*   实现了一个智能的轮询机制（Poller）：在 1 到 10 分钟之间生成随机间隔进行自动数据刷新，并在 UI 上展示倒计时。这既保证了数据的实时性，又避免了固定的高频请求对后端造成集中压力。

### 3.3 响应式与主题

*   采用了定制化的 Dark Mode（暗黑模式）CSS 样式（`App.css`, `index.css`），具有终端极客风格，适合金融监控场景长时间观看。
*   UI 布局采用 Flexbox 和 CSS Grid，确保大屏展示的灵活性和响应式适配。

## 4. 基础设施与容器化 (Infrastructure)

*   `docker-compose.yml` 统一定义了服务的依赖关系、网络端口映射和数据卷挂载。
*   **环境变量隔离**: 数据库连接字符串等敏感信息通过环境变量传入，提升了部署的灵活性。
*   **持久化挂载**: PostgreSQL 的数据目录挂载到宿主机的 Docker Volume (`pgdata`)，防止容器销毁导致数据丢失。