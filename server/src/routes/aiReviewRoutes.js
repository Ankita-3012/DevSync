const express = require('express');
const { getAIReview } = require('../controllers/aiReviewController');
const { protect } = require('../middleware/authMiddleware');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router({ mergeParams: true });

router.get('/', protect, rateLimiter, getAIReview);

module.exports = router;