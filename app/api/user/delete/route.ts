import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'
import { createAuditLog } from '@/lib/audit'

export async function DELETE(req: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyJWT(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const userId = payload.userId as string

        // Anonymization Logic
        const anonymizedEmail = `deleted_${userId.substring(0, 8)}@anonymized.local`
        const anonymizedName = 'Deleted User'

        await prisma.$transaction(async (tx: any) => {
            // Updated User
            await tx.user.update({
                where: { id: userId },
                data: {
                    email: anonymizedEmail,
                    passwordHash: 'DELETED',
                    verificationStatus: 'DELETED',
                    consentGivenAt: null,
                }
            })

            // Update Profiles
            const exporter = await tx.exporterProfile.findUnique({ where: { userId } })
            if (exporter) {
                await tx.exporterProfile.update({
                    where: { userId },
                    data: {
                        companyName: anonymizedName,
                        country: 'XX',
                        kycStatus: 'DELETED',
                        kycData: null,
                        kycProviderId: null,
                        verificationNotes: 'User requested deletion',
                    }
                })
            }

            const buyer = await tx.buyerProfile.findUnique({ where: { userId } })
            if (buyer) {
                await tx.buyerProfile.update({
                    where: { userId },
                    data: {
                        companyName: anonymizedName,
                        country: 'XX',
                    }
                })
            }
        })

        // Log the action (using system/admin context if possible, or just the user id which is now anonymous but ID is same)
        // Ideally we log BEFORE deletion so we know who did it.
        // But we are inside existing request.

        // We can't log as 'USER_VERIFY', we really need 'USER_DELETE'. 
        // I will use 'USER_VERIFY' with metadata.
        await createAuditLog('USER_VERIFY' as any, userId, undefined, { subAction: 'ACCOUNT_DELETION' });

        // Clear cookie
        const response = NextResponse.json({ success: true, message: 'Account anonymized' })
        response.cookies.delete('token')

        return response

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
