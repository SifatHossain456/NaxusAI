'use client'
import { useRef, useEffect, useCallback, useState } from 'react'

const MAX_CHARS = 12000

export default function InputBar({ onSend, streaming, onStop }) {
  const ref      = useRef(null)
  const [chars,  setChars]  = useState(0)

  useEffect(() => { if (!streaming) ref.current?.focus() }, [streaming])

  function resize() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    setChars(el.value.length)
  }

  const submit = useCallback(() => {
    const val = ref.current?.value.trim()
    if (!val || streaming) return
    onSend(val)
    ref.current.value = ''
    ref.current.style.height = 'auto'
    setChars(0)
  }, [onSend, streaming])

  const handleKey = useCallback(e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }, [submit])

  const nearLimit   = chars > MAX_CHARS * 0.85
  const overLimit   = chars > MAX_CHARS
  const canSubmit   = chars > 0 && chars <= MAX_CHARS && !streaming

  return (
    <footer
      role="contentinfo"
      style={{
        padding: '10px 20px 22px',
        background: `linear-gradient(to top, var(--bg) 55%, transparent)`,
        flexShrink: 0,
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        <div className="input-shell" role="form" aria-label="Chat input">
          <textarea
            ref={ref}
            rows={1}
            className="chat-input"
            placeholder="Message NexusAI… (Shift+Enter for new line)"
            onInput={resize}
            onKeyDown={handleKey}
            disabled={streaming}
            maxLength={MAX_CHARS + 500}
            aria-label="Message input"
            aria-multiline="true"
          />

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 10px',
          }}>
            {/* Character count */}
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: overLimit ? 'var(--red)' : nearLimit ? 'var(--amber)' : 'var(--t3)',
              transition: 'color .15s',
              opacity: chars > 0 ? 1 : 0,
            }} aria-live="polite" aria-label={`${chars} characters`}>
              {chars.toLocaleString()}/{MAX_CHARS.toLocaleString()}
            </span>

            {/* Send / Stop */}
            {streaming ? (
              <button className="btn-stop" onClick={onStop} aria-label="Stop generating">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                </svg>
                Stop
              </button>
            ) : (
              <button
                className="btn-send"
                onClick={submit}
                disabled={!canSubmit}
                aria-label="Send message"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Hints */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, marginTop: 8,
        }}>
          <p style={{ fontSize: 11, color: 'var(--t3)' }}>
            NexusAI may make mistakes — verify important information
          </p>
          <span style={{ color: 'var(--t4)', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="kbd">↵ Enter</span> send
          </span>
        </div>
      </div>
    </footer>
  )
}
