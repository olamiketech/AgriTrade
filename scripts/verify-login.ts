
import 'dotenv/config';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Verifying Admin Login...');

    const email = 'admin@agritradesecure.com';
    const password = 'adminpassword';

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error('❌ Admin user not found in database.');
        process.exit(1);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (isValid) {
        console.log('✅ Admin login verified (Password matches).');
        console.log(`User ID: ${user.id}`);
        console.log(`Role: ${user.role}`);
    } else {
        console.error('❌ Admin password mismatch.');
        process.exit(1);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
