import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'


const prisma = new PrismaClient()

async function main() {
    const email = 'admin@agritradesecure.com'
    const password = 'adminpassword'
    const passwordHash = await bcrypt.hash(password, 10)

    const admin = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash,
            role: 'ADMIN',
            verificationStatus: 'VERIFIED'
        },
    })

    // Create Verified Exporter
    const exporterEmail = 'exporter@example.com'
    const exporter = await prisma.user.upsert({
        where: { email: exporterEmail },
        update: {},
        create: {
            email: exporterEmail,
            passwordHash,
            role: 'EXPORTER',
            verificationStatus: 'VERIFIED'
        },
    })

    // Create Verified Buyer
    const buyerEmail = 'buyer@example.com'
    const buyer = await prisma.user.upsert({
        where: { email: buyerEmail },
        update: {},
        create: {
            email: buyerEmail,
            passwordHash,
            role: 'BUYER',
            verificationStatus: 'VERIFIED'
        },
    })

    console.log({ admin, exporter, buyer })
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
