import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { createAuditLog } from '@/lib/audit';

export async function PATCH(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { extractionId, value, verified } = body;

        if (!extractionId) {
            return NextResponse.json({ error: 'Missing extractionId' }, { status: 400 });
        }

        // Get the extraction to check permission (optional, but good practice)
        const extraction = await prisma.documentExtraction.findUnique({
            where: { id: extractionId },
            include: { document: true }
        });

        if (!extraction) {
            return NextResponse.json({ error: 'Extraction not found' }, { status: 404 });
        }

        // Update
        const updated = await prisma.documentExtraction.update({
            where: { id: extractionId },
            data: {
                fieldValue: value, // Allow editing
                verified: verified === true,
                verifiedBy: payload.userId as string,
                verifiedAt: new Date(),
            }
        });

        // Audit log
        await createAuditLog(
            'DOC_EXTRACTION_CONFIRMED',
            payload.userId as string,
            extraction.document.tradeId,
            { extractionId, oldValue: extraction.fieldValue, newValue: value }
        );

        return NextResponse.json({ success: true, extraction: updated });

    } catch (error) {
        console.error('Error updating extraction:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
