'use client'
import { useReducer, useState, useRef, useEffect, useCallback } from 'react'
import Sidebar       from '@/components/Sidebar'
import Message       from '@/components/Message'
import InputBar      from '@/components/InputBar'
import ModelSelector from '@/components/ModelSelector'

function genId()       { return Math.random().toString(36).slice(2, 9) }
function genTitle(txt) { return txt.slice(0, 46) + (txt.length > 46 ? '…' : '') }

export const MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku',  desc: 'Fastest responses',  tag: 'Fast'  },
  { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet', desc: 'Best for most tasks', tag: 'Best'  },
  { id: 'claude-opus-4-7',           label: 'Claude Opus',   desc: 'Most intelligent',    tag: 'Power' },
]

/* ─── Reducer ─── */
function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { conversations: action.convs, activeId: action.convs[0]?.id ?? null }

    case 'CREATE': {
      const conv = { id: genId(), title: 'New Chat', messages: [], createdAt: Date.now() }
      return { conversations: [conv, ...state.conversations], activeId: conv.id }
    }

    case 'SELECT':
      return { ...state, activeId: action.id }

    case 'DELETE': {
      const next = state.conversations.filter(c => c.id !== action.id)
      if (!next.length) {
        const conv = { id: genId(), title: 'New Chat', messages: [], createdAt: Date.now() }
        return { conversations: [conv], activeId: conv.id }
      }
      return { conversations: next, activeId: action.id === state.activeId ? next[0].id : state.activeId }
    }

    case 'RENAME':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.id ? { ...c, title: action.title.trim() || 'New Chat' } : c
        ),
      }

    case 'CLEAR':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === state.activeId ? { ...c, messages: [], title: 'New Chat' } : c
        ),
      }

    case 'TRIM_TO':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.convId ? { ...c, messages: c.messages.slice(0, action.index) } : c
        ),
      }

    case 'START_TURN': {
      const now = Date.now()
      return {
        ...state,
        conversations: state.conversations.map(c => {
          if (c.id !== action.convId) return c
          return {
            ...c,
            title: c.messages.length === 0 ? genTitle(action.text) : c.title,
            messages: [
              ...c.messages,
              { role: 'user',      content: action.text, id: genId(), createdAt: now },
              { role: 'assistant', content: '', id: action.msgId, streaming: true, createdAt: now },
            ],
          }
        }),
      }
    }

    case 'CHUNK':
      return {
        ...state,
        conversations: state.conversations.map(c => ({
          ...c,
          messages: c.messages.map(m =>
            m.id === action.msgId ? { ...m, content: m.content + action.text } : m
          ),
        })),
      }

    case 'FINISH':
      return {
        ...state,
        conversations: state.conversations.map(c => ({
          ...c,
          messages: c.messages
            // Remove empty placeholder if stream was aborted with no content
            .filter(m => !(m.id === action.msgId && !action.error && !m.content))
            .map(m => {
              if (m.id !== action.msgId) return m
              return action.error
                ? { ...m, streaming: false, content: action.error, isError: true }
                : { ...m, streaming: false }
            }),
        })),
      }

    default: return state
  }
}

