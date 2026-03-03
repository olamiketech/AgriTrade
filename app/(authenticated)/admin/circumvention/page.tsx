'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, Users, RefreshCw, FileText } from 'lucide-react'

export default function CircumventionDashboard() {
    const [introductions, setIntroductions] = useState<any[]>([])
    const [flags, setFlags] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/circumvention')
            if (res.ok) {
                const data = await res.json()
                setIntroductions(data.introductions)
                setFlags(data.flags)
            }
        } catch (error) {
            console.error("Failed to fetch data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const runScan = async () => {
        setScanning(true)
        try {
            const res = await fetch('/api/admin/circumvention/check', { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                alert(`Scan complete. ${data.flagsCreated} new flags created.`)
                fetchData() // Refresh
            } else {
                alert('Scan failed')
            }
        } catch (error) {
            console.error(error)
            alert('Scan failed')
        } finally {
            setScanning(false)
        }
    }

    if (loading) return <div className="p-8">Loading dashboard...</div>

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Anti-Circumvention Control
                    </h2>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <button
                        onClick={runScan}
                        disabled={scanning}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {scanning ? <RefreshCw className="animate-spin -ml-0.5 mr-1.5 h-4 w-4" /> : <ShieldAlert className="-ml-0.5 mr-1.5 h-4 w-4" />}
                        Run Risk Scan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

                {/* Introduction Records */}
                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                            <Users className="h-5 w-5 text-gray-500" />
                            Active Introductions
                        </h3>
                    </div>
                    <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                        {introductions.length === 0 && <li className="px-4 py-4 text-sm text-gray-500">No active introductions found.</li>}
                        {introductions.map((intro: any) => (
                            <li key={intro.id} className="px-4 py-4 hover:bg-gray-50">
                                <div className="flex justify-between">
                                    <div className="text-sm font-medium text-indigo-600 truncate">
                                        {intro.buyerName} ↔ {intro.exporterName}
                                    </div>
                                    <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${intro.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {intro.status}
                                    </div>
                                </div>
                                <div className="mt-1 flex justify-between text-sm text-gray-500">
                                    <span>Intro: {new Date(intro.introducedAt).toLocaleDateString()}</span>
                                    <span>Expires: {new Date(intro.expiresAt).toLocaleDateString()}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Risk Flags */}
                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            Circumvention Risks
                        </h3>
                    </div>
                    <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                        {flags.length === 0 && <li className="px-4 py-4 text-sm text-gray-500">No risk flags detected.</li>}
                        {flags.map((flag: any) => (
                            <li key={flag.id} className="px-4 py-4 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {flag.buyerName} ↔ {flag.exporterName}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{flag.notes}</p>
                                    </div>
                                    <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${flag.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                                            flag.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                        {flag.riskLevel} RISK
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-between text-xs text-gray-400">
                                    <span>Flagged: {new Date(flag.flaggedAt).toLocaleDateString()}</span>
                                    <button className="text-indigo-600 hover:text-indigo-500">View Evidence</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    )
}
