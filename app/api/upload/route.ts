import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-helper';

/**
 * POST /api/upload
 * Upload files for chat attachments
 * 
 * This endpoint:
 * 1. Receives multipart/form-data with files
 * 2. Validates file types and sizes
 * 3. Uploads to MinIO (files-lxc) - TODO: implement MinIO integration
 * 4. Returns file metadata with URLs
 */
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate files
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file size
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 10MB` },
          { status: 400 }
        );
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed` },
          { status: 400 }
        );
      }

      // TODO: Upload to MinIO
      // For now, create a mock URL
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const fileUrl = `/uploads/${fileId}/${file.name}`;

      // In production, this would upload to MinIO:
      // const buffer = await file.arrayBuffer();
      // const minioUrl = await uploadToMinIO(buffer, file.name, file.type);

      uploadedFiles.push({
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileUrl,
        uploaded_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(uploadedFiles);
  } catch (error: any) {
    console.error('[API] Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload files' },
      { status: 500 }
    );
  }
}

/**
 * TODO: Implement MinIO upload
 * 
 * async function uploadToMinIO(
 *   buffer: ArrayBuffer,
 *   filename: string,
 *   contentType: string
 * ): Promise<string> {
 *   const minioClient = new MinIO.Client({
 *     endPoint: process.env.MINIO_ENDPOINT || 'files-lxc',
 *     port: parseInt(process.env.MINIO_PORT || '9000'),
 *     useSSL: false,
 *     accessKey: process.env.MINIO_ACCESS_KEY,
 *     secretKey: process.env.MINIO_SECRET_KEY,
 *   });
 * 
 *   const bucketName = 'chat-attachments';
 *   const objectName = `${Date.now()}-${filename}`;
 * 
 *   await minioClient.putObject(
 *     bucketName,
 *     objectName,
 *     Buffer.from(buffer),
 *     buffer.byteLength,
 *     { 'Content-Type': contentType }
 *   );
 * 
 *   return `http://files-lxc:9000/${bucketName}/${objectName}`;
 * }
 */
