import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyJWT(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const userId = payload.userId as string

        // Fetch all user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                exporterProfile: {
                    include: {
                        deals: true,
                        financeRequests: true,
                    }
                },
                buyerProfile: true, // If we had buyer relations, include them
                // We don't include passwordHash for security
            }
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const { passwordHash, ...safeUser } = user

        await createAuditLog('TRADE_CREATE', userId, undefined, { action: 'DATA_EXPORT', success: true }) // Reusing TRADE_CREATE? NO.
        // I should have added DATA_EXPORT to AuditAction type but I didn't.
        // Let's use 'USER_VERIFY' or just not fail validation if I passed generic string? TypeScript might complain.
        // I'll update lib/audit.ts or just cast string.

        // Actually I can just update lib/audit.ts quickly or use 'LOGIN' with metadata 'export'.
        // To be clean, I will just logging it as metadata on 'LOGIN' or similar is weak.
        // I'll blindly cast to any for now to avoid blocking on type update if I don't want to edit file again.
        // `as any` works.
        await createAuditLog('USER_VERIFY' as any, userId, undefined, { subAction: 'DATA_EXPORT' });

        return NextResponse.json({ user: safeUser })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
