"use client"

import { useEffect, useState } from 'react'
import { Search, CheckCircle, XCircle, ShieldAlert, ShieldCheck, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DocumentReviewModal from "@/components/DocumentReviewModal"

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [documentModal, setDocumentModal] = useState<{ isOpen: boolean, userId: string, userName: string } | null>(null)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/users', { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users)
            }
        } catch (error) {
            console.error("Failed to fetch users", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, type: string, userId: string, userName: string } | null>(null)

    const openConfirm = (userId: string, type: string, userName: string) => {
        setConfirmModal({ isOpen: true, type, userId, userName })
    }

    const closeConfirm = () => setConfirmModal(null)

    const handleVerify = async () => {
        if (!confirmModal) return
        const { userId, type } = confirmModal

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationStatus: type })
            })

            if (res.ok) {
                await fetchUsers()
                closeConfirm()
                // alert(`User marked as ${type}`) // Optional: remove alert if modal is enough feedback, but let's keep it simple or show a toast
            } else {
                const data = await res.json().catch(() => ({}))
                alert(`Failed: ${data.error || res.statusText}`)
            }
        } catch (err) {
            console.error(err)
            alert("An error occurred")
        }
    }

    const handleVerificationLevelChange = async (exporterId: string, level: string) => {
        try {
            const res = await fetch(`/api/admin/exporters/${exporterId}/verification`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationLevel: level })
            })
            if (res.ok) {
                await fetchUsers()
                alert(`Verification level updated to ${level}`)
            } else {
                const data = await res.json().catch(() => ({}))
                alert(`Failed to update verification level: ${data.error || res.statusText}`)
                console.error("Update failed", data)
            }
        } catch (err) {
            console.error(err)
            alert("An error occurred while updating verification level")
        }
    }

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.exporterProfile?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
                <p className="text-slate-500">Manage user accounts, verify identities, and assign trust levels.</p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search users by email or company..."
                                className="pl-9 bg-slate-50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium">User / Company</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">Account Status</th>
                                    <th className="px-6 py-4 font-medium">Trust Level (Exporters)</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No users found.</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">
                                                        {user.exporterProfile?.companyName || user.buyerProfile?.companyName || user.email.split('@')[0]}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                                                    user.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {user.verificationStatus === 'VERIFIED' && <CheckCircle className="w-3 h-3" />}
                                                    {user.verificationStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                                    {user.verificationStatus === 'PENDING' && <ShieldAlert className="w-3 h-3" />}
                                                    {user.verificationStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.role === 'EXPORTER' && user.exporterProfile ? (
                                                    <select
                                                        value={user.exporterProfile.verificationLevel || 'BASIC'}
                                                        onChange={(e) => handleVerificationLevelChange(user.exporterProfile.id, e.target.value)}
                                                        className="block w-full max-w-[140px] rounded-md border-slate-300 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                                                    >
                                                        <option value="BASIC">Basic Tier</option>
                                                        <option value="VERIFIED">Verified</option>
                                                        <option value="VERIFIED_PLUS">Verified Plus</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {user.verificationStatus === 'PENDING' && (
                                                    <div className="flex justify-end gap-2">
                                                        {user.role === 'EXPORTER' && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    const name = user.exporterProfile?.companyName || user.email
                                                                    setDocumentModal({ isOpen: true, userId: user.id, userName: name })
                                                                }}
                                                            >
                                                                <FileText className="h-3 w-3 mr-1" />
                                                                View Docs
                                                            </Button>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                const name = user.exporterProfile?.companyName || user.email
                                                                openConfirm(user.id, 'VERIFIED', name)
                                                            }}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                const name = user.exporterProfile?.companyName || user.email
                                                                openConfirm(user.id, 'REJECTED', name)
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                                {user.verificationStatus === 'VERIFIED' && (
                                                    <span className="text-xs text-slate-400 italic">No actions</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="space-y-2 text-center">
                            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${confirmModal.type === 'VERIFIED' ? 'bg-emerald-100' : 'bg-red-100'
                                }`}>
                                {confirmModal.type === 'VERIFIED' ? (
                                    <CheckCircle className={`w-6 h-6 ${confirmModal.type === 'VERIFIED' ? 'text-emerald-600' : 'text-red-600'}`} />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-600" />
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {confirmModal.type === 'VERIFIED' ? 'Approve User?' : 'Reject User?'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Are you sure you want to {confirmModal.type === 'VERIFIED' ? 'approve' : 'reject'}{" "}
                                <strong>{confirmModal.userName}</strong>?
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={closeConfirm}>Cancel</Button>
                            <Button
                                variant={confirmModal.type === 'VERIFIED' ? 'default' : 'destructive'}
                                onClick={handleVerify}
                                className={confirmModal.type === 'VERIFIED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                            >
                                {confirmModal.type === 'VERIFIED' ? 'Approve' : 'Reject'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Review Modal */}
            {documentModal && (
                <DocumentReviewModal
                    isOpen={documentModal.isOpen}
                    userId={documentModal.userId}
                    userName={documentModal.userName}
                    onClose={() => setDocumentModal(null)}
                    onApprove={() => {
                        setDocumentModal(null)
                        openConfirm(documentModal.userId, 'VERIFIED', documentModal.userName)
                    }}
                    onReject={() => {
                        setDocumentModal(null)
                        openConfirm(documentModal.userId, 'REJECTED', documentModal.userName)
                    }}
                />
            )}
        </div>
    )
}
