"use client"

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, AlertTriangle, CheckCircle, RefreshCw, BarChart3 } from 'lucide-react'

interface DealScore {
    score: number
    explanation: string
    improvements: string[]
    generatedAt: string
}

interface DealStrengthCardProps {
    tradeId: string
    score: DealScore | null
    onRefresh: () => void
}

export default function DealStrengthCard({ tradeId, score, onRefresh }: DealStrengthCardProps) {
    const [loading, setLoading] = useState(false)

    const handleCalculate = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/deals/${tradeId}/score`, { method: 'POST' })
            if (res.ok) {
                onRefresh()
            } else {
                alert('Failed to calculate score')
            }
        } catch (e) {
            console.error(e)
            alert('Error calculating score')
        } finally {
            setLoading(false)
        }
    }

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-emerald-600'
        if (s >= 50) return 'text-amber-500'
        return 'text-red-500'
    }

    const getScoreBg = (s: number) => {
        if (s >= 80) return 'bg-emerald-50 border-emerald-100'
        if (s >= 50) return 'bg-amber-50 border-amber-100'
        return 'bg-red-50 border-red-100'
    }

    return (
        <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-slate-800">
                        <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                        Deal Strength
                    </CardTitle>
                    {score && (
                        <Button variant="ghost" size="sm" onClick={handleCalculate} disabled={loading} className="h-8 w-8 p-0">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                </div>
                <CardDescription>
                    AI analysis of your deal's financing viability.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {!score ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                            Get instant feedback on your deal structure and documentation to improve financing chances.
                        </p>
                        <Button onClick={handleCalculate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? 'Analyzing...' : 'Analyze Deal Strength'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Score Display */}
                        <div className={`p-4 rounded-lg border ${getScoreBg(score.score)} flex items-center justify-between`}>
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Confidence Score</p>
                                <div className={`text-4xl font-bold ${getScoreColor(score.score)}`}>
                                    {score.score}<span className="text-lg text-slate-400 font-normal">/100</span>
                                </div>
                            </div>
                            <div className="text-right max-w-[60%]">
                                <p className="text-sm font-medium text-slate-700">{score.explanation}</p>
                            </div>
                        </div>

                        {/* Improvements */}
                        {score.improvements.length > 0 ? (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                                    Suggested Improvements
                                </h4>
                                <ul className="space-y-2">
                                    {score.improvements.map((item, i) => (
                                        <li key={i} className="text-sm text-slate-600 flex items-start bg-slate-50 p-2 rounded">
                                            <span className="mr-2 text-slate-400">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex items-center text-emerald-600 text-sm bg-emerald-50 p-2 rounded">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Great job! No immediate improvements detected.
                            </div>
                        )}

                        <p className="text-xs text-slate-400 text-right">
                            Generated: {new Date(score.generatedAt).toLocaleString()}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
