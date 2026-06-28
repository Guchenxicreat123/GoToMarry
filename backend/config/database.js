const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'wedding.db');

let db = null;
let SQL = null;

/**
 * 初始化数据库（异步）
 */
async function initDatabase() {
  try {
    // 确保数据目录存在
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 初始化 sql.js
    SQL = await initSqlJs();

    // 如果数据库文件存在，加载它
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('✅ 数据库已加载');
    } else {
      // 创建新数据库
      db = new SQL.Database();
      console.log('📝 创建新数据库');
    }

    // 执行 Schema
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      db.run(schema);
      console.log('✅ 数据库 Schema 初始化完成');
      saveDatabase();
    } else {
      console.warn('⚠️ schema.sql 不存在，跳过初始化');
    }

    db = wrapDatabase(db);

    return db;
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err);
    throw err;
  }
}

/**
 * 包装数据库实例，在每次 exec 后自动保存到磁盘
 * run 也包装：仅非 INSERT 语句自动保存（INSERT 需要 last_insert_rowid 正确，由后续 exec 兜底保存）
 * exec 先拿结果再 export，last_insert_rowid 不受影响
 */
function wrapDatabase(instance) {
  const origExec = instance.exec.bind(instance);
  const origRun = instance.run.bind(instance);

  instance.exec = function(sql, params) {
    const result = origExec(sql, params);
    saveDatabase();
    return result;
  };

  instance.run = function(sql, params) {
    const result = origRun(sql, params);
    // db.export() 会重置 last_insert_rowid，所以 INSERT 不在此处保存
    // INSERT 后总会有 exec('last_insert_rowid()') 由 exec 兜底保存
    const sqlStr = typeof sql === 'string' ? sql : String(sql);
    if (!/^\s*INSERT\b/i.test(sqlStr)) {
      saveDatabase();
    }
    return result;
  };

  return instance;
}

/**
 * 保存数据库到文件
 */
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
    console.log('💾 数据库已保存');
  }
}

/**
 * 获取数据库实例（单例）
 */
function getDatabase() {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return db;
}



/**
 * 关闭数据库连接
 */
function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    SQL = null;
    console.log('🔒 数据库连接已关闭');
  }
}

// 优雅关闭
process.on('SIGTERM', closeDatabase);
process.on('SIGINT', closeDatabase);

module.exports = {
  getDatabase,
  initDatabase,
  closeDatabase,
  saveDatabase,
  DB_PATH
};
