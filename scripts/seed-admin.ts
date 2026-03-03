import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@agritradesecure.com'
    const password = 'adminpassword'
    const passwordHash = await bcrypt.hash(password, 10)

    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            role: 'ADMIN',
            verificationStatus: 'VERIFIED'
        },
        create: {
            email,
            passwordHash,
            role: 'ADMIN',
            verificationStatus: 'VERIFIED'
        },
    })

    console.log('Admin user created/updated:', admin)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
