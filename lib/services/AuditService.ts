
import prisma from "@/lib/prisma";

export enum AuditAction {
    DEAL_CREATED = "DEAL_CREATED",
    DEAL_STATUS_CHANGED = "DEAL_STATUS_CHANGED",
    PAYMENT_INITIATED = "PAYMENT_INITIATED",
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
    PAYOUT_REQUESTED = "PAYOUT_REQUESTED",
    PAYOUT_COMPLETED = "PAYOUT_COMPLETED",
    FX_LOCKED = "FX_LOCKED",
    FX_EXECUTED = "FX_EXECUTED",
    DISPUTE_OPENED = "DISPUTE_OPENED",
    DISPUTE_RESOLVED = "DISPUTE_RESOLVED",
    ADMIN_OVERRIDE = "ADMIN_OVERRIDE",
    USER_LOGIN = "USER_LOGIN",
    USER_LOGIN_FAILED = "USER_LOGIN_FAILED",
    DEAL_UPDATED = "DEAL_UPDATED",
    KYC_UPDATE = "KYC_UPDATE",
}

export enum ActorType {
    USER = "USER",
    SYSTEM = "SYSTEM",
    ADMIN = "ADMIN",
}

export enum EntityType {
    TRADE = "TRADE",
    PAYMENT = "PAYMENT",
    USER = "USER",
}

interface AuditEntry {
    action: AuditAction;
    actorType: ActorType;
    actorId: string;
    entityType?: EntityType;
    entityId?: string;
    metadata?: Record<string, any>;
    userId?: string; // Optional: Link to User table if actor is a relevant user
    tradeId?: string; // Optional: Link to Trade table if relevant
}

export class AuditService {
    /**
     * Logs an action to the AuditLog table.
     * This should be called within transactions where possible, or awaited.
     */
    static async log(entry: AuditEntry) {
        try {
            await prisma.auditLog.create({
                data: {
                    action: entry.action,
                    actorType: entry.actorType,
                    actorId: entry.actorId,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    metadata: entry.metadata ? (entry.metadata as any) : undefined, // Cast specifically for JSON compatibility
                    userId: entry.userId,
                    tradeId: entry.tradeId,
                } as any,
            });
            console.log(`[AUDIT] ${entry.action} by ${entry.actorType}:${entry.actorId}`);
        } catch (error) {
            console.error("Failed to write audit log:", error);
            // In a production banking system, failing to audit might be a critical failure.
            // We might want to throw here to rollback the transaction if this is part of one.
        }
    }
}
