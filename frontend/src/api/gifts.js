import request from './request';

export function getList() { return request.get('/gifts'); }
export function getSummary() { return request.get('/gifts/summary'); }
export function create(data) { return request.post('/gifts', data); }
export function update(id, data) { return request.put(`/gifts/${id}`, data); }
export function remove(id) { return request.delete(`/gifts/${id}`); }
