import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFromBuffer = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        Readable.from(buffer).pipe(uploadStream);
    });
};

export const uploadImage = async (buffer, folder = 'signatures') => {
    const result = await uploadFromBuffer(buffer, {
        folder,
        resource_type: 'image',
        format: 'webp'
    });
    return { url: result.secure_url, publicId: result.public_id };
};

export const uploadPdf = async (buffer, folder = 'deliverynotes') => {
    const result = await uploadFromBuffer(buffer, {
        folder,
        resource_type: 'raw',
        format: 'pdf'
    });
    return { url: result.secure_url, publicId: result.public_id };
};
