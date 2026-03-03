const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const email = 'admin_test@example.com'
    const password = await bcrypt.hash('password123', 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: { role: 'ADMIN', verificationStatus: 'VERIFIED' },
        create: {
            email,
            passwordHash: password,
            role: 'ADMIN',
            verificationStatus: 'VERIFIED'
        }
    })

    console.log(`Admin user ready: ${user.email}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
