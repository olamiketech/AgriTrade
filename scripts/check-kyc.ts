
import prisma from '@/lib/prisma'

async function main() {
    const exporter = await prisma.user.findFirst({
        where: { email: 'exporter-test-new@example.com' },
        include: { exporterProfile: true }
    })
    console.log(JSON.stringify(exporter, null, 2))
}
main()
