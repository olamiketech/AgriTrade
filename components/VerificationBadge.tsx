import { ShieldCheck, ShieldAlert, BadgeCheck } from 'lucide-react'

type VerificationLevel = 'BASIC' | 'VERIFIED' | 'VERIFIED_PLUS'

interface VerificationBadgeProps {
    level: VerificationLevel
    showLabel?: boolean
}

export default function VerificationBadge({ level, showLabel = true }: VerificationBadgeProps) {
    if (level === 'VERIFIED_PLUS') {
        return (
            <div className="inline-flex items-center space-x-1" title="Vendor verified with enhanced checks (Verified+)">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                {showLabel && <span className="text-sm font-medium text-purple-700">Verified+</span>}
            </div>
        )
    }

    if (level === 'VERIFIED') {
        return (
            <div className="inline-flex items-center space-x-1" title="Vendor identity verified">
                <BadgeCheck className="h-5 w-5 text-blue-600" />
                {showLabel && <span className="text-sm font-medium text-blue-700">Verified</span>}
            </div>
        )
    }

    return (
        <div className="inline-flex items-center space-x-1" title="Basic account (Unverified)">
            {/* <ShieldAlert className="h-4 w-4 text-gray-400" /> */}
            {showLabel && <span className="text-sm font-medium text-gray-500">Basic</span>}
        </div>
    )
}
