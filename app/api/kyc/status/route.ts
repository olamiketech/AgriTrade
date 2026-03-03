import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { AuditService, AuditAction, ActorType } from '@/lib/services/AuditService';

const schema = z.object({
    userId: z.string().uuid(),
    providerId: z.string().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
    data: z.any().optional(),
});

// This endpoint would be called by the KYC provider webhook or a frontend callback
// Secure this endpoint in production!
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 });
        }

        const { userId, providerId, status, data } = result.data;

        // Verify user exists and has exporter profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { exporterProfile: true },
        });

        if (!user || !user.exporterProfile) {
            return NextResponse.json({ error: 'User or Exporter Profile not found' }, { status: 404 });
        }

        // Update KYC status
        const updatedProfile = await prisma.exporterProfile.update({
            where: { id: user.exporterProfile.id },
            data: {
                kycStatus: status,
                kycProviderId: providerId,
                kycData: data ? JSON.stringify(data) : undefined,
                // If approved, strictly update verification level if not already verified
                verificationLevel: status === 'APPROVED' ? 'VERIFIED' : user.exporterProfile.verificationLevel,
                verifiedAt: status === 'APPROVED' ? new Date() : user.exporterProfile.verifiedAt,
            },
        });

        // Audit Log
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (adminUser) {
            await AuditService.log({
                action: AuditAction.KYC_UPDATE,
                actorType: ActorType.SYSTEM,
                actorId: adminUser.id,
                userId: adminUser.id,
                metadata: { userId, status, providerId }
            });
        }

        return NextResponse.json({ success: true, profile: updatedProfile });

    } catch (error) {
        console.error('KYC update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
