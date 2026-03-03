
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { processDocument } from '@/lib/ocr/service';
import { createAuditLog } from '@/lib/audit';

// This route should be called by a cron job (e.g. Vercel Cron, GitHub Actions, or a simple cron service)
// It processes pending documents in batches.

export async function GET(req: Request) {
    // Basic authorization to prevent abuse
    // In production, use a secret key in headers
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cron] Starting OCR Poller...');

        // 1. Find documents that are uploaded but not yet processed
        // We need to check if we have a status field or rely on missing extractions
        // Since we don't have a status field on Document in the schema yet, let's use a workaround:
        // Find documents that have NO associated DocumentExtraction or DocumentRawExtraction records

        // However, Prisma doesn't easily support "where does not exist" without some tricks or separate queries.
        // A simpler approach for MVP:
        // Let's fetch the last 50 documents and check which ones don't manage to have extractions.
        // Ideally we should add a 'status' field to Document model. 

        // For now, let's look for documents created in the last 24 hours that don't have extractions.
        const recentDocs = await prisma.document.findMany({
            where: {
                createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                extractions: { none: {} },
                rawExtraction: { is: null }
            },
            take: 10,
            orderBy: { createdAt: 'asc' }
        });

        console.log(`[Cron] Found ${recentDocs.length} pending documents.`);

        const results = [];

        for (const doc of recentDocs) {
            try {
                console.log(`[Cron] Processing document ${doc.id}...`);
                await processDocument(doc.id);
                results.push({ id: doc.id, status: 'processed' });
            } catch (error) {
                console.error(`[Cron] Failed to process ${doc.id}:`, error);
                results.push({ id: doc.id, status: 'failed', error: String(error) });
            }
        }

        return NextResponse.json({ success: true, processed: results.length, details: results });

    } catch (error) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
