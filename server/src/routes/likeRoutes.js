const express = require('express');
const router = express.Router();

const {
    toggleLike,
    getPostLikes
} = require('../controllers/likeController');

const authMiddleware = require('../middlewares/authMiddleware');

router.post('/:postId', authMiddleware, toggleLike);
router.get('/:postId', getPostLikes);

module.exports = router;
