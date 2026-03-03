
import crypto from "crypto";

// Mock configuration - in production this comes from env
const MODULR_API_KEY = process.env.MODULR_API_KEY || "mock-key";
const MODULR_API_SECRET = process.env.MODULR_API_SECRET || "mock-secret";
const MODULR_API_URL = "https://api-sandbox.modulrfinance.com/api-v1";

interface ModulrAccount {
    id: string;
    currency: string;
    bankName: string;
    sortCode?: string;
    accountNumber?: string;
    iban?: string;
    bic?: string;
}

export class ModulrService {
    /**
     * Creates a dedicated virtual account for a specific Trade Deal.
     * This ensures segregation of funds per deal.
     */
    async createVirtualAccount(dealId: string, customerId: string): Promise<ModulrAccount> {
        console.log(`[Modulr] Creating virtual account for deal ${dealId} (Customer: ${customerId})`);

        // In a real implementation:
        // const response = await fetch(`${MODULR_API_URL}/accounts`, { ... });

        // MOCK RESPONSE
        return {
            id: `A-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
            currency: "GBP",
            bankName: "Modulr/AgriTrade",
            sortCode: "12-34-56",
            accountNumber: Math.floor(10000000 + Math.random() * 90000000).toString(),
        };
    }

    /**
     * Initiates a payout from the virtual account to the Exporter's bank account.
     */
    async requestPayout(
        sourceAccountId: string,
        beneficiaryId: string,
        amount: number,
        currency: string,
        reference: string
    ): Promise<{ paymentId: string; status: string }> {
        console.log(`[Modulr] Requesting payout of ${amount} ${currency} from ${sourceAccountId} to ${beneficiaryId}`);

        // MOCK RESPONSE
        return {
            paymentId: `PAY-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
            status: "ACCEPTED", // Modulr statuses: SUBMITTED, VALIDATED, PENDING_FOR_DATE, PENDING_FOR_FUNDS, PROCESSED
        };
    }

    /**
     * Verifies the HMAC signature of an incoming webhook.
     */
    verifyWebhookSignature(payload: string, signature: string, nonce: string): boolean {
        if (process.env.NODE_ENV === "development") return true; // Bypass in dev if needed, but risky

        const hmac = crypto.createHmac("sha256", MODULR_API_SECRET);
        hmac.update(payload + nonce); // Confirm exact Modulr signing format
        const calculatedSignature = hmac.digest("hex");

        // Request signature might be base64 or hex depending on provider
        // Modulr specific logic here

        return signature === calculatedSignature;
    }
}
