const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const giftController = require('../controllers/giftController');

router.use(authMiddleware);

router.get('/summary', giftController.getGiftSummary);
router.get('/export', giftController.exportGifts);
router.get('/', giftController.getGifts);
router.get('/:id', giftController.getGiftById);
router.post('/', giftController.createGift);
router.put('/:id', giftController.updateGift);
router.delete('/:id', giftController.deleteGift);

module.exports = router;
