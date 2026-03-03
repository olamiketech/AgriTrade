import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);

        // Only admins can view user documents
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        // Get user with exporter profile and KYC documents
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                exporterProfile: {
                    include: {
                        kycDocuments: {
                            orderBy: { uploadedAt: 'desc' }
                        }
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                verificationStatus: user.verificationStatus,
            },
            exporterProfile: user.exporterProfile,
            documents: user.exporterProfile?.kycDocuments || []
        });

    } catch (e) {
        console.error('Error fetching user documents:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
