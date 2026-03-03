
import prisma from '@/lib/prisma';

export type AuditAction =
    | 'USER_LOGIN'
    | 'USER_REGISTER'
    | 'TRADE_CREATE'
    | 'TRADE_UPDATE'
    | 'DOC_UPLOAD'
    | 'FINANCE_REQUEST'
    | 'KYC_SUBMISSION'
    | 'KYC_VERIFICATION'
    | 'DOC_EXTRACTION_CONFIRMED'
    | 'DOSSIER_SUMMARY_GENERATED'
    | 'DEAL_SCORE_CALCULATED'
    | 'DOC_EXTRACT';

export async function createAuditLog(
    action: AuditAction,
    userId: string,
    tradeId?: string,
    metadata?: Record<string, any>
) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                actorType: 'USER', // Legacy helper assumes USER action
                actorId: userId,
                userId,
                tradeId,
                metadata: metadata ? JSON.stringify(metadata) : undefined,
            } as any
        });

    } catch (error) {
        // Fallback or silently fail (logging is side effect)
        // In strictly audited system, we might want to throw, but for now log error
        console.error('Failed to create audit log', error);
    }
}
