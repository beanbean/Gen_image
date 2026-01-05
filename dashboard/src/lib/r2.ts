import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

// R2 client configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'team-avatars';
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * Process and upload avatar to R2
 * - Resize to 200x200px
 * - Convert to WebP for optimization
 * - Upload to R2
 * - Return public URL
 */
export async function uploadAvatar(
  file: File,
  playerId: string
): Promise<string> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image với Sharp
    const processedImage = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover', // Crop to fill
        position: 'center',
      })
      .webp({ quality: 85 }) // Convert to WebP
      .toBuffer();

    // Generate unique filename
    const filename = `avatars/${playerId}-${Date.now()}.webp`;

    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: processedImage,
        ContentType: 'image/webp',
        // Make publicly accessible
        ACL: 'public-read',
      })
    );

    // Return public URL
    const publicUrl = `${PUBLIC_URL}/${filename}`;
    return publicUrl;
  } catch (error: any) {
    console.error('Failed to upload avatar:', error);
    throw new Error(`Avatar upload failed: ${error.message}`);
  }
}

/**
 * Upload avatar from base64 string (alternative method)
 */
export async function uploadAvatarFromBase64(
  base64: string,
  playerId: string
): Promise<string> {
  try {
    // Remove data:image/xxx;base64, prefix if exists
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Process image
    const processedImage = await sharp(buffer)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `avatars/${playerId}-${Date.now()}.webp`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: processedImage,
        ContentType: 'image/webp',
        ACL: 'public-read',
      })
    );

    return `${PUBLIC_URL}/${filename}`;
  } catch (error: any) {
    console.error('Failed to upload avatar from base64:', error);
    throw new Error(`Avatar upload failed: ${error.message}`);
  }
}

/**
 * Delete avatar from R2 (optional cleanup)
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const filename = avatarUrl.replace(`${PUBLIC_URL}/`, '');

    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
      })
    );
  } catch (error: any) {
    console.error('Failed to delete avatar:', error);
    // Don't throw - avatar deletion is not critical
  }
}
