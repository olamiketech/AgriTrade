
import { TradeDeal } from "@prisma/client";

export enum TradeState {
    CREATED = "CREATED",
    ACCEPTED = "ACCEPTED",
    AWAITING_PAYMENT = "AWAITING_PAYMENT",
    PAID_HELD = "PAID_HELD",
    SHIPPED = "SHIPPED",
    DELIVERY_CONFIRMED = "DELIVERY_CONFIRMED",
    RELEASE_REQUESTED = "RELEASE_REQUESTED",
    RELEASED = "RELEASED",
    DISPUTED = "DISPUTED",
    CANCELLED = "CANCELLED",
}

type TransitionMap = {
    [key in TradeState]?: TradeState[];
};

export class TradeStateMachine {
    private static transitions: TransitionMap = {
        [TradeState.CREATED]: [TradeState.ACCEPTED, TradeState.CANCELLED],
        [TradeState.ACCEPTED]: [TradeState.AWAITING_PAYMENT, TradeState.CANCELLED],
        [TradeState.AWAITING_PAYMENT]: [TradeState.PAID_HELD, TradeState.CANCELLED],
        [TradeState.PAID_HELD]: [TradeState.SHIPPED, TradeState.CANCELLED, TradeState.DISPUTED],
        [TradeState.SHIPPED]: [TradeState.DELIVERY_CONFIRMED, TradeState.DISPUTED],
        [TradeState.DELIVERY_CONFIRMED]: [TradeState.RELEASE_REQUESTED, TradeState.DISPUTED],
        [TradeState.RELEASE_REQUESTED]: [TradeState.RELEASED, TradeState.DISPUTED],
        [TradeState.DISPUTED]: [
            TradeState.PAID_HELD, // Dispute resolved, back to holding
            TradeState.RELEASED, // Dispute resolved, funds released
            TradeState.CANCELLED // Dispute resolved, deal cancelled/refunded
        ],
        [TradeState.RELEASED]: [], // Terminal state
        [TradeState.CANCELLED]: [], // Terminal state
    };

    /**
     * Validates if a transition from currentState to nextState is allowed.
     * @throws Error if transition is invalid.
     */
    public static validateTransition(currentState: string, nextState: TradeState): void {
        const validNextStates = this.transitions[currentState as TradeState];

        if (!validNextStates || !validNextStates.includes(nextState)) {
            throw new Error(
                `Invalid state transition from ${currentState} to ${nextState}`
            );
        }
    }

    /**
     * Returns allowed next states for a given state.
     */
    public static getAllowedTransitions(currentState: TradeState): TradeState[] {
        return this.transitions[currentState] || [];
    }

    /**
     * Checks if the deal can be cancelled.
     */
    public static canCancel(currentState: string): boolean {
        // Cancellation is allowed from most states before funds are released, 
        // but strictly speaking, once funds are held, cancellation requires refund logic (admin intervention).
        // For this strict model, we allow transition to CANCELLED from early states.
        // Later states (PAID_HELD+) might need Dispute flow to Cancel.
        // However, the transition map defines strictly where CANCELLED is a direct edge.
        const state = currentState as TradeState;
        return this.transitions[state]?.includes(TradeState.CANCELLED) || false;
    }
}
