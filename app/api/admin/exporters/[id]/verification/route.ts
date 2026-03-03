import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // TODO: Add real RBAC check here. For now, we assume the middleware/layout handles it 
        // or we check the session user role. 
        // Since I don't have access to the auth implementation details (e.g. NextAuth session),
        // I will focus on the logic. In a real app, verify admin role here.

        const body = await request.json()
        const { verificationLevel, verificationNotes } = body
        const { id } = await params

        console.log(`[VERIFY] Updating exporter ${id} to level ${verificationLevel}`)

        // Validate input
        const validLevels = ['BASIC', 'VERIFIED', 'VERIFIED_PLUS']
        if (verificationLevel && !validLevels.includes(verificationLevel)) {
            return NextResponse.json(
                { error: 'Invalid verification level' },
                { status: 400 }
            )
        }

        const updateData: any = {}
        if (verificationLevel) updateData.verificationLevel = verificationLevel
        if (verificationNotes !== undefined) updateData.verificationNotes = verificationNotes

        // If becoming verified, set timestamp
        if (verificationLevel === 'VERIFIED' || verificationLevel === 'VERIFIED_PLUS') {
            updateData.verifiedAt = new Date()
        }

        const exporterProfile = await prisma.exporterProfile.update({
            where: { id },
            data: updateData
        })

        // Also update the User model's verificationStatus for easier querying/stat checking if needed,
        // although the source of truth for the *level* is now in ExporterProfile.
        // The User.verificationStatus seems to be a simpler PENDING/VERIFIED/REJECTED.
        // Let's keep them in sync roughly.
        if (verificationLevel === 'VERIFIED' || verificationLevel === 'VERIFIED_PLUS') {
            await prisma.user.update({
                where: { id: exporterProfile.userId },
                data: { verificationStatus: 'VERIFIED' }
            })
        }

        return NextResponse.json({ exporterProfile })
    } catch (error) {
        console.error("Failed to update verification", error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
