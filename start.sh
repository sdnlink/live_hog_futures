#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Add common Node path if npm not found (e.g. non-interactive environments)
if ! command -v npm &> /dev/null; then
    if [ -d "/home/skn01/.config/nvm/versions/node/v25.8.1/bin" ]; then
        export PATH="/home/skn01/.config/nvm/versions/node/v25.8.1/bin:$PATH"
    fi
fi

echo "=========================================================="
echo "    生猪期货基本面数据监控与决策系统 一键启动脚本"
echo "=========================================================="

# 1. Start docker database container
echo "1. 正在启动 PostgreSQL 数据库容器..."
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "错误: 未检测到 docker-compose 或 docker 命令，请先安装 Docker。"
    exit 1
fi

# Run docker-compose using passwordless sudo if needed
if sudo -n true 2>/dev/null; then
    sudo docker-compose up -d
else
    docker-compose up -d
fi

# 2. Wait for PostgreSQL port to be ready
echo "2. 等待 PostgreSQL 数据库就绪 (Port 5432)..."
venv/bin/python -c "
import socket
import time
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
for i in range(30):
    try:
        s.connect(('127.0.0.1', 5432))
        print('PostgreSQL 数据库已就绪！')
        break
    except Exception:
        time.sleep(1)
else:
    print('等待数据库超时，请检查 Docker 容器状态。')
    exit(1)
"

# 3. DB Initialization
echo "3. 初始化数据库结构..."
venv/bin/python -m backend.init_db

# 4. Check if data needs to be seeded (if table is empty)
echo "4. 检查数据是否需要初始化填充..."
SEED_REQUIRED=$(venv/bin/python -c "
from backend.database import SessionLocal
from backend.models import FuturesQuote
db = SessionLocal()
count = db.query(FuturesQuote).count()
db.close()
print('true' if count == 0 else 'false')
")

if [ "$SEED_REQUIRED" = "true" ]; then
    echo "检测到数据库为空，正在启动 AkShare 数据同步抓取 (这需要几秒钟)..."
    venv/bin/python -m backend.seed_data
else
    echo "数据库已包含历史数据，跳过初始化同步。"
fi

# 5. Start Backend FastAPI
echo "5. 正在启动 FastAPI 后端服务..."
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "警告: 端口 8000 已被占用，可能后端已在运行。跳过启动。"
else
    nohup venv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
    echo "后端 FastAPI 已在后台启动，日志重定向至 backend.log (Port: 8000)"
fi

# 6. Start Frontend Vite Dev Server
echo "6. 正在启动 Vite 前端服务..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "警告: 端口 5173 已被占用，可能前端已在运行。跳过启动。"
else
    nohup npm run dev --prefix frontend -- --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &
    echo "前端 Vite 已在后台启动，日志重定向至 frontend.log (Port: 5173)"
fi

echo "=========================================================="
echo "    启动完成！请在浏览器中打开: http://localhost:5173/"
echo "=========================================================="
