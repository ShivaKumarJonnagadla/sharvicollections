import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

if (env.cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const uploadFolder = `${env.CLOUDINARY_UPLOAD_FOLDER}/products`;

/** Upload a buffer to Cloudinary with automatic format/quality optimisation. */
export function uploadBuffer(
  buffer: Buffer,
  options: { publicId?: string; folder?: string } = {},
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? uploadFolder,
        public_id: options.publicId,
        resource_type: 'image',
        overwrite: true,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteAsset(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

/**
 * Generate a signed upload signature so the browser can upload directly to
 * Cloudinary without exposing the API secret (Cloudinary Signed Uploads).
 */
export function signUpload(params: Record<string, string | number>) {
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = { timestamp, folder: uploadFolder, ...params };
  const signature = cloudinary.utils.api_sign_request(toSign, env.CLOUDINARY_API_SECRET!);
  return {
    signature,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder: uploadFolder,
  };
}

export { cloudinary };
