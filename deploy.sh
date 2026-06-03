#!/bin/bash
set -e

echo "    生猪期货终端 本地自动化配置与部署"

# 1. Stop any currently running docker-compose services
echo "1. 正在停止并清理现有的 Docker 容器与服务..."
sudo docker-compose down --remove-orphans

# 2. Build and start services
echo "2. 正在重新编译并启动 Docker 容器服务 (Postgres, Backend, Frontend, Nginx)..."
sudo docker-compose up -d --build

# 3. Wait for PostgreSQL to be healthy inside the container
echo "3. 等待 PostgreSQL 数据库就绪 (pg_isready)..."
for i in {1..30}; do
    if sudo docker exec qihuo_postgres pg_isready -U qihuo_user -d qihuo_db &>/dev/null; then
        echo "PostgreSQL 数据库已就绪，正在进行下一步。"
        break
    fi
    echo "数据库初始化中，等待 1 秒..."
    sleep 1
done

# 4. Initialize Database schema inside backend container
echo "4. 正在容器内初始化数据库表结构 (backend.init_db)..."
sudo docker exec qihuo_backend python -m backend.init_db

# 5. Populate initial/seed data inside backend container
echo "5. 正在容器内抓取并填充基本面初始化数据 (backend.seed_data)..."
sudo docker exec qihuo_backend python -m backend.seed_data

echo "=========================================================="
echo "    本地自动化配置部署完成！"
echo "=========================================================="
echo "    服务链接："
echo "    - 综合门户与决策系统 (Nginx Proxy): http://localhost:8080"
echo "    - 前端 Vite 实时开发服务: http://localhost:5173"
echo "    - 后端 FastAPI API 文档: http://localhost:8000/docs"
echo "=========================================================="
