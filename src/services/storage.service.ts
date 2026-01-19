import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

class R2StorageClient {
  private client: S3Client | null = null;
  private r2Enabled: boolean;
  private bucketName: string | null;
  private publicUrl: string | null;

  constructor() {
    this.r2Enabled = this.checkR2Config();
    this.bucketName = config.r2BucketName;
    this.publicUrl = config.r2PublicUrl;

    console.log(
      `R2 Storage Configuration Status: ${
        this.r2Enabled ? 'Enabled' : 'Disabled (using base64 fallback)'
      }`
    );

    if (this.r2Enabled) {
      try {
        this.client = new S3Client({
          region: 'auto',
          endpoint: config.r2EndpointUrl!,
          credentials: {
            accessKeyId: config.r2AccessKeyId!,
            secretAccessKey: config.r2SecretAccessKey!,
          },
        });
        console.log(
          `R2 Client initialized successfully. Bucket: ${this.bucketName}, Public URL: ${this.publicUrl}`
        );
      } catch (error) {
        console.error('Failed to initialize R2 client:', error);
        this.r2Enabled = false;
      }
    }
  }

  private checkR2Config(): boolean {
    const endpoint = config.r2EndpointUrl;
    const accessKey = config.r2AccessKeyId;
    const secretKey = config.r2SecretAccessKey;
    const bucketName = config.r2BucketName;
    const publicUrl = config.r2PublicUrl;

    if (!endpoint || !accessKey || !secretKey || !bucketName || !publicUrl) {
      console.log(
        `R2 config incomplete - Endpoint: ${!!endpoint}, AccessKey: ${!!accessKey}, SecretKey: ${!!secretKey}, Bucket: ${!!bucketName}, PublicURL: ${!!publicUrl}`
      );
      return false;
    }

    if (accessKey.includes('your_r2_access_key') || secretKey.includes('your_r2_secret')) {
      console.log('R2 config contains placeholder values');
      return false;
    }

    return true;
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    if (!this.r2Enabled) {
      // Fallback: return base64 data URL
      console.log('R2 not enabled, falling back to base64 encoding');
      const base64Data = buffer.toString('base64');
      return `data:${contentType};base64,${base64Data}`;
    }

    try {
      const ext = filename.split('.').pop() || 'jpg';
      const uniqueFilename = `${uuidv4()}.${ext}`;

      await this.client!.send(
        new PutObjectCommand({
          Bucket: this.bucketName!,
          Key: uniqueFilename,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read',
        })
      );

      const publicUrl = `${this.publicUrl}/${uniqueFilename}`;
      console.log(`Successfully uploaded to R2: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error('R2 upload failed:', error);
      throw new Error(`Failed to upload file to R2: ${error}`);
    }
  }

  async deleteFile(url: string): Promise<boolean> {
    if (!this.r2Enabled || !this.client) {
      return false;
    }

    try {
      const filename = url.split('/').pop()!;
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName!,
          Key: filename,
        })
      );
      return true;
    } catch (error) {
      console.error('Failed to delete file from R2:', error);
      return false;
    }
  }

  async generatePresignedUrl(
    filename: string,
    contentType: string = 'image/jpeg',
    expiresIn: number = 3600
  ): Promise<{ upload_url: string; file_url: string; key: string }> {
    if (!this.r2Enabled || !this.client) {
      throw new Error('R2 storage is not configured');
    }

    try {
      const ext = filename.split('.').pop() || 'jpg';
      const uniqueFilename = `${uuidv4()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName!,
        Key: uniqueFilename,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

      return {
        upload_url: uploadUrl,
        file_url: `${this.publicUrl}/${uniqueFilename}`,
        key: uniqueFilename,
      };
    } catch (error) {
      console.error('Failed to generate presigned URL:', error);
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  isEnabled(): boolean {
    return this.r2Enabled;
  }
}

export const r2Client = new R2StorageClient();
