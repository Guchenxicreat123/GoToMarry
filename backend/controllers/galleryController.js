const { success, error } = require('../utils/response');
const galleryModel = require('../models/galleryModel');

function list(req, res) {
  try {
    const photos = galleryModel.getAll();
    success(res, photos);
  } catch (err) {
    console.error('获取画廊照片失败:', err);
    error(res, '获取照片失败', 500);
  }
}

function upload(req, res) {
  try {
    const { image, caption, date, sort_order } = req.body;
    if (!image) return error(res, '请提供图片', 400);

    const filename = galleryModel.saveBase64Image(image);
    if (!filename) return error(res, '图片数据无效', 400);

    const photo = galleryModel.create(filename, caption || '', date || '', sort_order || 0);
    success(res, photo, '上传成功', 201);
  } catch (err) {
    console.error('上传照片失败:', err);
    error(res, '上传失败', 500);
  }
}

function remove(req, res) {
  try {
    const id = parseInt(req.params.id);
    const ok = galleryModel.remove(id);
    if (!ok) return error(res, '照片不存在', 404);
    success(res, null, '删除成功');
  } catch (err) {
    console.error('删除照片失败:', err);
    error(res, '删除失败', 500);
  }
}

/**
 * 扫描文件夹，批量导入未入库的图片
 */
function sync(req, res) {
  try {
    const result = galleryModel.syncFromDisk();
    success(res, result, '同步完成');
  } catch (err) {
    console.error('同步图片失败:', err);
    error(res, '同步失败', 500);
  }
}

module.exports = { list, upload, remove, sync };
