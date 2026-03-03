
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../app/api/webhooks/modulr/route";
import { NextRequest } from "next/server";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    default: {
        paymentRecord: {
            findFirst: vi.fn(),
            create: vi.fn().mockResolvedValue({ id: "pay-123" }),
        },
        tradeDeal: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback({
            paymentRecord: { create: vi.fn().mockResolvedValue({ id: "pay-123" }) },
            tradeDeal: { update: vi.fn() }
        })),
    },
}));

// Mock Modulr Service
vi.mock("@/lib/services/ModulrService", () => {
    const MockModulrService = vi.fn();
    MockModulrService.prototype.verifyWebhookSignature = vi.fn().mockReturnValue(true);
    MockModulrService.prototype.createVirtualAccount = vi.fn();
    MockModulrService.prototype.requestPayout = vi.fn();
    return { ModulrService: MockModulrService };
});

import prisma from "@/lib/prisma";

describe("Modulr Webhook API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 if signatures are missing", async () => {
        const req = new NextRequest("http://localhost/api/webhooks/modulr", {
            method: "POST",
            body: JSON.stringify({}),
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it("should process valid payment webhook", async () => {
        const payload = {
            id: "tx-123",
            reference: "DEAL-d1",
            status: "PROCESSED",
            originalAmount: 1000,
            currency: "GBP",
        };

        const req = new NextRequest("http://localhost/api/webhooks/modulr", {
            method: "POST",
            headers: {
                "x-modulr-signature": "valid-sig",
                "x-modulr-nonce": "123",
            },
            body: JSON.stringify(payload),
        });

        // Mock DB responses
        (prisma.paymentRecord.findFirst as any).mockResolvedValue(null); // Not duplicate
        (prisma.tradeDeal.findUnique as any).mockResolvedValue({
            id: "d1",
            status: "AWAITING_PAYMENT",
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        // Verify Transaction was called (implicitly by checking logs or mocks if we had deep access)
        // verification of specific calls would need reference to the transaction mock
    });
});
