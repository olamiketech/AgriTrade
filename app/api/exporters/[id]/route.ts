import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        // Assuming 'id' is the ExporterProfile ID
        const exporter = await prisma.exporterProfile.findUnique({
            where: { id },
            include: {
                // Include whatever else is needed, maybe summary of deals?
                // deals: true 
            }
        })

        if (!exporter) {
            return NextResponse.json(
                { error: 'Exporter not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ exporter })
    } catch (error) {
        console.error("Failed to fetch exporter", error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
