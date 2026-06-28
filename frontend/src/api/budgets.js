import request from './request';

/**
 * 获取预算列表
 */
export function getList(filters = {}) {
  return request.get('/budgets', { params: filters });
}

/**
 * 获取预算汇总
 */
export function getSummary() {
  return request.get('/budgets/summary');
}

/**
 * 获取分类列表
 */
export function getCategories() {
  return request.get('/budgets/categories');
}

/**
 * 新建预算
 */
export function create(data) {
  return request.post('/budgets', data);
}

/**
 * 更新预算
 */
export function update(id, data) {
  return request.put(`/budgets/${id}`, data);
}

/**
 * 删除预算
 */
export function remove(id) {
  return request.delete(`/budgets/${id}`);
}
