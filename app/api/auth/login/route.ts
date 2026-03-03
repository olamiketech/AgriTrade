import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, signJWT } from '@/lib/auth'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { AuditService, AuditAction, ActorType } from '@/lib/services/AuditService'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    mfaCode: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown'

        if (!checkRateLimit(ip)) {
            return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
        }

        const body = await req.json()
        const { email, password, mfaCode } = loginSchema.parse(body)

        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const isValid = await verifyPassword(password, user.passwordHash)

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Admin MFA
        if (user.role === 'ADMIN') {
            if (!mfaCode) {
                // Return requirement for MFA
                // In real app, trigger email sending here
                console.log(`[MOCK EMAIL] MFA Code for ${email}: 123456`);
                return NextResponse.json({ mfaRequired: true, message: 'MFA code sent to email' })
            }

            // Verify MFA
            if (mfaCode !== '123456') { // Mock verification
                await AuditService.log({
                    action: AuditAction.USER_LOGIN_FAILED,
                    actorType: ActorType.USER,
                    actorId: user.id,
                    metadata: { reason: "MFA_FAILED" },
                    userId: user.id
                });
                return NextResponse.json({ error: 'Invalid MFA code' }, { status: 401 })
            }
        }

        const token = await signJWT({ userId: user.id, email: user.email, role: user.role })

        await AuditService.log({
            action: AuditAction.USER_LOGIN,
            actorType: ActorType.USER,
            actorId: user.id,
            userId: user.id
        });

        const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } })
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        })

        return response

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
