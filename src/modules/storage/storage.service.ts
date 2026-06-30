import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID') || this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || this.configService.get<string>('MINIO_BUCKET_NAME', 'campusgrid');

    const endpoint = this.configService.get<string>('MINIO_ENDPOINT'); // Only set for local MinIO
    
    // Handle messy region strings like "Asia Pacific (Sydney) ap-southeast-2"
    const rawRegion = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const region = rawRegion.split(' ').pop() || rawRegion;

    this.s3Client = new S3Client({
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async getPresignedUrl(key: string, expiresSeconds: number = 300): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: expiresSeconds });
  }

  async getUploadPresignedUrl(key: string, contentType: string, expiresSeconds: number = 300): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: expiresSeconds });
  }

  async uploadFile(key: string, file: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return key;
  }

  async deleteFile(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }
}
