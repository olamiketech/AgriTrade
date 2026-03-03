import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10)

    // 1. Create Verified Exporter
    const exporterEmail = 'exporter@verified.com'
    const exporterUser = await prisma.user.upsert({
        where: { email: exporterEmail },
        update: {},
        create: {
            email: exporterEmail,
            role: 'EXPORTER',
            passwordHash,
            verificationStatus: 'VERIFIED'
        }
    })

    const exporterProfile = await prisma.exporterProfile.upsert({
        where: { userId: exporterUser.id },
        update: {
            verificationLevel: 'VERIFIED',
            verifiedAt: new Date(),
            verificationNotes: 'Verified via automated seed script.'
        },
        create: {
            userId: exporterUser.id,
            companyName: 'Verified Exports Ltd.',
            country: 'Nigeria',
            verificationLevel: 'VERIFIED',
            verifiedAt: new Date(),
            verificationNotes: 'Verified via automated seed script.'
        }
    })

    // 2. Create Buyer
    const buyerEmail = 'buyer@test.com'
    const buyerUser = await prisma.user.upsert({
        where: { email: buyerEmail },
        update: {},
        create: {
            email: buyerEmail,
            role: 'BUYER',
            passwordHash,
            verificationStatus: 'VERIFIED'
        }
    })

    const buyerProfile = await prisma.buyerProfile.upsert({
        where: { userId: buyerUser.id },
        update: {},
        create: {
            userId: buyerUser.id,
            companyName: 'Global Imports Inc.',
            country: 'UK'
        }
    })

    // 3. Create Deal
    const deal = await prisma.tradeDeal.create({
        data: {
            exporterId: exporterProfile.id,
            buyerEmail: buyerEmail,
            productDetails: 'Organic Cocoa Beans',
            quantity: 50,
            price: 50000,
            currency: 'USD',
            deliveryTerms: 'FOB Lagos',
            status: 'PENDING_ACCEPTANCE'
        }
    })

    console.log(`Created deal: ${deal.id}`)
    console.log(`Exporter: ${exporterEmail}`)
    console.log(`Buyer: ${buyerEmail}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
