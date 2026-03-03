import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);

        // Only admins can download KYC documents
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        // Get the KYC document
        const kycDoc = await prisma.kycDocument.findUnique({
            where: { id },
            include: {
                exporterProfile: true
            }
        });

        if (!kycDoc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Read file from disk
        const filePath = join(process.cwd(), 'private-uploads', kycDoc.filePath);
        const fileBuffer = await readFile(filePath);

        // Return file with appropriate headers
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': kycDoc.mimeType || 'application/octet-stream',
                'Content-Disposition': `inline; filename="${kycDoc.fileName}"`,
            },
        });

    } catch (e) {
        console.error('Error downloading KYC document:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
