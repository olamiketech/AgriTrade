
import { POST } from '../app/api/auth/login/route';
import prisma from '../lib/prisma';
import { hashPassword } from '../lib/auth';
import { NextRequest } from 'next/server';

async function main() {
    console.log('Starting Login MFA Verification...');

    // 1. Create Admin User
    const email = `admin_mfa_${Date.now()}@example.com`;
    const password = 'securepassword';
    const hashedPassword = await hashPassword(password);

    const admin = await prisma.user.create({
        data: {
            email,
            passwordHash: hashedPassword,
            role: 'ADMIN',
            verificationStatus: 'VERIFIED',
        }
    });

    // 2. Attempt Login (No MFA)
    console.log('Attempting Login without MFA...');
    const req1 = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    const res1 = await POST(req1);
    const data1 = await res1.json();

    if (res1.status === 200 && data1.mfaRequired) {
        console.log('PASS: MFA Required returned');
    } else {
        console.error('FAIL: Expected MFA Requirement', res1.status, data1);
        process.exit(1);
    }

    // 3. Attempt Login (Wrong MFA)
    console.log('Attempting Login with Wrong MFA...');
    const req2 = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, mfaCode: '000000' })
    });
    const res2 = await POST(req2);
    if (res2.status === 401) {
        console.log('PASS: Wrong MFA Blocked');
    } else {
        console.error('FAIL: Wrong MFA Accepted', res2.status);
    }

    // 4. Attempt Login (Correct MFA)
    console.log('Attempting Login with Correct MFA...');
    const req3 = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, mfaCode: '123456' })
    });
    const res3 = await POST(req3);
    const data3 = await res3.json();

    if (res3.status === 200 && data3.success && res3.cookies.get('token')) {
        console.log('PASS: MFA Login Successful');
    } else {
        console.error('FAIL: MFA Login Failed', res3.status, data3);
        process.exit(1);
    }

    // Clean up
    await prisma.user.delete({ where: { id: admin.id } });
}

main().catch(console.error);
