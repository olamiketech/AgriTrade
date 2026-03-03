
import { describe, it, expect } from "vitest";
import { TradeStateMachine, TradeState } from "../../lib/statemachine/TradeStateMachine";

describe("TradeStateMachine", () => {
    it("should allow valid transitions", () => {
        // Created -> Accepted
        expect(() =>
            TradeStateMachine.validateTransition(TradeState.CREATED, TradeState.ACCEPTED)
        ).not.toThrow();

        // Accepted -> Awaiting Payment
        expect(() =>
            TradeStateMachine.validateTransition(TradeState.ACCEPTED, TradeState.AWAITING_PAYMENT)
        ).not.toThrow();
    });

    it("should throw error for invalid transitions", () => {
        // Created -> Shipped (Skip steps)
        expect(() =>
            TradeStateMachine.validateTransition(TradeState.CREATED, TradeState.SHIPPED)
        ).toThrow();

        // Released -> Paid (Backwards)
        expect(() =>
            TradeStateMachine.validateTransition(TradeState.RELEASED, TradeState.PAID_HELD)
        ).toThrow();
    });

    it("should return allowed transitions", () => {
        const transitions = TradeStateMachine.getAllowedTransitions(TradeState.PAID_HELD);
        expect(transitions).toContain(TradeState.SHIPPED);
        expect(transitions).toContain(TradeState.CANCELLED);
        expect(transitions).toContain(TradeState.DISPUTED);
        expect(transitions).not.toContain(TradeState.CREATED);
    });
});
