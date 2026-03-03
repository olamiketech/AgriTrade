
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    // 1. Find the exporter user
    const exporter = await prisma.user.findUnique({
        where: { email: 'exporter@test.com' }
    })

    if (!exporter) {
        console.error('Exporter not found')
        return
    }

    console.log(`Found Exporter: ${exporter.id}, Status: ${exporter.verificationStatus}`)

    // 2. Simulate the API logic (since we can't easily call nextjs api from node script without running server, 
    // we will replicate the prisma update logic to see if it throws)

    console.log('Attempting to update status to VERIFIED...')

    try {
        const user = await prisma.user.update({
            where: { id: exporter.id },
            data: { verificationStatus: 'VERIFIED' },
            include: { exporterProfile: true }
        })

        console.log('User updated:', user.verificationStatus)

        if (user.role === 'EXPORTER' && user.exporterProfile) {
            console.log('Updating exporter profile...')
            await prisma.exporterProfile.update({
                where: { id: user.exporterProfile.id },
                data: { approvalStatus: 'APPROVED' }
            })
            console.log('Exporter profile updated')
        }

        console.log('SUCCESS: Database update works manually.')

    } catch (e) {
        console.error('FAILED: Database update threw error:', e)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
