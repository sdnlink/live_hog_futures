#!/bin/bash
set -e

echo "=========================================================="
echo "    生猪期货终端 本地自动化配置与部署"
echo "=========================================================="

# Check docker compose command
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "错误: 未检测到 docker compose 命令，请先安装 Docker。"
    exit 1
fi

# 1. Build and start services
echo "1. 正在重新构建并启动 Docker 容器服务 (Postgres, Backend, Frontend, Nginx)..."
$DOCKER_COMPOSE up -d --build

# 2. Wait for PostgreSQL to be healthy inside the container
echo "2. 等待 PostgreSQL 数据库就绪 (pg_isready)..."
for i in {1..30}; do
    if docker exec qihuo_postgres pg_isready -U qihuo_user -d qihuo_db &>/dev/null; then
        echo "PostgreSQL 数据库已就绪，正在进行下一步。"
        break
    fi
    echo "数据库初始化中，等待 1 秒..."
    sleep 1
done

# 3. Initialize Database schema inside backend container
echo "3. 正在容器内初始化数据库表结构 (backend.init_db)..."
docker exec qihuo_backend python -m backend.init_db

# 4. Restart services to ensure fresh code and connections
echo "4. 重新加载最新后端 API 与前端服务..."
$DOCKER_COMPOSE restart backend frontend nginx

echo "=========================================================="
echo "    本地自动化配置部署完成！"
echo "=========================================================="
echo "    服务链接："
echo "    - 综合门户与决策系统 (Nginx Proxy): http://localhost:8080"
echo "    - 前端 Vite 实时开发服务: http://localhost:5173"
echo "    - 后端 FastAPI API 文档: http://localhost:8000/docs"
echo "=========================================================="
