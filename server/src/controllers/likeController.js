const Like = require('../models/likeModel');
const Post = require('../models/postModel');
const Notification = require('../models/notificationModel');

const toggleLike = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.postId;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        const existingLike = await Like.findOne({
            user: userId,
            post: postId
        });

        if (existingLike) {
            await existingLike.deleteOne();

            return res.status(200).json({
                message: 'Like removed',
                liked: false
            });
        }

        await Like.create({
            user: userId,
            post: postId
        });

        if (post.user.toString() !== userId.toString()) {
            await Notification.create({
                recipient: post.user,
                sender: userId,
                type: 'like',
                post: postId,
                message: 'liked your post'
            });
        }

        const likesCount = await Like.countDocuments({
            post: postId
        });

        res.status(201).json({
            message: 'Post liked successfully',
            liked: true,
            likesCount
        });
    } catch (error) {
        res.status(500).json({
            message: 'Like error',
            error: error.message
        });
    }
};

const getPostLikes = async (req, res) => {
    try {
        const likes = await Like.find({
            post: req.params.postId
        }).populate('user', 'username avatar');

        res.status(200).json({
            count: likes.length,
            likes
        });
    } catch (error) {
        res.status(500).json({
            message: 'Get likes error',
            error: error.message
        });
    }
};

module.exports = {
    toggleLike,
    getPostLikes
};
