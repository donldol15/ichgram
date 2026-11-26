const express = require('express');
const router = express.Router();

const {
    createComment,
    getComments,
    deleteComment,
    toggleCommentLike
} = require('../controllers/commentController');

const authMiddleware = require('../middlewares/authMiddleware');

router.get('/:postId', getComments);

router.post('/:postId', authMiddleware, createComment);

router.post(
    '/:commentId/like',
    authMiddleware,
    toggleCommentLike
);

router.delete('/:commentId', authMiddleware, deleteComment);

module.exports = router;