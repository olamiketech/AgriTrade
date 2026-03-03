import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@agritradesecure.com'
    const user = await prisma.user.findUnique({
        where: { email }
    })

    console.log('User found:', user)

    if (user) {
        const isMatch = await bcrypt.compare('adminpassword', user.passwordHash)
        console.log('Password match:', isMatch)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
