
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10)

    // 1. Basic User (should create DRAFT)
    const basicEmail = 'basic@example.com'
    await prisma.user.upsert({
        where: { email: basicEmail },
        update: {},
        create: {
            email: basicEmail,
            passwordHash,
            role: 'EXPORTER',
            verificationStatus: 'PENDING',
            exporterProfile: {
                create: {
                    companyName: 'Basic Exporter Ltd',
                    country: 'Ghana',
                    verificationLevel: 'BASIC'
                }
            }
        }
    })

    // 2. Verified User (should create PENDING_ACCEPTANCE)
    const verifiedEmail = 'verified@example.com'
    await prisma.user.upsert({
        where: { email: verifiedEmail },
        update: {},
        create: {
            email: verifiedEmail,
            passwordHash,
            role: 'EXPORTER',
            verificationStatus: 'VERIFIED',
            exporterProfile: {
                create: {
                    companyName: 'Verified Exporter Ltd',
                    country: 'Nigeria',
                    verificationLevel: 'VERIFIED'
                }
            }
        }
    })

    console.log('Test users created')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
