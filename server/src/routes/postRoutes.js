const express = require('express');
const router = express.Router();

const {
    createPost,
    getPosts,
    getMyPosts,
    updatePost,
    deletePost
} = require('../controllers/postController');

const authMiddleware = require('../middlewares/authMiddleware');
const { uploadPost } = require('../middlewares/uploadMiddleware');

router.get('/', getPosts);
router.get('/my', authMiddleware, getMyPosts);

router.post(
    '/',
    authMiddleware,
    uploadPost.single('image'),
    createPost
);

router.put(
    '/:id',
    authMiddleware,
    uploadPost.single('image'),
    updatePost
);

router.delete('/:id', authMiddleware, deletePost);

module.exports = router;