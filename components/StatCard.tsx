import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: string
        isPositive: boolean
    }
    color?: 'emerald' | 'cyan' | 'amber' | 'red' | 'blue'
}

export default function StatCard({ title, value, icon: Icon, trend, color = 'emerald' }: StatCardProps) {
    const colorClasses = {
        emerald: 'from-emerald-500 to-emerald-600',
        cyan: 'from-cyan-500 to-cyan-600',
        amber: 'from-amber-500 to-amber-600',
        red: 'from-red-500 to-red-600',
        blue: 'from-blue-500 to-blue-600',
    }

    return (
        <div className="card-hover bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-900">{value}</p>
                        {trend && (
                            <span className={`text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                {trend.isPositive ? '↑' : '↓'} {trend.value}
                            </span>
                        )}
                    </div>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
            </div>
        </div>
    )
}
