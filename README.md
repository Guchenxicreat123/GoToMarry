# GoToMarry — 备婚管理系统

一套轻量级备婚管理应用，前后端一体 Docker 部署，适合新人管理婚礼筹备全流程。

新郎新娘名字、婚期、预算等个性化配置通过环境变量注入，代码本身不含任何个人信息。

---

## 快速开始

### 1. 克隆代码

```bash
git clone <仓库地址> goto-marry
cd goto-marry
```

### 2. 配置环境变量

复制模板并填入你们的信息：

```bash
cp .env.example .env
```

编辑 `.env`，至少要改这几个：

```ini
JWT_SECRET=你的随机密钥
PIN_CODE=六位登录码
VITE_GROOM_NAME=新郎名
VITE_BRIDE_NAME=新娘名
VITE_WEDDING_DATE=YYYY-MM-DD
```

### 3. 启动

```bash
sudo docker compose up -d --build
```

等待构建完成（首次需要下载依赖，约 1-3 分钟)。

### 4. 访问

浏览器打开 `http://<服务器IP>:8080`，输入 `.env` 里设置的 `PIN_CODE` 即可。

---

## 功能模块

| 模块 | 说明 |
|------|------|
| 首页看板 | 倒计时、日历黄历、快捷入口 |
| 任务清单 | 三视图（列表/卡片/月份），按阶段分组 |
| 预算管理 | 分类支出记录，超预算提醒 |
| 宾客管理 | 名单管理，按男方/女方/未确认筛选，拼音排序 |
| 座位表 | 桌号管理，宾客入座 |
| 礼金管理 | 收礼记录，男方/女方汇总，导出 CSV |
| 时光小记 | 图文日记，支持表情和图片 |
| 纪念日 | 10 个分类，正/倒计时，里程碑彩蛋 |
| 时光画廊 | 照片墙（瀑布流/网格），上传/同步/删除，全屏预览 |
| 星空宇宙 | Canvas 三合一大图交互相册 |
| 请帖 | 电子请帖（功能开发中） |

---

## 目录结构

```
.
├── .env.example          # 环境变量模板
├── .gitignore
├── Dockerfile            # 多阶段构建
├── docker-compose.yml
├── docker/
│   └── nginx.conf
├── backend/              # Express + sql.js
│   ├── server.js
│   ├── config/           # 数据库配置
│   ├── controllers/      # 路由控制器
│   ├── db/
│   │   └── schema.sql    # 建表语句（首次启动自动执行）
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
├── frontend/             # Vue 3 + Vant UI
│   ├── vite.config.js
│   └── src/
│       ├── api/          # API 调用层
│       ├── components/   # 通用组件
│       ├── router/       # 路由配置
│       ├── stores/       # Pinia 状态管理
│       ├── styles/       # 全局样式
│       └── views/        # 15 个页面
```

---

## 技术栈

**后端**
- Node.js + Express
- sql.js (SQLite WebAssembly)
- better-sqlite3 原生模块

**前端**
- Vue 3 + Vite
- Vant UI 4（移动端组件库）
- Pinia（状态管理）
- Vue Router 4

**部署**
- Docker + Docker Compose
- Nginx（反向代理 + 静态文件）

---

## 数据持久化

- 数据库和图片存储在宿主机的 `backend/data/` 目录下
- 通过 Docker volume 映射，容器重建不会丢失数据
- 如需备份，直接复制 `backend/data/` 目录

---

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `JWT_SECRET` | JWT 签名密钥，随机字符串 | ✅ |
| `PIN_CODE` | 登录密码，6 位数字 | ✅ |
| `VITE_GROOM_NAME` | 新郎姓名 | ✅ |
| `VITE_BRIDE_NAME` | 新娘姓名 | ✅ |
| `VITE_WEDDING_DATE` | 婚期，格式 YYYY-MM-DD | ✅ |
| `BUDGET_TOTAL` | 总预算上限，默认 300000 | |
| `NODE_PORT` | 后端端口，默认 3000 | |

> ⚠️ `.env` 文件包含私人信息，已被 `.gitignore` 排除，切勿推送到公开仓库。
克隆项目后请复制 `.env.example` 为 `.env` 并填入实际值。
