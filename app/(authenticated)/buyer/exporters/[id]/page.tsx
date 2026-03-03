"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import VerificationBadge from '@/components/VerificationBadge'

export default function ExporterProfilePage() {
    const { id } = useParams()
    const [exporter, setExporter] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // We probably need a public/buyer facing API to fetch exporter details.
        // For now, I'll assume we can reuse the existing deals API or I'll need to create a new one.
        // Let's create a specific API for fetching exporter profile: /api/exporters/[id]
        // But first, I'll draft the page assuming the API exists or I'll create the API.

        // Actually, looking at the task list, I have "GET /exporters/:id/dossier aggregation" later.
        // But for this profile page, I need basic info.
        // I will assume for now I can fetch it. If not, I'll need to create `app/api/exporters/[id]/route.ts`.
        // Let's create the API first to be sure.

        const fetchExporter = async () => {
            try {
                const res = await fetch(`/api/exporters/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setExporter(data.exporter)
                }
            } catch (error) {
                console.error("Failed to fetch exporter", error)
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchExporter()
    }, [id])

    if (loading) return <div>Loading...</div>
    if (!exporter) return <div>Exporter not found</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            {exporter.companyName}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            {exporter.country}
                        </p>
                    </div>
                    {exporter.verificationLevel && (
                        <div className="flex-shrink-0">
                            <VerificationBadge level={exporter.verificationLevel} />
                        </div>
                    )}
                </div>
                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{exporter.companyName}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Country</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{exporter.country}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Verification Status</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 flex items-center gap-2">
                                {exporter.verificationLevel}
                                {exporter.verificationLevel !== 'BASIC' && exporter.verifiedAt && (
                                    <span className="text-xs text-gray-500">
                                        (Since {new Date(exporter.verifiedAt).toLocaleDateString()})
                                    </span>
                                )}
                            </dd>
                        </div>
                        {exporter.verificationNotes && (
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Verification Notes</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{exporter.verificationNotes}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>
        </div>
    )
}
