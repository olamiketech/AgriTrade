
import { GET as exportData } from '../app/api/user/export/route';
import { DELETE as deleteUser } from '../app/api/user/delete/route';
import prisma from '../lib/prisma';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
const secret = new TextEncoder().encode(JWT_SECRET);

async function main() {
    console.log('Starting GDPR Verification...');

    // 1. Create User
    const email = `gdpr_test_${Date.now()}@example.com`;
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: 'hash',
            role: 'EXPORTER',
            exporterProfile: {
                create: {
                    companyName: 'GDPR Test Co',
                    country: 'DE',
                }
            }
        }
    });

    // 2. Generate Token
    const token = await new SignJWT({ userId: user.id, email: user.email, role: user.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret);

    // 3. Test Export
    console.log('Testing Export...');
    const reqExport = new NextRequest('http://localhost:3000/api/user/export', {
        headers: { cookie: `token=${token}` }
    });
    const resExport = await exportData(reqExport);
    const dataExport = await resExport.json();

    if (resExport.status === 200 && dataExport.user.email === email) {
        console.log('PASS: Data Export successful');
    } else {
        console.error('FAIL: Data Export failed', resExport.status, dataExport);
        process.exit(1);
    }

    // 4. Test Deletion
    console.log('Testing Deletion (Anonymization)...');
    const reqDelete = new NextRequest('http://localhost:3000/api/user/delete', {
        method: 'DELETE',
        headers: { cookie: `token=${token}` }
    });
    const resDelete = await deleteUser(reqDelete);

    if (resDelete.status === 200) {
        console.log('PASS: Deletion request successful');
    } else {
        console.error('FAIL: Deletion request failed', resDelete.status);
        process.exit(1);
    }

    // 5. Verify Anonymization in DB
    const checkUser = await prisma.user.findUnique({ where: { id: user.id } });
    const checkProfile = await prisma.exporterProfile.findUnique({ where: { userId: user.id } });

    if (checkUser && checkUser.email.startsWith('deleted_') && checkUser.passwordHash === 'DELETED') {
        console.log('PASS: User record anonymized');
    } else {
        console.error('FAIL: User record NOT properly anonymized', checkUser);
        process.exit(1);
    }

    if (checkProfile && checkProfile.companyName === 'Deleted User') {
        console.log('PASS: Profile record anonymized');
    } else {
        console.error('FAIL: Profile record NOT properly anonymized', checkProfile);
        process.exit(1);
    }

    // Clean up
    await prisma.exporterProfile.delete({ where: { id: checkProfile!.id } });
    await prisma.user.delete({ where: { id: user.id } });
}

main().catch(console.error);
