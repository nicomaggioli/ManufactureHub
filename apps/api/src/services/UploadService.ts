import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";

const BUCKET = process.env.S3_BUCKET_NAME || "";
const REGION = process.env.S3_REGION || "us-east-1";

const isEnabled = !!BUCKET && !!process.env.S3_ACCESS_KEY_ID;

const s3 = isEnabled ? new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
}) : null;

export class UploadService {
  async getPresignedUploadUrl(params: {
    userId: string;
    fileName: string;
    contentType: string;
    folder?: string;
  }): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    if (!s3 || !isEnabled) {
      // Return a mock URL for demo/dev mode
      const key = `${params.folder || 'uploads'}/${params.userId}/${uuid()}-${params.fileName}`;
      return {
        uploadUrl: `https://${BUCKET || 'demo-bucket'}.s3.amazonaws.com/${key}`,
        fileUrl: `https://${BUCKET || 'demo-bucket'}.s3.amazonaws.com/${key}`,
        key,
      };
    }

    const key = `${params.folder || 'uploads'}/${params.userId}/${uuid()}-${params.fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const fileUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    if (!s3 || !isEnabled) {
      return `https://${BUCKET || 'demo-bucket'}.s3.amazonaws.com/${key}`;
    }

    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
  }

  async deleteFile(key: string): Promise<void> {
    if (!s3 || !isEnabled) return;
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  }
}
