import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check if admin
        const payload = await verifyJWT(token)
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()
        const sixtyDaysAgo = new Date(now.setDate(now.getDate() - 60))

        // 1. Check for Dormant Relationships (Low Risk)
        // Find active introductions older than 60 days
        const oldIntroductions = await prisma.introductionRecord.findMany({
            where: {
                introducedAt: { lt: sixtyDaysAgo },
                status: 'ACTIVE'
            }
        })

        let flagsCreated = 0

        for (const intro of oldIntroductions) {
            // Count deals for this pair
            const dealCount = await prisma.tradeDeal.count({
                where: {
                    exporterId: intro.exporterId,
                    // We need to link deal to buyer ID ideally, but we only have email on deal.
                    // We need to fetch buyer email first.
                }
            })

            // Fetch Buyer Email to check deals
            const buyer = await prisma.buyerProfile.findUnique({
                where: { id: intro.buyerId },
                include: { user: true }
            })

            if (!buyer) continue

            const pairDealCount = await prisma.tradeDeal.count({
                where: {
                    exporterId: intro.exporterId,
                    buyerEmail: buyer.user.email
                }
            })

            // If only 1 deal (the initial one) and it's been > 60 days
            if (pairDealCount <= 1) {
                // Check if already flagged recently
                const existingFlag = await prisma.circumventionFlag.findFirst({
                    where: {
                        buyerId: intro.buyerId,
                        exporterId: intro.exporterId,
                        riskLevel: 'LOW'
                    }
                })

                if (!existingFlag) {
                    await prisma.circumventionFlag.create({
                        data: {
                            buyerId: intro.buyerId,
                            exporterId: intro.exporterId,
                            riskLevel: 'LOW',
                            notes: 'Dormant relationship: No new deals in 60+ days despite active introduction.',
                            flaggedAt: new Date()
                        }
                    })
                    flagsCreated++
                }
            }
        }

        return NextResponse.json({ success: true, flagsCreated })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
