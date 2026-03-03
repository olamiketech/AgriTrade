'use client'

import { useState } from 'react'
import { X, ShieldCheck } from 'lucide-react'

interface TermsModalProps {
    isOpen: boolean
    onClose: () => void
    onAccept: () => void
    dealId?: string // Optional context
}

export default function TermsModal({ isOpen, onClose, onAccept, dealId }: TermsModalProps) {
    const [accepted, setAccepted] = useState(false)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-gray-800">Non-Circumvention Agreement</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        By proceeding with this transaction, you agree to conduct all future business with this party through the <strong>AgriTrade Secure</strong> platform for a period of <strong>12 months</strong> from today.
                    </p>

                    <div className="bg-amber-50 border border-amber-100 rounded-md p-3 text-xs text-amber-800">
                        <p className="font-semibold">Why is this important?</p>
                        This ensures your deals are protected by our trade finance and dispute resolution services. Attempting to bypass the platform may result in account suspension.
                    </div>

                    <div className="flex items-start gap-3 mt-4">
                        <div className="flex items-center h-5">
                            <input
                                id="terms-checkbox"
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                        </div>
                        <label htmlFor="terms-checkbox" className="text-sm text-gray-700 select-none cursor-pointer">
                            I agree to the <a href="#" className="text-emerald-600 hover:underline">Non-Circumvention Terms</a> and understand my obligations.
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={!accepted}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors
                    ${accepted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-300 cursor-not-allowed'}
                `}
                    >
                        Confirm & Proceed
                    </button>
                </div>
            </div>
        </div>
    )
}
