const cloudinary = require('./config/cloudinary');
const fs = require('fs');
const path = require('path');

// Create a dummy file buffer
const buffer = Buffer.from('test image content');

console.log('Testing Cloudinary Connection...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '******' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'Not Set');

const uploadStream = cloudinary.uploader.upload_stream(
    { folder: "test_folder" },
    (error, result) => {
        if (error) {
            console.error('❌ Upload Failed:', error);
        } else {
            console.log('✅ Upload Success:', result.secure_url);
        }
    }
);

uploadStream.end(buffer);
