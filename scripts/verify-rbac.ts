
import { SignJWT } from 'jose';
import prisma from '../lib/prisma';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
const secret = new TextEncoder().encode(JWT_SECRET);

async function main() {
    console.log('Starting RBAC Verification...');

    // 1. Generate Admin and User Tokens
    const adminToken = await new SignJWT({ userId: 'admin', role: 'ADMIN' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret);

    const userToken = await new SignJWT({ userId: 'user', role: 'EXPORTER' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret);

    // 2. Mock Request Helper
    const createReq = (path: string, token?: string) => {
        const req = new NextRequest(`http://localhost:3000${path}`, {
            headers: token ? {
                'cookie': `token=${token}`
            } : {}
        });
        return req;
    };

    // 3. Test Cases
    const tests = [
        { name: 'Admin Route - No Token', path: '/admin/dashboard', token: undefined, expect: 307 }, // Redirect to login
        { name: 'Admin Route - User Token', path: '/admin/dashboard', token: userToken, expect: 307 }, // Redirect to unauthorized (or login/home depending on impl)
        // Wait, middleware redirects to /unauthorized for forbidden role.

        { name: 'Admin Route - Admin Token', path: '/admin/dashboard', token: adminToken, expect: 200 }, // Next() returns valid response (which strictly speaking isn't 200 object, but we check if it is NOT a redirect/error)
    ];

    // Note: NextResponse.next() doesn't return a status 200 object directly in tests, it returns an object with internal symbol.
    // We check if `headers.get('location')` exists for redirects.

    for (const t of tests) {
        console.log(`Testing: ${t.name}`);
        const req = createReq(t.path, t.token);
        const res = await middleware(req);

        if (t.expect === 307) {
            // Check redirect
            const location = res.headers.get('location');
            if (location) {
                // If expected redirect to unauthorized
                if (t.name.includes('User Token') && location.includes('/unauthorized')) {
                    console.log('PASS: Redirected to unauthorized');
                } else if (location.includes('/login')) {
                    console.log('PASS: Redirected to login');
                } else {
                    console.error(`FAIL: Redirected to ${location}, expected login or unauthorized`);
                    process.exit(1);
                }
            } else {
                console.error('FAIL: Expected redirect, got pass');
                process.exit(1);
            }
        } else if (t.expect === 200) {
            // Check passthrough
            if (res.headers.get('location')) {
                console.error(`FAIL: Expected pass, got redirect to ${res.headers.get('location')}`);
                process.exit(1);
            } else {
                console.log('PASS: Access Allowed');
            }
        }
    }

    console.log('RBAC Verified Successfully (Middleware Logic).');
}

main().catch(console.error);
