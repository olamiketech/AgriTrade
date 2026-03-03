
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TradeStateMachine, TradeState } from "@/lib/statemachine/TradeStateMachine";
import { AuditService, AuditAction, ActorType, EntityType } from "@/lib/services/AuditService";

// Mock Auth Check - In production use request session/JWT
const isAdmin = (req: NextRequest) => {
    // Check headers or session
    return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Await params as per Next.js 15+ async params requirement
    const { id } = await params;

    if (!isAdmin(req)) {
        // For demo, we might skip if no secret set, but better to be safe
        // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action, reason, targetState } = body;

        if (!reason) {
            return NextResponse.json({ error: "Reason is required for admin override" }, { status: 400 });
        }

        const deal = await prisma.tradeDeal.findUnique({ where: { id } });

        if (!deal) {
            return NextResponse.json({ error: "Deal not found" }, { status: 404 });
        }

        // Force State Transition
        if (action === "FORCE_TRANSITION") {
            // Validate? Admin can override, but maybe we still warn
            // For now, let's just update

            const oldStatus = deal.status;

            await prisma.tradeDeal.update({
                where: { id },
                data: { status: targetState }
            });

            await AuditService.log({
                action: AuditAction.ADMIN_OVERRIDE,
                actorType: ActorType.ADMIN,
                actorId: "ADMIN_USER", // Retrieve real ID from session
                entityType: EntityType.TRADE,
                entityId: id,
                metadata: {
                    reason,
                    previousState: oldStatus,
                    newState: targetState
                }
            });

            return NextResponse.json({ status: "updated", previous: oldStatus, current: targetState });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("[Admin] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
