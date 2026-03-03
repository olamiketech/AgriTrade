import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
    status: string
    type: 'deal' | 'payment' | 'finance' | 'verification'
    className?: string
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
    // Normalize status for comparison
    const normalizedStatus = status?.toUpperCase() || 'UNKNOWN'

    let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info" = "outline"
    let label = status

    // Map core logic based on Specification
    switch (type) {
        case 'deal':
            // Success states
            if (['COMPLETED', 'RELEASED', 'PAID_HELD', 'DELIVERY_CONFIRMED', 'SHIPPED'].includes(normalizedStatus)) variant = 'success'
            // Progress states
            else if (['ACCEPTED', 'RELEASE_REQUESTED', 'AWAITING_PAYMENT'].includes(normalizedStatus)) variant = 'info'
            // Pending states
            else if (['CREATED', 'DRAFT', 'PENDING_VERIFICATION'].includes(normalizedStatus)) variant = 'secondary'
            // Error/Warning states
            else if (['DISPUTED', 'REJECTED', 'CANCELLED'].includes(normalizedStatus)) variant = 'error'
            break;

        case 'payment':
            if (['PAID', 'SETTLED'].includes(normalizedStatus)) variant = 'success'
            else if (['PROCESSING', 'ESCROW_FUNDED'].includes(normalizedStatus)) variant = 'warning'
            else if (['FAILED', 'REFUNDED'].includes(normalizedStatus)) variant = 'error'
            else variant = 'secondary' // Unpaid/Pending
            break;

        case 'finance':
            if (['APPROVED', 'DISBURSED'].includes(normalizedStatus)) variant = 'success'
            else if (['PENDING', 'UNDER_REVIEW'].includes(normalizedStatus)) variant = 'warning'
            else if (['REJECTED'].includes(normalizedStatus)) variant = 'error'
            else variant = 'outline'
            break;

        case 'verification':
            if (['VERIFIED', 'VERIFIED_PLUS'].includes(normalizedStatus)) variant = 'success'
            else if (['PENDING'].includes(normalizedStatus)) variant = 'warning'
            else if (['REJECTED'].includes(normalizedStatus)) variant = 'error'
            else variant = 'secondary' // Basic/Unverified
            break;
    }

    // Formatting specific text labels if needed (e.g. removing underscores)
    label = normalizedStatus.replace(/_/g, ' ')

    return (
        <Badge variant={variant} className={className}>
            {label}
        </Badge>
    )
}
