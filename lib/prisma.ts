import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = (globalThis as unknown as { prismaGlobal: PrismaClient | undefined }).prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') (globalThis as unknown as { prismaGlobal: PrismaClient | undefined }).prismaGlobal = prisma
