import request from './request';

/**
 * 获取桌台列表
 */
export function getList() {
  return request.get('/tables');
}

/**
 * 新建桌台
 */
export function create(data) {
  return request.post('/tables', data);
}

/**
 * 更新桌台
 */
export function update(id, data) {
  return request.put(`/tables/${id}`, data);
}

/**
 * 删除桌台
 */
export function remove(id) {
  return request.delete(`/tables/${id}`);
}

/**
 * 分配宾客到桌台
 */
export function assign(tableId, data) {
  return request.put(`/tables/${tableId}/assign`, data);
}
