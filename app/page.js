'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import Message from '@/components/Message'
import InputBar from '@/components/InputBar'
import ModelSelector from '@/components/ModelSelector'

function genId() { return Math.random().toString(36).slice(2, 9) }
function genTitle(text) { return text.slice(0, 42) + (text.length > 42 ? '…' : '') }

export const MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku',  desc: 'Fast & efficient',   badge: 'Fast'  },
  { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet', desc: 'Balanced & powerful', badge: 'Best'  },
  { id: 'claude-opus-4-7',           label: 'Claude Opus',   desc: 'Most capable',        badge: 'Power' },
]

export default function Home() {
  const [conversations, setConversations] = useState([])
  const [activeId,      setActiveId]      = useState(null)
  const [model,         setModel]         = useState(MODELS[1].id)
  const [streaming,     setStreaming]      = useState(false)
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const bottomRef = useRef(null)
  const abortRef  = useRef(null)

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nexusai_convs') || '[]')
      if (saved.length) {
        setConversations(saved)
        setActiveId(saved[0].id)
      } else {
        createConv()
      }
    } catch { createConv() }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (conversations.length) {
      localStorage.setItem('nexusai_convs', JSON.stringify(conversations))
    }
  }, [conversations])

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations])

  const activeConv = conversations.find(c => c.id === activeId)

  function createConv() {
    const id   = genId()
    const conv = { id, title: 'New Chat', messages: [], createdAt: Date.now() }
    setConversations(prev => [conv, ...prev])
    setActiveId(id)
    return id
  }

  function startNewChat() {
    if (activeConv?.messages.length === 0) return
    createConv()
  }

  function deleteConv(id) {
    const next = conversations.filter(c => c.id !== id)
    if (next.length === 0) {
      const nid = genId()
      setConversations([{ id: nid, title: 'New Chat', messages: [], createdAt: Date.now() }])
      setActiveId(nid)
    } else {
      setConversations(next)
      if (id === activeId) setActiveId(next[0].id)
    }
  }

  function clearChat() {
    setConversations(prev =>
      prev.map(c => c.id === activeId ? { ...c, messages: [], title: 'New Chat' } : c)
    )
  }

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || streaming) return

    const userMsg       = { role: 'user', content: text.trim() }
    const placeholderId = genId()
    const currentMsgs   = activeConv?.messages ?? []

    setConversations(prev => prev.map(c => {
      if (c.id !== activeId) return c
      return {
        ...c,
        title: currentMsgs.length === 0 ? genTitle(text) : c.title,
        messages: [
          ...c.messages,
          userMsg,
          { role: 'assistant', content: '', id: placeholderId, streaming: true },
        ],
      }
    }))

    setStreaming(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const apiMessages = [
        ...currentMsgs.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text.trim() },
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, model }),
        signal: ctrl.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const dec    = new TextDecoder()
      let buf      = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6)
          if (raw === '[DONE]') break
          try {
            const { text: chunk, error } = JSON.parse(raw)
            if (error) throw new Error(error)
            if (chunk) {
              setConversations(prev => prev.map(c => {
                if (c.id !== activeId) return c
                return {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === placeholderId ? { ...m, content: m.content + chunk } : m
                  ),
                }
              }))
            }
          } catch {}
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setConversations(prev => prev.map(c => {
          if (c.id !== activeId) return c
          return {
            ...c,
            messages: c.messages.map(m =>
              m.id === placeholderId
                ? { ...m, content: `Error: ${e.message || 'Something went wrong.'}`, isError: true }
                : m
            ),
          }
        }))
      }
    } finally {
      setConversations(prev => prev.map(c => {
        if (c.id !== activeId) return c
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === placeholderId ? { ...m, streaming: false } : m
          ),
        }
      }))
      setStreaming(false)
      abortRef.current = null
    }
  }, [activeId, activeConv, model, streaming])

  function stopStream() { abortRef.current?.abort() }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={startNewChat}
        onDelete={deleteConv}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 56, flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(12,12,18,.85)', backdropFilter: 'blur(14px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} style={{
                background: 'none', border: 'none', color: 'var(--t3)',
                cursor: 'pointer', padding: 7, borderRadius: 8, display: 'flex',
                transition: 'color .15s',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6"  x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}
            <ModelSelector models={MODELS} value={model} onChange={setModel} disabled={streaming} />
          </div>

          {activeConv?.messages.length > 0 && (
            <button onClick={clearChat} style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--t3)',
              cursor: 'pointer', padding: '5px 13px', borderRadius: 8,
              fontSize: 12, fontWeight: 600, transition: 'all .15s',
            }}>
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          {!activeConv?.messages.length ? (
            <EmptyState model={MODELS.find(m => m.id === model)} />
          ) : (
            <div style={{ maxWidth: 740, margin: '0 auto', padding: '28px 0 12px' }}>
              {activeConv.messages.map((msg, i) => (
                <Message key={msg.id ?? i} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <InputBar onSend={sendMessage} streaming={streaming} onStop={stopStream} />
      </div>
    </div>
  )
}

function EmptyState({ model }) {
  const prompts = [
    'Explain quantum computing simply',
    'Write a Python web scraper',
    'Review my code for bugs',
    'Draft a professional email',
  ]
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 24, padding: '0 24px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 60, height: 60, borderRadius: 20, margin: '0 auto 16px',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, boxShadow: '0 8px 32px rgba(99,102,241,.3)',
        }}>✦</div>
        <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.03em' }}>
          How can I help?
        </p>
        <p style={{ fontSize: 14, color: 'var(--t3)', marginTop: 6 }}>
          {model?.label} · {model?.desc}
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 520 }}>
        {prompts.map(p => (
          <div key={p} style={{
            padding: '8px 14px', borderRadius: 99, border: '1px solid var(--border)',
            fontSize: 13, color: 'var(--t2)', background: 'rgba(255,255,255,0.03)',
            cursor: 'default',
          }}>{p}</div>
        ))}
      </div>
    </div>
  )
}
