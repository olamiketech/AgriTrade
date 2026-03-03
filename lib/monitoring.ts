
// Mock Monitoring Service (e.g. Sentry / Datadog)

export function captureException(error: any, context?: Record<string, any>) {
    // In production, send to Sentry
    console.error('[MONITORING] Exception:', error, context);
}

export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
    // In production, send to Datadog/CloudWatch
    console.log(`[METRIC] ${name}: ${value}`, tags);
}
