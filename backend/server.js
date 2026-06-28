const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const budgetRoutes = require('./routes/budgets');
const guestRoutes = require('./routes/guests');
const tableRoutes = require('./routes/tables');
const settingRoutes = require('./routes/settings');
const giftRoutes = require('./routes/gifts');
const diaryRoutes = require('./routes/diaries');
const anniversaryRoutes = require('./routes/anniversaries');
const galleryRoutes = require('./routes/gallery');

const app = express();
const PORT = process.env.NODE_PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const IMG_DIR = path.join(DATA_DIR, 'diary-images');
const ANNIVERSARY_IMG_DIR = path.join(DATA_DIR, 'anniversary-images');
const GALLERY_IMG_DIR = path.join(DATA_DIR, 'gallery-images');

// 确保数据目录和图片目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(IMG_DIR)) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
}
if (!fs.existsSync(ANNIVERSARY_IMG_DIR)) {
  fs.mkdirSync(ANNIVERSARY_IMG_DIR, { recursive: true });
}
if (!fs.existsSync(GALLERY_IMG_DIR)) {
  fs.mkdirSync(GALLERY_IMG_DIR, { recursive: true });
}

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/diary-images', express.static(IMG_DIR));
app.use('/anniversary-images', express.static(ANNIVERSARY_IMG_DIR));
app.use('/gallery-images', express.static(GALLERY_IMG_DIR));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/diaries', diaryRoutes);
app.use('/api/anniversaries', anniversaryRoutes);
app.use('/api/gallery', galleryRoutes);

// SPA 兜底路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// 404 处理
app.use((req, res) => {
  res.json({ code: 404, msg: '接口不存在', data: null });
});

// 启动服务器
initDatabase().then(() => {
  const { initTable: initAnniversaryTable } = require('./models/anniversaryModel');
  initAnniversaryTable();
  const { initTable: initGalleryTable } = require('./models/galleryModel');
  initGalleryTable();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ GoToMarry 后端运行在端口 ${PORT}`);
    console.log(`📍 数据库路径: ${path.join(DATA_DIR, 'wedding.db')}`);
  });
}).catch((err) => {
  console.error('❌ 数据库初始化失败:', err);
  process.exit(1);
});

module.exports = app;
