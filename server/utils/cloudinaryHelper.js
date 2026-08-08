const cloudinary = require('cloudinary').v2;

const uploadToCloudinary = (buffer) => {
    // We configure it inside the function to ensure process.env variables are loaded
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'civic_eye_tickets' },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        );
        uploadStream.end(buffer);
    });
};

module.exports = { uploadToCloudinary };
