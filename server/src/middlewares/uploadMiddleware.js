const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const uploadsPath = path.resolve(__dirname, '../../uploads');

const createStorage = (folder) => {
    const folderPath = path.join(uploadsPath, folder);

    fs.mkdirSync(folderPath, { recursive: true });

    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, folderPath);
        },

        filename: (req, file, cb) => {
            const extension = path.extname(file.originalname).toLowerCase();
            cb(null, `${crypto.randomUUID()}${extension}`);
        }
    });
};

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG and WEBP images are allowed'));
    }
};

const createUpload = (folder) => {
    return multer({
        storage: createStorage(folder),
        fileFilter,
        limits: {
            fileSize: 10 * 1024 * 1024
        }
    });
};

const uploadAvatar = createUpload('avatars');
const uploadPost = createUpload('posts');

module.exports = {
    uploadAvatar,
    uploadPost
};