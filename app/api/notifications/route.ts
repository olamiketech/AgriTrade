import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { jwtVerify } from 'jose'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me'
const key = new TextEncoder().encode(JWT_SECRET)

import { cookies } from 'next/headers'

// GET: Fetch unread notifications
export async function GET(request: Request) {
    try {
        let token = request.headers.get('Authorization')?.split(' ')[1]

        if (!token) {
            const cookieStore = await cookies()
            token = cookieStore.get('token')?.value
        }

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { payload } = await jwtVerify(token, key)
        const userId = payload.sub as string

        const notifications = await prisma.notification.findMany({
            where: {
                userId,
                read: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        })

        return NextResponse.json(notifications)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: Mark notification as read
export async function POST(request: Request) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { payload } = await jwtVerify(token, key)
        const userId = payload.sub as string

        const { notificationId } = await request.json()

        if (notificationId) {
            // Mark specific
            await prisma.notification.updateMany({ // updateMany safely handles verification ownership implicitly via where clause if added, but id is unique. Ideally check ownership.
                where: { id: notificationId, userId },
                data: { read: true }
            })
        } else {
            // Mark all valid for user
            await prisma.notification.updateMany({
                where: { userId, read: false },
                data: { read: true }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
