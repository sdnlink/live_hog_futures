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