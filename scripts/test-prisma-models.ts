
const { PrismaClient } = require('@prisma/client')
const localPrisma = new PrismaClient()

async function main() {
    console.log('Available models on prisma client:')
    const modelNames = Object.keys(localPrisma).filter(key =>
        !key.startsWith('_') &&
        !key.startsWith('$') &&
        typeof localPrisma[key] === 'object' &&
        localPrisma[key] !== null
    )
    console.log(modelNames)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await localPrisma.$disconnect()
    })
