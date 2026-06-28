import request from './request';

export function getList() { return request.get('/gallery'); }
export function upload(data) { return request.post('/gallery', data); }
export function remove(id) { return request.delete(`/gallery/${id}`); }
export function sync() { return request.post('/gallery/sync'); }