import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await verifyJWT(token)
        if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status');

        const whereClause: any = {};
        if (statusFilter && statusFilter !== 'ALL') {
            whereClause.status = statusFilter;
        }

        const requests = await prisma.financeRequest.findMany({
            where: whereClause,
            include: {
                exporter: true,
                trade: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(requests);
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
