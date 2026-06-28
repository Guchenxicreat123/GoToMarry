const { getDatabase } = require('../config/database');

/**
 * 获取所有任务
 */
function getTasks(filters = {}) {
  const db = getDatabase();
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (filters.stage) {
    sql += ' AND stage = ?';
    params.push(filters.stage);
  }
  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.assignee) {
    sql += ' AND assignee = ?';
    params.push(filters.assignee);
  }
  if (filters.keyword) {
    sql += ' AND title LIKE ?';
    params.push(`%${filters.keyword}%`);
  }

  sql += ' ORDER BY priority DESC, CASE WHEN due_date = \'\' OR due_date IS NULL THEN 0 ELSE 1 END, due_date ASC, created_at DESC';

  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }

  const results = [];
  while (stmt.step()) {
    results.push(stmt.get());
  }
  // 获取列名
  const cols = stmt.getColumnNames();
  stmt.free();
  return results.map(row => {
    const obj = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

/**
 * 获取单个任务
 */
function getTaskById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  stmt.bind([id]);
  
  if (stmt.step()) {
    const row = stmt.get();
    const cols = stmt.getColumnNames();
    const obj = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    stmt.free();
    return obj;
  }
  stmt.free();
  return null;
}

/**
 * 创建任务
 */
function createTask(data) {
  const db = getDatabase();
  db.run(
    'INSERT INTO tasks (title, description, stage, status, assignee, due_date, priority, is_recurring, recurring_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [data.title || '', data.description || '', data.stage || '', data.status || 'todo', data.assignee || '', data.dueDate || '', data.priority || 1, data.isRecurring || 0, data.recurringType || '', data.notes || '']
  );
  const result = db.exec('SELECT last_insert_rowid() as id');
  const id = result.length > 0 ? result[0].values[0][0] : null;
  return id ? getTaskById(id) : null;
}

/**
 * 更新任务
 */
function updateTask(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  const updatableFields = ['title', 'description', 'stage', 'status', 'assignee', 'dueDate', 'priority', 'is_recurring', 'recurring_type', 'notes'];
  
  // 字段映射：camelCase → snake_case
  const FIELD_MAP = {
    dueDate: 'due_date',
  };
  
  for (const field of updatableFields) {
    if (data[field] !== undefined) {
      const dbField = FIELD_MAP[field] || field;
      fields.push(`${dbField} = ?`);
      params.push(data[field]);
    }
  }

  if (data.status === 'done') {
    fields.push('completed_at = datetime("now")');
  }
  fields.push('updated_at = datetime("now")');
  params.push(id);

  db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);
  return getTaskById(id);
}

/**
 * 删除任务
 */
function deleteTask(id) {
  const db = getDatabase();
  db.run('DELETE FROM tasks WHERE id = ?', [id]);
}

/**
 * 切换任务状态
 */
function toggleTaskStatus(id) {
  const task = getTaskById(id);
  if (!task) return null;
  
  const newStatus = task.status === 'done' ? 'todo' : 'done';
  return updateTask(id, { status: newStatus });
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus
};
