const express = require('express');
const router = express.Router();

const {
    getProfile,
    getUserById,
    updateProfile,
    uploadAvatar
} = require('../controllers/userController');

const authMiddleware = require('../middlewares/authMiddleware');
const { uploadAvatar: avatarUpload } = require('../middlewares/uploadMiddleware');

router.get('/profile', authMiddleware, getProfile);
router.get('/:id', getUserById);
router.put('/profile', authMiddleware, updateProfile);
router.post('/avatar',authMiddleware,avatarUpload.single('avatar'),uploadAvatar);

module.exports = router;
