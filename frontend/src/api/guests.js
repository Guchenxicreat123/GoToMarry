import request from './request';

/**
 * 获取宾客列表
 */
export function getList(filters = {}) {
  return request.get('/guests', { params: filters });
}

/**
 * 获取宾客汇总
 */
export function getSummary() {
  return request.get('/guests/summary');
}

/**
 * 新建宾客
 */
export function create(data) {
  return request.post('/guests', data);
}

/**
 * 批量导入宾客
 */
export function batchCreate(data) {
  return request.post('/guests/batch', data);
}

/**
 * 更新宾客
 */
export function update(id, data) {
  return request.put(`/guests/${id}`, data);
}

/**
 * 删除宾客
 */
export function remove(id) {
  return request.delete(`/guests/${id}`);
}
