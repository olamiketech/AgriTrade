import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, signJWT } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['EXPORTER', 'BUYER']),
    companyName: z.string().min(1),
    country: z.string().min(1),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, role, companyName, country } = registerSchema.parse(body)

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        const passwordHash = await hashPassword(password)

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role,
                ...(role === 'EXPORTER'
                    ? {
                        exporterProfile: {
                            create: {
                                companyName,
                                country,
                            },
                        },
                    }
                    : {
                        buyerProfile: {
                            create: {
                                companyName,
                                country,
                            },
                        },
                    }),
            },
        })

        const token = await signJWT({ userId: user.id, email: user.email, role: user.role })

        // Set cookie
        const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } })
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        })

        return response

    } catch (error) {
        console.error(error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
