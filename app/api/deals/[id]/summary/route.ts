import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { generateDossierSummary } from '@/lib/llm/summarizer';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Only Admin or Exporter can generate?
        // Prompt says "Regenerate Summary (admin only)".
        // We'll enforce ADMIN for regeneration if one exists, but allow basic generation if missing?
        // The Prompt says "Add Regenerate Summary (admin only)".
        // Let's rely on frontend to hide button, but valid check here.

        const existing = await prisma.dossierSummary.findFirst({ where: { tradeId: id } });
        if (existing && payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Only admins can regenerate summaries.' }, { status: 403 });
        }

        const summary = await generateDossierSummary(id, payload.userId as string);
        return NextResponse.json({ success: true, summary });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch latest summary
        const summary = await prisma.dossierSummary.findFirst({
            where: { tradeId: id },
            orderBy: { generatedAt: 'desc' }
        });

        return NextResponse.json({ summary });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
