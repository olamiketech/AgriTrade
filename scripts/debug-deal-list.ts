import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Listing all Trade Deals...')
    const deals = await prisma.tradeDeal.findMany({
        select: { id: true, productDetails: true, status: true, exporter: { select: { user: { select: { email: true } } } } }
    })

    console.log(`Found ${deals.length} deals:`)
    deals.forEach(d => {
        console.log(`[${d.id}] ${d.productDetails} (${d.status}) - ${d.exporter.user.email}`)
    })
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
