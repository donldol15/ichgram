const Post = require('../models/postModel');

const createPost = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'Please upload an image'
            });
        }

        const { caption } = req.body;

        const post = await Post.create({
            user: req.user._id,
            image: `/uploads/posts/${req.file.filename}`,
            caption: caption || ''
        });

        await post.populate('user', 'username avatar');

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({ user: req.user._id })
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Not authorized'
            });
        }

        if (req.body.caption !== undefined) {
            post.caption = req.body.caption;
        }

        if (req.file) {
            post.image = `/uploads/posts/${req.file.filename}`;
        }

        await post.save();
        await post.populate('user', 'username avatar');

        res.json({
            message: 'Post updated successfully',
            post
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'Not authorized'
            });
        }

        await post.deleteOne();

        res.json({
            message: 'Post deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPost,
    getPosts,
    getMyPosts,
    updatePost,
    deletePost
};