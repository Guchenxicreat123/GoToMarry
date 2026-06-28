const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const diaryController = require('../controllers/diaryController');

router.use(authMiddleware);

router.get('/', diaryController.getDiaries);
router.get('/:id', diaryController.getDiaryById);
router.get('/:id/images', diaryController.getDiaryImages);
router.post('/', diaryController.createDiary);
router.put('/:id', diaryController.updateDiary);
router.delete('/:id', diaryController.deleteDiary);
router.post('/:id/migrate', diaryController.migrateDiary);

module.exports = router;
