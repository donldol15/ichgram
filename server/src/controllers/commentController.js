const Comment = require('../models/commentModel');
const Post = require('../models/postModel');
const Notification = require('../models/notificationModel');

const createComment = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.postId;
        const userId = req.user._id;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: 'Comment text is required'
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        const comment = await Comment.create({
            user: userId,
            post: postId,
            text: text.trim()
        });

        await comment.populate('user', 'username avatar');

        if (post.user.toString() !== userId.toString()) {
            await Notification.create({
                recipient: post.user,
                sender: userId,
                type: 'comment',
                post: postId,
                message: text.trim()
            });
        }

        res.status(201).json({
            message: 'Comment created successfully',
            comment
        });
    } catch (error) {
        res.status(500).json({
            message: 'Comment error',
            error: error.message
        });
    }
};

const getComments = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        const comments = await Comment.find({
            post: req.params.postId
        })
            .populate('user', 'username avatar')
            .populate('likes', 'username avatar')
            .sort({ createdAt: 1 });

        res.status(200).json({
            commentsCount: comments.length,
            comments
        });
    } catch (error) {
        res.status(500).json({
            message: 'Get comments error',
            error: error.message
        });
    }
};

const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                message: 'Comment not found'
            });
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'You can delete only your own comments'
            });
        }

        await comment.deleteOne();

        res.status(200).json({
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Delete comment error',
            error: error.message
        });
    }
};

const toggleCommentLike = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                message: 'Comment not found'
            });
        }

        const userId = req.user._id.toString();

        const alreadyLiked = comment.likes.some(
            (likeId) => likeId.toString() === userId
        );

        if (alreadyLiked) {
            comment.likes.pull(req.user._id);
        } else {
            comment.likes.push(req.user._id);
        }

        await comment.save();

        res.status(200).json({
            liked: !alreadyLiked,
            likesCount: comment.likes.length
        });
    } catch (error) {
        res.status(500).json({
            message: 'Comment like error',
            error: error.message
        });
    }
};

module.exports = {
    createComment,
    getComments,
    deleteComment,
    toggleCommentLike
};