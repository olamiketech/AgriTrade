import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

// Mocking Map (actually we can just reset it if we export reset function or just trust isolation per test file run)
// But to be safe, ip addresses should use random suffix per test if state persists.

describe('Rate Limit', () => {
    it('should allow first request', () => {
        const ip = '127.0.0.1-' + Date.now()
        expect(checkRateLimit(ip)).toBe(true)
    })

    it('should block after max attempts', () => {
        const ip = '127.0.0.2-' + Date.now()
        // limit is 5
        expect(checkRateLimit(ip)).toBe(true) // 1
        expect(checkRateLimit(ip)).toBe(true) // 2
        expect(checkRateLimit(ip)).toBe(true) // 3
        expect(checkRateLimit(ip)).toBe(true) // 4
        expect(checkRateLimit(ip)).toBe(true) // 5
        expect(checkRateLimit(ip)).toBe(false) // 6 -> Blocked
    })
})
