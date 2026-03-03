import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <ShieldAlert className="w-8 h-8 text-red-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>

                <p className="text-gray-600">
                    You do not have permission to view this page. Please contact your administrator if you believe this is an error.
                </p>

                <div className="pt-4 space-y-3">
                    <Link
                        href="/"
                        className="block w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        Return Home
                    </Link>
                    <Link
                        href="/login"
                        className="block w-full py-3 px-4 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Log in with different account
                    </Link>
                </div>
            </div>
        </div>
    )
}
