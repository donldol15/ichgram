const User = require('../models/userModel');
const Post = require('../models/postModel');

const getProfile = async (req, res) => {
    try {
        res.status(200).json({
            message: 'Profile retrieved successfully',
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -email');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const posts = await Post.find({
            user: user._id
        })
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'User profile retrieved successfully',
            user,
            posts
        });
    } catch (error) {
        res.status(500).json({
            message: 'Profile retrieval error',
            error: error.message
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, email, bio } = req.body;

        if (username !== undefined && !username.trim()) {
            return res.status(400).json({
                message: 'Username cannot be empty'
            });
        }

        if (email !== undefined && !email.trim()) {
            return res.status(400).json({
                message: 'Email cannot be empty'
            });
        }

        if (username || email) {
            const conditions = [];

            if (username) {
                conditions.push({ username: username.trim() });
            }

            if (email) {
                conditions.push({ email: email.trim().toLowerCase() });
            }

            const existingUser = await User.findOne({
                _id: { $ne: req.user._id },
                $or: conditions
            });

            if (existingUser) {
                return res.status(400).json({
                    message: 'Username or email already taken'
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                ...(username !== undefined && {
                    username: username.trim()
                }),
                ...(email !== undefined && {
                    email: email.trim().toLowerCase()
                }),
                ...(bio !== undefined && { bio })
            },
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            message: 'Profile update error',
            error: error.message
        });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'Please upload an image'
            });
        }

        const avatarPath = `/uploads/avatars/${req.file.filename}`;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: avatarPath },
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        res.status(200).json({
            message: 'Avatar uploaded successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            message: 'Avatar upload error',
            error: error.message
        });
    }
};

module.exports = {
    getProfile,
    getUserById,
    updateProfile,
    uploadAvatar
};
