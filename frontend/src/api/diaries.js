import request from './request';

export function getList() { return request.get('/diaries'); }
export function getDiaryImages(id) { return request.get(`/diaries/${id}/images`); }
export function create(data) { return request.post('/diaries', data); }
export function update(id, data) { return request.put(`/diaries/${id}`, data); }
export function remove(id) { return request.delete(`/diaries/${id}`); }
