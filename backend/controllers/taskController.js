const { success, error } = require('../utils/response');
const taskModel = require('../models/taskModel');

/**
 * 获取任务列表
 * GET /api/tasks
 */
function getTasks(req, res) {
  try {
    const { stage, status, assignee, keyword } = req.query;
    const filters = {};
    
    if (stage) filters.stage = stage;
    if (status) filters.status = status;
    if (assignee) filters.assignee = assignee;
    if (keyword) filters.keyword = keyword;
    
    const tasks = taskModel.getTasks(filters);
    success(res, tasks);
  } catch (err) {
    console.error('获取任务列表失败:', err);
    error(res, '获取任务列表失败', 500);
  }
}

/**
 * 获取单个任务
 * GET /api/tasks/:id
 */
function getTaskById(req, res) {
  try {
    const task = taskModel.getTaskById(parseInt(req.params.id));
    
    if (!task) {
      return error(res, '任务不存在', 404);
    }
    
    success(res, task);
  } catch (err) {
    console.error('获取任务失败:', err);
    error(res, '获取任务失败', 500);
  }
}

/**
 * 新建任务
 * POST /api/tasks
 */
function createTask(req, res) {
  try {
    const { title, description, stage, status, assignee, dueDate, priority, isRecurring, recurringType, notes } = req.body;
    
    // 必填字段验证
    if (!title || !stage || !assignee) {
      return error(res, 'title, stage, assignee 为必填字段', 400);
    }
    
    const task = taskModel.createTask({
      title,
      description,
      stage,
      status,
      assignee,
      dueDate,
      priority,
      isRecurring: isRecurring ? 1 : 0,
      recurringType,
      notes
    });
    
    success(res, task, '任务创建成功', 201);
  } catch (err) {
    console.error('创建任务失败:', err);
    error(res, '创建任务失败', 500);
  }
}

/**
 * 更新任务
 * PUT /api/tasks/:id
 */
function updateTask(req, res) {
  try {
    const id = parseInt(req.params.id);
    const task = taskModel.getTaskById(id);
    
    if (!task) {
      return error(res, '任务不存在', 404);
    }
    
    const { title, description, stage, status, assignee, dueDate, priority, isRecurring, recurringType, notes } = req.body;
    const updated = taskModel.updateTask(id, {
      title,
      description,
      stage,
      status,
      assignee,
      dueDate,
      priority,
      is_recurring: isRecurring !== undefined ? (isRecurring ? 1 : 0) : undefined,
      recurring_type: recurringType,
      notes
    });
    
    success(res, updated);
  } catch (err) {
    console.error('更新任务失败:', err);
    error(res, '更新任务失败', 500);
  }
}

/**
 * 删除任务
 * DELETE /api/tasks/:id
 */
function deleteTask(req, res) {
  try {
    const id = parseInt(req.params.id);
    const task = taskModel.getTaskById(id);
    
    if (!task) {
      return error(res, '任务不存在', 404);
    }
    
    taskModel.deleteTask(id);
    success(res, null);
  } catch (err) {
    console.error('删除任务失败:', err);
    error(res, '删除任务失败', 500);
  }
}

/**
 * 切换任务状态
 * PUT /api/tasks/:id/toggle
 */
function toggleTask(req, res) {
  try {
    const id = parseInt(req.params.id);
    const task = taskModel.getTaskById(id);
    
    if (!task) {
      return error(res, '任务不存在', 404);
    }
    
    const updated = taskModel.toggleTaskStatus(id);
    success(res, updated);
  } catch (err) {
    console.error('切换任务状态失败:', err);
    error(res, '切换任务状态失败', 500);
  }
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTask
};
