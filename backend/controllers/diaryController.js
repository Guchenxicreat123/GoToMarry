const { success, error } = require('../utils/response');
const diaryModel = require('../models/diaryModel');

function getDiaries(req, res) {
  try { success(res, diaryModel.getDiaries()); }
  catch (err) { error(res, '获取日记列表失败', 500); }
}

function getDiaryById(req, res) {
  try {
    const diary = diaryModel.getDiaryById(parseInt(req.params.id));
    if (!diary) return error(res, '日记不存在', 404);
    success(res, diary);
  } catch (err) { error(res, '获取日记失败', 500); }
}

function createDiary(req, res) {
  try {
    const { author, content, mood, images, date } = req.body;
    const diary = diaryModel.createDiary({ author, content, mood, images, date });
    success(res, diary, '日记创建成功', 201);
  } catch (err) { error(res, '创建日记失败', 500); }
}

function updateDiary(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!diaryModel.getDiaryById(id)) return error(res, '日记不存在', 404);
    const { author, content, mood, images, date } = req.body;
    const updated = diaryModel.updateDiary(id, { author, content, mood, images, date });
    success(res, updated);
  } catch (err) { error(res, '更新日记失败', 500); }
}

function deleteDiary(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!diaryModel.getDiaryById(id)) return error(res, '日记不存在', 404);
    diaryModel.deleteDiary(id);
    success(res, null);
  } catch (err) { error(res, '删除日记失败', 500); }
}

function getDiaryImages(req, res) {
  try {
    const diary = diaryModel.getDiaryById(parseInt(req.params.id));
    if (!diary) return error(res, '日记不存在', 404);
    const images = diaryModel.getDiaryImages(parseInt(req.params.id));
    success(res, images);
  } catch (err) { error(res, '获取图片失败', 500); }
}

function migrateDiary(req, res) {
  try {
    const id = parseInt(req.params.id);
    const ok = diaryModel.migrateDiary(id);
    if (!ok) return error(res, '无需迁移或日记不存在', 400);
    success(res, { id, migrated: true });
  } catch (err) { error(res, '迁移失败', 500); }
}

module.exports = { getDiaries, getDiaryById, getDiaryImages, createDiary, updateDiary, deleteDiary, migrateDiary };
