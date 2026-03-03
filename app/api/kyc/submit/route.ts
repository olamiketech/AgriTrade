import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Increase body size limit for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload || payload.role !== 'EXPORTER') {
            return NextResponse.json({ error: 'Unauthorized - not an exporter' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId as string },
            include: { exporterProfile: true }
        });

        if (!user || !user.exporterProfile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        // Parse form data
        let formData;
        try {
            formData = await req.formData();
        } catch (e) {
            console.error('FormData parsing error:', e);
            return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
        }

        const file = formData.get('file') as File;

        if (!file || typeof file === 'string') {
            console.error('No file uploaded or file is a string');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Get file type from form or infer from filename
        const fileType = (formData.get('fileType') as string) || 'ID_DOCUMENT';

        console.log('Processing file:', file.name, 'Type:', fileType, 'Size:', file.size);

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'private-uploads', 'kyc');
        try {
            if (!existsSync(uploadsDir)) {
                await mkdir(uploadsDir, { recursive: true });
                console.log('Created uploads directory:', uploadsDir);
            }
        } catch (e) {
            console.error('Directory creation error:', e);
            return NextResponse.json({ error: 'Failed to create upload directory' }, { status: 500 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${user.exporterProfile.id}_${timestamp}_${sanitizedFilename}`;
        const filePath = join(uploadsDir, filename);

        // Save file
        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);
            console.log('File saved to:', filePath);
        } catch (e) {
            console.error('File write error:', e);
            return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
        }

        // Save to database
        let kycDocument;
        try {
            kycDocument = await prisma.kycDocument.create({
                data: {
                    exporterProfileId: user.exporterProfile.id,
                    filePath: `kyc/${filename}`,
                    fileName: file.name,
                    fileType: fileType,
                    mimeType: file.type || 'application/octet-stream',
                }
            });
            console.log('KYC document created in DB:', kycDocument.id);
        } catch (e) {
            console.error('Database error creating KYC document:', e);
            return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 });
        }

        // Update KYC status
        try {
            const updatedProfile = await prisma.exporterProfile.update({
                where: { id: user.exporterProfile.id },
                data: {
                    kycStatus: 'PENDING',
                    kycProviderId: 'MANUAL_SUBMISSION',
                }
            });

            return NextResponse.json({
                success: true,
                document: kycDocument,
                profile: updatedProfile
            });
        } catch (e) {
            console.error('Database error updating profile:', e);
            return NextResponse.json({ error: 'Failed to update profile status' }, { status: 500 });
        }

    } catch (e: any) {
        console.error('KYC submission error:', e);
        console.error('Error stack:', e.stack);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: e.message
        }, { status: 500 });
    }
}
