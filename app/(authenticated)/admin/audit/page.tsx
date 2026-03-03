
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ShieldAlert, ShieldCheck, User, Code } from 'lucide-react'

// Server Component
export default async function AuditLogPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) redirect('/login');

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'ADMIN') {
        redirect('/unauthorized');
    }

    const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        include: {
            user: { select: { email: true, role: true } },
            // trade: { select: { id: true, productDetails: true } }, // Optional if relation exists
        },
        take: 100,
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Logs</h1>
                <p className="text-slate-500">Immutable record of all critical system actions.</p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Timestamp</th>
                                    <th className="px-6 py-4 font-medium">Action</th>
                                    <th className="px-6 py-4 font-medium">Actor</th>
                                    <th className="px-6 py-4 font-medium">Formatted Metadata</th>
                                    <th className="px-6 py-4 font-medium">Target ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log: any) => (
                                    <tr key={log.id} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            <div className="flex items-center gap-2">
                                                {log.user ? (
                                                    <>
                                                        <User className="h-3 w-3 text-slate-400" />
                                                        {log.user.email} <span className="text-xs text-slate-400">({log.user.role})</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Code className="h-3 w-3 text-slate-400" />
                                                        <span>{log.actorId}</span> <span className="text-xs text-slate-400">({log.actorType})</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs break-all">
                                            {log.metadata ? (
                                                <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200 font-mono text-slate-600">
                                                    {log.metadata ? JSON.stringify(log.metadata) : '-'}
                                                </code>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                                            {log.tradeId || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No audit logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
