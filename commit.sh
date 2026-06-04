#!/usr/bin/env bash
#
# 生猪期货基本面数据监控与决策系统 - 自动化格式化与提交工具
#
# Usage (Interactive):  ./commit.sh
# Usage (Non-interactive): ./commit.sh -t <type> -s <scope> -m <message>
#

set -e

# ANSI Color codes
GREEN='\033[92m'
RED='\033[91m'
YELLOW='\033[93m'
CYAN='\033[96m'
NC='\033[0m' # No Color

# Workspace directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

# Default variables
COMMIT_TYPE=""
COMMIT_SCOPE=""
COMMIT_MSG=""
NON_INTERACTIVE=false

# Print header
echo -e "${CYAN}==================================================${NC}"
echo -e "${CYAN}  生猪期货项目自动化格式化、测试与提交验证工具  ${NC}"
echo -e "${CYAN}==================================================${NC}"

# Parse options
while getopts "t:s:m:" opt; do
  case $opt in
    t)
      COMMIT_TYPE="$OPTARG"
      ;;
    s)
      COMMIT_SCOPE="$OPTARG"
      ;;
    m)
      COMMIT_MSG="$OPTARG"
      ;;
    \?)
      echo -e "${RED}无效选项: -$OPTARG${NC}"
      exit 1
      ;;
  esac
done

if [ -n "$COMMIT_TYPE" ] || [ -n "$COMMIT_SCOPE" ] || [ -n "$COMMIT_MSG" ]; then
  NON_INTERACTIVE=true
fi

# Step 1: Format Backend
echo -e "\n${YELLOW}[Step 1/4] 格式化后端 Python 代码...${NC}"
if [ -f "${PROJECT_ROOT}/venv/bin/black" ]; then
  "${PROJECT_ROOT}/venv/bin/black" "$BACKEND_DIR"
  echo -e "${GREEN}后端格式化完成！${NC}"
else
  echo -e "${RED}未找到 black 格式化工具于 venv/bin/black。跳过后端格式化。${NC}"
fi

# Step 2: Format & Lint Frontend
echo -e "\n${YELLOW}[Step 2/4] 修复并校验前端 ESlint 代码...${NC}"
if [ -d "$FRONTEND_DIR" ]; then
  npm run lint --prefix "$FRONTEND_DIR" -- --fix || echo -e "${YELLOW}警告: ESLint 发现部分无法自动修复的规范提示。${NC}"
  echo -e "${GREEN}前端 Lint 优化完成！${NC}"
else
  echo -e "${RED}未找到 frontend 文件夹。跳过前端校验。${NC}"
fi

# Step 3: Run Frontend Verification Build
echo -e "\n${YELLOW}[Step 3/4] 验证前端生产环境编译编译是否通过...${NC}"
if [ -d "$FRONTEND_DIR" ]; then
  if npm run build --prefix "$FRONTEND_DIR"; then
    echo -e "${GREEN}前端生产编译通过！${NC}"
  else
    echo -e "${RED}错误: 前端存在 TypeScript 编译阻断或语法错误！提交中止。${NC}"
    exit 1
  fi
fi

# Step 4: Run Backend API Coverage Suite
echo -e "\n${YELLOW}[Step 4/4] 校验后端 API 接口返回状态...${NC}"
if [ -f "${BACKEND_DIR}/test_api.py" ]; then
  if "${PROJECT_ROOT}/venv/bin/python" "${BACKEND_DIR}/test_api.py"; then
    echo -e "${GREEN}所有后端接口测试完全通过！${NC}"
  else
    echo -e "${RED}错误: 部分后端 API 测试校验失败！提交中止。${NC}"
    exit 1
  fi
fi

# Construct structured commit message
if [ "$NON_INTERACTIVE" = false ]; then
  # Interactive mode prompts
  echo -e "\n${CYAN}--- 交互式 Git 语义化提交构建 ---${NC}"
  
  # Select type
  echo -e "选择提交类型 (Type):"
  options=("feat (新特性)" "fix (修复Bug)" "docs (文档更新)" "style (样式微调)" "refactor (重构代码)" "test (测试用例)" "chore (日常构建)")
  select opt in "${options[@]}"; do
    case $opt in
      "feat (新特性)") COMMIT_TYPE="feat"; break;;
      "fix (修复Bug)") COMMIT_TYPE="fix"; break;;
      "docs (文档更新)") COMMIT_TYPE="docs"; break;;
      "style (样式微调)") COMMIT_TYPE="style"; break;;
      "refactor (重构代码)") COMMIT_TYPE="refactor"; break;;
      "test (测试用例)") COMMIT_TYPE="test"; break;;
      "chore (日常构建)") COMMIT_TYPE="chore"; break;;
      *) echo "无效选项 $REPLY";;
    esac
  done
  
  # Input scope
  read -p "请输入变更范围 (Scope, 例如: scraper, backend, frontend, docs): " COMMIT_SCOPE
  if [ -z "$COMMIT_SCOPE" ]; then
    COMMIT_SCOPE="all"
  fi
  
  # Input message
  read -p "请输入提交详细描述 (Subject): " COMMIT_MSG
  while [ -z "$COMMIT_MSG" ]; do
    read -p "${RED}描述不能为空，请重新输入描述: ${NC}" COMMIT_MSG
  done
fi

# Validate parameters
if [ -z "$COMMIT_TYPE" ] || [ -z "$COMMIT_SCOPE" ] || [ -z "$COMMIT_MSG" ]; then
  echo -e "${RED}错误: 缺少提交类型、范围或描述信息！${NC}"
  exit 1
fi

FULL_COMMIT_MESSAGE="${COMMIT_TYPE}(${COMMIT_SCOPE}): ${COMMIT_MSG}"

echo -e "\n${YELLOW}最终提交信息为: ${NC}${GREEN}${FULL_COMMIT_MESSAGE}${NC}"

# Git add & commit
git add .
git commit -m "$FULL_COMMIT_MESSAGE"

echo -e "\n${GREEN}✔ 代码格式化、测试与语义化提交成功完成！${NC}"
