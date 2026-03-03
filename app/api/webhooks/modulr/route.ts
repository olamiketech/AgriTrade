
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ModulrService } from "@/lib/services/ModulrService";
import { TradeStateMachine, TradeState } from "@/lib/statemachine/TradeStateMachine";
import { AuditService, AuditAction, ActorType, EntityType } from "@/lib/services/AuditService";

const modulrService = new ModulrService();

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get("x-modulr-signature");
        const nonce = req.headers.get("x-modulr-nonce");
        const bodyText = await req.text();

        if (!signature || !nonce) {
            return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
        }

        // 1. Verify Signature
        if (!modulrService.verifyWebhookSignature(bodyText, signature, nonce)) {
            console.error("[Webhook] Invalid signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        const payload = JSON.parse(bodyText);
        const { id: partnerTxId, reference, status, originalAmount, currency } = payload;

        // 2. Idempotency Check
        const existingPayment = await prisma.paymentRecord.findFirst({
            where: { partnerTxId },
        });

        if (existingPayment) {
            console.log(`[Webhook] Duplicate event for tx ${partnerTxId}`);
            return NextResponse.json({ status: "ignored_duplicate" });
        }

        // 3. Find Deal
        // Assuming 'reference' matches our Deal ID or we have a mapping.
        // In production, we might store a specialized paymentRef in the deal.
        // specific logic: Modulr reference might be "DEAL-<UUID>"
        const dealId = reference.replace("DEAL-", "");

        const deal = await prisma.tradeDeal.findUnique({
            where: { id: dealId },
        });

        if (!deal) {
            console.error(`[Webhook] Deal not found for reference ${reference}`);
            return NextResponse.json({ error: "Deal not found" }, { status: 404 });
        }

        // 4. Process Payment
        await prisma.$transaction(async (tx: any) => {
            // Create Payment Record
            const payment = await tx.paymentRecord.create({
                data: {
                    dealId: deal.id,
                    partner: "MODULR",
                    partnerTxId,
                    partnerReference: reference,
                    amount: originalAmount,
                    currency,
                    status, // e.g., 'PROCESSED'
                    rawPayload: payload,
                },
            });

            // Update Deal Status if Payment is Successful
            // Map Modulr status to our logic
            if (status === "PROCESSED" || status === "SUCCESS") {
                if (deal.status === TradeState.AWAITING_PAYMENT) {
                    // Verify correct amount?
                    // For now, auto-transition to PAID_HELD
                    TradeStateMachine.validateTransition(deal.status, TradeState.PAID_HELD);

                    await tx.tradeDeal.update({
                        where: { id: deal.id },
                        data: {
                            status: TradeState.PAID_HELD,
                            paymentStatus: "PAID_HELD", // Legacy field update
                        }
                    });

                    await AuditService.log({
                        action: AuditAction.PAYMENT_RECEIVED,
                        actorType: ActorType.SYSTEM,
                        actorId: "MODULR_WEBHOOK",
                        entityType: EntityType.PAYMENT,
                        entityId: payment.id,
                        tradeId: deal.id,
                        metadata: { amount: originalAmount, currency }
                    });

                    await AuditService.log({
                        action: AuditAction.DEAL_STATUS_CHANGED,
                        actorType: ActorType.SYSTEM,
                        actorId: "MODULR_WEBHOOK",
                        entityType: EntityType.TRADE,
                        entityId: deal.id,
                        tradeId: deal.id,
                        metadata: { oldStatus: deal.status, newStatus: TradeState.PAID_HELD }
                    });
                }
            }
        });

        return NextResponse.json({ status: "processed" });

    } catch (error) {
        console.error("[Webhook] Processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
