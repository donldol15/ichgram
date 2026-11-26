const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { initializeSocket } = require('./src/config/socket');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/likes', require('./src/routes/likeRoutes'));
app.use('/api/comments', require('./src/routes/commentRoutes'));
app.use('/api/follows', require('./src/routes/followRoutes'));
app.use('/api/search', require('./src/routes/searchRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    initializeSocket(server);

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
