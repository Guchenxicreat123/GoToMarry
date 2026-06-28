import request from './request';

/**
 * 获取任务列表
 */
export function getList(filters = {}) {
  return request.get('/tasks', { params: filters });
}

/**
 * 新建任务
 */
export function create(data) {
  return request.post('/tasks', data);
}

/**
 * 更新任务
 */
export function update(id, data) {
  return request.put(`/tasks/${id}`, data);
}

/**
 * 删除任务
 */
export function remove(id) {
  return request.delete(`/tasks/${id}`);
}

/**
 * 切换任务状态
 */
export function toggle(id) {
  return request.put(`/tasks/${id}/toggle`);
}
