
import { TradeStateMachine, TradeState } from "../lib/statemachine/TradeStateMachine";
import { ModulrService } from "../lib/services/ModulrService";
import { FXService } from "../lib/services/FXService";

const modulr = new ModulrService();
const fx = new FXService();

async function runDemo() {
    console.log("🚀 Starting AgriTrade Backend Demo\n");

    // 1. Create Deal
    let currentDeal = {
        id: "deal-demo-1",
        status: TradeState.CREATED,
        amount: 10000,
        currency: "GBP",
        exporterId: "EXP-001",
        buyerEmail: "buyer@example.com"
    };
    console.log(`[Deal Created] Status: ${currentDeal.status}`);

    // 2. Accept Deal
    TradeStateMachine.validateTransition(currentDeal.status, TradeState.ACCEPTED);
    currentDeal.status = TradeState.ACCEPTED;
    console.log(`[Deal Accepted] Status: ${currentDeal.status}`);

    // 3. Request Payment (Modulr)
    TradeStateMachine.validateTransition(currentDeal.status, TradeState.AWAITING_PAYMENT);
    currentDeal.status = TradeState.AWAITING_PAYMENT;
    console.log(`[Awaiting Payment] Status: ${currentDeal.status}`);

    const vAccount = await modulr.createVirtualAccount(currentDeal.id, "CUST-123");
    console.log(`  -> Virtual Account Created: ${vAccount.sortCode} ${vAccount.accountNumber}`);

    // 4. Simulate Payment Webhook
    console.log("\n[Simulating Payment Webhook form Modulr...]");
    const payload = {
        id: "tx-999",
        reference: `DEAL-${currentDeal.id}`,
        status: "PROCESSED",
        originalAmount: 10000,
        currency: "GBP"
    };

    // Verify Logic
    if (payload.status === "PROCESSED" && currentDeal.status === TradeState.AWAITING_PAYMENT) {
        TradeStateMachine.validateTransition(currentDeal.status, TradeState.PAID_HELD);
        currentDeal.status = TradeState.PAID_HELD;
        console.log(`  -> Payment Verified. Funds Held.`);
        console.log(`[Payment Received] Status: ${currentDeal.status}`);
    }

    // 5. FX Scenario (if needed)
    console.log("\n[Simulating FX for Payout...]");
    const quote = await fx.requestQuote("GBP", "USD", 5000);
    console.log(`  -> FX Quote Received: 1 GBP = ${quote.rate} USD`);
    const trade = await fx.lockRate(quote.quoteId);
    console.log(`  -> FX Trade Locked: ${trade.tradeId}`);

    // 6. Release Funds
    // Skip to release for demo
    // In real life: PAID_HELD -> SHIPPED -> DELIVERY_CONFIRMED -> RELEASE_REQUESTED -> RELEASED

    console.log("\n[Fast-forwarding to Release...]");
    currentDeal.status = TradeState.SHIPPED;
    console.log(`[Shipped] Status: ${currentDeal.status}`);

    currentDeal.status = TradeState.DELIVERY_CONFIRMED;
    console.log(`[Delivery Confirmed] Status: ${currentDeal.status}`);

    currentDeal.status = TradeState.RELEASE_REQUESTED;
    console.log(`[Release Requested] Status: ${currentDeal.status}`);

    const payout = await modulr.requestPayout(vAccount.id, "BEN-456", 10000, "GBP", "Payment Ref");
    console.log(`  -> Payout Initiated: ${payout.paymentId} (${payout.status})`);

    currentDeal.status = TradeState.RELEASED;
    console.log(`[Released] Status: ${currentDeal.status}`);

    console.log("\n✅ Demo Completed Successfully.");
}

runDemo().catch(console.error);
