import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me'
const key = new TextEncoder().encode(JWT_SECRET)

// GET: Fetch messages for a trade deal
export async function GET(request: Request) {
    try {
        let token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            const cookieStore = await cookies()
            token = cookieStore.get('token')?.value
        }
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const tradeId = searchParams.get('tradeId')

        if (!tradeId) {
            return NextResponse.json({ error: 'Trade ID required' }, { status: 400 })
        }

        const messages = await prisma.message.findMany({
            where: { tradeId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                content: true,
                senderId: true,
                createdAt: true,
            }
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error('[GET /api/messages] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: Send a message
export async function POST(request: Request) {
    try {
        let token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            const cookieStore = await cookies()
            token = cookieStore.get('token')?.value
        }
        if (!token) {
            console.error('[POST /api/messages] No token found')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { payload } = await jwtVerify(token, key)
        const userId = (payload.sub || payload.userId) as string

        if (!userId) {
            console.error('[POST /api/messages] No userId in token')
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const body = await request.json()
        const { tradeId, content } = body

        if (!tradeId) {
            console.error('[POST /api/messages] No tradeId provided')
            return NextResponse.json({ error: 'Trade ID required' }, { status: 400 })
        }

        if (!content || !content.trim()) {
            console.error('[POST /api/messages] No content provided')
            return NextResponse.json({ error: 'Message content required' }, { status: 400 })
        }

        console.log('[POST /api/messages] Creating message:', { tradeId, userId, contentLength: content.length })

        const message = await prisma.message.create({
            data: {
                tradeId,
                senderId: userId,
                content: content.trim(),
            }
        })

        console.log('[POST /api/messages] Message created successfully:', message.id)

        return NextResponse.json(message)
    } catch (error) {
        console.error('[POST /api/messages] Error:', error)
        if (error instanceof Error) {
            console.error('[POST /api/messages] Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            })
        }
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
