import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'exporter@verified.com'
    const user = await prisma.user.findUnique({
        where: { email },
        include: { exporterProfile: true }
    })

    console.log('Exporter User:', user)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
