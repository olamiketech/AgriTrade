
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize S3 Client
// If credentials are not explicitly set in env, AWS SDK will look for them in ~/.aws/credentials
// or instance metadata (if on EC2/Lambda).
const s3Client = new S3Client({
    region: REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    } : undefined
});

export async function uploadFile(key: string, body: Buffer | Uint8Array, contentType: string) {
    if (!BUCKET_NAME) {
        throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
    }

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType
    });

    try {
        await s3Client.send(command);
        console.log(`[Storage] Uploaded ${key} to S3`);
        return key;
    } catch (error) {
        console.error('[Storage] Upload failed:', error);
        throw error;
    }
}

export async function getFileBuffer(key: string): Promise<Buffer> {
    if (!BUCKET_NAME) {
        throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
    }

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });

    try {
        const response = await s3Client.send(command);
        if (!response.Body) throw new Error('Empty body');

        // Convert stream to buffer
        const byteArray = await response.Body.transformToByteArray();
        return Buffer.from(byteArray);
    } catch (error) {
        console.error('[Storage] Get object failed:', error);
        throw error;
    }
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
    if (!BUCKET_NAME) {
        throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
    }

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('[Storage] Signed URL generation failed:', error);
        throw error;
    }
}
