const express = require('express');
const { getComments, createComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

router.get('/', protect, getComments);
router.post('/', protect, createComment);

module.exports = router;