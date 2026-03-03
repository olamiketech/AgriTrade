
import prisma from '../lib/prisma';
import { hashPassword } from '../lib/auth';

async function main() {
    console.log('Seeding E2E Users...');

    const password = 'password123';
    const hashedPassword = await hashPassword(password);

    // 1. Admin
    const adminEmail = 'admin@agritrade.com';
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: hashedPassword,
            role: 'ADMIN',
            verificationStatus: 'VERIFIED',
        }
    });
    console.log(`Admin created: ${adminEmail} / ${password}`);

    // 2. Verified Exporter
    const exporterEmail = 'exporter@test.com';
    const exporter = await prisma.user.upsert({
        where: { email: exporterEmail },
        update: {
            exporterProfile: {
                update: {
                    kycStatus: 'APPROVED',
                    verificationLevel: 'VERIFIED_PLUS'
                }
            }
        },
        create: {
            email: exporterEmail,
            passwordHash: hashedPassword,
            role: 'EXPORTER',
            verificationStatus: 'VERIFIED',
            exporterProfile: {
                create: {
                    companyName: 'Best Grains Ltd',
                    country: 'US',
                    kycStatus: 'APPROVED',
                    verificationLevel: 'VERIFIED_PLUS'
                }
            }
        }
    });
    console.log(`Verified Exporter created: ${exporterEmail} / ${password}`);

    // 3. Unverified Exporter
    const unverifiedEmail = 'new_exporter@test.com';
    await prisma.user.upsert({
        where: { email: unverifiedEmail },
        update: {},
        create: {
            email: unverifiedEmail,
            passwordHash: hashedPassword,
            role: 'EXPORTER',
            verificationStatus: 'PENDING',
            exporterProfile: {
                create: {
                    companyName: 'Newbie Farms',
                    country: 'BR',
                    kycStatus: 'PENDING',
                }
            }
        }
    });
    console.log(`Unverified Exporter created: ${unverifiedEmail} / ${password}`);

    // 4. Buyer
    const buyerEmail = 'buyer@test.com';
    await prisma.user.upsert({
        where: { email: buyerEmail },
        update: {},
        create: {
            email: buyerEmail,
            passwordHash: hashedPassword,
            role: 'BUYER',
            verificationStatus: 'VERIFIED',
            buyerProfile: {
                create: {
                    companyName: 'Global Foods Inc',
                    country: 'UK',
                }
            }
        }
    });
    console.log(`Buyer created: ${buyerEmail} / ${password}`);
}

main().catch(console.error);
