import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'
import { AuditService, AuditAction, ActorType, EntityType } from '@/lib/services/AuditService'

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyJWT(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const deal = await prisma.tradeDeal.findUnique({
            where: { id },
            include: {
                documents: {
                    include: { extractions: true }
                },
                financeRequests: true,
                exporter: {
                    select: {
                        id: true,
                        companyName: true,
                        user: {
                            select: {
                                id: true,
                                email: true,
                                verificationStatus: true
                            }
                        }
                    }
                },
            }

        })

        if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

        // Access control
        if (payload.role === 'EXPORTER') {
            // Check if exporter owns the deal
            // We need to fetch exporter profile first to get ID, or we can check via relation if we had it.
            // Or we rely on `deal.exporter.userId` if we included it, but we didn't include `user` in exporter select.
            const exporterProfile = await prisma.exporterProfile.findUnique({ where: { userId: payload.userId as string } })
            if (deal.exporterId !== exporterProfile?.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
            }
        } else if (payload.role === 'BUYER') {
            if (deal.buyerEmail !== payload.email) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
            }
        }
        // Admin can view all

        return NextResponse.json({ deal })

    } catch (error: unknown) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyJWT(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { status, paymentStatus, deliveryStatus } = body

        // Validate deal existence
        const deal = await prisma.tradeDeal.findUnique({ where: { id } })
        if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

        const updateData: any = {}

        console.log(`[DEAL PATCH] User: ${payload.email} (${payload.role}), Deal Status: ${deal.status}, Body:`, body)

        // Role-based updates logic (Simulated for MVP)
        if (payload.role === 'ADMIN') {
            if (paymentStatus) updateData.paymentStatus = paymentStatus
            if (status) updateData.status = status // Admin can force status
        } else if (payload.role === 'BUYER') {
            const { termsAccepted } = body

            if (status === 'ACCEPTED' && deal.status === 'PENDING_ACCEPTANCE') {
                if (!termsAccepted) {
                    return NextResponse.json({ error: 'Terms must be accepted' }, { status: 400 })
                }
                updateData.status = 'ACCEPTED'

                // Record terms acceptance
                await prisma.termsAcceptance.create({
                    data: {
                        userId: payload.userId as string,
                        dealId: deal.id,
                        termsVersion: '1.0',
                        acceptedAt: new Date(),
                    }
                })
            }
            if (deliveryStatus === 'DELIVERED' && deal.deliveryStatus === 'SHIPPED') {
                updateData.deliveryStatus = 'DELIVERED'
                updateData.status = 'DELIVERY_CONFIRMED'
            }
        } else if (payload.role === 'EXPORTER') {
            const currentPaymentStatus = String((deal as any).paymentStatus);
            if (deliveryStatus === 'SHIPPED' && currentPaymentStatus === 'PAID_HELD') {
                updateData.deliveryStatus = 'SHIPPED'
                updateData.status = 'SHIPPED'
            }
            // Allow submitting for verification
            if (status === 'PENDING_VERIFICATION' && deal.status === 'DRAFT') {
                updateData.status = 'PENDING_VERIFICATION'
            }
        }

        if (Object.keys(updateData).length === 0) {
            console.log('[DEAL PATCH] No valid updates. Role:', payload.role, 'Status:', status, 'Current:', deal.status);
            return NextResponse.json({ error: 'No valid updates or unauthorized transition' }, { status: 400 })
        }

        const updatedDeal = await prisma.tradeDeal.update({
            where: { id },
            data: updateData
        })

        // Log action (MVP: simple log)
        // Log action
        await AuditService.log({
            action: AuditAction.DEAL_UPDATED,
            actorType: ActorType.USER,
            actorId: payload.userId as string,
            entityType: EntityType.TRADE,
            entityId: deal.id,
            tradeId: deal.id,
            userId: payload.userId as string,
            metadata: updateData
        })

        // -- Anti-Circumvention Features --

        // 1. Introduction Tracking: When Buyer accepts deal
        if (payload.role === 'BUYER' && updateData.status === 'ACCEPTED') {
            const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: payload.userId as string } })

            if (buyerProfile) {
                // Check if introduction exists
                const existingIntro = await prisma.introductionRecord.findFirst({
                    where: {
                        buyerId: buyerProfile.id,
                        exporterId: deal.exporterId
                    }
                })

                if (!existingIntro) {
                    // Create new introduction record (12 months default)
                    const expiresAt = new Date()
                    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

                    await prisma.introductionRecord.create({
                        data: {
                            buyerId: buyerProfile.id,
                            exporterId: deal.exporterId,
                            initialTradeId: deal.id,
                            expiresAt: expiresAt,
                            status: 'ACTIVE'
                        }
                    })
                    console.log(`[ANTI-CIRCUMVENTION] Created IntroductionRecord for Buyer ${buyerProfile.id} and Exporter ${deal.exporterId}`)
                }
            }
        }

        // 2. Retention Nudge: When deal is completed
        if (updateData.status === 'COMPLETED') {
            // In a real app, this would trigger an email job
            console.log(`[RETENTION] Sending nudge email for completed deal ${deal.id} to Buyer ${deal.buyerEmail}`)
            // We could also log this event explicitly if needed
        }

        return NextResponse.json({ success: true, deal: updatedDeal })

    } catch (error: unknown) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
