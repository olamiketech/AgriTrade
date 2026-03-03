import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'
import { uploadFile } from '@/lib/storage'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyJWT(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const formData = await req.formData()
        const file = formData.get('file') as File
        const tradeId = formData.get('tradeId') as string
        const type = formData.get('type') as string

        if (!file || !tradeId || !type) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `${Date.now()}_${file.name.replace(/\s/g, '_')}`
        const contentType = file.type || 'application/octet-stream'

        // S3 Upload
        try {
            await uploadFile(filename, buffer, contentType)
        } catch (error) {
            console.error('S3 Upload Failed:', error)
            // Just for MVP, if S3 fails, maybe try local or just validation error
            // Check if env var is missing
            if (!process.env.AWS_S3_BUCKET_NAME) {
                return NextResponse.json({ error: 'S3 Configuration Missing' }, { status: 500 })
            }
            return NextResponse.json({ error: 'Upload Failed' }, { status: 500 })
        }

        const document = await prisma.document.create({
            data: {
                tradeId,
                filePath: filename, // Now this is the S3 Key
                type: type as any,
                uploadedBy: payload.userId as string
            }
        })

        await createAuditLog('DOC_UPLOAD', payload.userId as string, tradeId, { documentId: document.id });

        // Trigger OCR asynchronously (fire and forget - but now handled by cron too)
        if (process.env.ENABLE_DOCUMENT_OCR !== 'false') {
            import('@/lib/ocr/service').then(({ processDocument }) => {
                processDocument(document.id).catch(err => console.error("OCR Trigger Failed:", err));
            });
        }

        return NextResponse.json({ success: true, document })

    } catch (error: unknown) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const tradeId = searchParams.get('tradeId')

        if (!tradeId) return NextResponse.json({ error: 'Missing tradeId' }, { status: 400 })

        const docs = await prisma.document.findMany({
            where: { tradeId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ documents: docs })
    } catch (error: unknown) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
