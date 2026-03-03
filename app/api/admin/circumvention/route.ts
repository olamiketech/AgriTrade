import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyJWT(token)
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [introductions, flags] = await Promise.all([
            prisma.introductionRecord.findMany({
                orderBy: { introducedAt: 'desc' }
            }),
            prisma.circumventionFlag.findMany({
                orderBy: { flaggedAt: 'desc' }
            })
        ])

        // Enrich with user details if needed, but for MVP we might just return IDs 
        // or we do a second fetch. Let's do a basic fetch of names.

        // Fetch all relevant buyer/exporter names map
        // This is a bit inefficient but fine for MVP
        const buyerIds = [...new Set([...introductions.map((i: any) => i.buyerId), ...flags.map((f: any) => f.buyerId)])]
        const exporterIds = [...new Set([...introductions.map((i: any) => i.exporterId), ...flags.map((f: any) => f.exporterId)])]

        const buyers = await prisma.buyerProfile.findMany({
            where: { id: { in: buyerIds } },
            select: { id: true, companyName: true, user: { select: { email: true } } }
        })

        const exporters = await prisma.exporterProfile.findMany({
            where: { id: { in: exporterIds } },
            select: { id: true, companyName: true, user: { select: { email: true } } }
        })

        const buyerMap = Object.fromEntries(buyers.map((b: any) => [b.id, b]))
        const exporterMap = Object.fromEntries(exporters.map((e: any) => [e.id, e]))

        const enrichedIntroductions = introductions.map((i: any) => ({
            ...i,
            buyerName: buyerMap[i.buyerId]?.companyName || buyerMap[i.buyerId]?.user.email || 'Unknown',
            exporterName: exporterMap[i.exporterId]?.companyName || exporterMap[i.exporterId]?.user.email || 'Unknown'
        }))

        const enrichedFlags = flags.map((f: any) => ({
            ...f,
            buyerName: buyerMap[f.buyerId]?.companyName || buyerMap[f.buyerId]?.user.email || 'Unknown',
            exporterName: exporterMap[f.exporterId]?.companyName || exporterMap[f.exporterId]?.user.email || 'Unknown'
        }))

        return NextResponse.json({
            introductions: enrichedIntroductions,
            flags: enrichedFlags
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
