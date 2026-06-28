const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', galleryController.list);
router.post('/', galleryController.upload);
router.post('/sync', galleryController.sync);
router.delete('/:id', galleryController.remove);

module.exports = router;