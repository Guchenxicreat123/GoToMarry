# syntax=docker/dockerfile:1.7

# ========== 阶段 1: 构建前端 ==========
FROM node:20-alpine AS frontend-builder

ARG VITE_GROOM_NAME
ARG VITE_BRIDE_NAME
ARG VITE_WEDDING_DATE
ENV VITE_GROOM_NAME=$VITE_GROOM_NAME
ENV VITE_BRIDE_NAME=$VITE_BRIDE_NAME
ENV VITE_WEDDING_DATE=$VITE_WEDDING_DATE

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci --frozen-lockfile

COPY frontend/ .

RUN npm run build

# ========== 阶段 2: 构建后端 ==========
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm ci --frozen-lockfile --omit=dev

COPY backend/ .

# ========== 阶段 3: 生产镜像 ==========
FROM node:20-alpine

WORKDIR /app

# 安装 nginx 和构建工具（用于编译 better-sqlite3 musl 兼容版本）
RUN apk add --no-cache nginx python3 make g++ musl-dev

# 复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# 复制后端
COPY --from=backend-builder /app/backend /app/backend

# 修复 better-sqlite3 musl 兼容性问题（重新编译原生模块）
RUN cd /app/backend && npm rebuild better-sqlite3 2>&1

# 复制 Nginx 配置
COPY docker/nginx.conf /etc/nginx/nginx.conf

# 创建数据卷目录
RUN mkdir -p /app/data

# 修复文件权限（COPY 可能保留构建时的 uid）
RUN chown -R root:root /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD ["wget", "-q", "--spider", "http://127.0.0.1/"]

# 启动：后端 + Nginx
CMD ["sh", "-c", "cd /app/backend && node server.js & nginx -g 'daemon off;'"]
