import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Testing Finance Request Creation...')

    // Find Exporter
    const exporter = await prisma.exporterProfile.findFirst({
        include: { user: true }
    })

    if (!exporter) {
        console.error('No exporter found')
        return
    }

    console.log(`Using Exporter: ${exporter.id} (User: ${exporter.userId})`)

    // Find Deal owned by exporter
    const deal = await prisma.tradeDeal.findFirst({
        where: { exporterId: exporter.id }
    })

    if (!deal) {
        console.error('No deal found for this exporter')
        return
    }

    console.log(`Using Deal: ${deal.id}`)

    try {
        // Log pre-check
        const existing = await prisma.financeRequest.findMany({ where: { tradeId: deal.id } })
        console.log(`Existing requests: ${existing.length}`)

        // Create
        const financeRequest = await prisma.financeRequest.create({
            data: {
                tradeId: deal.id,
                exporterId: exporter.id,
                amount: 1000,
                currency: 'USD',
                purpose: 'Debug Test',
                supportingDocs: JSON.stringify(['http://test.com/doc']),
                status: 'SUBMITTED',
            }
        });

        console.log('Successfully created Request:', financeRequest.id)

        // Log
        await prisma.financeReferralLog.create({
            data: {
                financeRequestId: financeRequest.id,
                action: 'created_submitted',
                actorId: exporter.userId,
                payload: JSON.stringify({ amount: 1000 })
            }
        });

        console.log('Successfully created Log')

        // Cleanup
        await prisma.financeReferralLog.deleteMany({ where: { financeRequestId: financeRequest.id } })
        await prisma.financeRequest.delete({ where: { id: financeRequest.id } })
        console.log('Cleanup done')

    } catch (e) {
        console.error('ERROR CREATING REQUEST:')
        console.error(e)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
