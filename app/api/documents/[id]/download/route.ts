
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'
import { readFile } from 'fs/promises'
import path from 'path'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyJWT(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const document = await prisma.document.findUnique({
            where: { id },
            include: { trade: true }
        })

        if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        // RBAC Check
        const userId = payload.userId as string
        const userRole = payload.role as string

        // Admin can access everything
        let hasAccess = userRole === 'ADMIN'

        // Exporter can access own trade docs
        if (!hasAccess && userRole === 'EXPORTER') {
            const profile = await prisma.exporterProfile.findUnique({ where: { userId } })
            if (profile && profile.id === document.trade.exporterId) {
                hasAccess = true
            }
        }

        // Buyer can access docs of accepted trades?
        // Or if email matches?
        if (!hasAccess && userRole === 'BUYER') {
            if (document.trade.buyerEmail === payload.email) {
                hasAccess = true
            }
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Serve File

        if (process.env.AWS_S3_BUCKET_NAME) {
            const { getFileBuffer } = await import('@/lib/storage');
            try {
                const fileBuffer = await getFileBuffer(document.filePath);

                // Audit Download
                await createAuditLog('DOC_UPLOAD' as any, userId, document.tradeId, { action: 'DOWNLOAD', docId: id });

                return new NextResponse(fileBuffer as any, {
                    headers: {
                        'Content-Disposition': `attachment; filename="${document.filePath}"`,
                        'Content-Type': 'application/octet-stream',
                    }
                })
            } catch (error) {
                console.error('S3 Download Failed:', error);
                return NextResponse.json({ error: 'File not found' }, { status: 404 })
            }
        } else {
            // Local Fallback
            const path = (await import('path')).default;
            const { readFile } = (await import('fs/promises'));
            try {
                const fileBuffer = await readFile(path.join(process.cwd(), 'private-uploads', document.filePath))
                await createAuditLog('DOC_UPLOAD' as any, userId, document.tradeId, { action: 'DOWNLOAD', docId: id });

                return new NextResponse(fileBuffer as any, {
                    headers: {
                        'Content-Disposition': `attachment; filename="${document.filePath}"`,
                        'Content-Type': 'application/octet-stream',
                    }
                })
            } catch (e) {
                console.error('File read error', e)
                return NextResponse.json({ error: 'File not found on server' }, { status: 404 })
            }
        }

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
