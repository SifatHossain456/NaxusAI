'use client'
import { useRef, useEffect, useCallback } from 'react'

export default function InputBar({ onSend, streaming, onStop }) {
  const ref = useRef(null)

  useEffect(() => { if (!streaming) ref.current?.focus() }, [streaming])

  function resize() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  const submit = useCallback(() => {
    const val = ref.current?.value.trim()
    if (!val || streaming) return
    onSend(val)
    ref.current.value = ''
    ref.current.style.height = 'auto'
  }, [onSend, streaming])

  const handleKey = useCallback(e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }, [submit])

  return (
    <div style={{
      padding: '10px 20px 22px',
      background: 'linear-gradient(to top, var(--bg) 65%, transparent)',
      flexShrink: 0,
    }}>
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <div className="input-wrap">
          <textarea
            ref={ref}
            rows={1}
            className="chat-input"
            placeholder="Message NexusAI…  (Shift+Enter for new line)"
            onInput={resize}
            onKeyDown={handleKey}
            disabled={streaming}
            style={{ opacity: streaming ? 0.55 : 1 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '6px 10px' }}>
            {streaming ? (
              <button onClick={onStop} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,.3)',
                background: 'rgba(239,68,68,.1)', color: '#ef4444',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .14s',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                </svg>
                Stop
              </button>
            ) : (
              <button className="send-btn" onClick={submit}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>
          NexusAI may make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}
