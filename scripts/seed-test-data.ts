import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // 1. Create Exporter
    const email = 'exporter@test.com'
    const password = 'password123'
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash,
            role: 'EXPORTER',
            verificationStatus: 'VERIFIED'
        },
    })

    const exporter = await prisma.exporterProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            companyName: 'Test Exporter Ltd',
            country: 'Nigeria',
            verificationLevel: 'VERIFIED',
            kycStatus: 'APPROVED'
        }
    })

    // 2. Create Deal
    const deal = await prisma.tradeDeal.create({
        data: {
            exporterId: exporter.id,
            buyerEmail: 'buyer@test.com',
            productDetails: 'Cashew Nuts',
            quantity: 50,
            price: 1500,
            currency: 'USD',
            deliveryTerms: 'FOB',
            status: 'CONFIRMED',
            paymentStatus: 'UNPAID'
        }
    })

    console.log(`Created Exporter: ${email} / ${password}`)
    console.log(`Created Deal: ${deal.id}`)
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
