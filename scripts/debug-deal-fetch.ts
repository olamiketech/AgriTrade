import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fetching a deal to test...')
    const deal = await prisma.tradeDeal.findFirst()
    if (!deal) {
        console.log('No deals found')
        return
    }
    const dealId = '26e4eab4-3401-464c-a2a8-05e4419cfa79'
    console.log(`Testing fetch for deal: ${dealId}`)

    try {
        const result = await prisma.tradeDeal.findUnique({
            where: { id: dealId },
            include: {
                documents: {
                    include: { extractions: true }
                },
                financeRequests: true,
                exporter: { select: { id: true, companyName: true, user: { select: { email: true } } } },
            }
        })
        console.log('Success:', result ? 'Found' : 'Not Found')
        console.log(JSON.stringify(result, null, 2))
    } catch (e) {
        console.error('ERROR FETCHING DEAL:')
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
