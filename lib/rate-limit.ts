
const rateHelpers = new Map<string, { count: number, resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // 5 attempts per window

export function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateHelpers.get(ip);

    if (!record) {
        rateHelpers.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }

    if (now > record.resetAt) {
        // Reset
        rateHelpers.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }

    if (record.count >= MAX_ATTEMPTS) {
        return false;
    }

    record.count++;
    return true;
}

export function clearRateLimit(ip: string): void {
    rateHelpers.delete(ip);
}

export function clearAllRateLimits(): void {
    rateHelpers.clear();
}
