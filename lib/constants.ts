export const UserRole = {
    EXPORTER: 'EXPORTER',
    BUYER: 'BUYER',
    ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TradeStatus = {
    DRAFT: 'DRAFT',
    PENDING_ACCEPTANCE: 'PENDING_ACCEPTANCE',
    ACCEPTED: 'ACCEPTED',
    PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type TradeStatus = (typeof TradeStatus)[keyof typeof TradeStatus];

export const PaymentStatus = {
    UNPAID: 'UNPAID',
    PAID_CONFIRMED: 'PAID_CONFIRMED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const DeliveryStatus = {
    PENDING: 'PENDING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
} as const;

export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const FinanceStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const;

export type FinanceStatus = (typeof FinanceStatus)[keyof typeof FinanceStatus];

export const DocumentType = {
    SHIPPING_INVOICE: 'SHIPPING_INVOICE',
    BILL_OF_LADING: 'BILL_OF_LADING',
    PACKING_LIST: 'PACKING_LIST',
    CERTIFICATE_OF_ORIGIN: 'CERTIFICATE_OF_ORIGIN',
    OTHER: 'OTHER',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];
