
import prisma from '@/lib/prisma'

async function main() {
    const deals = await prisma.tradeDeal.findMany({
        include: { exporter: true }
    })
    console.log(JSON.stringify(deals, null, 2))
}
main()
