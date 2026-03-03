"use client"

import { useState, useEffect } from 'react'
import { Check, X, Edit2, AlertCircle, Loader2 } from 'lucide-react'

interface Extraction {
    id: string
    fieldName: string
    fieldValue: string
    confidence: number
    verified: boolean
}

interface Props {
    documentId: string
    onVerificationComplete?: () => void
}

export default function ExtractionVerification({ documentId, onVerificationComplete }: Props) {
    const [extractions, setExtractions] = useState<Extraction[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    useEffect(() => {
        fetchExtractions()
    }, [documentId])

    const fetchExtractions = async () => {
        try {
            const res = await fetch(`/api/documents/${documentId}/extractions`)
            if (res.ok) {
                const data = await res.json()
                setExtractions(data.extractions)
            }
        } catch (error) {
            console.error("Failed to fetch extractions", error)
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (extraction: Extraction) => {
        try {
            const res = await fetch(`/api/documents/${documentId}/extractions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    extractionId: extraction.id,
                    newValue: extraction.fieldValue,
                    verified: true
                })
            })
            if (res.ok) {
                fetchExtractions()
                // Check if all verified
                if (extractions.every(e => e.id === extraction.id ? true : e.verified)) {
                    onVerificationComplete?.()
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleSaveEdit = async () => {
        if (!editingId) return

        try {
            const res = await fetch(`/api/documents/${documentId}/extractions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    extractionId: editingId,
                    newValue: editValue,
                    verified: true
                })
            })
            if (res.ok) {
                setEditingId(null)
                fetchExtractions()
            }
        } catch (error) {
            console.error(error)
        }
    }

    if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin h-5 w-5 mx-auto text-gray-400" /></div>

    if (extractions.length === 0) return <div className="p-4 text-sm text-gray-500 italic">No extractable data found yet. Processing might be in progress.</div>

    return (
        <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Extracted Data</h4>
                <span className="text-xs text-gray-500">Confidence Score</span>
            </div>
            <ul className="divide-y divide-gray-200">
                {extractions.map((ext) => (
                    <li key={ext.id} className="p-3 sm:flex sm:items-center sm:justify-between hover:bg-white transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="text-xs font-medium text-gray-500 uppercase">{ext.fieldName.replace(/_/g, ' ')}</p>

                            {editingId === ext.id ? (
                                <div className="mt-1 flex items-center">
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-1 px-2"
                                    />
                                    <button onClick={handleSaveEdit} className="ml-2 text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                                    <button onClick={() => setEditingId(null)} className="ml-1 text-gray-400 hover:text-gray-500"><X className="h-4 w-4" /></button>
                                </div>
                            ) : (
                                <div className="mt-1 flex items-center">
                                    <span className={`text-sm font-medium ${ext.verified ? 'text-green-700' : 'text-gray-900'}`}>{ext.fieldValue}</span>
                                    {ext.verified && <Check className="ml-2 h-4 w-4 text-green-500" />}
                                    {!ext.verified && (
                                        <button onClick={() => { setEditingId(ext.id); setEditValue(ext.fieldValue); }} className="ml-2 text-gray-400 hover:text-blue-500">
                                            <Edit2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-2 sm:mt-0 flex items-center">
                            {/* Confidence Indicator */}
                            <div className="mr-4 flex items-center">
                                <div className={`h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden`}>
                                    <div
                                        className={`h-full ${ext.confidence > 0.9 ? 'bg-green-500' : ext.confidence > 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${ext.confidence * 100}%` }}
                                    />
                                </div>
                                <span className="ml-2 text-xs text-gray-500">{(ext.confidence * 100).toFixed(0)}%</span>
                            </div>

                            {/* Actions */}
                            {!ext.verified && editingId !== ext.id && (
                                <button
                                    onClick={() => handleVerify(ext)}
                                    className="inline-flex items-center rounded bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                >
                                    Confirm
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
