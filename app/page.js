'use client'
import { useReducer, useState, useRef, useEffect, useCallback } from 'react'
import Sidebar       from '@/components/Sidebar'
import Message       from '@/components/Message'
import InputBar      from '@/components/InputBar'
import ModelSelector from '@/components/ModelSelector'

/* ─── Helpers ─── */
function genId()       { return Math.random().toString(36).slice(2, 9) }
function genTitle(txt) { return txt.slice(0, 46) + (txt.length > 46 ? '…' : '') }

/* ─── Models ─── */
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
      const activeId = action.id === state.activeId ? next[0].id : state.activeId
      return { conversations: next, activeId }
    }

    case 'CLEAR':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === state.activeId ? { ...c, messages: [], title: 'New Chat' } : c
        ),
      }

    case 'START_TURN': {
      const { convId, text, msgId } = action
      return {
        ...state,
        conversations: state.conversations.map(c => {
          if (c.id !== convId) return c
          return {
            ...c,
            title: c.messages.length === 0 ? genTitle(text) : c.title,
            messages: [
              ...c.messages,
              { role: 'user',      content: text },
              { role: 'assistant', content: '', id: msgId, streaming: true },
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
          messages: c.messages.map(m => {
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

/* ─── Component ─── */
export default function Home() {
  const [{ conversations, activeId }, dispatch] = useReducer(reducer, { conversations: [], activeId: null })
  const [model,       setModel]       = useState(MODELS[1].id)
  const [streaming,   setStreaming]   = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef(null)
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

  /* Persist to localStorage */
  useEffect(() => {
    if (conversations.length) {
      localStorage.setItem('nexusai_convs', JSON.stringify(conversations))
    }
  }, [conversations])

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations])

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

  /* Send message */
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || streaming) return

    const convId   = activeId
    const convMsgs = activeConv?.messages ?? []
    const msgId    = genId()

    dispatch({ type: 'START_TURN', convId, text: text.trim(), msgId })
    setStreaming(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const apiMessages = [
        ...convMsgs.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text.trim() },
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, model }),
        signal: ctrl.signal,
      })

      if (!res.ok) throw new Error(`Server responded with ${res.status}`)

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
        type: 'FINISH', msgId,
        error: e.name === 'AbortError' ? null : (e.message || 'Something went wrong.'),
      })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [activeId, activeConv, model, streaming])

  const stopStream = useCallback(() => abortRef.current?.abort(), [])

  const currentModel = MODELS.find(m => m.id === model)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onSelect={id => dispatch({ type: 'SELECT', id })}
        onNew={() => { if (activeConv?.messages.length > 0) dispatch({ type: 'CREATE' }) }}
        onDelete={id => dispatch({ type: 'DELETE', id })}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>

        {/* ── Top bar ── */}
        <header role="banner" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 56, flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(9,9,15,.88)', backdropFilter: 'blur(16px)',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!sidebarOpen && (
              <button
                className="btn-icon"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
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
              <span style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'blink .9s infinite' }} />
                Generating
              </span>
            )}
            {activeConv?.messages.length > 0 && (
              <button
                className="btn-ghost"
                onClick={() => dispatch({ type: 'CLEAR' })}
                aria-label="Clear conversation"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {/* ── Messages ── */}
        <main
          role="main"
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
                <Message key={msg.id ?? i} message={msg} />
              ))}
              <div ref={bottomRef} aria-hidden="true" />
            </div>
          )}
        </main>

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
      justifyContent: 'center', height: '100%', gap: 32, padding: '40px 24px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div
          className="logo-icon"
          style={{
            width: 64, height: 64, borderRadius: 22, margin: '0 auto 18px',
            background: 'linear-gradient(135deg, #6d5ce7, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30,
          }}
          aria-hidden="true"
        >✦</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.04em', marginBottom: 8 }}>
          <span className="gradient-text">How can I help?</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--t3)' }}>
          {model?.label} · {model?.desc}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 540, width: '100%' }}>
        {EXAMPLE_PROMPTS.map(({ icon, text }) => (
          <button
            key={text}
            className="prompt-chip anim-fade-up"
            onClick={() => onSend(text)}
            aria-label={`Try: ${text}`}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }} aria-hidden="true">{icon}</span>
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
