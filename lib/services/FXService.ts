
import crypto from "crypto";

// Mock configuration
const EBURY_CLIENT_ID = process.env.EBURY_CLIENT_ID || "mock-client-id";

export interface FXQuote {
    quoteId: string;
    buyCurrency: string;
    sellCurrency: string;
    rate: number;
    buyAmount: number;
    sellAmount: number;
    expiresAt: Date;
}

export class FXService {
    /**
     * Requests a firm FX quote from Ebury.
     */
    async requestQuote(
        sellCurrency: string,
        buyCurrency: string,
        amount: number, // Amount to sell
        side: "buy" | "sell" = "sell"
    ): Promise<FXQuote> {
        console.log(`[Ebury] Requesting quote: ${side} ${amount} ${sellCurrency} -> ${buyCurrency}`);

        // Mock Rate Logic
        // GBP -> USD ~ 1.25
        // USD -> GBP ~ 0.80
        // EUR -> GBP ~ 0.85
        let rate = 1.0;
        if (sellCurrency === "GBP" && buyCurrency === "USD") rate = 1.25;
        if (sellCurrency === "USD" && buyCurrency === "GBP") rate = 0.80;

        const buyAmount = amount * rate;

        return {
            quoteId: `Q-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
            buyCurrency,
            sellCurrency,
            rate,
            buyAmount,
            sellAmount: amount,
            expiresAt: new Date(Date.now() + 60 * 1000 * 15), // 15 mins validity
        };
    }

    /**
     * Locks only a previously requested quote (booking the trade).
     */
    async lockRate(quoteId: string): Promise<{ tradeId: string; status: string }> {
        console.log(`[Ebury] Booking trade for quote ${quoteId}`);

        return {
            tradeId: `FX-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
            status: "BOOKED"
        };
    }
}