/* ─── Page ─── */
export default function Home() {
  const [{ conversations, activeId }, dispatch] = useReducer(reducer, { conversations: [], activeId: null })
  const [model,       setModel]       = useState(MODELS[1].id)
  const [streaming,   setStreaming]   = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [atBottom,    setAtBottom]    = useState(true)
  const [isMobile,    setIsMobile]    = useState(false)
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)
  const abortRef  = useRef(null)

  const activeConv = conversations.find(c => c.id === activeId) ?? null

  /* Restore from localStorage */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nexusai_convs') || '[]')
      if (saved.length) dispatch({ type: 'INIT', convs: saved })
      else              dispatch({ type: 'CREATE' })
    } catch { dispatch({ type: 'CREATE' }) }
  }, [])

  /* Persist */
  useEffect(() => {
    if (conversations.length) localStorage.setItem('nexusai_convs', JSON.stringify(conversations))
  }, [conversations])

  /* Auto-scroll — only when active conv messages grow and user is at bottom */
  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages?.length])

  /* Mobile detection */
  useEffect(() => {
    function check() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* Keyboard shortcuts */
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (activeConv?.messages.length > 0) dispatch({ type: 'CREATE' })
      }
      if (e.key === 'Escape' && streaming) abortRef.current?.abort()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [streaming, activeConv])

  function handleScroll(e) {
    const el = e.currentTarget
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 120)
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setAtBottom(true)
  }

  /* Send message — accepts optional overrideMsgs for retry */
  const sendMessage = useCallback(async (text, overrideMsgs = undefined) => {
    if (!text.trim() || streaming) return

    const convId   = activeId
    const convMsgs = overrideMsgs !== undefined ? overrideMsgs : (activeConv?.messages ?? [])
    const msgId    = genId()

    dispatch({ type: 'START_TURN', convId, text: text.trim(), msgId })
    setStreaming(true)
    setAtBottom(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const apiMessages = [
        ...convMsgs
          .filter(m => !m.streaming && m.content && !m.isError)
          .map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text.trim() },
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, model }),
        signal: ctrl.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }

      const reader = res.body.getReader()
      const dec    = new TextDecoder()
      let   buf    = ''

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
            if (chunk)  dispatch({ type: 'CHUNK', msgId, text: chunk })
          } catch {}
        }
      }
      dispatch({ type: 'FINISH', msgId })
    } catch (e) {
      dispatch({
        type:  'FINISH', msgId,
        error: e.name === 'AbortError' ? null : (e.message || 'Something went wrong.'),
      })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [activeId, activeConv, model, streaming])

  /* Retry — trims to before last user msg, resends */
  const retryMessage = useCallback(() => {
    if (!activeConv || streaming) return
    const msgs = activeConv.messages
    let userIdx = -1
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') { userIdx = i; break }
    }
    if (userIdx === -1) return
    const text    = msgs[userIdx].content
    const history = msgs.slice(0, userIdx)
    dispatch({ type: 'TRIM_TO', convId: activeId, index: userIdx })
    sendMessage(text, history)
  }, [activeConv, activeId, streaming, sendMessage])

  const stopStream   = useCallback(() => abortRef.current?.abort(), [])
  const currentModel = MODELS.find(m => m.id === model)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, zIndex: 39, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(3px)' }}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        isMobile={isMobile}
        conversations={conversations}
        activeId={activeId}
        onSelect={id => { dispatch({ type: 'SELECT', id }); if (isMobile) setSidebarOpen(false) }}
        onNew={() => { if (activeConv?.messages.length > 0) dispatch({ type: 'CREATE' }) }}
        onDelete={id => dispatch({ type: 'DELETE', id })}
        onRename={(id, title) => dispatch({ type: 'RENAME', id, title })}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', position: 'relative' }}>

        {/* Top bar */}
        <header role="banner" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 56, flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(9,9,15,.9)', backdropFilter: 'blur(16px)',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!sidebarOpen && (
              <button className="btn-icon" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="3" y1="6"  x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}
            <ModelSelector models={MODELS} value={model} onChange={setModel} disabled={streaming} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {streaming && (
              <span style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'blink .9s infinite' }} aria-hidden="true"/>
                Generating
              </span>
            )}
            {activeConv?.messages.length > 0 && (
              <button className="btn-ghost" onClick={() => dispatch({ type: 'CLEAR' })} aria-label="Clear conversation">
                Clear
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <main
          role="main"
          ref={scrollRef}
          onScroll={handleScroll}
          aria-label="Conversation"
          style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}
        >
          {!activeConv?.messages.length ? (
            <EmptyState model={currentModel} onSend={sendMessage} />
          ) : (
            <div
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
              style={{ maxWidth: 760, margin: '0 auto', padding: '28px 0 12px' }}
            >
              {activeConv.messages.map((msg, i) => (
                <Message key={msg.id ?? i} message={msg} onRetry={retryMessage} />
              ))}
              <div ref={bottomRef} aria-hidden="true" />
            </div>
          )}
        </main>

        {/* Scroll-to-bottom */}
        {!atBottom && (
          <button className="scroll-btn" onClick={scrollToBottom} aria-label="Scroll to latest message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <polyline points="19 12 12 19 5 12"/>
            </svg>
          </button>
        )}

        <InputBar onSend={sendMessage} streaming={streaming} onStop={stopStream} />
      </div>
    </div>
  )
}

/* ─── Empty state ─── */
const EXAMPLE_PROMPTS = [
  { icon: '💻', text: 'Write a Python script that scrapes product prices from a website' },
  { icon: '✍️', text: 'Draft a professional email declining a meeting politely' },
  { icon: '🔬', text: 'Explain quantum entanglement in simple terms with an analogy' },
  { icon: '🐛', text: 'Review this code for bugs, edge cases, and improvements' },
]

function EmptyState({ model, onSend }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100%', gap: 32, padding: '40px 24px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="logo-icon" style={{
          width: 64, height: 64, borderRadius: 22, margin: '0 auto 18px',
          background: 'linear-gradient(135deg, #6d5ce7, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        }} aria-hidden="true">✦</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.04em', marginBottom: 8 }}>
          <span className="gradient-text">How can I help?</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--t3)' }}>{model?.label} · {model?.desc}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, maxWidth: 540, width: '100%' }}>
        {EXAMPLE_PROMPTS.map(({ icon, text }) => (
          <button key={text} className="prompt-chip anim-fade-up" onClick={() => onSend(text)} aria-label={`Try: ${text}`}>
            <span style={{ fontSize: 18, flexShrink: 0 }} aria-hidden="true">{icon}</span>
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
