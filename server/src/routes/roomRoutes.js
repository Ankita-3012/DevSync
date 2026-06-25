const express = require('express');
const { createRoom, joinRoom, getRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createRoom);
router.post('/:roomCode/join', protect, joinRoom);
router.get('/:roomCode', protect, getRoom);

module.exports = router;