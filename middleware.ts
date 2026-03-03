import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me'
const key = new TextEncoder().encode(JWT_SECRET)

// Define route access rules
const ROLE_PATHS: Record<string, string[]> = {
    '/admin': ['ADMIN'],
    '/dashboard/exporter': ['EXPORTER'],
    '/dashboard/buyer': ['BUYER'],
}

const PUBLIC_API_PATHS = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/register',
    '/api/webhooks',
]

const PUBLIC_PAGE_PATHS = [
    '/login',
    '/signup',
    '/',
    '/about',
    '/_next',
    '/favicon.ico',
    '/grid.svg',
    '/logo.png'
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Allow Public Assets & Pages
    if (PUBLIC_PAGE_PATHS.some(path => pathname === path || pathname.startsWith('/_next') || pathname.startsWith('/public'))) {
        return NextResponse.next()
    }

    // 2. Allow Public API Endpoints
    if (pathname.startsWith('/api')) {
        if (PUBLIC_API_PATHS.some(p => pathname.startsWith(p))) {
            return NextResponse.next()
        }
    }

    // 3. Token Verification
    const token = request.cookies.get('token')?.value || request.headers.get('Authorization')?.split(' ')[1]

    if (!token) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 })
        }
        // Redirect to login if accessing a protected page without a token
        if (pathname !== '/login' && !PUBLIC_PAGE_PATHS.includes(pathname)) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(url)
        }
        return NextResponse.next()
    }

    try {
        const { payload } = await jwtVerify(token, key)
        const userRole = payload.role as string

        // 4. RBAC Check for Specific Paths
        const requiredRoles = Object.entries(ROLE_PATHS).find(([path]) => pathname.startsWith(path))?.[1]

        if (requiredRoles) {
            if (!requiredRoles.includes(userRole)) {
                if (pathname.startsWith('/api')) {
                    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
                }
                return NextResponse.redirect(new URL('/unauthorized', request.url))
            }
        }

        // Attach user info to headers for downstream use if needed (optional but good practice)
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', payload.sub as string)
        requestHeaders.set('x-user-role', userRole)

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        })

    } catch (error) {
        console.error('Middleware Auth Error:', error)
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 })
        }
        // Redirect to login on invalid token
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
