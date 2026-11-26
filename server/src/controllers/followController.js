const mongoose = require('mongoose');
const Follow = require('../models/followModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

const toggleFollow = async (req, res) => {
    try {
        const followerId = req.user._id;
        const followingId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(followingId)) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

        if (followerId.toString() === followingId) {
            return res.status(400).json({
                message: 'You cannot follow yourself'
            });
        }

        const targetUser = await User.findById(followingId);

        if (!targetUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const existingFollow = await Follow.findOne({
            follower: followerId,
            following: followingId
        });

        if (existingFollow) {
            await existingFollow.deleteOne();

            return res.status(200).json({
                message: 'Unfollowed successfully',
                following: false
            });
        }

        try {
            await Follow.create({
                follower: followerId,
                following: followingId
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(200).json({
                    message: 'Already following',
                    following: true
                });
            }

            throw error;
        }

        await Notification.create({
            recipient: followingId,
            sender: followerId,
            type: 'follow',
            message: 'started following you'
        });

        return res.status(201).json({
            message: 'Followed successfully',
            following: true
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Follow error',
            error: error.message
        });
    }
};

const getFollowStatus = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

        const follow = await Follow.findOne({
            follower: req.user._id,
            following: userId
        });

        return res.status(200).json({
            following: Boolean(follow)
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Follow status error',
            error: error.message
        });
    }
};

const getFollowers = async (req, res) => {
    try {
        const followers = await Follow.find({
            following: req.params.userId
        }).populate('follower', 'username avatar');

        return res.status(200).json({
            count: followers.length,
            followers
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Followers error',
            error: error.message
        });
    }
};

const getFollowing = async (req, res) => {
    try {
        const following = await Follow.find({
            follower: req.params.userId
        }).populate('following', 'username avatar');

        return res.status(200).json({
            count: following.length,
            following
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Following error',
            error: error.message
        });
    }
};

module.exports = {
    toggleFollow,
    getFollowStatus,
    getFollowers,
    getFollowing
};
