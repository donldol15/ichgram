const User = require('../models/userModel');

const searchUsers = async (req, res) => {
    try {
        const query = req.query.q?.trim();

        let filter = {};

        if (query) {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            filter = {
                $or: [
                    { username: { $regex: escapedQuery, $options: 'i' } },
                    { email: { $regex: escapedQuery, $options: 'i' } }
                ]
            };
        }

        const users = await User.find(filter)
            .select('username avatar bio')
            .sort({ username: 1 });

        res.status(200).json({
            message: 'Users found successfully',
            count: users.length,
            users
        });

    } catch (error) {
        res.status(500).json({
            message: 'Search error',
            error: error.message
        });
    }
};

module.exports = { searchUsers };
