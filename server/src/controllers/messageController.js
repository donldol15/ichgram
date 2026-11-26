const Message = require('../models/messageModel');
const User = require('../models/userModel');
const Follow = require('../models/followModel');
const { getIO } = require('../config/socket');

const getConversations = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const follows = await Follow.find({
            follower: currentUserId
        })
            .populate('following', 'username avatar bio')
            .sort({ createdAt: -1 });

        const conversations = await Promise.all(
            follows
                .filter((follow) => follow.following)
                .map(async (follow) => {
                    const user = follow.following;

                    const [lastMessage, unreadCount] = await Promise.all([
                        Message.findOne({
                            $or: [
                                {
                                    sender: currentUserId,
                                    receiver: user._id
                                },
                                {
                                    sender: user._id,
                                    receiver: currentUserId
                                }
                            ]
                        })
                            .populate('sender', 'username avatar')
                            .populate('receiver', 'username avatar')
                            .sort({ createdAt: -1 }),

                        Message.countDocuments({
                            sender: user._id,
                            receiver: currentUserId,
                            isRead: false
                        })
                    ]);

                    return {
                        user,
                        lastMessage,
                        unreadCount
                    };
                })
        );

        conversations.sort((a, b) => {
            const dateA = a.lastMessage
                ? new Date(a.lastMessage.createdAt).getTime()
                : 0;

            const dateB = b.lastMessage
                ? new Date(b.lastMessage.createdAt).getTime()
                : 0;

            return dateB - dateA;
        });

        res.status(200).json({
            count: conversations.length,
            conversations
        });
    } catch (error) {
        res.status(500).json({
            message: 'Get conversations error',
            error: error.message
        });
    }
};

const sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.userId;
        const { text } = req.body;

        if (senderId.toString() === receiverId) {
            return res.status(400).json({
                message: 'You cannot send a message to yourself'
            });
        }

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: 'Message text is required'
            });
        }

        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            text: text.trim()
        });

        await message.populate('sender', 'username avatar');
        await message.populate('receiver', 'username avatar');
        getIO().to(receiverId.toString()).emit('new-message', message);

        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        res.status(500).json({
            message: 'Send message error',
            error: error.message
        });
    }
};

const getConversation = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const otherUserId = req.params.userId;

        const otherUser = await User.findById(otherUserId)
            .select('username avatar bio');

        if (!otherUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const messages = await Message.find({
            $or: [
                {
                    sender: currentUserId,
                    receiver: otherUserId
                },
                {
                    sender: otherUserId,
                    receiver: currentUserId
                }
            ]
        })
            .populate('sender', 'username avatar')
            .populate('receiver', 'username avatar')
            .sort({ createdAt: 1 });

        res.status(200).json({
            message: 'Conversation retrieved successfully',
            user: otherUser,
            count: messages.length,
            messages
        });
    } catch (error) {
        res.status(500).json({
            message: 'Get conversation error',
            error: error.message
        });
    }
};

const markMessagesAsRead = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const senderId = req.params.userId;

        const result = await Message.updateMany(
            {
                sender: senderId,
                receiver: currentUserId,
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        res.status(200).json({
            message: 'Messages marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({
            message: 'Mark messages error',
            error: error.message
        });
    }
};

module.exports = {
    getConversations,
    sendMessage,
    getConversation,
    markMessagesAsRead
};