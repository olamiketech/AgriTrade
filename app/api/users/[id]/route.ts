import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyJWT(token)
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await req.json()
        const { verificationStatus } = body

        console.log(`[ADMIN-VERIFY] Processing update for user ${id}, status: ${verificationStatus}, logic: ${!!token}, role: ${payload?.role}`)

        if (!verificationStatus) {
            return NextResponse.json({ error: 'Missing verificationStatus' }, { status: 400 })
        }

        const user = await prisma.user.update({
            where: { id },
            data: { verificationStatus },
            include: { exporterProfile: true }
        })

        if (user.role === 'EXPORTER' && user.exporterProfile) {
            await prisma.exporterProfile.update({
                where: { id: user.exporterProfile.id },
                data: { approvalStatus: verificationStatus === 'VERIFIED' ? 'APPROVED' : 'REJECTED' }
            })
        }

        return NextResponse.json({ success: true, user })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
