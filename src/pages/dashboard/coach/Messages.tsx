import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { UpgradeGate } from '../../../components/ui/UpgradeGate'
import { type CoachTier } from '../../../lib/subscriptions'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface Conversation {
  participantId: string
  participantName: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  messages: Message[]
}

export function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const tier: CoachTier = (profile?.subscription_tier as CoachTier) || 'free'

  useEffect(() => {
    if (!user) return
    fetchProfileAndMessages()
  }, [user])

  const fetchProfileAndMessages = async () => {
    if (!user) return

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single()

    setProfile(profileData)

    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: true })

    if (messagesData) {
      const convMap = new Map<string, Conversation>()

      for (const msg of messagesData as Message[]) {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            participantId: otherId,
            participantName: 'Athlete',
            lastMessage: '',
            lastMessageAt: msg.created_at,
            unreadCount: 0,
            messages: [],
          })
        }

        const conv = convMap.get(otherId)!
        conv.messages.push(msg)
        conv.lastMessage = msg.content
        conv.lastMessageAt = msg.created_at

        if (msg.recipient_id === user.id && !msg.is_read) {
          conv.unreadCount++
        }
      }

      // Fetch participant names
      const participantIds = Array.from(convMap.keys())
      if (participantIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', participantIds)

        const { data: athleteData } = await supabase
          .from('athlete_profiles')
          .select('user_id, name')
          .in('user_id', participantIds)

        const nameMap: Record<string, string> = {}
        if (athleteData) {
          for (const a of athleteData) {
            nameMap[a.user_id] = a.name
          }
        }

        for (const [id, conv] of convMap) {
          conv.participantName = nameMap[id] || 'Athlete'
        }
      }

      const sorted = Array.from(convMap.values()).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )
      setConversations(sorted)
    }

    setLoading(false)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedId || !user) return
    setSending(true)

    await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: selectedId,
      content: newMessage.trim(),
    })

    setNewMessage('')
    setSending(false)
    fetchProfileAndMessages()
    scrollToBottom()
  }

  const markAsRead = async (conversation: Conversation) => {
    const unreadIds = conversation.messages
      .filter(m => m.recipient_id === user?.id && !m.is_read)
      .map(m => m.id)

    if (unreadIds.length === 0) return

    await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', unreadIds)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const selectedConversation = conversations.find(c => c.participantId === selectedId)

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedId(conv.participantId)
    markAsRead(conv)
    scrollToBottom()
  }

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <UpgradeGate tier={tier} feature="messaging">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Messages</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)} unread
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/coach')}
              className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
            >
              &larr; Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
            {/* Conversation List */}
            <Card className="md:col-span-1 overflow-hidden flex flex-col">
              <div className="p-3 border-b border-[#E5E7EB] dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Inbox</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-gray-700">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2563EB] mx-auto" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.participantId}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-3 text-left hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors ${
                        selectedId === conv.participantId ? 'bg-[#2563EB]/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${conv.unreadCount > 0 ? 'text-gray-900 dark:text-gray-50' : 'text-gray-700 dark:text-gray-300'}`}>
                          {conv.participantName}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-xs font-semibold bg-[#2563EB] text-white rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {conv.lastMessage}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </Card>

            {/* Message Thread */}
            <Card className="md:col-span-2 flex flex-col overflow-hidden">
              {selectedConversation ? (
                <>
                  <div className="p-3 border-b border-[#E5E7EB] dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {selectedConversation.participantName}
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedConversation.messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-[8px] text-sm ${
                            isOwn
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-[#F9FAFB] dark:bg-gray-800 text-gray-900 dark:text-gray-50'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-3 border-t border-[#E5E7EB] dark:border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                      />
                      <Button
                        size="sm"
                        onClick={handleSendMessage}
                        loading={sending}
                        disabled={!newMessage.trim()}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  Select a conversation to start messaging
                </div>
              )}
            </Card>
          </div>
        </UpgradeGate>
      </div>
    </AppLayout>
  )
}