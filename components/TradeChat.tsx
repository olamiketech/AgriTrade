"use client"

import { useState, useEffect, useRef } from 'react'
import { Send, User } from 'lucide-react'

interface Message {
    id: string
    content: string
    senderId: string
    createdAt: string
}

export default function TradeChat({ tradeId, currentUserId }: { tradeId: string, currentUserId: string }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/messages?tradeId=${tradeId}`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            } else {
                console.error('Failed to fetch messages:', res.status)
            }
        } catch (e) {
            console.error('Error fetching messages:', e)
        } finally {
            setLoading(false)
        }
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        const messageToSend = newMessage.trim()
        setNewMessage('') // Clear input immediately for better UX

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Important: Send cookies for authentication
                body: JSON.stringify({ tradeId, content: messageToSend })
            })

            if (res.ok) {
                await fetchMessages() // Refresh list
            } else {
                const errorData = await res.json()
                console.error('Failed to send message:', errorData)
                alert(`Failed to send message: ${errorData.error || 'Unknown error'}`)
                setNewMessage(messageToSend) // Restore message on error
            }
        } catch (e) {
            console.error('Error sending message:', e)
            alert('Failed to send message. Please try again.')
            setNewMessage(messageToSend) // Restore message on error
        } finally {
            setSending(false)
        }
    }

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [tradeId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className="flex flex-col h-[500px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-gray-900">Trade Discussion</h3>
                <p className="text-xs text-gray-500">Secure Audit Log Enforced</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading && <div className="text-center text-sm text-gray-500">Loading messages...</div>}

                {!loading && messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-10">
                        No messages yet. Start the conversation.
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                    <User className="w-4 h-4" />
                                </div>
                                <div className={`px-4 py-2 rounded-2xl text-sm ${isMe
                                    ? 'bg-gradient-to-br from-emerald-500 to-cyan-600 text-white rounded-tr-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                    }`}>
                                    <p>{msg.content}</p>
                                    <span className={`text-[10px] block mt-1 ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={sending ? 'Sending...' : 'Send message'}
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
